// Institutional / Clinical Partnership Platform (B2B) — Task #59 route module.
//
// Mounted AFTER setupAuth(app) so isAuthenticated sees the session middleware.
//
// Route groups & authorization:
//   /api/institutions/admin/*   — platform admin (isAuthenticated + requireAdmin): create/list/update orgs, add staff.
//   /api/institutions/org/:orgId/* — org staff (owner/clinician of that org): roster, bulk invite, cohort dashboard, identified list, remove seat.
//   /api/institutions/invite/:token — public GET (join page); authed POST accept.
//   /api/institutions/me/*      — survivor-facing: my memberships, my consent per org.
//
// Every org-scoped route re-checks the caller's role IN THAT org, so a staffer
// of org A can never read org B (no cross-tenant leak). Cohort payloads are
// consent-gated + small-cohort-suppressed inside the service.

import type { Express } from "express";
import { z } from "zod";
import { getUserId } from "./lib/authUtils";
import { requireAdmin } from "./middleware/requireAdmin";
import { paymentCheckoutLimiter, billingPortalLimiter } from "./middleware/publicRateLimit";
import * as inst from "./services/institutionService";
import * as billing from "./services/institutionBillingService";

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function registerInstitutionRoutes(app: Express, isAuthenticated: any) {
  // ── Org-staff authorization guard (owner or clinician of :orgId) ───────────
  async function requireOrgStaff(req: any, res: any, next: any) {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const orgId = Number(req.params.orgId);
      if (!Number.isFinite(orgId)) return res.status(400).json({ message: "Invalid org" });
      const role = await inst.getUserOrgRole(orgId, userId);
      if (role !== "owner" && role !== "clinician") {
        // 404 (not 403) so org existence isn't leaked to non-members.
        return res.status(404).json({ message: "Not found" });
      }
      req.orgId = orgId;
      req.orgRole = role;
      next();
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Authorization failed" });
    }
  }

  // ── Org-owner authorization guard (owner of :orgId only) ───────────────────
  // Billing is owner-only — clinicians manage the roster but never the payment
  // method. 404 (not 403) on non-owners so org existence isn't leaked.
  async function requireOrgOwner(req: any, res: any, next: any) {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const orgId = Number(req.params.orgId);
      if (!Number.isFinite(orgId)) return res.status(400).json({ message: "Invalid org" });
      const role = await inst.getUserOrgRole(orgId, userId);
      if (role !== "owner") return res.status(404).json({ message: "Not found" });
      req.orgId = orgId;
      req.orgRole = role;
      next();
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Authorization failed" });
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // PLATFORM ADMIN
  // ════════════════════════════════════════════════════════════════════════
  const createOrgSchema = z.object({
    name: z.string().min(2).max(160),
    orgType: z.enum(["rehab_center", "hospital", "clinic", "discharge_program", "research", "other"]).optional(),
    contactName: z.string().max(160).optional(),
    contactEmail: z.string().max(200).optional(),
    seatLimit: z.number().int().min(0).max(100000).optional(),
    status: z.enum(["trial", "active", "suspended"]).optional(),
    notes: z.string().max(2000).optional(),
    ownerUserId: z.string().max(80).optional(), // optionally attach an owner
    ownerEmail: z.string().max(200).optional(),
  });

  app.post("/api/institutions/admin/orgs", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const parsed = createOrgSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
      const org = await inst.createOrganization(parsed.data);
      if (parsed.data.ownerUserId) {
        await inst.addStaffMember(org.id, parsed.data.ownerUserId, "owner");
      }
      res.json(org);
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed to create org" });
    }
  });

  app.get("/api/institutions/admin/orgs", isAuthenticated, requireAdmin, async (_req: any, res) => {
    try {
      res.json(await inst.listOrganizations());
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed to list orgs" });
    }
  });

  const updateOrgSchema = z.object({
    name: z.string().min(2).max(160).optional(),
    orgType: z.enum(["rehab_center", "hospital", "clinic", "discharge_program", "research", "other"]).optional(),
    contactName: z.string().max(160).optional(),
    contactEmail: z.string().max(200).optional(),
    seatLimit: z.number().int().min(0).max(100000).optional(),
    status: z.enum(["trial", "active", "suspended"]).optional(),
    billingStatus: z.enum(["none", "active", "past_due", "canceled"]).optional(),
    notes: z.string().max(2000).optional(),
  });

  app.patch("/api/institutions/admin/orgs/:orgId", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const orgId = Number(req.params.orgId);
      if (!Number.isFinite(orgId)) return res.status(400).json({ message: "Invalid org" });
      const parsed = updateOrgSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
      const org = await inst.updateOrganization(orgId, parsed.data);
      if (!org) return res.status(404).json({ message: "Not found" });
      // Seat-limit change → sync the Stripe subscription quantity (proration).
      // No-op if the org has no active seat subscription yet. Best-effort so a
      // Stripe hiccup never blocks the admin update.
      if (parsed.data.seatLimit != null) {
        try {
          await billing.syncSeatSubscriptionQuantity(orgId, parsed.data.seatLimit);
        } catch (e: any) {
          console.warn("[institution-billing] seat quantity sync failed:", e?.message ?? e);
        }
      }
      res.json(org);
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed to update org" });
    }
  });

  const addStaffSchema = z.object({
    userId: z.string().min(1).max(80),
    role: z.enum(["owner", "clinician"]),
  });
  app.post("/api/institutions/admin/orgs/:orgId/staff", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const orgId = Number(req.params.orgId);
      if (!Number.isFinite(orgId)) return res.status(400).json({ message: "Invalid org" });
      const parsed = addStaffSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
      await inst.addStaffMember(orgId, parsed.data.userId, parsed.data.role);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed to add staff" });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  // ORG STAFF (owner/clinician of :orgId)
  // ════════════════════════════════════════════════════════════════════════
  app.get("/api/institutions/org/:orgId", isAuthenticated, requireOrgStaff, async (req: any, res) => {
    try {
      const org = await inst.getOrganization(req.orgId);
      if (!org) return res.status(404).json({ message: "Not found" });
      const seats = await inst.getSeatUsage(req.orgId);
      res.json({
        id: org.id,
        name: org.name,
        slug: org.slug,
        orgType: org.orgType,
        status: org.status,
        seats,
        role: req.orgRole,
      });
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed" });
    }
  });

  app.get("/api/institutions/org/:orgId/dashboard", isAuthenticated, requireOrgStaff, async (req: any, res) => {
    try {
      res.json(await inst.getCohortMetrics(req.orgId));
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed to load dashboard" });
    }
  });

  app.get("/api/institutions/org/:orgId/roster", isAuthenticated, requireOrgStaff, async (req: any, res) => {
    try {
      res.json(await inst.getRoster(req.orgId));
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed to load roster" });
    }
  });

  app.get("/api/institutions/org/:orgId/identified", isAuthenticated, requireOrgStaff, async (req: any, res) => {
    try {
      res.json(await inst.getIdentifiedMembers(req.orgId));
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed to load members" });
    }
  });

  const bulkInviteSchema = z.object({
    emails: z.array(z.string().max(200)).min(1).max(500),
    // When true (default), each invited survivor is emailed their join link via
    // the crisis-safe template. Set false to just mint tokens (staff hand out links).
    sendInviteEmail: z.boolean().optional().default(true),
  });
  app.post("/api/institutions/org/:orgId/invite", isAuthenticated, requireOrgStaff, async (req: any, res) => {
    try {
      const parsed = bulkInviteSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Provide 1-500 emails" });
      const result = await inst.bulkInviteSurvivors(req.orgId, parsed.data.emails);
      // Best-effort email of join links — never fatal to the invite itself.
      let emailsSent = 0;
      let emailsFailed = 0;
      if (parsed.data.sendInviteEmail && result.invited.length) {
        try {
          const org = await inst.getOrganization(req.orgId);
          const orgName = org?.name ?? "your care team";
          const { sendEmail } = await import("./emailService");
          const { renderEmail, ctaButton } = await import("./emailTemplate");
          const base = process.env.PUBLIC_BASE_URL || "https://strokerecoveryacademy.com";
          for (const inv of result.invited) {
            const link = `${base}/institution/join/${inv.token}`;
            const html = renderEmail({
              previewText: `${orgName} set up full Stroke Recovery Academy access for you — no cost to you.`,
              eyebrow: "YOUR CARE TEAM",
              headline: "Your recovery access is ready",
              subheadline: `${orgName} set up full access for you — no cost.`,
              showCrisisCallout: true,
              whyReceiving: `You're receiving this because ${orgName} provisioned Stroke Recovery Academy access for you.`,
              bodyHtml: `
                <p class="body-text">Your care team at <strong>${escapeHtml(orgName)}</strong> set up full access to Stroke Recovery Academy for you — no cost to you.</p>
                <p class="body-text">Activate your account to start rebuilding. You choose what your care team sees — it starts private and de-identified, always your call. Heart's still thumpin'.</p>
                ${ctaButton(link, "Activate your account")}
                <p class="body-text">If the button doesn't work, paste this link into your browser:<br/><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>
              `,
            });
            try {
              const sent = await sendEmail({
                to: inv.email,
                subject: `${orgName} set up your Stroke Recovery Academy access`,
                html,
                text: `Your care team at ${orgName} set up Stroke Recovery Academy access for you — no cost.\n\nActivate: ${link}\n\nYou choose what your care team sees. It starts private and de-identified.\n\nIf you are in crisis, call or text 988 (U.S.). In immediate danger, call 911.\n\nMedical disclaimer: Stroke Recovery Academy is educational and non-clinical. Always talk to your physician before starting, stopping, or changing any rehabilitation program.`,
              });
              if (sent?.success) emailsSent++;
              else {
                emailsFailed++;
                console.error(`[institution-invite] Resend failed for invite email (org ${req.orgId}):`, sent?.error);
              }
            } catch (sendErr: any) {
              emailsFailed++;
              console.error(`[institution-invite] Error sending invite email (org ${req.orgId}):`, sendErr?.message ?? sendErr);
            }
          }
        } catch (err: any) {
          console.error(`[institution-invite] Invite email batch failed (org ${req.orgId}):`, err?.message ?? err);
        }
      }
      res.json({ ...result, emailsSent, emailsFailed });
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed to invite" });
    }
  });

  app.delete("/api/institutions/org/:orgId/member/:memberId", isAuthenticated, requireOrgStaff, async (req: any, res) => {
    try {
      const memberId = Number(req.params.memberId);
      if (!Number.isFinite(memberId)) return res.status(400).json({ message: "Invalid member" });
      const ok = await inst.removeMember(req.orgId, memberId);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed to remove member" });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  // ORG BILLING (owner-only) — per-seat Stripe subscription, invoices/receipts
  // ════════════════════════════════════════════════════════════════════════
  // Snapshot: billing status, current subscription, per-seat price, invoices.
  app.get("/api/institutions/org/:orgId/billing", isAuthenticated, requireOrgOwner, async (req: any, res) => {
    try {
      res.json(await billing.getOrgBilling(req.orgId));
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed to load billing" });
    }
  });

  // Start (or scale up to) a seat subscription via Stripe Checkout. `seats`
  // sets the org's seat limit and the subscription quantity. If a subscription
  // already exists, route the owner to the billing portal instead.
  const checkoutSchema = z.object({ seats: z.number().int().min(1).max(100000) });
  app.post(
    "/api/institutions/org/:orgId/billing/checkout",
    isAuthenticated,
    paymentCheckoutLimiter,
    requireOrgOwner,
    async (req: any, res) => {
      try {
        const parsed = checkoutSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ message: "Provide a seat count (1+)" });
        const current = await billing.getOrgBilling(req.orgId);
        const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
        if (current.hasSubscription) {
          // Already subscribed — adjust quantity/seat limit in place and send
          // them to the portal to review the prorated invoice.
          await inst.updateOrganization(req.orgId, { seatLimit: parsed.data.seats });
          await billing.syncSeatSubscriptionQuantity(req.orgId, parsed.data.seats);
          const portal = await billing.createOrgBillingPortal(req.orgId, `${baseUrl}/institution`);
          return res.json({ url: portal.url, adjusted: true });
        }
        // New subscription: persist the intended seat limit, then checkout.
        await inst.updateOrganization(req.orgId, { seatLimit: parsed.data.seats });
        const session = await billing.createSeatCheckoutSession(req.orgId, parsed.data.seats, baseUrl);
        res.json({ url: session.url });
      } catch (err: any) {
        res.status(500).json({ message: err?.message ?? "Failed to start checkout" });
      }
    },
  );

  // Billing portal — manage payment method, view invoices/receipts, cancel.
  app.post(
    "/api/institutions/org/:orgId/billing/portal",
    isAuthenticated,
    billingPortalLimiter,
    requireOrgOwner,
    async (req: any, res) => {
      try {
        const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
        const portal = await billing.createOrgBillingPortal(req.orgId, `${baseUrl}/institution`);
        res.json({ url: portal.url });
      } catch (err: any) {
        res.status(500).json({ message: err?.message ?? "Failed to open billing portal" });
      }
    },
  );

  // ════════════════════════════════════════════════════════════════════════
  // INVITE (public info + authed accept)
  // ════════════════════════════════════════════════════════════════════════
  app.get("/api/institutions/invite/:token", async (req: any, res) => {
    try {
      const info = await inst.getInviteByToken(String(req.params.token));
      if (!info) return res.status(404).json({ message: "Invite not found" });
      // Only surface org display info + acceptance state, never internal ids of others.
      res.json({
        orgName: info.org.name,
        orgType: info.org.orgType,
        email: info.email,
        status: info.status,
      });
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed" });
    }
  });

  app.post("/api/institutions/invite/:token/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const result = await inst.acceptInvite(String(req.params.token), userId);
      if (!result.ok) return res.status(400).json({ message: result.reason ?? "Could not accept invite" });
      res.json({ ok: true, orgId: result.orgId });
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed to accept" });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  // SURVIVOR-FACING (my memberships + consent controls)
  // ════════════════════════════════════════════════════════════════════════
  app.get("/api/institutions/me/memberships", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const rows = await inst.listMembershipsForUser(userId);
      res.json(
        rows.map((r) => ({
          orgId: r.org_id,
          orgName: r.org_name,
          orgType: r.org_type,
          role: r.role,
          shareLevel: r.share_level ?? "aggregate",
          joinedAt: r.joined_at,
        })),
      );
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed" });
    }
  });

  const consentSchema = z.object({
    shareLevel: z.enum(["none", "aggregate", "identified"]),
  });
  app.patch("/api/institutions/me/consent/:orgId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const orgId = Number(req.params.orgId);
      if (!Number.isFinite(orgId)) return res.status(400).json({ message: "Invalid org" });
      const parsed = consentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid consent level" });
      // Caller must be an active survivor member of this org.
      const role = await inst.getUserOrgRole(orgId, userId);
      if (role !== "survivor") return res.status(404).json({ message: "Not found" });
      await inst.setConsent(orgId, userId, parsed.data.shareLevel);
      res.json({ ok: true, shareLevel: parsed.data.shareLevel });
    } catch (err: any) {
      res.status(500).json({ message: err?.message ?? "Failed to update consent" });
    }
  });
}
