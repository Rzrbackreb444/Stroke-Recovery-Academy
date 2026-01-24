import { db } from "./db";
import { 
  marketplaceListings, 
  bookEditions, 
  bookOrders,
  users,
  creatorStorefronts,
  creatorAnalytics,
  revenueEvents,
  publishingProjects
} from "@shared/schema";
import { eq, and, desc, sql, gte, lte, ilike, or } from "drizzle-orm";
import Stripe from "stripe";

const PLATFORM_FEE_PERCENT = 15;
const CREATOR_SHARE_PERCENT = 85;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-08-27.basil",
});

export interface ListingFilters {
  genre?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: "newest" | "popular" | "price_low" | "price_high" | "rating";
  status?: string;
  authorId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateListingData {
  projectId: number;
  authorId: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImageUrl?: string;
  previewUrl?: string;
  genre: string;
  tags?: string[];
  isDigitalOnly?: boolean;
  pageCount?: number;
  wordCount?: number;
}

export interface CreateEditionData {
  listingId: number;
  editionType: "digital_ebook" | "digital_pdf" | "print_paperback" | "print_hardcover";
  price: number;
  currency?: string;
  printCost?: number;
  trimSize?: string;
  paperType?: string;
  bindingType?: string;
  colorInterior?: boolean;
  luluPackageId?: string;
  interiorPdfUrl?: string;
  coverPdfUrl?: string;
  epubUrl?: string;
  isbn?: string;
  isbn13?: string;
}

export async function getMarketplaceListings(filters: ListingFilters = {}) {
  const {
    genre,
    priceMin,
    priceMax,
    sortBy = "newest",
    status = "published",
    authorId,
    search,
    page = 1,
    limit = 20,
  } = filters;

  const offset = (page - 1) * limit;

  let query = db
    .select({
      listing: marketplaceListings,
      author: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      },
    })
    .from(marketplaceListings)
    .leftJoin(users, eq(marketplaceListings.authorId, users.id))
    .where(
      and(
        status ? eq(marketplaceListings.status, status) : undefined,
        genre ? eq(marketplaceListings.genre, genre) : undefined,
        authorId ? eq(marketplaceListings.authorId, authorId) : undefined,
        search
          ? or(
              ilike(marketplaceListings.title, `%${search}%`),
              ilike(marketplaceListings.description, `%${search}%`)
            )
          : undefined
      )
    )
    .limit(limit)
    .offset(offset);

  const orderByMap = {
    newest: desc(marketplaceListings.createdAt),
    popular: desc(marketplaceListings.totalSales),
    rating: desc(marketplaceListings.averageRating),
    price_low: sql`1`, // Will be handled with editions
    price_high: sql`1`,
  };

  const listings = await query.orderBy(orderByMap[sortBy] || desc(marketplaceListings.createdAt));

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(marketplaceListings)
    .where(
      and(
        status ? eq(marketplaceListings.status, status) : undefined,
        genre ? eq(marketplaceListings.genre, genre) : undefined,
        authorId ? eq(marketplaceListings.authorId, authorId) : undefined
      )
    );

  return {
    listings,
    pagination: {
      page,
      limit,
      total: countResult?.count || 0,
      totalPages: Math.ceil((countResult?.count || 0) / limit),
    },
  };
}

export async function getListingById(listingId: number) {
  const [listing] = await db
    .select({
      listing: marketplaceListings,
      author: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      },
    })
    .from(marketplaceListings)
    .leftJoin(users, eq(marketplaceListings.authorId, users.id))
    .where(eq(marketplaceListings.id, listingId));

  if (!listing) return null;

  const editions = await db
    .select()
    .from(bookEditions)
    .where(and(eq(bookEditions.listingId, listingId), eq(bookEditions.isActive, true)));

  return { ...listing, editions };
}

export async function createListing(data: CreateListingData) {
  const royaltyDefault = CREATOR_SHARE_PERCENT;

  const [listing] = await db
    .insert(marketplaceListings)
    .values({
      ...data,
      status: "draft",
      moderationStatus: "pending",
    })
    .returning();

  return listing;
}

export async function updateListing(listingId: number, authorId: string, data: Partial<CreateListingData>) {
  const [existing] = await db
    .select()
    .from(marketplaceListings)
    .where(and(eq(marketplaceListings.id, listingId), eq(marketplaceListings.authorId, authorId)));

  if (!existing) {
    throw new Error("Listing not found or you don't have permission to edit it");
  }

  const [updated] = await db
    .update(marketplaceListings)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(marketplaceListings.id, listingId))
    .returning();

  return updated;
}

