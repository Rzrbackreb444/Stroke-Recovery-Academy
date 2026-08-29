import { EventEmitter } from 'events';
import { desc, eq, sql } from 'drizzle-orm';
import { jobQueueJobs } from '@shared/schema';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type JobType = 'ai_generation' | 'batch_generation' | 'export' | 'import' | 'media_processing';

export type JobFailureReason =
  | 'worker_timeout'
  | 'worker_start'
  | 'handler'
  | 'validation'
  | 'unsupported'
  | 'no_worker'
  | 'unknown';

export interface JobFailure {
  attempt: number;
  error: string;
  reason: JobFailureReason;
  failedAt: Date;
  attemptId?: string;
}

export interface JobRetryPolicy {
  maxAttempts: number;
  retryableFailureReasons: readonly JobFailureReason[];
}

/**
 * Retry rules are intentionally explicit per job type. A retry reuses the
 * stable job idempotency key, so processors can make external writes
 * idempotent even when a worker disappeared after a partial write.
 */
export const JOB_RETRY_POLICIES: Readonly<Record<JobType, JobRetryPolicy>> = {
  ai_generation: {
    maxAttempts: 3,
    retryableFailureReasons: ['worker_timeout', 'worker_start', 'handler'],
  },
  batch_generation: {
    maxAttempts: 3,
    retryableFailureReasons: ['worker_timeout', 'worker_start', 'handler'],
  },
  export: {
    maxAttempts: 2,
    retryableFailureReasons: ['worker_timeout', 'worker_start', 'handler'],
  },
  import: {
    maxAttempts: 2,
    retryableFailureReasons: ['worker_timeout', 'worker_start', 'handler'],
  },
  media_processing: {
    maxAttempts: 2,
    retryableFailureReasons: ['worker_timeout', 'worker_start', 'handler'],
  },
};
export interface Job {
  id: string;
  type: JobType;
  userId: string;
  status: JobStatus;
  progress: number;
  data: Record<string, any>;
  /** Number of times this job has been claimed by a worker, including the current attempt. */
  attempt: number;
  /** Alias exposed for consumers that use the conventional plural name. */
  attempts: number;
  /** Maximum number of worker attempts, including the initial attempt. */
  maxAttempts: number;
  /** Stable across retries and intended for downstream idempotency keys. */
  idempotencyKey: string;
  /** Failure records are append-only and survive a retry. */
  failureHistory: JobFailure[];
  failureReason?: JobFailureReason;
  retryable?: boolean;
  /** Identifies the currently running attempt; it changes on every retry. */
  attemptId?: string;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface JobUpdate {
  status?: JobStatus;
  progress?: number;
  result?: any;
  error?: string;
  failureReason?: JobFailureReason;
  retryable?: boolean;
}

export interface JobExecutionContext {
  jobId: string;
  attempt: number;
  attemptId: string;
  /** Stable across all attempts for this job. */
  idempotencyKey: string;
  isRetry: boolean;
  /**
   * Derive a stable key for a sub-operation. The same scope gets the same
   * value on a retry, which lets external providers deduplicate partial work.
   */
  idempotencyKeyFor(scope: string): string;
  /** Update only the attempt that received this context. */
  update(update: JobUpdate): Job | undefined;
}
export type JobStartHandler = (
  job: Job,
  context: JobExecutionContext,
) => void | Promise<void>;

export interface JobPersistence {
  loadJobs(): Promise<Job[]>;
  saveJob(job: Job): Promise<void>;
  deleteJob(jobId: string): Promise<void>;
}

const JOB_RETRY_METADATA_KEY = '__jobQueueRetryState';

const TERMINAL_STATUSES = new Set<JobStatus>(['completed', 'failed', 'cancelled']);
/**
 * Maximum time a worker may leave a job in `processing` before the queue
 * fails it and releases the worker slot. This bounds the impact of a worker
 * that crashes or stops responding after accepting a job.
 */
export const DEFAULT_PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;
const VALID_TRANSITIONS: Record<JobStatus, Set<JobStatus>> = {
  pending: new Set(['processing', 'failed', 'cancelled']),
  processing: new Set(['completed', 'failed', 'cancelled']),
  completed: new Set(),
  failed: new Set(),
  cancelled: new Set(),
};

export class JobQueueService extends EventEmitter {
  private jobs: Map<string, Job> = new Map();

