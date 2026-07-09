import PDFDocument from "pdfkit";
import { storage } from "./storage";

// Brand palette — warm dark + gold, light "paper" body pages.
const INK_DARK = "#0E0D0C";
const GOLD = "#E2741B";
const PAPER = "#FBF7F0";
const INK_TEXT = "#1A1614";
const MUTED = "#6B5E54";
const BONE = "#F5EFE6";

const MARGIN = 64;

function fmtDate(value: any): string {
  if (!value) return "Undated";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Undated";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Generate a personalized "My Reflections" PDF from a survivor's own journal
 * entries (oldest -> newest). Pure passthrough of their words — never AI, never
 * fabricated. Returns a Buffer ready to upload to object storage.
 */
export async function generateReflectionsPdf(userId: string, authorName: string): Promise<Buffer> {
  const rowsDesc = await storage.getJournalEntries(userId);
  const entries = [...rowsDesc].reverse();

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "LETTER", margin: MARGIN, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c as Buffer));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const contentW = pageW - MARGIN * 2;

      // Paint paper background on every page added AFTER the dark title page.
      doc.on("pageAdded", () => {
        doc.save();
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(PAPER);
        doc.restore();
        doc.fillColor(INK_TEXT);
        doc.x = MARGIN;
        doc.y = MARGIN;
      });

      // ---- Title page (dark) ----
      doc.save();
      doc.rect(0, 0, pageW, pageH).fill(INK_DARK);
      doc.restore();

      doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(46);
      doc.text("MY REFLECTIONS", MARGIN, pageH * 0.32, { width: contentW, align: "center" });

      doc.fillColor(BONE).font("Helvetica").fontSize(14);
      doc.moveDown(0.6);
      doc.text("A recovery journal", { width: contentW, align: "center" });

      doc.fillColor(GOLD).fontSize(12);
      doc.moveDown(0.4);
      doc.text(authorName || "A Survivor", { width: contentW, align: "center" });

      // Gold rule.
      const ruleY = doc.y + 18;
      doc.save();
      doc.moveTo(pageW / 2 - 60, ruleY).lineTo(pageW / 2 + 60, ruleY).lineWidth(2).strokeColor(GOLD).stroke();
      doc.restore();

      const count = entries.length;
      const range =
        count > 0
          ? `${fmtDate(entries[0].created_at)} — ${fmtDate(entries[count - 1].created_at)}`
          : "";
      doc.fillColor(MUTED).font("Helvetica").fontSize(10);
      doc.text(
        `${count} ${count === 1 ? "entry" : "entries"}${range ? "  ·  " + range : ""}`,
        MARGIN,
        ruleY + 22,
        { width: contentW, align: "center" },
      );

      doc.fillColor(MUTED).fontSize(9);
      doc.text("Heart's still thumpin'.", MARGIN, pageH - MARGIN - 14, {
        width: contentW,
        align: "center",
      });

      // ---- Body pages (paper) ----
      doc.addPage();

      if (count === 0) {
        doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(13);
        doc.text("No reflections yet. The first word is the hardest.", { width: contentW });
      }

      entries.forEach((e, idx) => {
        // Avoid orphaned headers near the bottom of a page.
        if (doc.y > pageH - MARGIN - 90) doc.addPage();

        if (idx > 0) {
          doc.save();
          doc
            .moveTo(MARGIN, doc.y)
            .lineTo(pageW - MARGIN, doc.y)
            .lineWidth(0.5)
            .strokeColor("#E4DACB")
            .stroke();
          doc.restore();
          doc.moveDown(1);
        }

        doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(15);
        doc.text(fmtDate(e.created_at), { width: contentW });

        const meta: string[] = [];
        if (e.mood_label) meta.push(String(e.mood_label).toUpperCase());
        if (e.energy_level != null) meta.push(`ENERGY ${e.energy_level}/5`);
        if (meta.length) {
          doc.fillColor(MUTED).font("Helvetica").fontSize(9);
          doc.moveDown(0.15);
          doc.text(meta.join("  ·  "), { width: contentW, characterSpacing: 0.5 });
        }

        const content = String(e.content || "").trim();
        if (content) {
          doc.fillColor(INK_TEXT).font("Helvetica").fontSize(11);
          doc.moveDown(0.5);
          for (const para of content.split(/\n+/).map((p) => p.trim()).filter(Boolean)) {
            doc.text(para, { width: contentW, align: "left", lineGap: 2 });
            doc.moveDown(0.4);
          }
        }

        const transcript = String(e.voice_transcript || "").trim();
        if (transcript) {
          doc.moveDown(0.2);
          const blockTop = doc.y;
          doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8.5);
          doc.text("VOICE NOTE", MARGIN + 14, doc.y, { width: contentW - 14, characterSpacing: 0.5 });
          doc.fillColor(INK_TEXT).font("Helvetica-Oblique").fontSize(10.5);
          doc.text(transcript, MARGIN + 14, doc.y + 2, { width: contentW - 14, lineGap: 2 });
          const blockBottom = doc.y;
          doc.save();
          doc
            .moveTo(MARGIN + 2, blockTop)
            .lineTo(MARGIN + 2, blockBottom)
            .lineWidth(2)
            .strokeColor(GOLD)
            .stroke();
          doc.restore();
          doc.x = MARGIN;
          doc.moveDown(0.4);
        }

        const caption = String(e.photo_caption || "").trim();
        if (caption) {
          doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(9.5);
          doc.text(`Photo — ${caption}`, MARGIN, doc.y, { width: contentW });
        }

        doc.x = MARGIN;
        doc.moveDown(0.8);
      });

      doc.end();
    } catch (err) {
      reject(err as Error);
    }
  });
}
