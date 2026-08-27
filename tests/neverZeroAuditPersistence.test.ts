import assert from "node:assert/strict";
import test from "node:test";
import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { textArraySql } from "../server/neverZeroAuditSql";

const dialect = new PgDialect();

test("Never Zero audit categories use typed text-array SQL with bound elements", () => {
  const query = dialect.sqlToQuery(sql`
    INSERT INTO never_zero_audits (categories_covered, categories_missed)
    VALUES (${textArraySql(["movement", "mindset"])}, ${textArraySql(["therapy"])})
  `);

  assert.equal(
    query.sql.replace(/\s+/g, " ").trim(),
    "INSERT INTO never_zero_audits (categories_covered, categories_missed) VALUES (ARRAY[$1, $2]::text[], ARRAY[$3]::text[])",
  );
  assert.deepEqual(query.params, ["movement", "mindset", "therapy"]);
});

test("Never Zero audit empty category lists remain typed text arrays", () => {
  const query = dialect.sqlToQuery(sql`${textArraySql([])}`);

  assert.equal(query.sql, "ARRAY[]::text[]");
  assert.deepEqual(query.params, []);
});