import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import express from "express";
import test from "node:test";
import { eq } from "drizzle-orm";
import { users } from "../shared/schema";

const canRun = Boolean(process.env.DATABASE_URL);

type FailureMode = "logout" | "session";

async function listen(app: express.Express): Promise<{ server: Server; baseUrl: string }> {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

test(
  "account deletion reports cleanup failures without leaking credentials and leaves the tombstone removable",
  { skip: !canRun },
  async () => {
    const [{ db }, { default: accountRoutes }] = await Promise.all([
      import("../server/db"),
      import("../server/routes/accountRoutes"),
    ]);

    for (const failureMode of ["logout", "session"] as const) {
      const suffix = randomUUID();
      const userId = `account-delete-failure-${failureMode}-${suffix}`;
      const email = `${userId}@example.test`;
      const sessionCookie = "connect.sid=sensitive-session-cookie";
      let inserted = false;
      let server: Server | undefined;

      try {
        await db.insert(users).values({
          id: userId,
          email,
          passwordHash: "sensitive-password-hash",
          authProvider: "local",
          role: "member",
        });
        inserted = true;

        const app = express();
        app.use(express.json());
        app.use((req: any, _res, next) => {
          req.session = {
            userId,
            destroy(callback: (error?: Error) => void) {
              callback(
                failureMode === "session"
                  ? new Error("injected session-store failure")
                  : undefined,
              );
            },
          };
          req.logout = (callback: (error?: Error) => void) => {
            callback(
              failureMode === "logout"
                ? new Error("injected logout failure")
                : undefined,
            );
          };
          next();
        });
        app.use("/api/account", accountRoutes);

        const listening = await listen(app);
        server = listening.server;
        const response = await fetch(`${listening.baseUrl}/api/account/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie,
          },
          body: JSON.stringify({ confirmEmail: email }),
        });
        const responseText = await response.text();
        const body = JSON.parse(responseText) as { error?: string };
        const setCookie = response.headers.get("set-cookie") || "";

        assert.equal(response.status, 500, `${failureMode} failure should not report success`);
        assert.deepEqual(body, {
          error: "Account data was scrubbed but session cleanup failed. Please contact support.",
        });
        assert.doesNotMatch(responseText, new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        assert.doesNotMatch(responseText, /sensitive-password-hash|sensitive-session-cookie/);
        assert.match(setCookie, /^connect\.sid=/);
        assert.doesNotMatch(setCookie, /sensitive-session-cookie/);

        const scrubbed = await db
          .select({ email: users.email, firstName: users.firstName, passwordHash: users.passwordHash })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        assert.equal(scrubbed.length, 1);
        assert.match(scrubbed[0].email || "", /^deleted-/);
        assert.equal(scrubbed[0].firstName, "[deleted]");
        assert.equal(scrubbed[0].passwordHash, null);
      } finally {
        if (server) {
          await new Promise<void>((resolve) => server.close(() => resolve()));
        }
        if (inserted) {
          await db.delete(users).where(eq(users.id, userId));
          const remaining = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
          assert.equal(remaining.length, 0, `${failureMode} fixture teardown left a user row behind`);
        }
      }
    }
  },
);