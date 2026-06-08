import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import sharp from 'sharp';

/**
 * Generates a Lulu-compliant cover PDF from the cover image.
 *
 * Book specs:
 *   - 6" x 9" (US Trade, perfect bound)
 *   - 314 pages
 *   - 60# white standard paper
 *   - 0.125" bleed
 *
 * Spine width: 314/2 = 157 sheets * 0.0025" = 0.3925" ≈ 0.393"
 *
 * Cover dimensions:
 *   - Width: 0.125 + 6.0 + 0.393 + 6.0 + 0.125 = 12.643"
 *   - Height: 0.125 + 9.0 + 0.125 = 9.25"
 */

const ROOT = path.resolve('attached_assets/book_v2');
const COVER_IMG = path.join(ROOT, 'images', 'sasquatch-cover.png');
const OUT_COVER_PDF = path.join(ROOT, 'cover.pdf');

const PAGE_COUNT = 314;
const TRIM_W = 6.0;
const TRIM_H = 9.0;
const BLEED = 0.125;
const SHEET_THICKNESS = 0.0025;
const SPINE_IN = (PAGE_COUNT / 2) * SHEET_THICKNESS;
const SPINE_IN_ROUNDED = Math.round(SPINE_IN * 1000) / 1000;

const DPI = 300;

const COVER_W_IN = BLEED + TRIM_W + SPINE_IN_ROUNDED + TRIM_W + BLEED;
const COVER_H_IN = BLEED + TRIM_H + BLEED;

const COVER_W_PX = Math.round(COVER_W_IN * DPI);
const COVER_H_PX = Math.round(COVER_H_IN * DPI);

const bleedPx = Math.round(BLEED * DPI);
const spinePx = Math.round(SPINE_IN_ROUNDED * DPI);
const backCoverPx = Math.round(TRIM_W * DPI) + bleedPx;   // back cover + left bleed
const frontCoverPx = Math.round(TRIM_W * DPI) + bleedPx;  // front cover + right bleed

console.log('Cover dimensions:');
console.log(`  ${COVER_W_IN.toFixed(3)}" x ${COVER_H_IN.toFixed(3)}"`);
console.log(`  ${COVER_W_PX} x ${COVER_H_PX} pixels at ${DPI} DPI`);
console.log(`  Spine: ${SPINE_IN_ROUNDED}" (${spinePx}px)`);
console.log(`  Back cover: ${backCoverPx}px, Front cover: ${frontCoverPx}px`);

async function generateCover() {
  const coverImg = sharp(COVER_IMG);
  const meta = await coverImg.metadata();
  const { width: imgW, height: imgH } = meta;

  console.log(`Cover image: ${imgW}x${imgH} px`);

  // The front cover area: backCoverPx + spinePx to end of canvas
  const frontCoverX = backCoverPx + spinePx;
  // Ensure the image doesn't exceed the background width
  const frontCoverTargetW = Math.min(frontCoverPx, COVER_W_PX - frontCoverX);
  const frontCoverTargetH = Math.min(Math.round(TRIM_H * DPI) + bleedPx * 2, COVER_H_PX);
  const frontCoverEnd = frontCoverX + frontCoverTargetW;

  console.log(`Front cover image: ${frontCoverTargetW}x${frontCoverTargetH}px at x=${frontCoverX}`);
  console.log(`  Ends at ${frontCoverEnd}, background=${COVER_W_PX}`);

  // Resize the cover image to fit the front cover area
  const resizedFront = await coverImg
    .resize(frontCoverTargetW, frontCoverTargetH, { fit: 'cover', position: 'centre' })
    .toBuffer();

  // Create a dark background canvas
  const background = sharp({
    create: {
      width: COVER_W_PX,
      height: COVER_H_PX,
      channels: 4,
      background: { r: 0x18, g: 0x18, b: 0x18, alpha: 1 },
    }
  });

  // Composite the front cover onto the background
  const compositeBuffer = await background
    .composite([{ input: resizedFront, left: frontCoverX, top: 0 }])
    .png()
    .toBuffer();

  // Save debug PNG
  fs.writeFileSync(path.join(ROOT, '.cover-composite.png'), compositeBuffer);

  // Create PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([COVER_W_IN * 72, COVER_H_IN * 72]);

  const pngImage = await pdfDoc.embedPng(compositeBuffer);

  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: COVER_W_IN * 72,
    height: COVER_H_IN * 72,
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(OUT_COVER_PDF, pdfBytes);

  console.log(`\nCover PDF saved: ${OUT_COVER_PDF}`);
  console.log(`  Size: ${(fs.statSync(OUT_COVER_PDF).size / 1024).toFixed(1)} KB`);
}

generateCover().catch(e => {
  console.error('Cover generation failed:', e);
  process.exit(1);
});
