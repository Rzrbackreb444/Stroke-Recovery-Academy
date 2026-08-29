import { EventEmitter } from 'events';

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

  // Kept as a derived value for existing diagnostics that inspect the
  // service's active count; the set remains the accounting source of truth.
  private get activeJobs(): number {
    return this.activeJobIds.size;
  }

  constructor(
    maxConcurrent: number = 5,
    processingTimeoutMs: number = DEFAULT_PROCESSING_TIMEOUT_MS,
  ) {
    super();
    this.maxConcurrent = Math.max(1, maxConcurrent);
    if (!Number.isFinite(processingTimeoutMs) || processingTimeoutMs <= 0) {
      throw new RangeError('processingTimeoutMs must be a finite number greater than zero');
    }
    this.processingTimeoutMs = processingTimeoutMs;
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
          cleaned++;
        }
      }
    }

    return cleaned;
  }
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
  } catch (error: any) {
    jobQueue.updateJob(job.id, {
      status: 'failed',
      error: error.message || 'Unknown error',
    });
  }
}

export async function processBatchJob(
  job: Job,
  processFn: (item: any, index: number) => Promise<any>
): Promise<void> {
  try {
    const items = job.data.items as any[];
    const results: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const result = await processFn(items[i], i);
        results.push({ index: i, success: true, result });
      } catch (error: any) {
        errors.push({ index: i, success: false, error: error.message });
      }

      const progress = Math.round(((i + 1) / items.length) * 100);
      jobQueue.updateJob(job.id, { progress });
    }

    jobQueue.updateJob(job.id, {
      status: errors.length === items.length ? 'failed' : 'completed',
      progress: 100,
      result: { results, errors, totalProcessed: items.length },
    });
  } catch (error: any) {
    jobQueue.updateJob(job.id, {
      status: 'failed',
      error: error.message || 'Batch processing failed',
    });
  }
}
