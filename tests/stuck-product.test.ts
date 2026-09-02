import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  STUCK_BUNDLE_PRICE_CENTS,
  STUCK_BUNDLE_DOWNLOAD_SENTINEL,
  STUCK_DOWNLOAD_SENTINEL,
  STUCK_PRODUCT_TITLE,
  STUCK_STANDALONE_PRICE_CENTS,
} from "../shared/stuckProduct";

const root = process.cwd();
const sourcePdf = path.join(
  root,
  "attached_assets",
  "STUCK_-_The_Sasquatch_Formula_for_Breaking_a_Recovery_Plateau__1788321677906.pdf",
);
const bundlePdf = path.join(root, "attached_assets", "stuck", "STUCK-66-Day-Rebuild-Bundle.pdf");

test("STUCK is configured as two real paid digital editions", () => {
  assert.equal(STUCK_PRODUCT_TITLE.startsWith("STUCK —"), true);
  assert.equal(STUCK_STANDALONE_PRICE_CENTS, 1499);
  assert.equal(STUCK_BUNDLE_PRICE_CENTS, 2999);
  assert.notEqual(STUCK_DOWNLOAD_SENTINEL, STUCK_BUNDLE_DOWNLOAD_SENTINEL);
});

test("STUCK source and companion bundle are actual PDFs", () => {
  const source = fs.readFileSync(sourcePdf);
  const bundle = fs.readFileSync(bundlePdf);
  assert.deepEqual(source.subarray(0, 5).toString("ascii"), "%PDF-");
  assert.deepEqual(bundle.subarray(0, 5).toString("ascii"), "%PDF-");
  assert.ok(bundle.length > source.length, "bundle should include the companion pages");
});