  private userJobs: Map<string, Set<string>> = new Map();

  private processingQueue: string[] = [];

  private maxConcurrent: number;

  private activeJobIds: Set<string> = new Set();

  private jobHandlers: Map<JobType, JobStartHandler> = new Map();

  private processingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

  private processingTimeoutMs: number;

  private retryPolicies: Readonly<Record<JobType, JobRetryPolicy>>;

  private isDraining = false;

  private persistence?: JobPersistence;

  private persistenceChains: Map<string, Promise<void>> = new Map();

  private initializationPromise?: Promise<void>;

  // Kept as a derived value for existing diagnostics that inspect the
  // service's active count; the set remains the accounting source of truth.
  private get activeJobs(): number {
    return this.activeJobIds.size;
  }

  constructor(
    maxConcurrent: number = 5,
    processingTimeoutMs: number = DEFAULT_PROCESSING_TIMEOUT_MS,
    retryPoliciesOrPersistence:
      | Partial<Record<JobType, JobRetryPolicy>>
      | JobPersistence
      | undefined = {},
    persistence?: JobPersistence,
  ) {
    super();
    this.maxConcurrent = Math.max(1, maxConcurrent);
    if (!Number.isFinite(processingTimeoutMs) || processingTimeoutMs <= 0) {
      throw new RangeError('processingTimeoutMs must be a finite number greater than zero');
    }
    this.processingTimeoutMs = processingTimeoutMs;
    const isPersistence = (
      typeof retryPoliciesOrPersistence === 'object'
      && retryPoliciesOrPersistence !== null
      && 'loadJobs' in retryPoliciesOrPersistence
      && 'saveJob' in retryPoliciesOrPersistence
      && 'deleteJob' in retryPoliciesOrPersistence
    );
    const retryPolicies = isPersistence
      ? {}
      : (retryPoliciesOrPersistence as Partial<Record<JobType, JobRetryPolicy>>);
    this.persistence = isPersistence
      ? retryPoliciesOrPersistence as JobPersistence
      : persistence;
    this.retryPolicies = {
      ...JOB_RETRY_POLICIES,
      ...retryPolicies,
    };
    for (const [type, policy] of Object.entries(this.retryPolicies)) {
      if (!Number.isInteger(policy.maxAttempts) || policy.maxAttempts < 1) {
        throw new RangeError(`maxAttempts for "${type}" must be an integer greater than zero`);
      }
    }
    this.setMaxListeners(100);
  }

  generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  createJob(
    type: JobType,
    userId: string,
    data: Record<string, any>,
    metadata?: Record<string, any>
  ): Job {
    const id = this.generateJobId();
    
    const job: Job = {
      id,
      type,
      userId,
      status: 'pending',
      progress: 0,
      data,
      attempt: 0,
      attempts: 0,
      maxAttempts: this.getRetryPolicy(type).maxAttempts,
      idempotencyKey: id,
      failureHistory: [],
      createdAt: new Date(),
      metadata,
    };

    this.jobs.set(id, job);
    
    if (!this.userJobs.has(userId)) {
      this.userJobs.set(userId, new Set());
    }
    this.userJobs.get(userId)!.add(id);

    this.persistSnapshot(job);
    this.processingQueue.push(id);
    this.emit('job:created', job);
    
    this.processNext();
    
    return job;
  }

  getJob(jobId: string, userId?: string): Job | undefined {
    const job = this.jobs.get(jobId);
    if (!job || (userId !== undefined && job.userId !== userId)) return undefined;
    return job;
  }

