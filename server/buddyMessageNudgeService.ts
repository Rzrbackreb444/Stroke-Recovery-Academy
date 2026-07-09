// Buddy-message nudges — flows through the unified lifecycle messaging engine.
// A buddy pair only works if messages get answered, but today a survivor only
// sees a new DM if they happen to open /recovery/messages. This finds unread
// 1:1 (buddy) direct messages older than ~1 hour and sends the recipient one
// digest-style "your buddy wrote to you" nudge across email + push + SMS
// (consent-gated per channel by the engine).
//
// Idempotency: the dedupeKey is keyed on the recipient + the newest unread
// message id they currently have (buddy-dm-nudge-{recipientId}-{maxMsgId}-{ch}).
// So the same unread backlog never re-notifies on the next hourly run, but a
// genuinely new buddy message (higher id) mints a fresh key and nudges once
// more. Muted conversations and already-read messages are excluded at the query.
//
// Static copy only, so the crisis gate isn't needed here (the DM send handler
// already runs the crisis gate on the message body itself).
import { db } from "./db";
import { sql } from "drizzle-orm";
import { sendMessage } from "./messaging";

interface DueRow {
  recipient_id: string;
  unread_count: number;
  max_msg_id: number;
}

export async function runBuddyMessageNudges(): Promise<void> {
  // One row per recipient who has unread buddy DMs older than ~1 hour, across
  // all their 1:1 conversations. is_read is a single boolean per message which
  // is correct for 1:1 direct conversations (the buddy surface). Muted
  // conversations are skipped.
  const res = await db.execute(sql`
    SELECT cp.user_id AS recipient_id,
           COUNT(*)::int AS unread_count,
           MAX(dm.id)::int AS max_msg_id
    FROM direct_messages dm
    JOIN conversations c ON c.id = dm.conversation_id AND c.type = 'direct'
    JOIN conversation_participants cp
      ON cp.conversation_id = dm.conversation_id
     AND cp.user_id <> dm.sender_id
     AND cp.is_muted = false
    WHERE dm.is_read = false
      AND dm.created_at < now() - interval '1 hour'
    GROUP BY cp.user_id
  `);
  const rows = (((res as any).rows ?? res) as DueRow[]) || [];

  let sent = 0;
  for (const r of rows) {
    const n = Number(r.unread_count) || 0;
    if (n < 1) continue;
    const link = "/recovery/messages";
    const noun = n === 1 ? "message" : "messages";
    const base = `buddy-dm-nudge-${r.recipient_id}-${r.max_msg_id}`;

    // Email
    await sendMessage({
      userId: r.recipient_id,
      channel: "email",
      category: "buddy-dm-nudge",
      dedupeKey: `${base}-email`,
      subject: `Your recovery buddy is waiting on you`,
      html: `<p>Hey, survivor.</p>
<p>You've got <strong>${n} unread ${noun}</strong> from your recovery buddy. A buddy pair only works if you both show up — don't leave 'em hanging.</p>
<p><a href="${link}">Read and reply</a> when you're ready.</p>
<p style="color:#888;font-size:12px">Buddy chat is peer support — not a substitute for medical care. In a crisis, call or text 988.</p>`,
      text: `You've got ${n} unread ${noun} from your recovery buddy. Read and reply: ${link}. Peer support, not medical care. Crisis: call or text 988.`,
    });

    // Push
    await sendMessage({
      userId: r.recipient_id,
      channel: "push",
      category: "buddy-dm-nudge",
      dedupeKey: `${base}-push`,
      push: {
        title: "Your buddy wrote to you",
        body: `${n} unread ${noun} waiting. Tap to reply.`,
        url: link,
        type: "buddy-dm-nudge",
        tag: `buddy-dm-${r.recipient_id}`,
      },
    });

    // SMS — the engine skips if the survivor hasn't consented (sms_disabled /
    // no_phone) and defers in quiet hours, so attempting is always safe.
    await sendMessage({
      userId: r.recipient_id,
      channel: "sms",
      category: "buddy-dm-nudge",
      dedupeKey: `${base}-sms`,
      smsBody: `You've got ${n} unread ${noun} from your recovery buddy. Reply here: ${link}. Reply STOP to opt out. Crisis: call or text 988.`,
    });
    sent++;
  }
  if (sent > 0) console.log(`[buddy-dm-nudge] processed ${sent} recipient nudge(s)`);
}
