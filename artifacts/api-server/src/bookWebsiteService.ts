import { db } from "./db";
import { 
  bookWebsites, 
  bookWebsitePages, 
  bookWebsiteLeads,
  marketplaceListings,
  users
} from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { generateCoachResponse } from "./geminiService";

const BASE_DOMAIN = process.env.REPLIT_DEV_DOMAIN || "kreaitr.xyz";

export interface CreateBookWebsiteData {
  listingId?: number;
  authorId: string;
  slug: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  description?: string;
  authorBio?: string;
  authorName: string;
  authorPhotoUrl?: string;
  coverImageUrl?: string;
  bannerImageUrl?: string;
  theme?: string;
  primaryColor?: string;
  accentColor?: string;
  genre?: string;
}

export interface UpdateBookWebsiteData extends Partial<CreateBookWebsiteData> {
  amazonUrl?: string;
  barnesNobleUrl?: string;
  appleBooksUrl?: string;
  koboUrl?: string;
  googlePlayUrl?: string;
  luluUrl?: string;
  directBuyUrl?: string;
  sampleChapterUrl?: string;
  testimonials?: any[];
  awards?: any[];
  pressQuotes?: any[];
  bookDetails?: any;
  socialLinks?: any;
  newsletterEnabled?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImageUrl?: string;
  analyticsId?: string;
  facebookPixelId?: string;
}

export async function createBookWebsite(data: CreateBookWebsiteData) {
  const existingSlug = await db
    .select()
    .from(bookWebsites)
    .where(eq(bookWebsites.slug, data.slug));

  if (existingSlug.length > 0) {
    throw new Error("This URL slug is already taken. Please choose a different one.");
  }

  const [website] = await db
    .insert(bookWebsites)
    .values({
      ...data,
      theme: data.theme || "classic",
      primaryColor: data.primaryColor || "#C9941A",
      accentColor: data.accentColor || "#1a1a1a",
    })
    .returning();

  await createDefaultPages(website.id);

  return website;
}

async function createDefaultPages(websiteId: number) {
  const defaultPages = [
    { slug: "home", title: "Home", sortOrder: 0, content: "" },
    { slug: "about", title: "About the Author", sortOrder: 1, content: "" },
    { slug: "excerpt", title: "Sample Chapter", sortOrder: 2, content: "" },
    { slug: "reviews", title: "Reviews", sortOrder: 3, content: "" },
    { slug: "contact", title: "Contact", sortOrder: 4, content: "" },
  ];

  for (const page of defaultPages) {
    await db.insert(bookWebsitePages).values({
      websiteId,
      ...page,
    });
  }
}

export async function updateBookWebsite(
  websiteId: number,
  authorId: string,
  data: UpdateBookWebsiteData
) {
  const [existing] = await db
    .select()
    .from(bookWebsites)
    .where(and(eq(bookWebsites.id, websiteId), eq(bookWebsites.authorId, authorId)));

  if (!existing) {
    throw new Error("Website not found or you don't have permission to edit it");
  }

  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await db
      .select()
      .from(bookWebsites)
      .where(eq(bookWebsites.slug, data.slug));

    if (slugExists.length > 0) {
      throw new Error("This URL slug is already taken");
    }
  }

  const [updated] = await db
    .update(bookWebsites)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(bookWebsites.id, websiteId))
    .returning();

  return updated;
}

export async function publishBookWebsite(websiteId: number, authorId: string) {
  const [existing] = await db
    .select()
    .from(bookWebsites)
    .where(and(eq(bookWebsites.id, websiteId), eq(bookWebsites.authorId, authorId)));

  if (!existing) {
    throw new Error("Website not found");
  }

  if (!existing.title || !existing.coverImageUrl) {
    throw new Error("Please add a title and cover image before publishing");
  }

  const [updated] = await db
    .update(bookWebsites)
    .set({
      isPublished: true,
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookWebsites.id, websiteId))
    .returning();

  return {
    ...updated,
    liveUrl: `https://${BASE_DOMAIN}/book/${updated.slug}`,
  };
}

