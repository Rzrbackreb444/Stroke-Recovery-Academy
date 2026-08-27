import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { Writable } from "node:stream";
import { readFileSync } from "node:fs";
import test from "node:test";
import { db } from "../server/db";
import {
  ObjectStorageService,
  ObjectNotFoundError,
  ObjectUploadIntentError,
} from "../server/replit_integrations/object_storage/objectStorage";
import { registerObjectStorageRoutes } from "../server/replit_integrations/object_storage/routes";
import { registerJournalMediaRoutes } from "../server/journalMediaRoutes";
import { setObjectAclPolicy } from "../server/replit_integrations/object_storage/objectAcl";

const OWNER_ID = "survivor-a";
const OTHER_ID = "survivor-b";
const OBJECT_PATH = "/objects/uploads/journal-photo";

type Metadata = {
  size: number;
  contentType: string;
  metadata?: Record<string, string>;
};

/**
 * This is deliberately shaped like the small subset of a GCS File used by
 * the object-storage code. It keeps the test storage-backed without needing a
 * real bucket or a presigned URL service.
 */
class MemoryFile {
  public deleted = false;
  public metadata: Metadata;

  constructor(
    public readonly name: string,
    contentType = "image/png",
    size = 12,
  ) {
    this.metadata = { size, contentType };
  }

  async exists(): Promise<[boolean]> {
    return [!this.deleted];
  }

  async getMetadata(): Promise<[Metadata]> {
    return [this.metadata];
  }

  async setMetadata(input: { metadata?: Record<string, string> }): Promise<void> {
    this.metadata = {
      ...this.metadata,
      metadata: { ...this.metadata.metadata, ...input.metadata },
    };
  }

  async delete(): Promise<void> {
    this.deleted = true;
  }

  createReadStream(): Readable {
    return Readable.from(["test-object"]);
  }
}

type UploadIntent = {
  objectPath: string;
  ownerId: string;
  originalName: string;
  declaredSize: number;
  contentType: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
};

const objects = new Map<string, MemoryFile>();
let intentRows: UploadIntent[] = [];

/*
 * ObjectStorageService normally talks to both GCS and Drizzle. The test keeps
 * both boundaries in memory while running the production methods that enforce
 * ACL ownership, metadata matching, and intent expiry.
 */
const dbForTest = db as any;
const originalDbMethods = {
  execute: dbForTest.execute,
  select: dbForTest.select,
  update: dbForTest.update,
};
const originalGetObjectEntityFile = ObjectStorageService.prototype.getObjectEntityFile;
const originalDownloadObject = ObjectStorageService.prototype.downloadObject;
const objectStorageStatics = ObjectStorageService as any;
const originalIntentTableReady = objectStorageStatics.uploadIntentTableReady;

dbForTest.execute = async () => undefined;
dbForTest.select = () => ({
  from: () => ({
    where: () => ({
      limit: async () => intentRows,
    }),
  }),
});
dbForTest.update = () => ({
  set: (values: { consumedAt: Date }) => ({
    where: () => ({
      returning: async () => {
        const intent = intentRows.find((row) => !row.consumedAt);
        if (!intent) return [];
        intent.consumedAt = values.consumedAt;
        return [{ objectPath: intent.objectPath }];
      },
    }),
  }),
});

ObjectStorageService.prototype.getObjectEntityFile = async function (objectPath) {
  const file = objects.get(objectPath);
  if (!file || file.deleted) throw new ObjectNotFoundError();
  return file as any;
};

class TestResponse extends Writable {
  statusCode = 200;
  headers: Record<string, string | number> = {};
  served = false;
  bodyChunks: Buffer[] = [];
  body: unknown;

  _write(
    chunk: any,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    this.served = true;
    this.bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    callback();
  }

  setHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  set(values: Record<string, string | number>): void {
    Object.assign(this.headers, values);
  }

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  json(body: unknown): this {
    this.body = body;
    return this;
  }
}

function makeResponse(): TestResponse {
  return new TestResponse();
}

async function invoke(handler: any, request: any) {
  const response = makeResponse();
  await Promise.resolve(handler(request, response, () => undefined));
  if (
    response.statusCode === 200 &&
    response.headers["Content-Type"] &&
    !response.writableFinished
  ) {
    await new Promise<void>((resolve) => response.once("finish", resolve));
  }
  return response;
}

function intentFor(ownerId: string = OWNER_ID): UploadIntent {
  return {
    objectPath: OBJECT_PATH,
    ownerId,
    originalName: "journal.png",
    declaredSize: 12,
    contentType: "image/png",
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
    createdAt: new Date(),
  };
}

const objectGetRoutes: Record<string, any> = {};
const objectApp = {
  post: () => undefined,
  get: (path: string, handler: any) => {
    objectGetRoutes[path] = handler;
  },
};
registerObjectStorageRoutes(objectApp as any);

