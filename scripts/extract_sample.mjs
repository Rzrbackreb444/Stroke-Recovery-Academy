import fs from "fs";
import { PDFDocument } from "pdf-lib";

const SRC = "attached_assets/book_v2/THE-ULTIMATE-STROKE-RECOVERY-REVOLUTION.pdf";
const OUT = "client/public/book/sample.pdf";
const SAMPLE_PAGES = 36;

const srcBytes = fs.readFileSync(SRC);
const srcDoc = await PDFDocument.load(srcBytes);
const total = srcDoc.getPageCount();
const take = Math.min(SAMPLE_PAGES, total);

const sampleDoc = await PDFDocument.create();
const indices = Array.from({ length: take }, (_, i) => i);
const copied = await sampleDoc.copyPages(srcDoc, indices);
copied.forEach((p) => sampleDoc.addPage(p));

const bytes = await sampleDoc.save();
fs.writeFileSync(OUT, bytes);
console.log(`Sample written: ${OUT} (${take} pages, ${(bytes.length / 1024).toFixed(0)} KB)`);