export async function unpublishBookWebsite(websiteId: number, authorId: string) {
  const [updated] = await db
    .update(bookWebsites)
    .set({
      isPublished: false,
      updatedAt: new Date(),
    })
    .where(and(eq(bookWebsites.id, websiteId), eq(bookWebsites.authorId, authorId)))
    .returning();

  return updated;
}

export async function getBookWebsite(websiteId: number) {
  const [website] = await db.select().from(bookWebsites).where(eq(bookWebsites.id, websiteId));

  if (!website) return null;

  const pages = await db
    .select()
    .from(bookWebsitePages)
    .where(eq(bookWebsitePages.websiteId, websiteId))
    .orderBy(bookWebsitePages.sortOrder);

  return { ...website, pages };
}

export async function getBookWebsiteBySlug(slug: string) {
  const [website] = await db.select().from(bookWebsites).where(eq(bookWebsites.slug, slug));

  if (!website) return null;

  await db
    .update(bookWebsites)
    .set({ viewCount: sql`${bookWebsites.viewCount} + 1` })
    .where(eq(bookWebsites.id, website.id));

  const pages = await db
    .select()
    .from(bookWebsitePages)
    .where(and(eq(bookWebsitePages.websiteId, website.id), eq(bookWebsitePages.isVisible, true)))
    .orderBy(bookWebsitePages.sortOrder);

  const author = await db.select().from(users).where(eq(users.id, website.authorId));

  return { ...website, pages, author: author[0] };
}

export async function getMyBookWebsites(authorId: string) {
  return db
    .select()
    .from(bookWebsites)
    .where(eq(bookWebsites.authorId, authorId))
    .orderBy(desc(bookWebsites.createdAt));
}

export async function deleteBookWebsite(websiteId: number, authorId: string) {
  const [deleted] = await db
    .delete(bookWebsites)
    .where(and(eq(bookWebsites.id, websiteId), eq(bookWebsites.authorId, authorId)))
    .returning();

  return deleted;
}

export async function updateWebsitePage(
  pageId: number,
  websiteId: number,
  authorId: string,
  data: { title?: string; content?: string; isVisible?: boolean; sortOrder?: number }
) {
  const [website] = await db
    .select()
    .from(bookWebsites)
    .where(and(eq(bookWebsites.id, websiteId), eq(bookWebsites.authorId, authorId)));

  if (!website) {
    throw new Error("Website not found or you don't have permission");
  }

  const [updated] = await db
    .update(bookWebsitePages)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(bookWebsitePages.id, pageId), eq(bookWebsitePages.websiteId, websiteId)))
    .returning();

  return updated;
}

export async function createWebsitePage(
  websiteId: number,
  authorId: string,
  data: { slug: string; title: string; content?: string; sortOrder?: number }
) {
  const [website] = await db
    .select()
    .from(bookWebsites)
    .where(and(eq(bookWebsites.id, websiteId), eq(bookWebsites.authorId, authorId)));

  if (!website) {
    throw new Error("Website not found or you don't have permission");
  }

  const [page] = await db
    .insert(bookWebsitePages)
    .values({
      websiteId,
      slug: data.slug,
      title: data.title,
      content: data.content || "",
      sortOrder: data.sortOrder || 99,
    })
    .returning();

  return page;
}

export async function deleteWebsitePage(pageId: number, websiteId: number, authorId: string) {
  const [website] = await db
    .select()
    .from(bookWebsites)
    .where(and(eq(bookWebsites.id, websiteId), eq(bookWebsites.authorId, authorId)));

  if (!website) {
    throw new Error("Website not found or you don't have permission");
  }

  const [deleted] = await db
    .delete(bookWebsitePages)
    .where(and(eq(bookWebsitePages.id, pageId), eq(bookWebsitePages.websiteId, websiteId)))
    .returning();

  return deleted;
}

export async function captureWebsiteLead(
  websiteId: number,
  email: string,
  name?: string,
  source?: string
) {
  const [lead] = await db
    .insert(bookWebsiteLeads)
    .values({
      websiteId,
      email,
      name,
      source: source || "newsletter",
    })
    .returning();

  return lead;
}

