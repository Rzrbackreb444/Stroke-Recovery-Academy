import { db } from "../server/db";
import { publishingProjects, marketplaceListings, bookEditions } from "../shared/schema";
import { eq, and } from "drizzle-orm";

const ADMIN_ID = "local:67befce8-491e-4432-a2ed-d202c524b1cf";
const TITLE = "The Ultimate Stroke Recovery Revolution";

async function seed() {
  let [project] = await db.select().from(publishingProjects)
    .where(and(eq(publishingProjects.authorId, ADMIN_ID), eq(publishingProjects.title, TITLE)));

  if (!project) {
    [project] = await db.insert(publishingProjects).values({
      authorId: ADMIN_ID,
      title: TITLE,
      subtitle: "From 0% to 90%+ and Still Rising",
      description: "The battle-tested blueprint defying every \"never.\"",
      genre: "memoir-manual",
      status: "published",
      isPublished: true,
      publishedAt: new Date(),
      wordCount: 78750,
      chapterCount: 30,
      coverImageUrl: "/book/cover.jpg",
      price: 1900,
    }).returning();
    console.log("Created project", project.id);
  }

  let [listing] = await db.select().from(marketplaceListings)
    .where(eq(marketplaceListings.projectId, project.id));

  if (!listing) {
    [listing] = await db.insert(marketplaceListings).values({
      projectId: project.id,
      authorId: ADMIN_ID,
      title: TITLE,
      subtitle: "From 0% to 90%+ and Still Rising",
      description:
        "Nick Kremers' battle-tested stroke recovery manual. 314 pages, 30 chapters, 17 appendices, 9 case studies, full 90-day program. The blueprint defying every \"never.\"",
      coverImageUrl: "/book/cover.jpg",
      previewUrl: "/book/sample.pdf",
      genre: "Health & Recovery",
      tags: ["stroke", "recovery", "neuroplasticity", "memoir", "rehab"],
      status: "published",
      isFeatured: true,
      pageCount: 314,
      wordCount: 78750,
      moderationStatus: "approved",
      publishedAt: new Date(),
    }).returning();
    console.log("Created listing", listing.id);
  } else {
    await db.update(marketplaceListings)
      .set({
        pageCount: 314,
        wordCount: 78750,
        previewUrl: "/book/sample.pdf",
        description: "Nick Kremers' battle-tested stroke recovery manual. 314 pages, 30 chapters, 17 appendices, 9 case studies, full 90-day program. The blueprint defying every \"never.\"",
      })
      .where(eq(marketplaceListings.id, listing.id));
    console.log("Updated listing", listing.id);
  }

  const editions = await db.select().from(bookEditions).where(eq(bookEditions.listingId, listing.id));

  if (!editions.find(e => e.editionType === "digital_pdf")) {
    const [d] = await db.insert(bookEditions).values({
      listingId: listing.id,
      editionType: "digital_pdf",
      isActive: true,
      price: 1900,
      currency: "USD",
      authorRoyalty: 1615,
      interiorPdfUrl: "https://storage.googleapis.com/download/storage/v1/b/replit-objstore-6695a99c-acae-4297-ba17-54ca57afa29e/o/book%2Ffull.pdf?generation=1780924574487409&alt=media",
    }).returning();
    console.log("Created digital edition", d.id);
  }

  if (!editions.find(e => e.editionType === "print_paperback")) {
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
      interiorPdfUrl: "https://storage.googleapis.com/download/storage/v1/b/replit-objstore-6695a99c-acae-4297-ba17-54ca57afa29e/o/book%2Ffull.pdf?generation=1780924574487409&alt=media",
      coverPdfUrl: "https://storage.googleapis.com/download/storage/v1/b/replit-objstore-6695a99c-acae-4297-ba17-54ca57afa29e/o/book%2Fcover.pdf?generation=1780924574807285&alt=media",
    }).returning();
    console.log("Created print edition", p.id);
  }

  console.log("\n✓ Storefront ready");
  console.log(`  /book/buy → listingId ${listing.id}`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
