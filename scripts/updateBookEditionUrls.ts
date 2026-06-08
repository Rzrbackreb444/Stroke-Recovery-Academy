import { db } from "../server/db";
import { bookEditions } from "../shared/schema";
import { eq } from "drizzle-orm";

const INTERIOR_URL = "https://storage.googleapis.com/download/storage/v1/b/replit-objstore-6695a99c-acae-4297-ba17-54ca57afa29e/o/book%2Ffull.pdf?generation=1780924574487409&alt=media";
const COVER_URL = "https://storage.googleapis.com/download/storage/v1/b/replit-objstore-6695a99c-acae-4297-ba17-54ca57afa29e/o/book%2Fcover.pdf?generation=1780924574807285&alt=media";
const LULU_PKG = "0600X0900BW060UW444M";

async function main() {
  // Update digital edition — set interiorPdfUrl to public storage URL
  const [d] = await db.update(bookEditions)
    .set({ interiorPdfUrl: INTERIOR_URL })
    .where(eq(bookEditions.id, 1))
    .returning();
  console.log("Digital edition updated:", d.id, d.interiorPdfUrl?.slice(0, 60));

  // Update print edition — set both PDFs + luluPackageId
  const [p] = await db.update(bookEditions)
    .set({
      interiorPdfUrl: INTERIOR_URL,
      coverPdfUrl: COVER_URL,
      luluPackageId: LULU_PKG,
    })
    .where(eq(bookEditions.id, 2))
    .returning();
  console.log("Print edition updated:", p.id);
  console.log("  interiorPdfUrl:", p.interiorPdfUrl?.slice(0, 60));
  console.log("  coverPdfUrl:", p.coverPdfUrl?.slice(0, 60));
  console.log("  luluPackageId:", p.luluPackageId);
}
main().catch(console.error);
