import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';

const SRC = 'attached_assets/book_v2/images';
const OUT = 'attached_assets/book_v2/images-web';
await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter(f => /\.png$/i.test(f));
let totalIn = 0, totalOut = 0;
for (const f of files) {
  const inPath = join(SRC, f);
  const outPath = join(OUT, basename(f, extname(f)) + '.jpg');
  const inSize = (await stat(inPath)).size;
  await sharp(inPath)
    .resize({ width: 1400, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outPath);
  const outSize = (await stat(outPath)).size;
  totalIn += inSize; totalOut += outSize;
  console.log(`${f}: ${(inSize/1024).toFixed(0)}KB -> ${(outSize/1024).toFixed(0)}KB`);
}
console.log(`\nTotal: ${(totalIn/1024/1024).toFixed(1)}MB -> ${(totalOut/1024/1024).toFixed(1)}MB`);
