// Admin-only Business Intelligence API (Task #4).
// Mounted at /api/admin/business AFTER setupAuth so requireAdmin's session
// lookup works. Every route is isAuthenticated + requireAdmin.

import { Router } from "express";
import { isAuthenticated } from "./replitAuth";
import { requireAdmin } from "./middleware/requireAdmin";
import {
  computeBusinessMetrics,
  getTrends,
  captureDailySnapshot,
} from "./services/biMetricsService";

const router = Router();

// GET /api/admin/business/metrics — live funnel/revenue/engagement snapshot.
router.get("/metrics", isAuthenticated, requireAdmin, async (_req, res) => {
  try {
    res.json(await computeBusinessMetrics());
  } catch (e: any) {
    console.error("[bi] metrics failed", e?.message || e);
    res.status(500).json({ message: e?.message ?? "Failed to compute metrics" });
  }
});

// GET /api/admin/business/trends?days=30 — daily snapshot history.
router.get("/trends", isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const days = req.query.days ? parseInt(String(req.query.days), 10) : 30;
    res.json({ days, trends: await getTrends(Number.isFinite(days) ? days : 30) });
  } catch (e: any) {
    console.error("[bi] trends failed", e?.message || e);
    res.status(500).json({ message: e?.message ?? "Failed to load trends" });
  }
});

// POST /api/admin/business/snapshot — capture a snapshot now (manual trigger,
// complements the daily scheduler job). Idempotent per UTC day.
router.post("/snapshot", isAuthenticated, requireAdmin, async (_req, res) => {
  try {
    await captureDailySnapshot();
    res.json({ ok: true });
  } catch (e: any) {
    console.error("[bi] snapshot failed", e?.message || e);
    res.status(500).json({ message: e?.message ?? "Failed to capture snapshot" });
  }
});

export default router;