  getUserJobs(userId: string, limit: number = 50): Job[] {
    const jobIds = this.userJobs.get(userId);
    if (!jobIds) return [];

    const jobs: Job[] = [];
    const jobIdArray = Array.from(jobIds);
    for (let i = 0; i < jobIdArray.length; i++) {
      const job = this.jobs.get(jobIdArray[i]);
      if (job) jobs.push(job);
    }

    return jobs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  updateJob(jobId: string, update: JobUpdate, attemptId?: string): Job | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    // A timed-out worker may call back after the same job has been retried.
    // Require attempt-scoped updates from handlers so that callback cannot
    // mutate the newer attempt.
    if (attemptId !== undefined && job.attemptId !== attemptId) return job;

    // A terminal job is immutable. This prevents a late worker callback after
    // cancellation (or a duplicate callback) from changing its result or
    // releasing capacity a second time.
    if (TERMINAL_STATUSES.has(job.status)) return job;

    if (update.status && update.status !== job.status) {
      if (!VALID_TRANSITIONS[job.status].has(update.status)) return job;
      job.status = update.status;
    }
    if (update.progress !== undefined) job.progress = update.progress;
    if (update.result !== undefined) job.result = update.result;
    if (update.error !== undefined) job.error = update.error;
    if (update.failureReason !== undefined) job.failureReason = update.failureReason;
    if (update.retryable !== undefined) job.retryable = update.retryable;

    if (update.status === 'failed') {
      const error = update.error || 'Job failed';
      const reason = update.failureReason || 'unknown';
      job.failureHistory.push({
        attempt: job.attempt,
        error,
        reason,
        failedAt: new Date(),
        attemptId: job.attemptId,
      });
      job.retryable = update.retryable
        ?? this.getRetryPolicy(job.type).retryableFailureReasons.includes(reason);
    }

    if (update.status === 'processing' && !job.startedAt) {
      job.startedAt = new Date();
    }

    if (update.status === 'completed' || update.status === 'failed') {
      this.clearProcessingTimeout(jobId);
      job.completedAt = new Date();
      this.releaseCapacity(jobId);
      this.processNext();
    }

    this.emit('job:updated', job);
    this.emit(`job:${jobId}`, job);
    this.persistSnapshot(job);

    return job;
  }

  cancelJob(jobId: string, userId?: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || (userId !== undefined && job.userId !== userId)) return false;

    if (job.status === 'pending' || job.status === 'processing') {
      const wasProcessing = job.status === 'processing';
      job.status = 'cancelled';
      job.completedAt = new Date();
      
      const queueIndex = this.processingQueue.indexOf(jobId);
      if (queueIndex > -1) {
        this.processingQueue.splice(queueIndex, 1);
      }

      // Pending work never acquired a slot. Processing work releases exactly
      // the slot it owns; repeated cancellation is rejected by the terminal
      // state check above.
      if (wasProcessing) {
        this.clearProcessingTimeout(jobId);
        this.releaseCapacity(jobId);
      }
      this.processNext();

      this.emit('job:cancelled', job);
      this.emit(`job:${jobId}`, job);
      this.persistSnapshot(job);
      return true;
    }

    return false;
  }

  registerJobHandler(type: JobType, handler: JobStartHandler): () => void {
    this.jobHandlers.set(type, handler);
    return () => {
      if (this.jobHandlers.get(type) === handler) this.jobHandlers.delete(type);
    };
  }

  private isSupportedJobType(type: string): type is JobType {
    return ['ai_generation', 'batch_generation', 'export', 'import', 'media_processing'].includes(type);
  }

  /**
   * Load durable jobs before requests are served. Jobs that were processing
   * when the process stopped cannot safely be resumed because their worker may
   * have already performed an external side effect, so they become an
   * explicit retryable failure instead of remaining stuck.
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      if (!this.persistence) {
        this.persistence = await createDatabaseJobPersistence();
      }

      const persistedJobs = await this.persistence.loadJobs();
      for (const persistedJob of persistedJobs) {
        if (this.jobs.has(persistedJob.id)) continue;

        const normalizedJob = this.normalizePersistedJob(persistedJob);
        const job = normalizedJob.status === 'processing'
          ? {
              ...normalizedJob,
              status: 'failed' as const,
              completedAt: new Date(),
              error: normalizedJob.error
                ? `${normalizedJob.error} (worker interrupted by server restart; retryable)`
                : 'Worker interrupted by server restart before the job completed; retryable',
              failureReason: 'worker_timeout' as const,
              retryable: this.getRetryPolicy(normalizedJob.type)
                .retryableFailureReasons.includes('worker_timeout'),
              attemptId: undefined,
              failureHistory: [
                ...normalizedJob.failureHistory,
                {
                  attempt: normalizedJob.attempt,
                  error: normalizedJob.error
                    ? `${normalizedJob.error} (worker interrupted by server restart; retryable)`
                    : 'Worker interrupted by server restart before the job completed; retryable',
                  reason: 'worker_timeout' as const,
                  failedAt: new Date(),
                  attemptId: normalizedJob.attemptId,
                },
              ],
            }
          : normalizedJob;

        this.jobs.set(job.id, job);
        if (!this.userJobs.has(job.userId)) {
          this.userJobs.set(job.userId, new Set());
        }
        this.userJobs.get(job.userId)!.add(job.id);

        if (job.status === 'pending') {
          this.processingQueue.push(job.id);
        }

        await this.persistence.saveJob(job);
        if (job.status === 'failed' && normalizedJob.status === 'processing') {
          this.emit('job:updated', job);
          this.emit(`job:${job.id}`, job);
        }
      }

      this.processNext();
    })().catch((error) => {
      this.initializationPromise = undefined;
      throw error;
    });

    return this.initializationPromise;
  }

  /**
   * Wait until the latest write for a job has reached durable storage. The
   * queue remains synchronous for existing workers, while HTTP creation can
   * wait before acknowledging a successfully persisted job.
   */
  async waitForPersistence(jobId: string): Promise<void> {
    await this.persistenceChains.get(jobId);
  }