export async function getWebsiteLeads(websiteId: number, authorId: string) {
  const [website] = await db
    .select()
    .from(bookWebsites)
    .where(and(eq(bookWebsites.id, websiteId), eq(bookWebsites.authorId, authorId)));

  if (!website) {
    throw new Error("Website not found or you don't have permission");
  }

  return db
    .select()
    .from(bookWebsiteLeads)
    .where(eq(bookWebsiteLeads.websiteId, websiteId))
    .orderBy(desc(bookWebsiteLeads.createdAt));
}

export async function getWebsiteAnalytics(websiteId: number, authorId: string) {
  const [website] = await db
    .select()
    .from(bookWebsites)
    .where(and(eq(bookWebsites.id, websiteId), eq(bookWebsites.authorId, authorId)));

  if (!website) {
    throw new Error("Website not found or you don't have permission");
  }

  const [leadCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookWebsiteLeads)
    .where(eq(bookWebsiteLeads.websiteId, websiteId));

  return {
    viewCount: website.viewCount,
    clickCount: website.clickCount,
    leadCount: leadCount?.count || 0,
    isPublished: website.isPublished,
    publishedAt: website.publishedAt,
    liveUrl: website.isPublished ? `https://${BASE_DOMAIN}/book/${website.slug}` : null,
  };
}

export async function generateWebsiteContent(
  websiteId: number,
  authorId: string,
  contentType: "tagline" | "description" | "authorBio" | "seoDescription"
) {
  const [website] = await db
    .select()
    .from(bookWebsites)
    .where(and(eq(bookWebsites.id, websiteId), eq(bookWebsites.authorId, authorId)));

  if (!website) {
    throw new Error("Website not found");
  }

  const prompts: Record<string, string> = {
    tagline: `Generate a compelling, short tagline (under 10 words) for a book titled "${website.title}" ${website.genre ? `in the ${website.genre} genre` : ""}. ${website.subtitle ? `Subtitle: ${website.subtitle}` : ""} Just return the tagline, no quotes.`,
    description: `Write an engaging book description (2-3 paragraphs) for "${website.title}" ${website.genre ? `in the ${website.genre} genre` : ""}. ${website.subtitle ? `Subtitle: ${website.subtitle}` : ""} Make it compelling for potential readers.`,
    authorBio: `Write a professional author bio (1 paragraph) for ${website.authorName}, the author of "${website.title}". Make it engaging and suitable for a book website.`,
    seoDescription: `Write an SEO-optimized meta description (under 160 characters) for a book website about "${website.title}" by ${website.authorName}. ${website.genre ? `Genre: ${website.genre}` : ""}`,
  };

  const systemMessage = { role: "system", content: "You are a professional book marketing copywriter." };
  const result = await generateCoachResponse(prompts[contentType], [systemMessage], "marketing");

  return { content: result.response, contentType };
}

export async function createWebsiteFromListing(listingId: number, authorId: string) {
  const [listing] = await db
    .select()
    .from(marketplaceListings)
    .where(and(eq(marketplaceListings.id, listingId), eq(marketplaceListings.authorId, authorId)));

  if (!listing) {
    throw new Error("Listing not found");
  }

  const [author] = await db.select().from(users).where(eq(users.id, authorId));

  const slug = listing.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);

  const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

  return createBookWebsite({
    listingId,
    authorId,
    slug: uniqueSlug,
    title: listing.title,
    subtitle: listing.subtitle || undefined,
    description: listing.description,
    authorName: author ? `${author.firstName || ""} ${author.lastName || ""}`.trim() || "Author" : "Author",
    authorPhotoUrl: author?.profileImageUrl || undefined,
    coverImageUrl: listing.coverImageUrl || undefined,
    genre: listing.genre,
  });
}

export const WEBSITE_THEMES = [
  { id: "classic", name: "Classic", description: "Elegant and timeless design" },
  { id: "modern", name: "Modern", description: "Clean and minimalist" },
  { id: "dark", name: "Dark", description: "Bold and dramatic" },
  { id: "elegant", name: "Elegant", description: "Sophisticated and refined" },
  { id: "bold", name: "Bold", description: "Eye-catching and impactful" },
];