const journalPostRoutes: Record<string, any[]> = {};
const journalApp = {
  post: (path: string, ...handlers: any[]) => {
    journalPostRoutes[path] = handlers;
  },
};
registerJournalMediaRoutes(
  journalApp as any,
  (_req: any, _res: any, next: any) => next(),
  "/tmp",
);

const objectHandler = objectGetRoutes["/objects/:objectPath(*)"];
const photoFinalizeHandler =
  journalPostRoutes["/api/recovery/journal/photo/finalize"].at(-1);

test("an issued upload is readable only by its owner before ACL finalization", async () => {
  const file = new MemoryFile("uploads/journal-photo");
  objects.set(OBJECT_PATH, file);
  intentRows = [intentFor()];

  const ownerResponse = await invoke(objectHandler, {
    path: OBJECT_PATH,
    user: { id: OWNER_ID },
  });
  assert.equal(ownerResponse.statusCode, 200);
  assert.equal(ownerResponse.served, true);

  const otherResponse = await invoke(objectHandler, {
    path: OBJECT_PATH,
    user: { id: OTHER_ID },
  });
  assert.equal(otherResponse.statusCode, 404);
  assert.equal(otherResponse.served, false);
  assert.deepEqual(otherResponse.body, { error: "Object not found" });
});

test("legacy objects without an upload intent remain readable, but finalized objects do not", async () => {
  const legacyPath = "/objects/uploads/legacy";
  const legacyFile = new MemoryFile("uploads/legacy");
  objects.set(legacyPath, legacyFile);
  intentRows = [];

  const legacyResponse = await invoke(objectHandler, {
    path: legacyPath,
  });
  assert.equal(legacyResponse.statusCode, 200);
  assert.equal(legacyResponse.served, true);

  const privateFile = new MemoryFile("uploads/journal-photo");
  objects.set(OBJECT_PATH, privateFile);
  await setObjectAclPolicy(privateFile as any, {
    owner: OWNER_ID,
    visibility: "private",
  });

  const ownerResponse = await invoke(objectHandler, {
    path: OBJECT_PATH,
    user: { claims: { sub: OWNER_ID } },
  });
  assert.equal(ownerResponse.statusCode, 200);
  assert.equal(ownerResponse.served, true);

  const otherResponse = await invoke(objectHandler, {
    path: OBJECT_PATH,
    user: { claims: { sub: OTHER_ID } },
  });
  assert.equal(otherResponse.statusCode, 404);
  assert.equal(otherResponse.served, false);
});

test("revoking journal sharing restores owner-only access and private caching", async () => {
  const file = new MemoryFile("uploads/journal-photo");
  objects.set(OBJECT_PATH, file);
  const objectStorage = new ObjectStorageService();

  // Sharing makes the media readable to an anonymous community viewer.
  await objectStorage.trySetObjectEntityAclPolicy(
    OBJECT_PATH,
    { owner: OWNER_ID, visibility: "public" },
    { requireUploadIntent: false },
  );
  const sharedResponse = await invoke(objectHandler, {
    path: OBJECT_PATH,
  });
  assert.equal(sharedResponse.statusCode, 200);
  assert.equal(sharedResponse.served, true);
  assert.equal(sharedResponse.headers["Cache-Control"], "public, max-age=3600");

  // The same share lifecycle writes private metadata when sharing is revoked.
  await objectStorage.trySetObjectEntityAclPolicy(
    OBJECT_PATH,
    { owner: OWNER_ID, visibility: "private" },
    { requireUploadIntent: false },
  );
  const otherResponse = await invoke(objectHandler, {
    path: OBJECT_PATH,
    user: { id: OTHER_ID },
  });
  assert.equal(otherResponse.statusCode, 404);
  assert.equal(otherResponse.served, false);
  assert.deepEqual(otherResponse.body, { error: "Object not found" });

  const ownerResponse = await invoke(objectHandler, {
    path: OBJECT_PATH,
    user: { id: OWNER_ID },
  });
  assert.equal(ownerResponse.statusCode, 200);
  assert.equal(ownerResponse.served, true);
  assert.equal(ownerResponse.headers["Cache-Control"], "private, max-age=3600");
});

test("upload intent lookup distinguishes the owner, expiry, and unknown paths", async () => {
  const service = new ObjectStorageService();
  intentRows = [intentFor()];

  assert.equal(await service.canAccessIssuedUpload(OBJECT_PATH, OWNER_ID), true);
  assert.equal(await service.canAccessIssuedUpload(OBJECT_PATH, OTHER_ID), false);

  intentRows = [{ ...intentFor(), expiresAt: new Date(Date.now() - 1) }];
  assert.equal(await service.canAccessIssuedUpload(OBJECT_PATH, OWNER_ID), false);

  intentRows = [];
  assert.equal(await service.canAccessIssuedUpload(OBJECT_PATH, OWNER_ID), null);
});

