import { db } from "../server/db";
import { publishingProjects, marketplaceListings, bookEditions } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import { REFLECTIONS_PRODUCT_TITLE } from "../server/reflectionsProduct";

const ADMIN_ID = "local:67befce8-491e-4432-a2ed-d202c524b1cf";
const TITLE = REFLECTIONS_PRODUCT_TITLE;

async function seed() {
  let [project] = await db.select().from(publishingProjects)
    .where(and(eq(publishingProjects.authorId, ADMIN_ID), eq(publishingProjects.title, TITLE)));

  if (!project) {
    [project] = await db.insert(publishingProjects).values({
      authorId: ADMIN_ID,
      title: TITLE,
      subtitle: "Your words, bound.",
      description: "A personalized keepsake compiled from a survivor's own recovery journal entries.",
      genre: "memoir",
      status: "published",
      isPublished: true,
      publishedAt: new Date(),
      wordCount: 0,
      chapterCount: 0,
      coverImageUrl: "/book/cover.jpg",
      price: 1900,
    }).returning();
    console.log("Created project", project.id);
  }

  let [listing] = await db.select().from(marketplaceListings)
    .where(eq(marketplaceListings.title, TITLE));

  if (!listing) {
    [listing] = await db.insert(marketplaceListings).values({
      projectId: project.id,
      authorId: ADMIN_ID,
      title: TITLE,
      subtitle: "Your words, bound.",
      description:
        "Your recovery journal — every entry, in your own words — compiled into a keepsake you can hold or download. Generated fresh from your reflections at checkout.",
      coverImageUrl: "/book/cover.jpg",
      genre: "Health & Recovery",
      tags: ["stroke", "recovery", "journal", "memoir", "keepsake"],
      status: "published",
      isFeatured: false,
      moderationStatus: "approved",
      publishedAt: new Date(),
    }).returning();
    console.log("Created listing", listing.id);
  }

  const editions = await db.select().from(bookEditions).where(eq(bookEditions.listingId, listing.id));

  if (!editions.find(e => e.editionType === "digital_pdf")) {
    // No static interior — the per-buyer PDF is generated at checkout and
    // stamped onto the order item's downloadUrl before the Stripe session.
    const [d] = await db.insert(bookEditions).values({
      listingId: listing.id,
      editionType: "digital_pdf",
      isActive: true,
      price: 1900,
      currency: "USD",
      authorRoyalty: 1615,
    }).returning();
    console.log("Created digital edition", d.id);
  }

  if (!editions.find(e => e.editionType === "print_paperback")) {
    // Personalized interior is stamped on the order item before checkout.
    const [p] = await db.insert(bookEditions).values({
      listingId: listing.id,
      editionType: "print_paperback",
      isActive: true,
      price: 2900,
      currency: "USD",
      printCost: 800,
      authorRoyalty: 1785,
      trimSize: "us_trade",
      paperType: "standard_white",
      bindingType: "perfect",
      colorInterior: false,
      luluPackageId: "0600X0900BW060UW444M",
    }).returning();
    console.log("Created print edition", p.id);
  }

  console.log("\n✓ Reflections storefront ready");
  console.log(`  title → ${TITLE}, listingId ${listing.id}`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
