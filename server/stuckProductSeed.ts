import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import {
  bookEditions,
  marketplaceListings,
  publishingProjects,
  users,
} from "@shared/schema";
import {
  STUCK_BUNDLE_DOWNLOAD_SENTINEL,
  STUCK_BUNDLE_PRICE_CENTS,
  STUCK_COVER_IMAGE,
  STUCK_DOWNLOAD_SENTINEL,
  STUCK_PRODUCT_DESCRIPTION,
  STUCK_PRODUCT_SUBTITLE,
  STUCK_PRODUCT_TITLE,
  STUCK_STANDALONE_PRICE_CENTS,
} from "@shared/stuckProduct";

const STUCK_AUTHOR_EMAIL = "strokedoutsasquatch@gmail.com";
const STUCK_SEED_LOCK_NAME = "stroke-recovery-academy:stuck-product-seed";

async function findAuthorId(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  preferredAuthorId?: string,
): Promise<string | null> {
  const candidateIds = [
    preferredAuthorId,
    process.env.STUCK_PRODUCT_AUTHOR_ID,
  ].filter((id): id is string => Boolean(id));

  for (const candidateId of candidateIds) {
    const [candidate] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, candidateId))
      .limit(1);
    if (candidate) return candidate.id;
  }

  const [owner] = await tx
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${STUCK_AUTHOR_EMAIL}`)
    .limit(1);

  return owner?.id ?? null;
}

export async function ensureStuckProductSeeded(preferredAuthorId?: string) {
  return db.transaction(async (tx) => {
    // Autoscale can start more than one instance at once. Serialize this
    // narrowly-scoped seed so two instances cannot create duplicate listings.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${STUCK_SEED_LOCK_NAME}))`,
    );

    let [project] = await tx
      .select()
      .from(publishingProjects)
      .where(eq(publishingProjects.title, STUCK_PRODUCT_TITLE))
      .limit(1);

    if (!project) {
      const authorId = await findAuthorId(tx, preferredAuthorId);
      if (!authorId) {
        throw new Error(
          "Cannot seed STUCK: no Stroke Recovery Academy author account exists",
        );
      }

      [project] = await tx
        .insert(publishingProjects)
        .values({
          authorId,
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
        })
        .returning();
    }

    const listingValues = {
      title: STUCK_PRODUCT_TITLE,
      subtitle: STUCK_PRODUCT_SUBTITLE,
      description: STUCK_PRODUCT_DESCRIPTION,
      coverImageUrl: STUCK_COVER_IMAGE,
      genre: "Health & Recovery",
      tags: [
        "stroke recovery",
        "recovery plateau",
        "workbook",
        "neuroplasticity",
        "caregiver",
      ],
      status: "published",
      isFeatured: true,
      isDigitalOnly: true,
      pageCount: 29,
      wordCount: 5000,
      moderationStatus: "approved",
      publishedAt: new Date(),
      updatedAt: new Date(),
    };

    let [listing] = await tx
      .select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.projectId, project.id))
      .limit(1);

    if (!listing) {
      [listing] = await tx
        .insert(marketplaceListings)
        .values({
          projectId: project.id,
          authorId: project.authorId,
          ...listingValues,
        })
        .returning();
    } else {
      [listing] = await tx
        .update(marketplaceListings)
        .set(listingValues)
        .where(eq(marketplaceListings.id, listing.id))
        .returning();
    }

    const existingEditions = await tx
      .select()
      .from(bookEditions)
      .where(eq(bookEditions.listingId, listing.id));

    const editions = [
      {
        editionType: "digital_pdf",
        price: STUCK_STANDALONE_PRICE_CENTS,
        sentinel: STUCK_DOWNLOAD_SENTINEL,
      },
      {
        editionType: "digital_bundle",
        price: STUCK_BUNDLE_PRICE_CENTS,
        sentinel: STUCK_BUNDLE_DOWNLOAD_SENTINEL,
      },
    ];

    for (const edition of editions) {
      const values = {
        editionType: edition.editionType,
        isActive: true,
        price: edition.price,
        currency: "USD",
        authorRoyalty: Math.floor(edition.price * 0.85),
        interiorPdfUrl: edition.sentinel,
        updatedAt: new Date(),
      };
      const existing = existingEditions.find(
        (candidate) => candidate.editionType === edition.editionType,
      );

      if (existing) {
        await tx
          .update(bookEditions)
          .set(values)
          .where(eq(bookEditions.id, existing.id));
      } else {
        await tx.insert(bookEditions).values({
          listingId: listing.id,
          ...values,
        });
      }
    }

    return {
      projectId: project.id,
      listingId: listing.id,
      editionCount: editions.length,
    };
  });
}