test("ACL finalization cannot claim another survivor's upload intent", async () => {
  const service = new ObjectStorageService();
  const file = new MemoryFile("uploads/journal-photo");
  objects.set(OBJECT_PATH, file);

  intentRows = [];
  await assert.rejects(
    service.trySetObjectEntityAclPolicy(
      OBJECT_PATH,
      { owner: OTHER_ID, visibility: "private" },
      { requireUploadIntent: true },
    ),
    (error: unknown) =>
      error instanceof ObjectUploadIntentError &&
      error.message === "Upload reference is invalid or expired",
  );
  assert.equal(file.metadata.metadata, undefined);

  intentRows = [intentFor()];
  const finalizedPath = await service.trySetObjectEntityAclPolicy(
    OBJECT_PATH,
    { owner: OWNER_ID, visibility: "private" },
    { requireUploadIntent: true },
  );
  assert.equal(finalizedPath, OBJECT_PATH);
  assert.deepEqual(JSON.parse(file.metadata.metadata!["custom:aclPolicy"]), {
    owner: OWNER_ID,
    visibility: "private",
  });
  assert.ok(intentRows[0].consumedAt instanceof Date);
});

test("journal photo finalization rejects a path issued to another survivor", async () => {
  const file = new MemoryFile("uploads/journal-photo");
  objects.set(OBJECT_PATH, file);
  // The real query applies the caller's owner predicate. Return no matching
  // row for the wrong caller, then restore the issued row for the owner.
  intentRows = [];

  const otherResponse = await invoke(photoFinalizeHandler, {
    body: { objectPath: OBJECT_PATH },
    user: { id: OTHER_ID },
  });
  assert.equal(otherResponse.statusCode, 400);
  assert.match(otherResponse.body.message, /invalid or expired/i);
  assert.equal(file.metadata.metadata, undefined);

  intentRows = [intentFor(OWNER_ID)];
  const ownerResponse = await invoke(photoFinalizeHandler, {
    body: { objectPath: OBJECT_PATH },
    user: { id: OWNER_ID },
  });
  assert.equal(ownerResponse.statusCode, 200);
  assert.equal(ownerResponse.body.photoUrl, OBJECT_PATH);
  assert.deepEqual(
    JSON.parse(file.metadata.metadata!["custom:aclPolicy"]),
    { owner: OWNER_ID, visibility: "private" },
  );
});

test("protected journal routes claim new media before persisting it and secure PDF output", () => {
  const routesSource = readFileSync(
    "server/routes.ts",
    "utf8",
  );
  const secureMediaStart = routesSource.indexOf("const secureNewJournalMedia");
  const journalCreateStart = routesSource.indexOf(
    "app.post('/api/recovery/journal'",
    secureMediaStart,
  );
  const secureMediaBlock = routesSource.slice(secureMediaStart, journalCreateStart);
  const claimPosition = secureMediaBlock.indexOf(
    "await secureNewJournalMedia(validated.data, userId)",
  );
  const persistPosition = routesSource.indexOf(
    "const entry = await storage.createJournalEntry(userId, validated.data)",
  );
  const claimSourcePosition = routesSource.indexOf(
    "await secureNewJournalMedia(validated.data, userId)",
    journalCreateStart,
  );

  assert.ok(secureMediaStart >= 0);
  assert.match(secureMediaBlock, /requireUploadIntent:\s*true/);
  assert.ok(
    claimPosition < 0 &&
      claimSourcePosition >= journalCreateStart &&
      claimSourcePosition < persistPosition,
  );

  const checkoutStart = routesSource.indexOf(
    "app.post('/api/recovery/journal/checkout'",
  );
  const pdfMarker = routesSource.indexOf('name: "reflections.pdf"');
  assert.ok(checkoutStart >= 0 && pdfMarker > checkoutStart);
  assert.match(
    routesSource.slice(pdfMarker - 500, pdfMarker + 1800),
    /ownerId:\s*userId[\s\S]*?requireUploadIntent:\s*true/,
  );

  const journalMediaSource = readFileSync(
    "server/journalMediaRoutes.ts",
    "utf8",
  );
  assert.match(
    journalMediaSource,
    /getObjectEntityUploadURL\(\{\s*ownerId:\s*userId/s,
  );
  assert.match(
    journalMediaSource,
    /owner:\s*userId,\s*visibility:\s*"private"[\s\S]*?requireUploadIntent:\s*true/,
  );
});

test.after(() => {
  dbForTest.execute = originalDbMethods.execute;
  dbForTest.select = originalDbMethods.select;
  dbForTest.update = originalDbMethods.update;
  ObjectStorageService.prototype.getObjectEntityFile = originalGetObjectEntityFile;
  ObjectStorageService.prototype.downloadObject = originalDownloadObject;
  objectStorageStatics.uploadIntentTableReady = originalIntentTableReady;
});