  private persistSnapshot(job: Job): void {
    if (!this.persistence) return;

    const snapshot = cloneJob(job);
    const previous = this.persistenceChains.get(job.id) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(() => this.persistence!.saveJob(snapshot));

    this.persistenceChains.set(job.id, next);
    void next.catch((error) => {
      console.error(`[jobQueue] failed to persist job ${job.id}:`, error);
    });
  }

  private normalizePersistedJob(persistedJob: Job): Job {
    const policy = this.getRetryPolicy(persistedJob.type);
    const storedMetadata = (persistedJob.metadata ?? {}) as Record<string, any>;
    const retryState = storedMetadata[JOB_RETRY_METADATA_KEY] as Record<string, any> | undefined;
    const { [JOB_RETRY_METADATA_KEY]: _retryState, ...metadata } = storedMetadata;
    const attempt = Number.isInteger(retryState?.attempt)
      ? retryState?.attempt
      : Number.isInteger(persistedJob.attempt)
        ? persistedJob.attempt
        : 0;
    const failureHistory = Array.isArray(retryState?.failureHistory)
      ? retryState.failureHistory.map((failure: any) => ({
          ...failure,
          failedAt: failure.failedAt instanceof Date
            ? failure.failedAt
            : new Date(failure.failedAt),
        }))
      : Array.isArray(persistedJob.failureHistory)
        ? persistedJob.failureHistory
        : [];

    return {
      ...persistedJob,
      attempt,
      attempts: attempt,
      maxAttempts: Number.isInteger(retryState?.maxAttempts)
        ? retryState?.maxAttempts
        : Number.isInteger(persistedJob.maxAttempts)
          ? persistedJob.maxAttempts
          : policy.maxAttempts,
      idempotencyKey: typeof retryState?.idempotencyKey === 'string'
        ? retryState.idempotencyKey
        : typeof persistedJob.idempotencyKey === 'string'
          ? persistedJob.idempotencyKey
          : persistedJob.id,
      failureHistory,
      ...(retryState?.failureReason || persistedJob.failureReason
        ? { failureReason: retryState?.failureReason || persistedJob.failureReason }
        : {}),
      ...(retryState?.retryable !== undefined || persistedJob.retryable !== undefined
        ? { retryable: retryState?.retryable ?? persistedJob.retryable }
        : {}),
      ...(Object.keys(metadata).length > 0 ? { metadata } : { metadata: undefined }),
    };
  }

  private releaseCapacity(jobId: string): void {
    if (this.activeJobIds.delete(jobId)) {
      // activeJobIds is the source of truth, so this can never go below zero.
    }
  }

  private clearProcessingTimeout(jobId: string): void {
    const timeout = this.processingTimeouts.get(jobId);
    if (!timeout) return;

    clearTimeout(timeout);
    this.processingTimeouts.delete(jobId);
  }

  private scheduleProcessingTimeout(job: Job, attemptId: string): void {
    this.clearProcessingTimeout(job.id);

    const timeout = setTimeout(() => {
      this.processingTimeouts.delete(job.id);

      const currentJob = this.jobs.get(job.id);
      if (
        !currentJob
        || currentJob.status !== 'processing'
        || currentJob.attemptId !== attemptId
      ) return;

      this.updateJob(job.id, {
        status: 'failed',
        error: `Worker timed out after ${this.processingTimeoutMs}ms while processing "${job.type}"; the job may have lost its worker`,
        failureReason: 'worker_timeout',
      }, attemptId);
    }, this.processingTimeoutMs);
    timeout.unref?.();
    this.processingTimeouts.set(job.id, timeout);
  }

