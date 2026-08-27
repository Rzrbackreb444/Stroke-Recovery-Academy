import assert from "node:assert/strict";
import test from "node:test";
import { matchesObjectContentType } from "../server/replit_integrations/object_storage/objectStorage";

function bytes(text: string): Buffer {
  return Buffer.from(text, "ascii");
}

test("accepts the supported image signatures", () => {
  assert.equal(
    matchesObjectContentType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg"),
    true,
  );
  assert.equal(
    matchesObjectContentType(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      "image/png",
    ),
    true,
  );
  assert.equal(matchesObjectContentType(bytes("GIF89a"), "image/gif"), true);
  assert.equal(
    matchesObjectContentType(bytes("RIFF1234WEBP"), "image/webp"),
    true,
  );
  assert.equal(
    matchesObjectContentType(bytes("....ftypheic........"), "image/heic"),
    true,
  );
});

test("accepts the supported audio, video, and PDF signatures", () => {
  assert.equal(
    matchesObjectContentType(bytes("\x1a\x45\xdf\xa3"), "audio/webm"),
    true,
  );
  assert.equal(matchesObjectContentType(bytes("ID3audio"), "audio/mpeg"), true);
  assert.equal(
    matchesObjectContentType(Buffer.from([0xff, 0xfb, 0x90, 0x64]), "audio/mp3"),
    true,
  );
  assert.equal(
    matchesObjectContentType(bytes("RIFF1234WAVE"), "audio/wav"),
    true,
  );
  assert.equal(matchesObjectContentType(bytes("OggS"), "audio/ogg"), true);
  assert.equal(
    matchesObjectContentType(bytes("....ftypisom........"), "video/mp4"),
    true,
  );
  assert.equal(
    matchesObjectContentType(Buffer.from([0xff, 0xf1, 0x50, 0x80]), "audio/aac"),
    true,
  );
  assert.equal(matchesObjectContentType(bytes("%PDF-1.7"), "application/pdf"), true);
});

test("rejects mismatched or truncated signatures", () => {
  assert.equal(matchesObjectContentType(bytes("not an image"), "image/png"), false);
  assert.equal(matchesObjectContentType(bytes("%PDF-1.7"), "image/jpeg"), false);
  assert.equal(matchesObjectContentType(bytes("RIFF1234WEBP"), "audio/wav"), false);
  assert.equal(matchesObjectContentType(bytes("....ftypisom........"), "image/heic"), false);
  assert.equal(matchesObjectContentType(Buffer.alloc(0), "application/pdf"), false);
});