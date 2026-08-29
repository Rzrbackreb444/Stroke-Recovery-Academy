import assert from "node:assert/strict";
import {
  JobQueueService,
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
  queue.on("job:start", (job: Job) => {
    queue.cancelJob(job.id, "owner-a");
  });
  const cancelled = queue.createJob("ai_generation", "owner-a", {});

  assert.equal(cancelled.status, "cancelled");
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(cancelled.status, "cancelled", "cancellation clears the processing timeout");
  assert.equal(queue.getQueueStats().failed, 0);
}

console.log("PASS job queue lifecycle coverage");