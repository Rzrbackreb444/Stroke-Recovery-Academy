from pathlib import Path
import fitz


PDF_PATH = Path(
    "attached_assets/STUCK_-_The_Sasquatch_Formula_for_Breaking_a_Recovery_Plateau__1788321677906.pdf"
)
OUTPUT_DIR = Path(".agents/outputs/stuck-pdf-pages")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

document = fitz.open(PDF_PATH)
print(f"pages={document.page_count}")
print(f"metadata={document.metadata}")

for page_number, page in enumerate(document):
    text = page.get_text("text").strip()
    image_count = len(page.get_images(full=True))
    print(
        f"page={page_number + 1} "
        f"chars={len(text)} "
        f"images={image_count} "
        f"size={page.rect.width:.0f}x{page.rect.height:.0f}"
    )

for page_number in (0, 1, 4, 7, 13, 20, 25, 27, 28):
    page = document[page_number]
    pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
    output_path = OUTPUT_DIR / f"page-{page_number + 1:02d}.png"
    pixmap.save(output_path)
    print(f"rendered={output_path}")