"""Build the paid STUCK companion bundle PDF.

The original workbook stays unchanged. This appends a small, printable
companion section so the bundle is a real second deliverable, not just a
different price button.
"""

from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "attached_assets" / "STUCK_-_The_Sasquatch_Formula_for_Breaking_a_Recovery_Plateau__1788321677906.pdf"
OUTPUT_DIR = ROOT / "attached_assets" / "stuck"
OUTPUT = OUTPUT_DIR / "STUCK-66-Day-Rebuild-Bundle.pdf"


def add_page(doc, title, subtitle, lines):
    page = doc.new_page(width=612, height=792)
    page.draw_rect(fitz.Rect(0, 0, 612, 792), color=(0.05, 0.05, 0.05), fill=(0.05, 0.05, 0.05))
    page.draw_rect(fitz.Rect(0, 0, 612, 12), color=(0.89, 0.45, 0.11), fill=(0.89, 0.45, 0.11))
    page.insert_text((54, 90), "STROKE RECOVERY ACADEMY", fontname="hebo", fontsize=10, color=(0.89, 0.45, 0.11))
    page.insert_text((54, 142), title, fontname="hebo", fontsize=28, color=(0.96, 0.94, 0.88))
    page.insert_textbox(
        fitz.Rect(54, 165, 555, 205),
        subtitle,
        fontname="hebo",
        fontsize=12,
        color=(0.68, 0.66, 0.61),
        lineheight=1.3,
    )
    y = 250
    for line in lines:
        page.draw_rect(fitz.Rect(54, y - 19, 558, y + 32), color=(0.25, 0.25, 0.25), fill=(0.10, 0.10, 0.10), width=0.7)
        page.insert_textbox(
            fitz.Rect(68, y - 8, 540, y + 22),
            line,
            fontname="hebo",
            fontsize=11,
            color=(0.90, 0.88, 0.82),
            lineheight=1.25,
        )
        y += 66
    page.insert_text((54, 752), "Rebuild. Rewire. Rise. — survivor-led education, not medical advice.", fontname="hebo", fontsize=8, color=(0.50, 0.48, 0.44))


def add_tracker_page(doc, start_day):
    page = doc.new_page(width=612, height=792)
    page.draw_rect(fitz.Rect(0, 0, 612, 792), color=(0.05, 0.05, 0.05), fill=(0.05, 0.05, 0.05))
    page.draw_rect(fitz.Rect(0, 0, 612, 12), color=(0.89, 0.45, 0.11), fill=(0.89, 0.45, 0.11))
    page.insert_text((54, 66), "66-DAY REBUILD TRACKER", fontname="hebo", fontsize=18, color=(0.96, 0.94, 0.88))
    page.insert_text((54, 88), f"Days {start_day}–{start_day + 21}  |  Mark the rep, not perfection.", fontname="hebo", fontsize=10, color=(0.68, 0.66, 0.61))
    x0, y0 = 54, 125
    widths = [55, 278, 72, 72, 72]
    headers = ["Day", "One safe rep I chose", "Done", "Effort", "Note"]
    x = x0
    for width, header in zip(widths, headers):
        page.draw_rect(fitz.Rect(x, y0, x + width, y0 + 30), color=(0.89, 0.45, 0.11), fill=(0.89, 0.45, 0.11), width=0.7)
        page.insert_textbox(fitz.Rect(x + 5, y0 + 8, x + width - 5, y0 + 22), header, fontname="hebo", fontsize=8, color=(0.05, 0.05, 0.05))
        x += width
    for i in range(22):
        y = y0 + 30 + i * 25
        x = x0
        for col, width in enumerate(widths):
            page.draw_rect(fitz.Rect(x, y, x + width, y + 25), color=(0.28, 0.28, 0.28), fill=(0.10, 0.10, 0.10), width=0.5)
            if col == 0:
                page.insert_text((x + 18, y + 16), str(start_day + i), fontname="hebo", fontsize=9, color=(0.89, 0.45, 0.11))
            x += width
    page.insert_text((54, 734), "If today is a hard day: one honest rep still counts. If symptoms are new or worsening, stop and contact your care team.", fontname="hebo", fontsize=8, color=(0.68, 0.66, 0.61))


def build():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    source = fitz.open(SOURCE)
    bundle = fitz.open()
    bundle.insert_pdf(source)
    add_page(bundle, "Your 66-Day Rebuild", "A simple place to turn T.L.E.C.A. into a repeatable practice.", [
        "1  TAKE — Name the exact thing that feels stuck.",
        "2  LEARN — Notice one signal from your body, task, or environment.",
        "3  EXPERIMENT — Choose one small, safe variable to change.",
        "4  COMBINE — Pair the rep with a cue, person, or routine.",
        "5  APPLY — Record what happened and choose the next rep.",
    ])
    add_tracker_page(bundle, 1)
    add_tracker_page(bundle, 23)
    add_tracker_page(bundle, 45)
    add_page(bundle, "Weekly Review", "Keep the evidence. Drop the judgment.", [
        "What became 1% easier this week?",
        "What did I learn about timing, setup, fatigue, or support?",
        "Which experiment is worth repeating next week?",
        "What will I shrink on a hard day so the chain stays intact?",
    ])
    bundle.save(OUTPUT)
    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    build()