  private processNext(): void {
    if (this.isDraining) return;
    this.isDraining = true;

    try {
      while (this.activeJobIds.size < this.maxConcurrent && this.processingQueue.length > 0) {
        const jobId = this.processingQueue.shift();
        if (!jobId) continue;

        const job = this.jobs.get(jobId);
        if (!job || job.status !== 'pending') continue;

        if (!this.isSupportedJobType(job.type)) {
          this.updateJob(jobId, {
            status: 'failed',
            error: `Unsupported job type "${String(job.type)}"`,
          });
          continue;
        }

        const hasEventWorker = this.listenerCount('job:start') > 0;
        const registeredHandler = this.jobHandlers.get(job.type);
        if (!hasEventWorker && !registeredHandler) {
          this.updateJob(jobId, {
            status: 'failed',
            error: `No worker is available for job type "${job.type}"`,
          });
          continue;
        }

        this.activeJobIds.add(jobId);
        job.attempt += 1;
        job.attempts = job.attempt;
        const attemptId = `${job.id}:attempt:${job.attempt}`;
        job.attemptId = attemptId;
        this.updateJob(jobId, { status: 'processing' });
        const currentJob = this.getJob(jobId);
        const startedJob = currentJob ? { ...currentJob } : undefined;
        if (!startedJob || startedJob.status !== 'processing') continue;
        const context: JobExecutionContext = {
          jobId: startedJob.id,
          attempt: startedJob.attempt,
          attemptId,
          idempotencyKey: startedJob.idempotencyKey,
          isRetry: startedJob.attempt > 1,
          idempotencyKeyFor: (scope: string) =>
            `${startedJob.idempotencyKey}:${scope}`,
          update: (update: JobUpdate) =>
            this.updateJob(startedJob.id, update, attemptId),
        };
        this.scheduleProcessingTimeout(startedJob, attemptId);

        try {
          // Keep the existing event-driven worker contract. Registered
          // handlers are an optional typed convenience for new processors.
          this.emit('job:start', startedJob, context);
        } catch (error: any) {
          this.updateJob(jobId, {
            status: 'failed',
            error: error?.message || `Worker failed to start job "${job.type}"`,
            failureReason: 'worker_start',
          }, attemptId);
          continue;
        }

        if (registeredHandler && this.getJob(jobId)?.status === 'processing') {
          Promise.resolve()
            .then(() => registeredHandler(startedJob, context))
            .catch((error: any) => {
              this.updateJob(jobId, {
                status: 'failed',
                error: error?.message || `Worker failed while processing "${job.type}"`,
                failureReason: 'handler',
              }, attemptId);
            });
        }
      }
    } finally {
      this.isDraining = false;
    }
  }

  subscribeToJob(
    jobId: string,
    callback: (job: Job) => void,
    userId?: string,
  ): (() => void) | undefined {
    if (!this.getJob(jobId, userId)) return undefined;

    const listener = (job: Job) => callback(job);
    this.on(`job:${jobId}`, listener);
    
    return () => {
      this.off(`job:${jobId}`, listener);
    };
  }

  getQueueStats(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    let pending = 0, processing = 0, completed = 0, failed = 0;

    const jobsArray = Array.from(this.jobs.values());
    for (let i = 0; i < jobsArray.length; i++) {
      const job = jobsArray[i];
      switch (job.status) {
        case 'pending': pending++; break;
        case 'processing': processing++; break;
        case 'completed': completed++; break;
        case 'failed': failed++; break;
      }
    }

    return { pending, processing, completed, failed };
  }

  cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    const entries = Array.from(this.jobs.entries());
    for (let i = 0; i < entries.length; i++) {
      const [id, job] = entries[i];
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        const age = now - job.createdAt.getTime();
        if (age > maxAgeMs) {
          this.jobs.delete(id);
          const userJobSet = this.userJobs.get(job.userId);
          if (userJobSet) {
            userJobSet.delete(id);
          }
          if (this.persistence) {
            const previous = this.persistenceChains.get(id) ?? Promise.resolve();
            const next = previous
              .catch(() => undefined)
              .then(() => this.persistence!.deleteJob(id));
            this.persistenceChains.set(id, next);
            void next.catch((error) => {
              console.error(`[jobQueue] failed to delete expired job ${id}:`, error);
            });
          }
          cleaned++;
        }
      }
    }

    return cleaned;
  }

  getRetryPolicy(type: JobType): JobRetryPolicy {
    return this.retryPolicies[type] || {
      maxAttempts: 1,
      retryableFailureReasons: [],
    };
  }

  getRetryEligibility(
    jobId: string,
    userId?: string,
  ): { eligible: boolean; reason?: string; remainingAttempts: number } {
    const job = this.getJob(jobId, userId);
    if (!job) {
      return { eligible: false, reason: 'Job not found', remainingAttempts: 0 };
    }

    const remainingAttempts = Math.max(0, job.maxAttempts - job.attempt);
    if (job.status !== 'failed') {
      return {
        eligible: false,
        reason: 'Only failed jobs can be retried',
        remainingAttempts,
      };
    }
    if (remainingAttempts === 0) {
      return {
        eligible: false,
        reason: `Retry limit reached (${job.maxAttempts} attempts)`,
        remainingAttempts: 0,
      };
    }
    if (!job.retryable) {
      return {
        eligible: false,
        reason: `Failure "${job.failureReason || 'unknown'}" is not eligible for retry`,
        remainingAttempts,
      };
    }

    return { eligible: true, remainingAttempts };
  }

  /**
   * Requeue one failed job. The id remains stable so all attempts share one
   * idempotency boundary and failureHistory remains available to operators.
   */
  retryJob(jobId: string, userId?: string): Job | undefined {
    const job = this.jobs.get(jobId);
    if (!job || (userId !== undefined && job.userId !== userId)) return undefined;
    if (!this.getRetryEligibility(jobId, userId).eligible) return undefined;

    job.status = 'pending';
    job.progress = 0;
    job.error = undefined;
    job.failureReason = undefined;
    job.retryable = undefined;
    job.result = undefined;
    job.startedAt = undefined;
    job.completedAt = undefined;
    job.attemptId = undefined;
    this.processingQueue.push(job.id);
    this.persistSnapshot(job);
    this.emit('job:retried', job);
    this.emit('job:updated', job);
    this.emit(`job:${job.id}`, job);
    this.processNext();
    return job;
  }
}

function cloneJob(job: Job): Job {
  return {
    ...job,
    data: structuredClone(job.data),
    ...(job.result !== undefined ? { result: structuredClone(job.result) } : {}),
    ...(job.metadata !== undefined ? { metadata: structuredClone(job.metadata) } : {}),
  };
}

function metadataForPersistence(job: Job): Record<string, any> {
  return {
    ...(job.metadata ? structuredClone(job.metadata) : {}),
    [JOB_RETRY_METADATA_KEY]: {
      attempt: job.attempt,
      maxAttempts: job.maxAttempts,
      idempotencyKey: job.idempotencyKey,
      failureHistory: structuredClone(job.failureHistory),
      ...(job.failureReason ? { failureReason: job.failureReason } : {}),
      ...(job.retryable !== undefined ? { retryable: job.retryable } : {}),
    },
  };
}

