import { EventEmitter } from 'events';
import { desc, eq, sql } from 'drizzle-orm';
import { jobQueueJobs } from '@shared/schema';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type JobType = 'ai_generation' | 'batch_generation' | 'export' | 'import' | 'media_processing';

export interface Job {
  id: string;
  type: JobType;
  userId: string;
  status: JobStatus;
  progress: number;
  data: Record<string, any>;
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
}

export type JobStartHandler = (job: Job) => void | Promise<void>;

export interface JobPersistence {
  loadJobs(): Promise<Job[]>;
  saveJob(job: Job): Promise<void>;
  deleteJob(jobId: string): Promise<void>;
}

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
    persistence?: JobPersistence,
  ) {
    super();
    this.maxConcurrent = Math.max(1, maxConcurrent);
    if (!Number.isFinite(processingTimeoutMs) || processingTimeoutMs <= 0) {
      throw new RangeError('processingTimeoutMs must be a finite number greater than zero');
    }
    this.processingTimeoutMs = processingTimeoutMs;
    this.persistence = persistence;
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

  updateJob(jobId: string, update: JobUpdate): Job | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

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

        const job = persistedJob.status === 'processing'
          ? {
              ...persistedJob,
              status: 'failed' as const,
              completedAt: new Date(),
              error: persistedJob.error
                ? `${persistedJob.error} (worker interrupted by server restart; retryable)`
                : 'Worker interrupted by server restart before the job completed; retryable',
            }
          : persistedJob;

        this.jobs.set(job.id, job);
        if (!this.userJobs.has(job.userId)) {
          this.userJobs.set(job.userId, new Set());
        }
        this.userJobs.get(job.userId)!.add(job.id);

        if (job.status === 'pending') {
          this.processingQueue.push(job.id);
        }

        if (job !== persistedJob) {
          await this.persistence.saveJob(job);
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

  private scheduleProcessingTimeout(job: Job): void {
    this.clearProcessingTimeout(job.id);

    const timeout = setTimeout(() => {
      this.processingTimeouts.delete(job.id);

      const currentJob = this.jobs.get(job.id);
      if (!currentJob || currentJob.status !== 'processing') return;

      this.updateJob(job.id, {
        status: 'failed',
        error: `Worker timed out after ${this.processingTimeoutMs}ms while processing "${job.type}"; the job may have lost its worker`,
      });
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
        this.updateJob(jobId, { status: 'processing' });
        const startedJob = this.getJob(jobId);
        if (!startedJob || startedJob.status !== 'processing') continue;
        this.scheduleProcessingTimeout(startedJob);

        try {
          // Keep the existing event-driven worker contract. Registered
          // handlers are an optional typed convenience for new processors.
          this.emit('job:start', startedJob);
        } catch (error: any) {
          this.updateJob(jobId, {
            status: 'failed',
            error: error?.message || `Worker failed to start job "${job.type}"`,
          });
          continue;
        }

        if (registeredHandler && startedJob.status === 'processing') {
          Promise.resolve()
            .then(() => registeredHandler(startedJob))
            .catch((error: any) => {
              this.updateJob(jobId, {
                status: 'failed',
                error: error?.message || `Worker failed while processing "${job.type}"`,
              });
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
}

function cloneJob(job: Job): Job {
  return {
    ...job,
    data: structuredClone(job.data),
    ...(job.result !== undefined ? { result: structuredClone(job.result) } : {}),
    ...(job.metadata !== undefined ? { metadata: structuredClone(job.metadata) } : {}),
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
      }));
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
          metadata: snapshot.metadata ?? null,
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
            metadata: snapshot.metadata ?? null,
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
  generateFn: (data: any, onProgress: (p: number) => void) => Promise<any>
): Promise<void> {
  try {
    const result = await generateFn(job.data, (progress) => {
      jobQueue.updateJob(job.id, { progress });
    });

    jobQueue.updateJob(job.id, {
      status: 'completed',
      progress: 100,
      result,
    });
    await jobQueue.waitForPersistence(job.id);
  } catch (error: any) {
    jobQueue.updateJob(job.id, {
      status: 'failed',
      error: error.message || 'Unknown error',
    });
    await jobQueue.waitForPersistence(job.id);
  }
}

export async function processBatchJob(
  job: Job,
  processFn: (item: any, index: number) => Promise<any>,
  queue: JobQueueService = jobQueue,
): Promise<void> {
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
        const result = await processFn(items[i], i);
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
      queue.updateJob(job.id, { progress });
    }

    queue.updateJob(job.id, {
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
    });
    await queue.waitForPersistence(job.id);
  } catch (error: any) {
    queue.updateJob(job.id, {
      status: 'failed',
      error: error.message || 'Batch processing failed',
    });
    await queue.waitForPersistence(job.id);
  }
}
