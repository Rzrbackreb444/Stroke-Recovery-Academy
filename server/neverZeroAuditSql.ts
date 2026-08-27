import { sql, type SQL } from "drizzle-orm";

/**
 * Build a PostgreSQL text-array expression from individually bound values.
 *
 * Drizzle treats a raw JavaScript array interpolation as one driver value.
 * PostgreSQL can then interpret it as a record instead of the text[] expected
 * by the audit columns, so each element must be bound inside an explicitly
 * typed ARRAY expression.
 */
export function textArraySql(values: readonly string[]): SQL {
  if (values.length === 0) {
    return sql`ARRAY[]::text[]`;
  }

  return sql`ARRAY[${sql.join(values.map((value) => sql`${value}`), sql`, `)}]::text[]`;
}