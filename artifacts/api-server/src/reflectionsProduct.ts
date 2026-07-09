import { db } from "./db";
import { marketplaceListings, bookEditions, type MarketplaceListing, type BookEdition } from "@workspace/db";
import { eq } from "drizzle-orm";

// Canonical title for the personalized Reflections product. Shared by the seed
// script and the checkout route so the lookup never drifts.
export const REFLECTIONS_PRODUCT_TITLE = "My Reflections — Personalized Recovery Journal";

export async function getReflectionsListingWithEditions(): Promise<
  { listing: MarketplaceListing; editions: BookEdition[] } | null
> {
  const [listing] = await db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.title, REFLECTIONS_PRODUCT_TITLE));
  if (!listing) return null;
  const editions = await db
    .select()
    .from(bookEditions)
    .where(eq(bookEditions.listingId, listing.id));
  return { listing, editions };
}