async function createDatabaseJobPersistence(): Promise<JobPersistence> {
  const { db } = await import('./db');

  // The migration is the normal installation path. This guarded initializer
  // also keeps an older running environment from dropping jobs while the
  // migration is being rolled out.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS job_queue_jobs (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      progress INTEGER NOT NULL DEFAULT 0,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      result JSONB,
      error TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      metadata JSONB
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS job_queue_jobs_user_created_idx
      ON job_queue_jobs (user_id, created_at)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS job_queue_jobs_status_idx
      ON job_queue_jobs (status, created_at)
  `);

  return {
    async loadJobs() {
      const rows = await db
        .select()
        .from(jobQueueJobs)
        .orderBy(desc(jobQueueJobs.createdAt));

      return rows.map((row) => ({
        id: row.id,
        type: row.type as JobType,
        userId: row.userId,
        status: row.status as JobStatus,
        progress: row.progress,
        data: (row.data ?? {}) as Record<string, any>,
        ...(row.result !== null ? { result: row.result } : {}),
        ...(row.error !== null ? { error: row.error } : {}),
        createdAt: row.createdAt,
        ...(row.startedAt ? { startedAt: row.startedAt } : {}),
        ...(row.completedAt ? { completedAt: row.completedAt } : {}),
        ...(row.metadata !== null ? { metadata: row.metadata as Record<string, any> } : {}),
      } as Job));
    },

    async saveJob(job) {
      const snapshot = cloneJob(job);
      await db
        .insert(jobQueueJobs)
        .values({
          id: snapshot.id,
          type: snapshot.type,
          userId: snapshot.userId,
          status: snapshot.status,
          progress: snapshot.progress,
          data: snapshot.data,
          result: snapshot.result ?? null,
          error: snapshot.error ?? null,
          createdAt: snapshot.createdAt,
          startedAt: snapshot.startedAt ?? null,
          completedAt: snapshot.completedAt ?? null,
          metadata: metadataForPersistence(snapshot),
        })
        .onConflictDoUpdate({
          target: jobQueueJobs.id,
          set: {
            type: snapshot.type,
            userId: snapshot.userId,
            status: snapshot.status,
            progress: snapshot.progress,
            data: snapshot.data,
            result: snapshot.result ?? null,
            error: snapshot.error ?? null,
            createdAt: snapshot.createdAt,
            startedAt: snapshot.startedAt ?? null,
            completedAt: snapshot.completedAt ?? null,
            metadata: metadataForPersistence(snapshot),
          },
        });
    },

    async deleteJob(jobId) {
      await db.delete(jobQueueJobs).where(eq(jobQueueJobs.id, jobId));
    },
  };
}

export const jobQueue = new JobQueueService();

setInterval(() => {
  jobQueue.cleanupOldJobs();
}, 60 * 60 * 1000).unref();
export async function processAIGenerationJob(
  job: Job,
  generateFn: (data: any, onProgress: (p: number) => void) => Promise<any>,
  context?: JobExecutionContext,
): Promise<void> {
  const update = (jobUpdate: JobUpdate) =>
    context
      ? context.update(jobUpdate)
      : jobQueue.updateJob(job.id, jobUpdate);

  try {
    const result = await generateFn(job.data, (progress) => {
      update({ progress });
    });

    update({
      status: 'completed',
      progress: 100,
      result,
    });
    await jobQueue.waitForPersistence(job.id);
  } catch (error: any) {
    update({
      status: 'failed',
      error: error.message || 'Unknown error',
      failureReason: 'handler',
    });
    await jobQueue.waitForPersistence(job.id);
  }
}

export type BatchProcessFn = (
  item: any,
  index: number,
  idempotencyKey: string,
) => Promise<any>;
export async function processBatchJob(
  job: Job,
  processFn: BatchProcessFn,
  queue: JobQueueService = jobQueue,
  context?: JobExecutionContext,
): Promise<void> {
  const update = (jobUpdate: JobUpdate) =>
    context
      ? context.update(jobUpdate)
      : queue.updateJob(job.id, jobUpdate);

  try {
    const items = job.data.items;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Batch job must contain at least one item');
    }

    const results: any[] = [];
    const outputItems: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const itemKey = context?.idempotencyKeyFor(`item:${items[i]?.id || i}`)
          || `${job.id}:item:${items[i]?.id || i}`;
        const result = await processFn(items[i], i, itemKey);
        results.push({ index: i, success: true, result });
        outputItems.push(result);
      } catch (error: any) {
        const message = error?.message || 'Item processing failed';
        errors.push({ index: i, success: false, error: message });
        outputItems.push({
          id: items[i]?.id || `${job.id}-item-${i}`,
          index: i,
          status: 'failed',
          error: message,
        });
      }

      const progress = Math.round(((i + 1) / items.length) * 100);
      update({ progress });
    }

    update({
      status: errors.length === items.length ? 'failed' : 'completed',
      progress: 100,
      result: {
        // `items` is the user-facing result shape used by batch-generation
        // clients. Keep the detailed per-item records for existing consumers.
        items: outputItems,
        results,
        errors,
        totalProcessed: items.length,
      },
      error: errors.length === items.length ? 'All batch items failed' : undefined,
      failureReason: errors.length === items.length ? 'handler' : undefined,
    });
    await queue.waitForPersistence(job.id);
  } catch (error: any) {
    update({
      status: 'failed',
      error: error.message || 'Batch processing failed',
      failureReason: 'handler',
    });
    await queue.waitForPersistence(job.id);
  }
}

