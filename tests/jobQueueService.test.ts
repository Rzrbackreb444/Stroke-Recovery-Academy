import assert from "node:assert/strict";
import {
  JobQueueService,
  type JobPersistence,
  processBatchJob,
  type Job,
} from "../server/jobQueueService";

function createEventWorker(queue: JobQueueService) {
  const started: Job[] = [];
  queue.on("job:start", (job: Job) => started.push(job));
  return started;
}

console.log("\njobQueueService.test.ts\n");

{
  const queue = new JobQueueService(1);
  const started = createEventWorker(queue);
  const first = queue.createJob("ai_generation", "owner-a", {});
  const pending = queue.createJob("ai_generation", "owner-a", {});

  assert.equal(first.status, "processing", "the first job consumes the only slot");
  assert.equal(pending.status, "pending", "the second job waits for capacity");
  assert.equal(queue.getJob(first.id, "owner-a")?.id, first.id);
  assert.equal(queue.getJob(first.id, "owner-b"), undefined, "another user cannot look up the job");
  assert.equal(queue.cancelJob(first.id, "owner-b"), false, "another user cannot cancel the job");
  assert.equal(
    queue.subscribeToJob(first.id, () => {}, "owner-b"),
    undefined,
    "another user cannot subscribe to the job",
  );

  // Cancelling pending work must not release the slot held by first.
  assert.equal(queue.cancelJob(pending.id, "owner-a"), true);
  const third = queue.createJob("ai_generation", "owner-a", {});
  assert.equal(third.status, "pending", "pending cancellation does not free active capacity");

  queue.updateJob(first.id, { status: "completed", progress: 100, result: "done" });
  assert.equal(third.status, "processing", "capacity is recovered when active work completes");
  assert.equal(started.map((job) => job.id).join(","), `${first.id},${third.id}`);

  // Late duplicate completion/failure events cannot mutate or decrement again.
  queue.updateJob(first.id, { status: "failed", error: "late failure" });
  assert.equal(queue.getJob(first.id)?.status, "completed");
  assert.deepEqual(queue.getQueueStats(), {
    pending: 0,
    processing: 1,
    completed: 1,
    failed: 0,
  });
}

{
  const queue = new JobQueueService();
  const job = queue.createJob("ai_generation", "owner-a", {});
  assert.equal(job.status, "failed", "supported work without a worker fails explicitly");
  assert.match(job.error ?? "", /No worker is available/);
  assert.deepEqual(queue.getQueueStats(), {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 1,
  });
}

{
  const queue = new JobQueueService();
  const job = queue.createJob(
    "not-a-real-job" as Job["type"],
    "owner-a",
    {},
  );
  assert.equal(job.status, "failed", "unsupported work does not remain processing");
  assert.match(job.error ?? "", /Unsupported job type/);
}

