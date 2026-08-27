/**
 * Regression contracts for the recovery write paths.
 *
 * These checks intentionally inspect the small set of persistence boundaries
 * that are easy to accidentally "simplify" back into best-effort writes.
 * Database-backed integration tests can run against a disposable database;
 * these fast checks still run in the normal no-database test command.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routes = await readFile(new URL("../server/routes.ts", import.meta.url), "utf8");
const storage = await readFile(new URL("../server/storage.ts", import.meta.url), "utf8");
const history = await readFile(new URL("../server/sasquatchHistoryService.ts", import.meta.url), "utf8");
const chatWidget = await readFile(
  new URL("../client/src/components/recovery/SasquatchChatWidget.tsx", import.meta.url),
  "utf8",
);

test("coach turns await durable history before returning success", () => {
  assert.match(routes, /const \{ persistChatTurn \} = await import\('\.\/sasquatchHistoryService'\);\s+await persistChatTurn\(persistUserId, message, finalResponse\)/);
  assert.match(history, /await db\.execute\(sql`[\s\S]*INSERT INTO sasquatch_chat_messages/);
  assert.doesNotMatch(history, /persistChatTurn[\s\S]{0,900}catch/);
});

test("daily check-in serializes duplicate clicks and commits reward data atomically", () => {
  assert.match(storage, /async createDailyCheckinWithRewards/);
  assert.match(storage, /db\.transaction\(async \(tx\) => \{[\s\S]*pg_advisory_xact_lock/);
  assert.match(storage, /INSERT INTO credit_ledger/);
  assert.match(routes, /createDailyCheckinWithRewards/);
  assert.match(routes, /DailyCheckinAlreadyExistsError/);
});

test("routine feedback and goal replacement cannot commit partial state", () => {
  assert.match(routes, /await db\.transaction\(async \(tx\) => \{[\s\S]*INSERT INTO routine_feedback[\s\S]*routine_completions/);
  assert.match(routes, /const inserted = await dbInst\.transaction\(async \(tx\) => \{[\s\S]*tx\.delete\(survivorGoals\)[\s\S]*tx\.insert\(survivorGoals\)/);
});

test("habit writes verify the signed-in owner before touching logs", () => {
  assert.match(storage, /eq\(userHabits\.id, userHabitId\), eq\(userHabits\.userId, userId\)/);
  assert.match(routes, /logHabitCompletion\(userHabitId, new Date\(\), notes, getUserId\(req\)!\)/);
});

test("coach UI keeps failed and in-flight turns visibly distinct", () => {
  assert.match(chatWidget, /status\?: "pending" \| "sent" \| "error"/);
  assert.match(chatWidget, /Saving…/);
  assert.match(chatWidget, /Not saved — try again/);
});