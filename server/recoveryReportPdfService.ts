import PDFDocument from "pdfkit";
import type { RecoveryReport } from "./services/recoveryReport/recoveryReportService";

// Brand palette — warm dark + gold, light "paper" body pages.
const INK_DARK = "#0E0D0C";
const GOLD = "#E2741B";
const PAPER = "#FBF7F0";
const INK_TEXT = "#1A1614";
const MUTED = "#6B5E54";
const BONE = "#F5EFE6";
const RULE = "#E4DACB";

const MARGIN = 64;
const DEFICIT_DOMAINS: Array<keyof Pick<RecoveryReport["deficitTrend"][number], "physical" | "cognitive" | "speech" | "emotional" | "memory">> = [
  "physical",
  "cognitive",
  "speech",
  "emotional",
  "memory",
];

function fmtDate(value: any): string {
  if (!value) return "—";
  const d = new Date(typeof value === "string" && value.length === 10 ? value + "T00:00:00Z" : value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Print-ready recovery outcomes report. Owner-only content (includes flicker
 * moments). Non-clinical framing baked into the copy. Returns a Buffer.
 */
export async function generateRecoveryReportPdf(
  report: RecoveryReport,
  authorName: string,
): Promise<Buffer> {
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

      doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(42);
      doc.text("MY RECOVERY REPORT", MARGIN, pageH * 0.28, { width: contentW, align: "center" });

      doc.fillColor(BONE).font("Helvetica").fontSize(14);
      doc.moveDown(0.6);
      doc.text("Outcomes over time", { width: contentW, align: "center" });

      doc.fillColor(GOLD).fontSize(12);
      doc.moveDown(0.4);
      doc.text(authorName || "A Survivor", { width: contentW, align: "center" });

      const ruleY = doc.y + 18;
      doc.save();
      doc.moveTo(pageW / 2 - 60, ruleY).lineTo(pageW / 2 + 60, ruleY).lineWidth(2).strokeColor(GOLD).stroke();
      doc.restore();

      const range =
        report.tenure.memberSince
          ? `${fmtDate(report.tenure.memberSince)} — ${fmtDate(report.generatedAt)}  ·  ${report.tenure.daysTracked} days tracked`
          : `Generated ${fmtDate(report.generatedAt)}`;
      doc.fillColor(MUTED).font("Helvetica").fontSize(10);
      doc.text(range, MARGIN, ruleY + 22, { width: contentW, align: "center" });

      doc.fillColor(MUTED).fontSize(9);
      doc.text(
        "Survivor-built — not medical advice. Bring this to your care team; it does not replace them.",
        MARGIN,
        pageH - MARGIN - 40,
        { width: contentW, align: "center" },
      );
      doc.fillColor(GOLD).fontSize(9);
      doc.text("Heart's still thumpin'.", MARGIN, pageH - MARGIN - 14, { width: contentW, align: "center" });

      // ---- Body ----
      doc.addPage();

      if (!report.hasData) {
        doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(13);
        doc.text(
          "No recovery data logged yet. Start with one rep, one check-in, one flicker — the report fills itself in as you go.",
          { width: contentW },
        );
        doc.end();
        return;
      }

      // Section helper
      const heading = (label: string) => {
        if (doc.y > pageH - MARGIN - 80) doc.addPage();
        doc.moveDown(0.6);
        doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(15);
        doc.text(label, MARGIN, doc.y, { width: contentW });
        doc.moveDown(0.3);
        doc.x = MARGIN;
      };
      const rule = () => {
        doc.save();
        doc.moveTo(MARGIN, doc.y).lineTo(pageW - MARGIN, doc.y).lineWidth(0.5).strokeColor(RULE).stroke();
        doc.restore();
        doc.moveDown(0.4);
      };

      // ---- Summary grid ----
      heading("The numbers");
      const s = report.summary;
      const stats: Array<[string, string]> = [
        ["Current streak", `${s.currentStreak} days`],
        ["Longest streak", `${s.longestStreak} days`],
        ["Active days", `${s.totalActiveDays}`],
        ["Total reps", `${s.totalReps.toLocaleString()}`],
        ["Exercise sessions", `${s.exerciseSessions}`],
        ["Flickers logged", `${s.flickerCount}`],
        ["Breakthroughs", `${s.breakthroughCount}`],
        ["Milestones", `${s.milestoneCount}`],
        ["Assessments", `${s.assessmentCount}`],
      ];
      const colW = contentW / 3;
      let gx = MARGIN;
      let gy = doc.y;
      stats.forEach(([label, value], i) => {
        const col = i % 3;
        gx = MARGIN + col * colW;
        if (col === 0 && i > 0) gy += 46;
        doc.fillColor(INK_TEXT).font("Helvetica-Bold").fontSize(18);
        doc.text(value, gx, gy, { width: colW - 8 });
        doc.fillColor(MUTED).font("Helvetica").fontSize(8.5);
        doc.text(label.toUpperCase(), gx, gy + 22, { width: colW - 8, characterSpacing: 0.5 });
      });
      doc.x = MARGIN;
      doc.y = gy + 52;

      // ---- Sasquatch Scale trend (1-10, higher is stronger) ----
      if (report.deficitTrend.length > 0) {
        heading("Sasquatch Scale over time (1 = lowest, 10 = highest)");
        rule();
        const first = report.deficitTrend[0];
        const last = report.deficitTrend[report.deficitTrend.length - 1];
        doc.fillColor(MUTED).font("Helvetica").fontSize(9);
        doc.text(`${fmtDate(first.date)}  →  ${fmtDate(last.date)}`, { width: contentW });
        doc.moveDown(0.3);
        DEFICIT_DOMAINS.forEach((dom) => {
          const f = first[dom];
          const l = last[dom];
          if (f == null && l == null) return;
          const delta = f != null && l != null ? l - f : null;
          const arrow = delta == null ? "" : delta > 0 ? "  ▲ stronger" : delta < 0 ? "  ▼ dipped" : "  = held";
          doc.fillColor(INK_TEXT).font("Helvetica-Bold").fontSize(10.5);
          doc.text(
            `${dom.charAt(0).toUpperCase() + dom.slice(1)}: ${f ?? "—"} → ${l ?? "—"}${arrow}`,
            { width: contentW },
          );
          doc.moveDown(0.15);
        });
      }

      // ---- Milestones ----
      if (report.milestones.length > 0) {
        heading("Milestones");
        rule();
        report.milestones.forEach((m) => {
          if (doc.y > pageH - MARGIN - 40) doc.addPage();
          doc.fillColor(INK_TEXT).font("Helvetica-Bold").fontSize(10.5);
          doc.text(m.name, MARGIN, doc.y, { width: contentW, continued: true });
          doc.fillColor(MUTED).font("Helvetica").fontSize(9);
          doc.text(`   ${fmtDate(m.date)} · ${m.category}`);
          doc.moveDown(0.2);
        });
      }

      // ---- First returns / flickers ----
      if (report.flickers.length > 0) {
        heading("First returns & flickers");
        rule();
        doc.fillColor(MUTED).font("Helvetica").fontSize(9);
        doc.text(
          `${report.summary.flickerCount} logged · ${report.summary.breakthroughCount} breakthroughs`,
          { width: contentW },
        );
        doc.moveDown(0.3);
        // Show the most recent 40 to keep the PDF bounded.
        const recent = [...report.flickers].slice(-40).reverse();
        recent.forEach((f) => {
          if (doc.y > pageH - MARGIN - 40) doc.addPage();
          const tag = f.isBreakthrough ? " ★" : "";
          doc.fillColor(INK_TEXT).font("Helvetica").fontSize(10);
          const bodyPart = f.bodyPart ? ` [${f.bodyPart}]` : "";
          const moment = f.moment ? ` — ${f.moment}` : "";
          doc.text(
            `${fmtDate(f.date)}  ·  intensity ${f.intensity}/5${bodyPart}${tag}${moment}`,
            { width: contentW },
          );
          doc.moveDown(0.15);
        });
      }

      // ---- Vitals ----
      if (report.vitals.length > 0) {
        heading("Vitals trend");
        rule();
        const v0 = report.vitals[0];
        const vN = report.vitals[report.vitals.length - 1];
        doc.fillColor(INK_TEXT).font("Helvetica").fontSize(10);
        const bp = (p: typeof v0) =>
          p.systolic != null && p.diastolic != null ? `${p.systolic}/${p.diastolic}` : "—";
        doc.text(`Blood pressure: ${bp(v0)} (${fmtDate(v0.date)})  →  ${bp(vN)} (${fmtDate(vN.date)})`, {
          width: contentW,
        });
        doc.moveDown(0.15);
        doc.text(
          `Heart rate: ${v0.heartRate ?? "—"} bpm  →  ${vN.heartRate ?? "—"} bpm  ·  ${report.vitals.length} readings`,
          { width: contentW },
        );
      }

      // ---- Footer disclaimer on last content page ----
      doc.moveDown(1.2);
      rule();
      doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(8.5);
      doc.text(
        "This report reflects what you logged. It is education and encouragement from one survivor's system — not a clinical assessment, diagnosis, or medical advice. Share it with your doctor, neurologist, or therapist to inform (not replace) their care. Suspect a new stroke? Call 911.",
        MARGIN,
        doc.y,
        { width: contentW },
      );

      doc.end();
    } catch (err) {
      reject(err as Error);
    }
  });
}