{
  const queue = new JobQueueService();
  queue.on("job:start", (job: Job) => {
    queue.updateJob(job.id, { progress: 40 });
  });
  const job = queue.createJob("ai_generation", "owner-a", {});
  assert.equal(job.status, "processing");
  assert.equal(job.progress, 40, "event-driven workers can still publish progress");

  assert.equal(queue.cancelJob(job.id, "owner-a"), true);
  assert.equal(job.status, "cancelled");
  queue.updateJob(job.id, { status: "completed", progress: 100 });
  assert.equal(job.status, "cancelled", "a cancelled job ignores a late completion");
  assert.equal(queue.cancelJob(job.id, "owner-a"), false, "terminal cancellation is idempotent");
  assert.deepEqual(queue.getQueueStats(), {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
}

{
  const queue = new JobQueueService(1, 100);
  const started: Job[] = [];
  let timeoutFailures = 0;
  queue.on("job:start", (job: Job) => started.push(job));
  queue.on("job:updated", (job: Job) => {
    if (job.status === "failed") timeoutFailures++;
  });
  const timedOut = queue.createJob("ai_generation", "owner-a", {});
  const pending = queue.createJob("ai_generation", "owner-a", {});
  const waiting = queue.createJob("ai_generation", "owner-a", {});

  assert.equal(timedOut.status, "processing");
  assert.equal(pending.status, "pending");

  await new Promise((resolve) => setTimeout(resolve, 150));

  assert.equal(timedOut.status, "failed");
  assert.match(timedOut.error ?? "", /Worker timed out after 100ms/);
  assert.equal(timedOut.completedAt instanceof Date, true);
  assert.equal(timeoutFailures, 1, "an expired job fails exactly once");
  assert.equal(queue.getQueueStats().processing, 1, "the next job owns the released capacity");
  assert.equal(pending.status, "processing", "timeout releases capacity for pending work");
  assert.equal(waiting.status, "pending");
  assert.equal(started.map((job) => job.id).join(","), `${timedOut.id},${pending.id}`);

  // A worker that finishes after the timeout cannot change the failure or
  // release the capacity a second time.
  queue.updateJob(timedOut.id, { status: "completed", progress: 100, result: "late" });
  assert.equal(timedOut.status, "failed");
  assert.equal(timedOut.result, undefined);
  assert.equal(queue.getQueueStats().processing, 1);
  assert.equal(waiting.status, "pending", "a late completion cannot release another job's slot");
}

{
  const queue = new JobQueueService(1, 20);
  const contexts: Array<{
    attempt: number;
    attemptId: string;
    idempotencyKey: string;
    isRetry: boolean;
    update: (update: { status: "completed" }) => Job | undefined;
  }> = [];
  queue.on("job:start", (_job, context) => {
    contexts.push(context);
    if (context.isRetry) {
      context.update({ status: "completed" });
    }
  });

  const timedOut = queue.createJob("ai_generation", "owner-a", {});
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(timedOut.status, "failed");
  assert.equal(timedOut.attempt, 1);
  assert.equal(timedOut.attempts, 1);
  assert.equal(timedOut.failureHistory.length, 1);
  assert.equal(timedOut.failureHistory[0].reason, "worker_timeout");

  const originalContext = contexts[0];
  const originalIdempotencyKey = timedOut.idempotencyKey;
  const retried = queue.retryJob(timedOut.id, "owner-a");
  assert.equal(retried, timedOut);
  assert.equal(timedOut.status, "completed", "a timed-out job can be retried");
  assert.equal(timedOut.attempt, 2);
  assert.equal(timedOut.attempts, 2);
  assert.equal(timedOut.failureHistory.length, 1, "retry preserves the original failure");
  assert.equal(timedOut.idempotencyKey, originalIdempotencyKey);
  assert.equal(contexts[1].isRetry, true);
  assert.equal(contexts[1].idempotencyKey, originalContext.idempotencyKey);
  assert.notEqual(contexts[1].attemptId, originalContext.attemptId);

  // The disappeared worker's callback is scoped to attempt one and cannot
  // overwrite the successful retry.
  originalContext.update({ status: "completed" });
  assert.equal(timedOut.status, "completed");
  assert.equal(timedOut.failureHistory.length, 1);
}

{
  const queue = new JobQueueService(1, 100, {
    ai_generation: {
      maxAttempts: 2,
      retryableFailureReasons: ["handler"],
    },
  });
  queue.on("job:start", (_job, context) => {
    context.update({
      status: "failed",
      error: `attempt ${context.attempt} failed`,
      failureReason: "handler",
    });
  });

  const exhausted = queue.createJob("ai_generation", "owner-a", {});
  assert.equal(exhausted.status, "failed");
  assert.equal(exhausted.attempt, 1);
  assert.equal(queue.retryJob(exhausted.id, "owner-a"), exhausted);
  assert.equal(exhausted.status, "failed");
  assert.equal(exhausted.attempt, 2);
  assert.equal(exhausted.failureHistory.length, 2);
  assert.equal(queue.retryJob(exhausted.id, "owner-a"), undefined);
  assert.deepEqual(queue.getRetryEligibility(exhausted.id, "owner-a"), {
    eligible: false,
    reason: "Retry limit reached (2 attempts)",
    remainingAttempts: 0,
  });
}

{
  const queue = new JobQueueService(1, 20);
  queue.on("job:start", (job: Job) => {
    queue.cancelJob(job.id, "owner-a");
  });
  const cancelled = queue.createJob("ai_generation", "owner-a", {});

  assert.equal(cancelled.status, "cancelled");
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(cancelled.status, "cancelled", "cancellation clears the processing timeout");
  assert.equal(queue.getQueueStats().failed, 0);
}

{
  const queue = new JobQueueService();
  let terminalJob: Job | undefined;
  const terminal = new Promise<void>((resolve) => {
    queue.on("job:updated", (updatedJob: Job) => {
      if (updatedJob.status === "completed" || updatedJob.status === "failed") {
        terminalJob = updatedJob;
        resolve();
      }
    });
  });

  queue.registerJobHandler("batch_generation", (job, context) =>
    processBatchJob(
      job,
      async (item, index) => {
        if (index === 1) throw new Error("item unavailable");
        return { id: item.id, index, status: "completed", content: `result-${index}` };
      },
      queue,
      context,
    ),
  );

  const job = queue.createJob("batch_generation", "owner-a", {
    items: [{ id: "first" }, { id: "second" }, { id: "third" }],
  });
  await terminal;

  assert.equal(job.status, "completed", "a batch with partial item failures completes");
  assert.deepEqual(job.result?.items, [
    { id: "first", index: 0, status: "completed", content: "result-0" },
    { id: "second", index: 1, status: "failed", error: "item unavailable" },
    { id: "third", index: 2, status: "completed", content: "result-2" },
  ]);
  assert.equal(job.progress, 100);
  assert.equal(terminalJob?.id, job.id);
}

{
  class MemoryJobPersistence implements JobPersistence {
    private jobs = new Map<string, Job>();

    async loadJobs(): Promise<Job[]> {
      return Array.from(this.jobs.values()).map((job) => ({
        ...job,
        data: structuredClone(job.data),
        ...(job.result !== undefined ? { result: structuredClone(job.result) } : {}),
        ...(job.metadata !== undefined ? { metadata: structuredClone(job.metadata) } : {}),
      }));
    }

    async saveJob(job: Job): Promise<void> {
      this.jobs.set(job.id, {
        ...job,
        data: structuredClone(job.data),
        ...(job.result !== undefined ? { result: structuredClone(job.result) } : {}),
        ...(job.metadata !== undefined ? { metadata: structuredClone(job.metadata) } : {}),
      });
    }

    async deleteJob(jobId: string): Promise<void> {
      this.jobs.delete(jobId);
    }

    seed(job: Job): void {
      this.jobs.set(job.id, job);
    }
  }

  const persistence = new MemoryJobPersistence();
  const writer = new JobQueueService(1, 1000, persistence);
  writer.on("job:start", (startedJob: Job) => {
    writer.updateJob(startedJob.id, {
      status: "completed",
      progress: 100,
      result: { items: [{ id: "item-1", content: "survived restart" }] },
    });
  });
  const completed = writer.createJob("batch_generation", "owner-a", {
    items: [{ id: "item-1" }],
  });
  await writer.waitForPersistence(completed.id);

  const restored = new JobQueueService(1, 1000, persistence);
  await restored.initialize();
  assert.deepEqual(restored.getJob(completed.id, "owner-a")?.result, {
    items: [{ id: "item-1", content: "survived restart" }],
  });
  assert.equal(restored.getJob(completed.id, "owner-b"), undefined);

  const interrupted = {
    id: "job_interrupted",
    type: "batch_generation" as const,
    userId: "owner-a",
    status: "processing" as const,
    progress: 60,
    data: { items: [{ id: "item-2" }] },
    createdAt: new Date("2026-08-29T00:00:00.000Z"),
    startedAt: new Date("2026-08-29T00:01:00.000Z"),
  } as Job;
  persistence.seed(interrupted);

  const recovered = new JobQueueService(1, 1000, persistence);
  await recovered.initialize();
  const recoveredJob = recovered.getJob(interrupted.id, "owner-a");
  assert.equal(recoveredJob?.status, "failed");
  assert.match(recoveredJob?.error ?? "", /server restart.*retryable/i);
  assert.equal(recoveredJob?.progress, 60);
  assert.equal(recoveredJob?.failureHistory.length, 1);
  assert.equal(recoveredJob?.retryable, true);
}

console.log("PASS job queue lifecycle coverage");