import type { Express, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { sasquatchSoundInterest, insertSasquatchSoundInterestSchema } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { sendEmail } from "../emailService";
import { requireAdmin } from "../middleware/requireAdmin";

const NICK_EMAIL = "nick@washbizhub.com";

const interestSchema = insertSasquatchSoundInterestSchema.extend({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  storyText: z.string().trim().max(4000).optional().or(z.literal("")),
  songVibe: z.string().trim().max(1000).optional().or(z.literal("")),
  tierInterest: z.enum(["sponsored", "paid", "either"]).optional(),
  hearAbout: z.string().trim().max(120).optional().or(z.literal("")),
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function registerSasquatchSoundRoutes(app: Express, isAuthenticated: any) {
  // Public submit — pre-launch interest
  app.post("/api/sasquatch-sound/interest", async (req: Request, res: Response) => {
    try {
      const parsed = interestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid", details: parsed.error.format() });
      }
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "";
      const userAgent = (req.headers["user-agent"] as string) || "";
      const data = parsed.data;

      const [row] = await db
        .insert(sasquatchSoundInterest)
        .values({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          city: data.city || null,
          state: data.state || null,
          storyText: data.storyText || null,
          songVibe: data.songVibe || null,
          tierInterest: data.tierInterest || null,
          hearAbout: data.hearAbout || null,
          ip,
          userAgent,
        })
        .returning();

      // Fire-and-forget email to Nick. Non-blocking.
      const html = `
        <h2>New Sasquatch Sound interest signup</h2>
        <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>
        ${data.phone ? `<p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>` : ""}
        ${data.city || data.state ? `<p><strong>Location:</strong> ${escapeHtml([data.city, data.state].filter(Boolean).join(", "))}</p>` : ""}
        ${data.tierInterest ? `<p><strong>Tier interest:</strong> ${escapeHtml(data.tierInterest)}</p>` : ""}
        ${data.hearAbout ? `<p><strong>Heard about us via:</strong> ${escapeHtml(data.hearAbout)}</p>` : ""}
        ${data.songVibe ? `<p><strong>Song vibe:</strong><br>${escapeHtml(data.songVibe).replace(/\n/g, "<br>")}</p>` : ""}
        ${data.storyText ? `<p><strong>Their story:</strong><br>${escapeHtml(data.storyText).replace(/\n/g, "<br>")}</p>` : ""}
        <hr>
        <p style="color:#666;font-size:12px">
          Signup ID #${row.id} · ${new Date().toISOString()}<br>
          IP: ${escapeHtml(ip)}<br>
          UA: ${escapeHtml(userAgent.slice(0, 200))}
        </p>
      `;
      sendEmail({
        to: NICK_EMAIL,
        subject: `🎵 Sasquatch Sound interest: ${data.name}${data.tierInterest ? ` (${data.tierInterest})` : ""}`,
        html,
        text: `New Sasquatch Sound interest signup\n\nName: ${data.name}\nEmail: ${data.email}\n${data.phone ? `Phone: ${data.phone}\n` : ""}${data.tierInterest ? `Tier: ${data.tierInterest}\n` : ""}${data.songVibe ? `\nSong vibe: ${data.songVibe}\n` : ""}${data.storyText ? `\nStory: ${data.storyText}\n` : ""}`,
      })
        .then(async (result) => {
          if (result.success) {
            await db
              .update(sasquatchSoundInterest)
              .set({ emailedNick: true })
              .where(eq(sasquatchSoundInterest.id, row.id));
          } else {
            console.error("[sasquatch-sound] email send failed:", result.error);
          }
        })
        .catch((err) => console.error("[sasquatch-sound] email send threw:", err));

      return res.json({ ok: true, id: row.id });
    } catch (err: any) {
      console.error("[sasquatch-sound/interest] error:", err);
      return res.status(500).json({ error: "Failed to submit" });
    }
  });

  // Admin — list signups
  app.get(
    "/api/admin/sasquatch-sound/interest",
    isAuthenticated,
    requireAdmin,
    async (_req: Request, res: Response) => {
      const rows = await db
        .select()
        .from(sasquatchSoundInterest)
        .orderBy(desc(sasquatchSoundInterest.createdAt))
        .limit(500);
      return res.json({ items: rows });
    }
  );
}
