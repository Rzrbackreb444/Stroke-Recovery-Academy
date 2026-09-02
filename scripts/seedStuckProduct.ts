import { db } from "../server/db";
import { publishingProjects, marketplaceListings, bookEditions } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import {
  STUCK_BUNDLE_DOWNLOAD_SENTINEL,
  STUCK_BUNDLE_PRICE_CENTS,
  STUCK_COVER_IMAGE,
  STUCK_DOWNLOAD_SENTINEL,
  STUCK_PRODUCT_DESCRIPTION,
  STUCK_PRODUCT_SUBTITLE,
  STUCK_PRODUCT_TITLE,
  STUCK_STANDALONE_PRICE_CENTS,
} from "../shared/stuckProduct";

const ADMIN_ID = "local:67befce8-491e-4432-a2ed-d202c524b1cf";

async function seed() {
  let [project] = await db.select().from(publishingProjects).where(
    and(eq(publishingProjects.authorId, ADMIN_ID), eq(publishingProjects.title, STUCK_PRODUCT_TITLE)),
  );

  if (!project) {
    [project] = await db.insert(publishingProjects).values({
      authorId: ADMIN_ID,
      title: STUCK_PRODUCT_TITLE,
      subtitle: STUCK_PRODUCT_SUBTITLE,
      description: STUCK_PRODUCT_DESCRIPTION,
      genre: "Health & Recovery",
      status: "published",
      isPublished: true,
      publishedAt: new Date(),
      wordCount: 5000,
      chapterCount: 8,
      coverImageUrl: STUCK_COVER_IMAGE,
      price: STUCK_STANDALONE_PRICE_CENTS,
    }).returning();
  }

  let [listing] = await db.select().from(marketplaceListings).where(
    eq(marketplaceListings.projectId, project.id),
  );

  const listingValues = {
    title: STUCK_PRODUCT_TITLE,
    subtitle: STUCK_PRODUCT_SUBTITLE,
    description: STUCK_PRODUCT_DESCRIPTION,
    coverImageUrl: STUCK_COVER_IMAGE,
    genre: "Health & Recovery",
    tags: ["stroke recovery", "recovery plateau", "workbook", "neuroplasticity", "caregiver"],
    status: "published",
    isFeatured: true,
    isDigitalOnly: true,
    pageCount: 29,
    wordCount: 5000,
    moderationStatus: "approved",
    publishedAt: new Date(),
  } as const;

  if (!listing) {
    [listing] = await db.insert(marketplaceListings).values({
      projectId: project.id,
      authorId: ADMIN_ID,
      ...listingValues,
    }).returning();
  } else {
    [listing] = await db.update(marketplaceListings).set({
      ...listingValues,
      updatedAt: new Date(),
    }).where(eq(marketplaceListings.id, listing.id)).returning();
  }

  const editions = await db.select().from(bookEditions).where(eq(bookEditions.listingId, listing.id));
  const upsertEdition = async (editionType: string, price: number, sentinel: string) => {
    const existing = editions.find((edition) => edition.editionType === editionType);
    const values = {
      editionType,
      isActive: true,
      price,
      currency: "USD",
      authorRoyalty: Math.floor(price * 0.85),
      interiorPdfUrl: sentinel,
    };
    if (existing) {
      await db.update(bookEditions).set({ ...values, updatedAt: new Date() }).where(eq(bookEditions.id, existing.id));
    } else {
      await db.insert(bookEditions).values({ listingId: listing.id, ...values });
    }
  };

  await upsertEdition("digital_pdf", STUCK_STANDALONE_PRICE_CENTS, STUCK_DOWNLOAD_SENTINEL);
  await upsertEdition("digital_bundle", STUCK_BUNDLE_PRICE_CENTS, STUCK_BUNDLE_DOWNLOAD_SENTINEL);

  console.log(`STUCK storefront ready at /stuck (listing ${listing.id})`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("STUCK seed failed:", error);
  process.exit(1);
});