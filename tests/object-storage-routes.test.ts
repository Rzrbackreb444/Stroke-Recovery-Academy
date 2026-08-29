import assert from "node:assert/strict";
import test from "node:test";
import { db } from "../server/db";
import { ObjectStorageService } from "../server/replit_integrations/object_storage/objectStorage";
import { registerObjectStorageRoutes } from "../server/replit_integrations/object_storage/routes";

type Handler = (req: any, res: any, next: () => void) => unknown;

const postHandlers: Handler[] = [];
const app = {
  post: (_path: string, ...handlers: Handler[]) => {
    postHandlers.push(...handlers);
  },
  get: () => undefined,
} as any;

process.env.PRIVATE_OBJECT_DIR = "/test-bucket";
registerObjectStorageRoutes(app);

const requestUrlHandlers = postHandlers.splice(0);
const originalGetUploadUrl = ObjectStorageService.prototype.getObjectEntityUploadURL;
const dbForTest = db as any;
const originalDbMethods = {
  execute: dbForTest.execute,
  select: dbForTest.select,
  delete: dbForTest.delete,
};
const originalDeleteObjectEntity = ObjectStorageService.prototype.deleteObjectEntity;
const objectStorageStatics = ObjectStorageService as any;
const originalIntentTableReady = objectStorageStatics.uploadIntentTableReady;
let lastUploadRequest: unknown;
ObjectStorageService.prototype.getObjectEntityUploadURL = async function (request) {
  lastUploadRequest = request;
  return "https://storage.googleapis.com/test-bucket/uploads/test-object";
};

function makeResponse(done: (response: any) => void) {
  const response: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      done(this);
      return this;
    },
  };
  return response;
}

async function runRequest(body: unknown, userId?: string, ip = "upload-test") {
  return new Promise<any>((resolve, reject) => {
    const req: any = {
      body,
      headers: { "x-forwarded-for": ip },
      socket: { remoteAddress: ip },
      session: userId ? { userId } : {},
      path: "/api/uploads/request-url",
    };
    const res = makeResponse(resolve);
    let index = 0;
    const next = () => {
      const handler = requestUrlHandlers[index++];
      if (!handler) return resolve(res);
      Promise.resolve(handler(req, res, next)).catch(reject);
    };
    next();
  });
}

test("anonymous callers cannot obtain an object upload URL", async () => {
  const response = await runRequest({
    name: "photo.png",
    size: 10,
    contentType: "image/png",
  });
  assert.equal(response.statusCode, 401);
});

test("upload metadata is rejected before signing", async () => {
  const response = await runRequest(
    { name: "photo.png", size: 26 * 1024 * 1024, contentType: "image/png" },
    "invalid-metadata-user",
    "invalid-metadata-ip",
  );
  assert.equal(response.statusCode, 413);
  assert.match(response.body.error, /too large/i);
});

test("unsupported content types are rejected before signing", async () => {
  const response = await runRequest(
    { name: "payload.exe", size: 10, contentType: "application/x-msdownload" },
    "unsupported-type-user",
    "unsupported-type-ip",
  );
  assert.equal(response.statusCode, 415);
  assert.match(response.body.error, /not supported/i);
});

test("an authenticated caller receives a normalized, owner-bound upload reference", async () => {
  const response = await runRequest(
    {
      name: "  folder\\Photo.PNG ",
      size: 1024,
      contentType: "IMAGE/PNG; charset=binary",
    },
    "valid-upload-user",
    "valid-upload-ip",
  );
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.objectPath, "/objects/uploads/test-object");
  assert.deepEqual(response.body.metadata, {
    name: "folder_Photo.PNG",
    size: 1024,
    contentType: "image/png",
  });
  assert.deepEqual(lastUploadRequest, {
    ownerId: "valid-upload-user",
    metadata: response.body.metadata,
  });
});

test("upload URL issuance is rate limited per authenticated caller", async () => {
  const userId = "rate-limited-upload-user";
  let response: any;
  for (let i = 0; i < 31; i += 1) {
    response = await runRequest(
      { name: `photo-${i}.png`, size: 10, contentType: "image/png" },
      userId,
      "rate-limit-ip",
    );
  }
  assert.equal(response.statusCode, 429);
  assert.ok(response.headers["Retry-After"]);
});

test("expired upload cleanup retries abandoned objects after a storage failure", async () => {
  const abandonedPath = "/objects/uploads/abandoned-upload";
  const consumedPath = "/objects/uploads/consumed-upload";
  const expiredAt = new Date(Date.now() - 60_000);
  const abandonedIntent = {
    objectPath: abandonedPath,
    expiresAt: expiredAt,
    consumedAt: null,
  };
  const consumedIntent = {
    objectPath: consumedPath,
    expiresAt: new Date(expiredAt.getTime() + 1),
    consumedAt: new Date(expiredAt.getTime() - 1),
  };
  let intentRows = [abandonedIntent, consumedIntent];
  let storageOutage = true;
  const deleteAttempts: string[] = [];
  const deletedObjects: string[] = [];

  dbForTest.execute = async () => undefined;
  dbForTest.select = () => ({
    from: () => ({
      where: () => ({
        orderBy: () => ({
          limit: async (limit: number) =>
            [...intentRows]
              .sort((left, right) => left.expiresAt.getTime() - right.expiresAt.getTime())
              .slice(0, limit),
        }),
      }),
    }),
  });
  dbForTest.delete = () => ({
    where: () => ({
      returning: async () => {
        const consumedIndex = intentRows.findIndex((intent) => intent.consumedAt !== null);
        const deleteIndex = consumedIndex >= 0 ? consumedIndex : 0;
        const [deletedIntent] = intentRows.splice(deleteIndex, 1);
        return deletedIntent ? [{ objectPath: deletedIntent.objectPath }] : [];
      },
    }),
  });
  ObjectStorageService.prototype.deleteObjectEntity = async function (objectPath) {
    deleteAttempts.push(objectPath);
    if (storageOutage) {
      throw new Error("temporary storage outage");
    }
    deletedObjects.push(objectPath);
  };
  objectStorageStatics.uploadIntentTableReady = null;

  try {
    const service = new ObjectStorageService();
    const firstPass = await service.cleanupExpiredUploadIntents();

    assert.deepEqual(firstPass, {
      scanned: 2,
      objectsDeleted: 0,
      intentsDeleted: 1,
      failures: 1,
    });
    assert.deepEqual(intentRows, [abandonedIntent]);
    assert.deepEqual(deleteAttempts, [abandonedPath]);
    assert.deepEqual(deletedObjects, []);

    storageOutage = false;
    const secondPass = await service.cleanupExpiredUploadIntents();

    assert.deepEqual(secondPass, {
      scanned: 1,
      objectsDeleted: 1,
      intentsDeleted: 1,
      failures: 0,
    });
    assert.deepEqual(intentRows, []);
    assert.deepEqual(deleteAttempts, [abandonedPath, abandonedPath]);
    assert.deepEqual(deletedObjects, [abandonedPath]);
    assert.equal(deleteAttempts.includes(consumedPath), false);
  } finally {
    dbForTest.execute = originalDbMethods.execute;
    dbForTest.select = originalDbMethods.select;
    dbForTest.delete = originalDbMethods.delete;
    ObjectStorageService.prototype.deleteObjectEntity = originalDeleteObjectEntity;
    objectStorageStatics.uploadIntentTableReady = originalIntentTableReady;
  }
});

test.after(() => {
  ObjectStorageService.prototype.getObjectEntityUploadURL = originalGetUploadUrl;
});