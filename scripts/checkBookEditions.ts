import { db } from "../server/db";
import { bookEditions } from "../shared/schema";

async function main() {
  const editions = await db.select().from(bookEditions);
  console.log(JSON.stringify(editions, null, 2));
}
main().catch(console.error);
