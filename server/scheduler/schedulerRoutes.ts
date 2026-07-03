// Admin-only observability + control for the durable scheduler.
// Mounted at /api/admin/scheduler AFTER setupAuth so requireAdmin's session
// lookup works. Every route is isAuthenticated + requireAdmin.

import { Router } from "express";
import { isAuthenticated } from "../replitAuth";
import { requireAdmin } from "../middleware/requireAdmin";
import {
  listJobsWithStatus,
  listRecentRuns,
  triggerJobNow,
  setJobEnabled,
} from "./scheduler";

const router = Router();

router.get("/jobs", isAuthenticated, requireAdmin, async (_req, res) => {
  try {
    res.json({ jobs: await listJobsWithStatus() });
  } catch (e: any) {
    res.status(500).json({ message: e?.message ?? "Failed to list jobs" });
  }
});

router.get("/runs", isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const jobId = req.query.jobId ? parseInt(String(req.query.jobId), 10) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    res.json({ runs: await listRecentRuns(jobId, limit) });
  } catch (e: any) {
    res.status(500).json({ message: e?.message ?? "Failed to list runs" });
  }
});

router.post("/jobs/:id/run", isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad job id" });
    const job = await triggerJobNow(id);
    if (!job) return res.status(409).json({ message: "Job is currently running or not found" });
    res.json({ job });
  } catch (e: any) {
    res.status(500).json({ message: e?.message ?? "Failed to trigger job" });
  }
});

router.post("/jobs/:id/toggle", isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad job id" });
    const enabled = !!req.body?.enabled;
    const job = await setJobEnabled(id, enabled);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ job });
  } catch (e: any) {
    res.status(500).json({ message: e?.message ?? "Failed to toggle job" });
  }
});

export default router;