export async function publishListing(listingId: number, authorId: string) {
  const [existing] = await db
    .select()
    .from(marketplaceListings)
    .where(and(eq(marketplaceListings.id, listingId), eq(marketplaceListings.authorId, authorId)));

  if (!existing) {
    throw new Error("Listing not found");
  }

  const editions = await db.select().from(bookEditions).where(eq(bookEditions.listingId, listingId));
  if (editions.length === 0) {
    throw new Error("Cannot publish listing without at least one edition/price");
  }

  const [updated] = await db
    .update(marketplaceListings)
    .set({
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(marketplaceListings.id, listingId))
    .returning();

  return updated;
}

export async function createEdition(data: CreateEditionData) {
  const authorRoyalty = Math.floor(data.price * (CREATOR_SHARE_PERCENT / 100));

  const [edition] = await db
    .insert(bookEditions)
    .values({
      ...data,
      authorRoyalty,
    })
    .returning();

  return edition;
}

export async function updateEdition(editionId: number, listingId: number, data: Partial<CreateEditionData>) {
  const authorRoyalty = data.price ? Math.floor(data.price * (CREATOR_SHARE_PERCENT / 100)) : undefined;

  const [updated] = await db
    .update(bookEditions)
    .set({
      ...data,
      authorRoyalty: authorRoyalty ?? undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(bookEditions.id, editionId), eq(bookEditions.listingId, listingId)))
    .returning();

  return updated;
}

export async function getEditionsByListing(listingId: number) {
  return db.select().from(bookEditions).where(eq(bookEditions.listingId, listingId));
}

export async function createCheckoutSession(
  editionId: number,
  customerId: string | null,
  customerEmail: string,
  successUrl: string,
  cancelUrl: string
) {
  const [edition] = await db.select().from(bookEditions).where(eq(bookEditions.id, editionId));

  if (!edition) {
    throw new Error("Edition not found");
  }

  const [listing] = await db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.id, edition.listingId));

  if (!listing) {
    throw new Error("Listing not found");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: edition.currency.toLowerCase(),
          product_data: {
            name: listing.title,
            description: `${edition.editionType.replace("_", " ").toUpperCase()}`,
            images: listing.coverImageUrl ? [listing.coverImageUrl] : [],
          },
          unit_amount: edition.price,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata: {
      editionId: edition.id.toString(),
      listingId: listing.id.toString(),
      authorId: listing.authorId,
      platformFee: Math.floor(edition.price * (PLATFORM_FEE_PERCENT / 100)).toString(),
      authorRoyalty: edition.authorRoyalty.toString(),
    },
  });

  return session;
}

export async function processSuccessfulPurchase(
  stripeSessionId: string,
  editionId: number,
  customerId: string | null,
  customerEmail: string
) {
  const [edition] = await db.select().from(bookEditions).where(eq(bookEditions.id, editionId));
  if (!edition) throw new Error("Edition not found");

  const [listing] = await db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.id, edition.listingId));
  if (!listing) throw new Error("Listing not found");

  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const [order] = await db
    .insert(bookOrders)
    .values({
      orderNumber,
      customerId,
      customerEmail,
      customerName: customerEmail.split("@")[0],
      status: "paid",
      stripeCheckoutSessionId: stripeSessionId,
      subtotal: edition.price,
      total: edition.price,
      currency: edition.currency,
    })
    .returning();

  await db
    .update(marketplaceListings)
    .set({
      totalSales: sql`${marketplaceListings.totalSales} + 1`,
      totalRevenue: sql`${marketplaceListings.totalRevenue} + ${edition.price}`,
    })
    .where(eq(marketplaceListings.id, listing.id));

  const platformFee = Math.floor(edition.price * (PLATFORM_FEE_PERCENT / 100));
  const creatorPayout = edition.authorRoyalty;

  await db.insert(revenueEvents).values({
    userId: listing.authorId,
    eventType: "marketplace_sale",
    amountCents: edition.price,
    currency: edition.currency,
    platformFeeCents: platformFee,
    creatorPayoutCents: creatorPayout,
    creatorId: listing.authorId,
    metadata: {
      orderId: order.id,
      orderNumber,
      listingId: listing.id,
      editionId: edition.id,
      editionType: edition.editionType,
    },
  });

  return order;
}

export async function getCreatorEarnings(creatorId: string) {
  const [totalEarnings] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${revenueEvents.creatorPayoutCents}), 0)`,
      salesCount: sql<number>`COUNT(*)`,
    })
    .from(revenueEvents)
    .where(
      and(
        eq(revenueEvents.creatorId, creatorId),
        eq(revenueEvents.eventType, "marketplace_sale")
      )
    );

  const [pendingEarnings] = await db
    .select({
      pending: sql<number>`COALESCE(SUM(${revenueEvents.creatorPayoutCents}), 0)`,
    })
    .from(revenueEvents)
    .where(
      and(
        eq(revenueEvents.creatorId, creatorId),
        eq(revenueEvents.eventType, "marketplace_sale")
      )
    );

  const recentSales = await db
    .select()
    .from(revenueEvents)
    .where(
      and(
        eq(revenueEvents.creatorId, creatorId),
        eq(revenueEvents.eventType, "marketplace_sale")
      )
    )
    .orderBy(desc(revenueEvents.createdAt))
    .limit(10);

  return {
    totalEarnings: totalEarnings?.total || 0,
    salesCount: totalEarnings?.salesCount || 0,
    pendingEarnings: pendingEarnings?.pending || 0,
    recentSales,
    revenueSplit: {
      creatorPercent: CREATOR_SHARE_PERCENT,
      platformPercent: PLATFORM_FEE_PERCENT,
    },
  };
}

export async function getMyListings(authorId: string) {
  const listings = await db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.authorId, authorId))
    .orderBy(desc(marketplaceListings.createdAt));

  const listingsWithEditions = await Promise.all(
    listings.map(async (listing) => {
      const editions = await db
        .select()
        .from(bookEditions)
        .where(eq(bookEditions.listingId, listing.id));
      return { ...listing, editions };
    })
  );

  return listingsWithEditions;
}

export async function getFeaturedListings(limit = 8) {
  return db
    .select({
      listing: marketplaceListings,
      author: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      },
    })
    .from(marketplaceListings)
    .leftJoin(users, eq(marketplaceListings.authorId, users.id))
    .where(
      and(
        eq(marketplaceListings.status, "published"),
        eq(marketplaceListings.isFeatured, true)
      )
    )
    .orderBy(desc(marketplaceListings.totalSales))
    .limit(limit);
}

export async function getGenres() {
  const genres = await db
    .selectDistinct({ genre: marketplaceListings.genre })
    .from(marketplaceListings)
    .where(eq(marketplaceListings.status, "published"));

  return genres.map((g) => g.genre);
}
