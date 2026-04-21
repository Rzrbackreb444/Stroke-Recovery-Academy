import { sql } from "drizzle-orm";
import { pgTable, pgSchema, text, varchar, timestamp, integer, boolean, jsonb, serial, index, uniqueIndex, real, customType, uuid, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// AUTHOR BRAIN - SEMANTIC MEMORY SYSTEM (pgvector)
// ============================================================================

// Define the author_brain schema
export const authorBrainSchema = pgSchema("author_brain");

// Custom vector type for pgvector embeddings
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    if (typeof value === 'string') {
      // Parse PostgreSQL vector format: [0.1,0.2,0.3]
      return value.slice(1, -1).split(',').map(Number);
    }
    return value as unknown as number[];
  },
});

// Project Context - Links memories to specific books/studios
export const projectContext = authorBrainSchema.table("project_context", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  userId: text("user_id").notNull(),
  projectName: text("project_name").notNull(),
  projectType: text("project_type"), // 'book', 'music', 'video', 'course'
  globalTone: text("global_tone").default("narrative"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

// Author Memory - Semantic memory with vector embeddings
export const authorMemory = authorBrainSchema.table("author_memory", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  projectId: uuid("project_id").references(() => projectContext.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(), // 'character', 'lore', 'research', 'style'
  rawText: text("raw_text").notNull(),
  embedding: vector("embedding"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Insert schemas for Author Brain
export const insertProjectContextSchema = createInsertSchema(projectContext).omit({ id: true, createdAt: true, lastUpdated: true });
export const insertAuthorMemorySchema = createInsertSchema(authorMemory).omit({ id: true, createdAt: true });

// Types for Author Brain
export type ProjectContext = typeof projectContext.$inferSelect;
export type InsertProjectContext = z.infer<typeof insertProjectContextSchema>;
export type AuthorMemory = typeof authorMemory.$inferSelect;
export type InsertAuthorMemory = z.infer<typeof insertAuthorMemorySchema>;

// ============================================================================
// AFFILIATE/REFERRAL SYSTEM
// ============================================================================

export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  usageCount: integer("usage_count").notNull().default(0),
  totalEarnings: integer("total_earnings").notNull().default(0), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const referralConversions = pgTable("referral_conversions", {
  id: serial("id").primaryKey(),
  referralCodeId: integer("referral_code_id").notNull().references(() => referralCodes.id, { onDelete: "cascade" }),
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  purchaseId: integer("purchase_id"),
  commission: integer("commission").notNull().default(0), // in cents (10% of first purchase)
  status: text("status").notNull().default("pending"), // pending, paid
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({ id: true, createdAt: true, usageCount: true, totalEarnings: true });
export const insertReferralConversionSchema = createInsertSchema(referralConversions).omit({ id: true, createdAt: true });

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type ReferralConversion = typeof referralConversions.$inferSelect;
export type InsertReferralConversion = z.infer<typeof insertReferralConversionSchema>;

// ============================================================================
// WHITE LABEL BRANDING SYSTEM
// ============================================================================

export const whiteLabelConfigs = pgTable("white_label_configs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  
  // Branding
  brandName: text("brand_name").notNull(),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").default("#C9941A"),
  accentColor: text("accent_color").default("#1a1a1a"),
  backgroundColor: text("background_color").default("#FAF8F3"),
  
  // Custom Domain
  customDomain: text("custom_domain"),
  domainVerified: boolean("domain_verified").default(false),
  
  // API Keys (encrypted) - Full AI Provider Support
  openaiApiKey: text("openai_api_key"),
  anthropicApiKey: text("anthropic_api_key"),
  geminiApiKey: text("gemini_api_key"),
  grokApiKey: text("grok_api_key"),
  perplexityApiKey: text("perplexity_api_key"),
  stabilityApiKey: text("stability_api_key"),
  removeBgApiKey: text("remove_bg_api_key"),
  huggingfaceApiKey: text("huggingface_api_key"),
  replicateApiKey: text("replicate_api_key"),
  cohereApiKey: text("cohere_api_key"),
  mistralApiKey: text("mistral_api_key"),
  togetherApiKey: text("together_api_key"),
  deepseekApiKey: text("deepseek_api_key"),
  groqApiKey: text("groq_api_key"),
  elevenLabsApiKey: text("eleven_labs_api_key"),
  runwayApiKey: text("runway_api_key"),
  midJourneyApiKey: text("midjourney_api_key"),
  leonardoApiKey: text("leonardo_api_key"),
  githubApiKey: text("github_api_key"),
  serpApiKey: text("serp_api_key"),
  awsAccessKey: text("aws_access_key"),
  awsSecretKey: text("aws_secret_key"),
  cloudflareApiKey: text("cloudflare_api_key"),
  
  // White Label Settings
  hideKreaiteBranding: boolean("hide_kreaite_branding").default(false),
  customFooterText: text("custom_footer_text"),
  customTermsUrl: text("custom_terms_url"),
  customPrivacyUrl: text("custom_privacy_url"),
  
  // Revenue Settings
  creatorRevenueShare: integer("creator_revenue_share").default(85), // percentage to creators
  platformRevenueShare: integer("platform_revenue_share").default(15), // percentage to platform
  
  // Subscription & Status
  subscriptionTier: text("subscription_tier").default("basic"), // basic, professional, enterprise
  status: text("status").default("active"), // active, suspended, trial
  trialEndsAt: timestamp("trial_ends_at"),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// White Label API Usage Tracking
export const whiteLabelApiUsage = pgTable("white_label_api_usage", {
  id: serial("id").primaryKey(),
  whiteLabelId: integer("white_label_id").notNull().references(() => whiteLabelConfigs.id, { onDelete: "cascade" }),
  apiProvider: text("api_provider").notNull(), // openai, anthropic, gemini, grok, perplexity
  endpoint: text("endpoint"),
  tokensUsed: integer("tokens_used").default(0),
  costUsd: real("cost_usd").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// White Label Pricing Tiers
export const whiteLabelPricingTiers = {
  basic: {
    name: "Basic White Label",
    price: 99, // per month
    features: [
      "Custom branding (logo, colors)",
      "Use your own API keys",
      "Custom domain support",
      "5 creator accounts",
      "Basic analytics",
    ],
  },
  professional: {
    name: "Professional White Label",
    price: 299, // per month
    features: [
      "Everything in Basic",
      "Hide KreAIte branding",
      "Unlimited creator accounts",
      "Custom revenue split",
      "Priority support",
      "Advanced analytics",
    ],
  },
  enterprise: {
    name: "Enterprise White Label",
    price: 999, // per month
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "White-glove onboarding",
      "API access",
    ],
  },
};

export const insertWhiteLabelConfigSchema = createInsertSchema(whiteLabelConfigs).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  domainVerified: true,
});

export const insertWhiteLabelApiUsageSchema = createInsertSchema(whiteLabelApiUsage).omit({ 
  id: true, 
  createdAt: true,
});

export type WhiteLabelConfig = typeof whiteLabelConfigs.$inferSelect;
export type InsertWhiteLabelConfig = z.infer<typeof insertWhiteLabelConfigSchema>;
export type WhiteLabelApiUsage = typeof whiteLabelApiUsage.$inferSelect;
export type InsertWhiteLabelApiUsage = z.infer<typeof insertWhiteLabelApiUsageSchema>;

// ============================================================================
// SESSION STORAGE (Required for Replit Auth)
// ============================================================================

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// ============================================================================
// AUTHENTICATION - EMAIL/PASSWORD & MAGIC LINKS
// ============================================================================

export const magicLinks = pgTable("magic_links", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMagicLinkSchema = createInsertSchema(magicLinks).omit({ id: true, createdAt: true, usedAt: true });
export const insertPasswordResetSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true, usedAt: true });

export type MagicLink = typeof magicLinks.$inferSelect;
export type InsertMagicLink = z.infer<typeof insertMagicLinkSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordReset = z.infer<typeof insertPasswordResetSchema>;

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  authProvider: varchar("auth_provider").default("local"),
  role: text("role").notNull().default("member"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"),
  stripeConnectAccountId: text("stripe_connect_account_id"),
  stripeConnectOnboarded: boolean("stripe_connect_onboarded").default(false),
  creatorPayoutEnabled: boolean("creator_payout_enabled").default(false),
  // Survivor Spotlight opt-in (transparent + consented)
  spotlightOptedIn: boolean("spotlight_opted_in").notNull().default(false),
  spotlightConsent: boolean("spotlight_consent").notNull().default(false),
  spotlightConsentAt: timestamp("spotlight_consent_at"),
  // Verified Therapist program — gates therapist-tagged courses & badges
  isVerifiedTherapist: boolean("is_verified_therapist").notNull().default(false),
  therapistTitle: text("therapist_title"), // e.g. "PT, DPT", "OT/L", "SLP-CCC"
  therapistCredentials: text("therapist_credentials"), // license # / state / cert
  therapistBio: text("therapist_bio"),
  therapistVerifiedAt: timestamp("therapist_verified_at"),
  // Power Points: opt-in to receive gifts + public slug for share link
  acceptsPowerPoints: boolean("accepts_power_points").notNull().default(true),
  publicSlug: varchar("public_slug").unique(),
  lastDailyGiftAt: timestamp("last_daily_gift_at"),
  // Avatar system — distinct from profileImageUrl (which is Replit Auth photo)
  avatarUrl: text("avatar_url"),
  avatarStyle: text("avatar_style"),           // generated | uploaded | gallery
  avatarGeneratedPrompt: text("avatar_generated_prompt"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Power Points — purchased by family/friends/therapists, gifted to a survivor
// with a motivational message. Delivered as bonus credits + persistent inbox entry.
export const powerPointGifts = pgTable("power_point_gifts", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id, { onDelete: "set null" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  packageKey: text("package_key").notNull(), // spark | boost | surge | beast
  points: integer("points").notNull(), // credits delivered to receiver
  amountCents: integer("amount_cents").notNull(), // what sender paid (USD cents)
  message: text("message"), // motivational note
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").notNull().default("pending"), // pending | delivered | refunded
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  receiverIdx: index("ppg_receiver_idx").on(t.receiverId, t.createdAt),
  senderIdx: index("ppg_sender_idx").on(t.senderId, t.createdAt),
}));

export const insertPowerPointGiftSchema = createInsertSchema(powerPointGifts).omit({
  id: true,
  createdAt: true,
  deliveredAt: true,
  readAt: true,
  status: true,
  stripePaymentId: true,
});
export type InsertPowerPointGift = z.infer<typeof insertPowerPointGiftSchema>;
export type PowerPointGift = typeof powerPointGifts.$inferSelect;

// Therapist applications — manual admin review before isVerifiedTherapist flips on
export const therapistApplications = pgTable("therapist_applications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  title: text("title").notNull(),               // PT, DPT, OT/L, SLP-CCC, etc.
  licenseNumber: text("license_number").notNull(),
  licenseState: text("license_state").notNull(),
  yearsExperience: integer("years_experience"),
  specialties: text("specialties").array(),
  bio: text("bio"),
  portfolioUrl: text("portfolio_url"),
  documentUrl: text("document_url"),            // license/cert upload
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  reviewerId: varchar("reviewer_id").references(() => users.id, { onDelete: "set null" }),
  reviewerNotes: text("reviewer_notes"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("therapist_app_user_idx").on(t.userId),
  statusIdx: index("therapist_app_status_idx").on(t.status, t.createdAt),
}));
export const insertTherapistApplicationSchema = createInsertSchema(therapistApplications).omit({
  id: true, createdAt: true, status: true, reviewerId: true, reviewerNotes: true, reviewedAt: true,
});
export type InsertTherapistApplication = z.infer<typeof insertTherapistApplicationSchema>;
export type TherapistApplication = typeof therapistApplications.$inferSelect;

// Course unlocks paid in credits — drives 85% Stripe Connect payout to therapist
export const courseCreditUnlocks = pgTable("course_credit_unlocks", {
  id: serial("id").primaryKey(),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull(),    // soft FK — courses live in marketplace
  pointsSpent: integer("points_spent").notNull(),
  cashEquivalentCents: integer("cash_equivalent_cents").notNull(),  // points * point-value
  creatorPayoutCents: integer("creator_payout_cents").notNull(),     // 85%
  platformFeeCents: integer("platform_fee_cents").notNull(),         // 15%
  payoutTransferId: text("payout_transfer_id"),
  payoutStatus: text("payout_status").notNull().default("queued"),   // queued | paid | failed | skipped
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  buyerIdx: index("ccu_buyer_idx").on(t.buyerId, t.createdAt),
  creatorIdx: index("ccu_creator_idx").on(t.creatorId, t.createdAt),
  uniqUnlock: uniqueIndex("ccu_unique_unlock_idx").on(t.buyerId, t.courseId),
}));
export const insertCourseCreditUnlockSchema = createInsertSchema(courseCreditUnlocks).omit({
  id: true, createdAt: true, payoutTransferId: true, payoutStatus: true,
});
export type InsertCourseCreditUnlock = z.infer<typeof insertCourseCreditUnlockSchema>;
export type CourseCreditUnlock = typeof courseCreditUnlocks.$inferSelect;

// Block list — receivers can mute hostile senders
export const giftSenderBlocks = pgTable("gift_sender_blocks", {
  id: serial("id").primaryKey(),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedSenderId: varchar("blocked_sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  uniq: uniqueIndex("gsb_unique_idx").on(t.receiverId, t.blockedSenderId),
}));

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  strokeDate: timestamp("stroke_date"),
  strokeType: text("stroke_type"),
  affectedSide: text("affected_side"),
  recoveryGoals: text("recovery_goals").array(),
  currentChallenges: text("current_challenges").array(),
  bio: text("bio"),
  location: text("location"),
  timeZone: text("time_zone"),
  notificationPreferences: jsonb("notification_preferences"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// FORUM SYSTEM
// ============================================================================

export const forumCategories = pgTable("forum_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const forumThreads = pgTable("forum_threads", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => forumCategories.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => forumThreads.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").notNull().default(false),
  editedAt: timestamp("edited_at"),
  likeCount: integer("like_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const forumReactions = pgTable("forum_reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// LEARNING PLATFORM - COURSES
// ============================================================================

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  ogImageUrl: text("og_image_url"),
  // difficulty lane: survival | rebuild | rise | reign (P1 four-tier)
  difficulty: text("difficulty").notNull(),
  estimatedHours: integer("estimated_hours"),
  category: text("category").notNull(), // legacy single-category; new multi-tag lives in courseCategoryTags
  instructorId: varchar("instructor_id").references(() => users.id),
  status: text("status").notNull().default("draft"), // draft | preview | published
  priceCredits: integer("price_credits").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  enrollmentCount: integer("enrollment_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Course taxonomy (multi-category + prerequisites) ───────────────────────
export const courseCategories = pgTable("course_categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon"),       // lucide-react icon name
  color: text("color"),     // hex accent
  sortOrder: integer("sort_order").notNull().default(0),
});

export const courseCategoryTags = pgTable("course_category_tags", {
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => courseCategories.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.courseId, t.categoryId] }),
}));

export const coursePrerequisites = pgTable("course_prerequisites", {
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  prerequisiteCourseId: integer("prerequisite_course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.courseId, t.prerequisiteCourseId] }),
}));

// ─── User badges (earned achievements, driven by engagement events) ─────────
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeKey: varchar("badge_key").notNull(), // e.g. 'streak_7', 'first_course_complete'
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  metadata: jsonb("metadata"),
}, (t) => ({
  userIdx: index("user_badges_user_idx").on(t.userId),
  uniq: uniqueIndex("user_badges_user_badge_unique").on(t.userId, t.badgeKey),
}));

export const insertCourseCategorySchema = createInsertSchema(courseCategories).omit({ id: true });
export type InsertCourseCategory = z.infer<typeof insertCourseCategorySchema>;
export type CourseCategory = typeof courseCategories.$inferSelect;

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, earnedAt: true });
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courseLessons = pgTable("course_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => courseModules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  videoUrl: text("video_url"),
  duration: integer("duration"),
  order: integer("order").notNull(),
  lessonType: text("lesson_type").notNull(),
  resources: jsonb("resources"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// LEARNING PLATFORM - BOOKS
// ============================================================================

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  subtitle: text("subtitle"),
  description: text("description").notNull(),
  author: text("author").notNull().default("Nick Kremers"),
  coverImageUrl: text("cover_image_url"),
  stripePriceId: text("stripe_price_id"),
  stripeProductId: text("stripe_product_id"),
  category: text("category").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  isFree: boolean("is_free").notNull().default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookChapters = pgTable("book_chapters", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  estimatedReadTime: integer("estimated_read_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookPages = pgTable("book_pages", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").notNull().references(() => bookChapters.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  content: text("content").notNull(),
  interactiveElements: jsonb("interactive_elements"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// LEARNING PACKAGES (Book + Course Combinations)
// ============================================================================

export const learningPackages = pgTable("learning_packages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  bookChapterIds: integer("book_chapter_ids").array(),
  courseIds: integer("course_ids").array(),
  difficulty: text("difficulty").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export const userCourseProgress = pgTable("user_course_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  completedLessonIds: integer("completed_lesson_ids").array(),
  currentLessonId: integer("current_lesson_id"),
  progressPercentage: integer("progress_percentage").notNull().default(0),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const userBookProgress = pgTable("user_book_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentChapterId: integer("current_chapter_id").references(() => bookChapters.id),
  currentPageNumber: integer("current_page_number").notNull().default(1),
  completedChapterIds: integer("completed_chapter_ids").array(),
  totalReadTime: integer("total_read_time").notNull().default(0),
  lastReadAt: timestamp("last_read_at").notNull().defaultNow(),
});

export const userNotes = pgTable("user_notes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  contentId: integer("content_id").notNull(),
  note: text("note").notNull(),
  position: jsonb("position"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userBookmarks = pgTable("user_bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  contentId: integer("content_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// AI COACHING SYSTEM
// ============================================================================

export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionType: text("session_type").notNull(),
  title: text("title"),
  messageCount: integer("message_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiChatMessages = pgTable("ai_chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => aiChatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coachingInsights = pgTable("coaching_insights", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  insightType: text("insight_type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// ACHIEVEMENTS & MILESTONES
// ============================================================================

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  category: text("category").notNull(),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  criteria: jsonb("criteria").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const dailyLogs = pgTable("daily_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  logDate: timestamp("log_date").notNull(),
  mood: text("mood"),
  energyLevel: integer("energy_level"),
  painLevel: integer("pain_level"),
  exercisesCompleted: text("exercises_completed").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// MARKETPLACE (Amazon Affiliate Products)
// ============================================================================

export const marketplaceCategories = pgTable("marketplace_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  order: integer("order").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const marketplaceProducts = pgTable("marketplace_products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => marketplaceCategories.id, { onDelete: "cascade" }),
  asin: text("asin"),
  title: text("title").notNull(),
  brand: text("brand"),
  description: text("description"),
  features: text("features").array(),
  imageUrl: text("image_url"),
  amazonUrl: text("amazon_url").notNull(),
  priceDisplay: text("price_display"),
  rating: text("rating"),
  reviewCount: integer("review_count"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// STROKE LYFE PUBLISHING - Book Writing Studio
// ============================================================================

export const publishingProjects = pgTable("publishing_projects", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  genre: text("genre"),
  targetAudience: text("target_audience"),
  coverImageUrl: text("cover_image_url"),
  status: text("status").notNull().default("draft"), // draft, writing, editing, review, published
  wordCount: integer("word_count").notNull().default(0),
  chapterCount: integer("chapter_count").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  price: integer("price"), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const manuscriptChapters = pgTable("manuscript_chapters", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => publishingProjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  content: text("content"), // Rich text content
  aiDraft: text("ai_draft"), // AI-generated draft
  notes: text("notes"), // Author notes
  wordCount: integer("word_count").notNull().default(0),
  status: text("status").notNull().default("outline"), // outline, drafting, ai_review, editing, complete
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const manuscriptAssets = pgTable("manuscript_assets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => publishingProjects.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id").references(() => manuscriptChapters.id, { onDelete: "set null" }),
  assetType: text("asset_type").notNull(), // image, document, audio
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  aiPrompt: text("ai_prompt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiWritingJobs = pgTable("ai_writing_jobs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => publishingProjects.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id").references(() => manuscriptChapters.id, { onDelete: "cascade" }),
  jobType: text("job_type").notNull(), // outline, draft, rewrite, edit, expand, summarize
  prompt: text("prompt").notNull(),
  result: text("result"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ============================================================================
// STROKE LYFE PUBLISHING - Course Builder
// ============================================================================

export const creatorCourses = pgTable("creator_courses", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceProjectId: integer("source_project_id").references(() => publishingProjects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  difficulty: text("difficulty").notNull().default("beginner"),
  estimatedHours: integer("estimated_hours"),
  price: integer("price"), // in cents
  status: text("status").notNull().default("draft"), // draft, review, published
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  enrollmentCount: integer("enrollment_count").notNull().default(0),
  revenue: integer("revenue").notNull().default(0), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const creatorCourseModules = pgTable("creator_course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => creatorCourses.id, { onDelete: "cascade" }),
  sourceChapterId: integer("source_chapter_id").references(() => manuscriptChapters.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creatorCourseLessons = pgTable("creator_course_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => creatorCourseModules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  videoUrl: text("video_url"),
  duration: integer("duration"), // in minutes
  order: integer("order").notNull().default(0),
  isFree: boolean("is_free").notNull().default(false), // Preview lesson
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coursePurchases = pgTable("course_purchases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => creatorCourses.id, { onDelete: "cascade" }),
  stripePaymentId: text("stripe_payment_id"),
  amount: integer("amount").notNull(), // in cents
  status: text("status").notNull().default("pending"), // pending, completed, refunded
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
});

export const creatorPayouts = pgTable("creator_payouts", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  stripePayoutId: text("stripe_payout_id"),
  stripeTransferId: text("stripe_transfer_id"),
  failureReason: text("failure_reason"),
  earningsIncluded: integer("earnings_included").array(), // array of earning IDs
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  paidAt: timestamp("paid_at"),
});

// ============================================================================
// RECOVERY UNIVERSITY - Learning Programs
// ============================================================================

export const recoveryPrograms = pgTable("recovery_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  tier: text("tier").notNull(),
  difficulty: text("difficulty").notNull(),
  estimatedWeeks: integer("estimated_weeks"),
  moduleCount: integer("module_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const programModules = pgTable("program_modules", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => recoveryPrograms.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  lessonCount: integer("lesson_count").notNull().default(0),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const programLessons = pgTable("program_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => programModules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  videoUrl: text("video_url"),
  order: integer("order").notNull(),
  lessonType: text("lesson_type").notNull(),
  estimatedMinutes: integer("estimated_minutes"),
  resources: jsonb("resources"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userEnrollments = pgTable("user_enrollments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  programId: integer("program_id").notNull().references(() => recoveryPrograms.id),
  currentModuleId: integer("current_module_id").references(() => programModules.id),
  currentLessonId: integer("current_lesson_id").references(() => programLessons.id),
  completedModuleIds: integer("completed_module_ids").array(),
  completedLessonIds: integer("completed_lesson_ids").array(),
  progressPercentage: integer("progress_percentage").notNull().default(0),
  recoveryScore: integer("recovery_score").notNull().default(0),
  status: text("status").notNull().default("active"),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  graduatedAt: timestamp("graduated_at"),
});

// ============================================================================
// RECOVERY UNIVERSITY - Milestones & Achievements
// ============================================================================

export const recoveryMilestones = pgTable("recovery_milestones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  iconUrl: text("icon_url"),
  badgeUrl: text("badge_url"),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userMilestoneLogs = pgTable("user_milestone_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  milestoneId: integer("milestone_id").notNull().references(() => recoveryMilestones.id),
  celebrationNotes: text("celebration_notes"),
  achievedAt: timestamp("achieved_at").notNull().defaultNow(),
});

// ============================================================================
// RECOVERY UNIVERSITY - Habits & Streaks
// ============================================================================

export const recoveryHabits = pgTable("recovery_habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  frequency: text("frequency").notNull().default("daily"),
  targetDays: integer("target_days").notNull().default(66),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userHabits = pgTable("user_habits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  habitId: integer("habit_id").notNull().references(() => recoveryHabits.id),
  customName: text("custom_name"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  targetDays: integer("target_days").notNull().default(66),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalCompletions: integer("total_completions").notNull().default(0),
  status: text("status").notNull().default("active"),
  completedAt: timestamp("completed_at"),
});

export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  userHabitId: integer("user_habit_id").notNull().references(() => userHabits.id, { onDelete: "cascade" }),
  logDate: timestamp("log_date").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dailyCheckins = pgTable("daily_checkins", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  checkinDate: timestamp("checkin_date").notNull(),
  moodScore: integer("mood_score"),
  energyScore: integer("energy_score"),
  painScore: integer("pain_score"),
  effortScore: integer("effort_score"),
  sleepHours: integer("sleep_hours"),
  exerciseMinutes: integer("exercise_minutes"),
  winsToday: text("wins_today"),
  challengesToday: text("challenges_today"),
  gratitude: text("gratitude"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userStreaks = pgTable("user_streaks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityDate: timestamp("last_activity_date"),
  totalActiveDays: integer("total_active_days").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// RECOVERY UNIVERSITY - Accountability & Community
// ============================================================================

export const accountabilityPods = pgTable("accountability_pods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  leaderId: varchar("leader_id").references(() => users.id),
  maxMembers: integer("max_members").notNull().default(6),
  memberCount: integer("member_count").notNull().default(0),
  focusArea: text("focus_area"),
  meetingSchedule: text("meeting_schedule"),
  isPrivate: boolean("is_private").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const podMembers = pgTable("pod_members", {
  id: serial("id").primaryKey(),
  podId: integer("pod_id").notNull().references(() => accountabilityPods.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const recoveryExperiments = pgTable("recovery_experiments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  outcome: text("outcome"),
  notes: text("notes"),
  rating: integer("rating"),
  wouldRecommend: boolean("would_recommend"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// RECOVERY UNIVERSITY - Reminders & Wellness
// ============================================================================

export const recoveryReminders = pgTable("recovery_reminders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // medication, appointment, hydration, exercise, stand
  title: text("title").notNull(),
  description: text("description"),
  time: text("time").notNull(), // HH:MM format
  days: text("days").array().notNull(), // ["monday", "tuesday", etc.] or ["daily"]
  isActive: boolean("is_active").notNull().default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reminderLogs = pgTable("reminder_logs", {
  id: serial("id").primaryKey(),
  reminderId: integer("reminder_id").notNull().references(() => recoveryReminders.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // completed, dismissed, snoozed, missed
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Recovery Blog Posts — Nick Kremers authored articles, no user FK required
export const recoveryBlogPosts = pgTable("recovery_blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  category: text("category").notNull().default("philosophy"), // philosophy, therapy, science, exercises, caregivers, income
  tags: text("tags").array().default([]),
  heroImageUrl: text("hero_image_url"),
  authorName: text("author_name").notNull().default("Nick Kremers"),
  authorBio: text("author_bio"),
  status: text("status").notNull().default("published"), // published, draft
  featured: boolean("featured").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  readTime: integer("read_time").notNull().default(5),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRecoveryBlogPostSchema = createInsertSchema(recoveryBlogPosts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRecoveryBlogPost = typeof insertRecoveryBlogPostSchema._type;
export type RecoveryBlogPost = typeof recoveryBlogPosts.$inferSelect;

// Newsletter Subscribers
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  source: text("source").notNull().default("website"), // website, signup, challenge, blog, community
  isActive: boolean("is_active").notNull().default(true),
  tags: text("tags").array().default([]), // e.g. ["challenge", "caregiver", "survivor"]
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({ id: true, subscribedAt: true, unsubscribedAt: true });
export type InsertNewsletterSubscriber = typeof insertNewsletterSubscriberSchema._type;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

// Platform feedback survey responses
export const platformFeedback = pgTable("platform_feedback", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  userType: text("user_type").notNull().default("visitor"), // visitor, survivor, caregiver, family
  goals: text("goals").array().notNull().default([]),
  freeText: text("free_text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlatformFeedbackSchema = createInsertSchema(platformFeedback).omit({ id: true, createdAt: true });
export type InsertPlatformFeedback = typeof insertPlatformFeedbackSchema._type;
export type PlatformFeedback = typeof platformFeedback.$inferSelect;

// Newsletter Editions sent to subscribers
export const newsletterEditions = pgTable("newsletter_editions", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  preview: text("preview"), // Preview text shown in email clients
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  edition: integer("edition").notNull().default(1), // e.g. Edition #12
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").notNull().default(0),
  openCount: integer("open_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type NewsletterEdition = typeof newsletterEditions.$inferSelect;

// Drip email queue — one row per subscriber per edition
export const newsletterDripQueue = pgTable("newsletter_drip_queue", {
  id: serial("id").primaryKey(),
  subscriberId: integer("subscriber_id").notNull().references(() => newsletterSubscribers.id, { onDelete: "cascade" }),
  editionNumber: integer("edition_number").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  sentAt: timestamp("sent_at"),
  status: text("status").notNull().default("pending"), // pending | sent | skipped
});

export type NewsletterDripQueue = typeof newsletterDripQueue.$inferSelect;

export const standGoals = pgTable("stand_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hourlyGoal: integer("hourly_goal").notNull().default(1), // stand up every X hours
  dailyStandTarget: integer("daily_stand_target").notNull().default(12), // total stands per day
  startHour: integer("start_hour").notNull().default(8), // 8 AM
  endHour: integer("end_hour").notNull().default(20), // 8 PM
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const standLogs = pgTable("stand_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  standAt: timestamp("stand_at").notNull().defaultNow(),
  duration: integer("duration"), // seconds standing
  notes: text("notes"),
});

export const hydrationGoals = pgTable("hydration_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dailyTarget: integer("daily_target").notNull().default(8), // glasses per day
  glassSize: integer("glass_size").notNull().default(8), // oz per glass
  reminderInterval: integer("reminder_interval").notNull().default(60), // minutes
  startHour: integer("start_hour").notNull().default(7),
  endHour: integer("end_hour").notNull().default(21),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const hydrationLogs = pgTable("hydration_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // oz
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  notes: text("notes"),
});

export const exerciseGoals = pgTable("exercise_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dailyMinutes: integer("daily_minutes").notNull().default(30),
  weeklyDays: integer("weekly_days").notNull().default(5),
  preferredTime: text("preferred_time"), // morning, afternoon, evening
  exerciseTypes: text("exercise_types").array(), // walking, stretching, therapy, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exerciseLogs = pgTable("exercise_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // walking, stretching, therapy, etc.
  duration: integer("duration").notNull(), // minutes
  intensity: text("intensity"), // light, moderate, intense
  notes: text("notes"),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
});

// ============================================================================
// ENHANCED USER MANAGEMENT
// ============================================================================

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  // Profile Settings
  username: text("username").unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  // Privacy Settings
  profileVisibility: text("profile_visibility").notNull().default("public"), // public, members, private
  showRecoveryProgress: boolean("show_recovery_progress").notNull().default(true),
  showActivityFeed: boolean("show_activity_feed").notNull().default(true),
  allowDirectMessages: boolean("allow_direct_messages").notNull().default(true),
  // Notification Settings
  emailNotifications: boolean("email_notifications").notNull().default(true),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  reminderNotifications: boolean("reminder_notifications").notNull().default(true),
  communityNotifications: boolean("community_notifications").notNull().default(true),
  achievementNotifications: boolean("achievement_notifications").notNull().default(true),
  // Accessibility Settings
  fontSize: text("font_size").notNull().default("medium"), // small, medium, large, xlarge
  highContrast: boolean("high_contrast").notNull().default(false),
  reducedMotion: boolean("reduced_motion").notNull().default(false),
  screenReader: boolean("screen_reader").notNull().default(false),
  // Theme Settings
  theme: text("theme").notNull().default("dark"), // dark, light, system
  accentColor: text("accent_color").notNull().default("#FF6B35"),
  // Recovery Preferences
  preferredExerciseTime: text("preferred_exercise_time"), // morning, afternoon, evening
  recoveryFocus: text("recovery_focus").array(), // upper_extremity, speech, cognitive, etc.
  difficultyLevel: text("difficulty_level").notNull().default("adaptive"), // easy, moderate, challenging, adaptive
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// THERAPIST SYSTEM
// ============================================================================

export const therapistProfiles = pgTable("therapist_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  licenseNumber: text("license_number"),
  licenseState: text("license_state"),
  licenseType: text("license_type"), // PT, OT, SLP, etc.
  specializations: text("specializations").array(),
  yearsExperience: integer("years_experience"),
  bio: text("bio"),
  education: text("education"),
  certifications: text("certifications").array(),
  acceptingPatients: boolean("accepting_patients").notNull().default(true),
  hourlyRate: integer("hourly_rate"), // in cents
  availableHours: jsonb("available_hours"), // { monday: ["9:00-12:00", "14:00-17:00"], ... }
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  rating: integer("rating"), // 1-5 scale, stored as 10-50 for precision
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const patientAssignments = pgTable("patient_assignments", {
  id: serial("id").primaryKey(),
  therapistId: varchar("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"), // pending, active, paused, completed, terminated
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  goals: text("goals").array(),
  notes: text("notes"),
  sessionFrequency: text("session_frequency"), // weekly, biweekly, monthly
  nextSessionDate: timestamp("next_session_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const therapySessions = pgTable("therapy_sessions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => patientAssignments.id, { onDelete: "cascade" }),
  therapistId: varchar("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionType: text("session_type").notNull(), // video, in_person, phone, async_review
  scheduledAt: timestamp("scheduled_at").notNull(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // minutes
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled, no_show
  meetingUrl: text("meeting_url"),
  recordingUrl: text("recording_url"),
  notes: text("notes"),
  patientNotes: text("patient_notes"),
  exercisesPrescribed: jsonb("exercises_prescribed"),
  progressAssessment: jsonb("progress_assessment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exercisePrescriptions = pgTable("exercise_prescriptions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => patientAssignments.id, { onDelete: "cascade" }),
  therapistId: varchar("therapist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id"), // links to therapeutic exercises
  title: text("title").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  videoUrl: text("video_url"),
  sets: integer("sets"),
  reps: integer("reps"),
  duration: integer("duration"), // seconds
  frequency: text("frequency").notNull(), // daily, twice_daily, weekly, etc.
  daysPerWeek: integer("days_per_week"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// ACTIVITY WALL (Social Feed)
// ============================================================================

export const activityPosts = pgTable("activity_posts", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  postType: text("post_type").notNull().default("update"), // update, milestone, question, tip, celebration, pod_activity
  visibility: text("visibility").notNull().default("public"), // public, members, pod, private
  podId: integer("pod_id").references(() => accountabilityPods.id, { onDelete: "set null" }),
  isPinned: boolean("is_pinned").notNull().default(false),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const activityMedia = pgTable("activity_media", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => activityPosts.id, { onDelete: "cascade" }),
  mediaType: text("media_type").notNull(), // image, video, gif, sticker
  mediaUrl: text("media_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  tenorId: text("tenor_id"), // for GIFs from Tenor API
  altText: text("alt_text"),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"), // for videos, in seconds
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityReactions = pgTable("activity_reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => activityPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull(), // like, love, celebrate, support, insightful
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityComments = pgTable("activity_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => activityPosts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"), // for nested replies
  content: text("content").notNull(),
  likeCount: integer("like_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// THERAPEUTIC EXERCISE GAMES
// ============================================================================

export const therapeuticExercises = pgTable("therapeutic_exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(), // upper_extremity, lower_extremity, cognitive, speech, balance, daily_living
  subcategory: text("subcategory"), // grip_strength, shoulder_rom, finger_dexterity, memory, attention, etc.
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  targetArea: text("target_area").array(), // shoulder, elbow, wrist, fingers, etc.
  instructions: text("instructions"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  gameType: text("game_type"), // tap_sequence, target_hit, word_match, memory_cards, reaction_time, etc.
  gameConfig: jsonb("game_config"), // { duration: 60, targets: 10, speed: "medium", etc. }
  benefits: text("benefits").array(),
  contraindications: text("contraindications").array(),
  estimatedMinutes: integer("estimated_minutes"),
  caloriesBurned: integer("calories_burned"),
  equipmentNeeded: text("equipment_needed").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exerciseSessions = pgTable("exercise_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => therapeuticExercises.id, { onDelete: "cascade" }),
  prescriptionId: integer("prescription_id").references(() => exercisePrescriptions.id, { onDelete: "set null" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // seconds
  score: integer("score"),
  maxScore: integer("max_score"),
  accuracy: integer("accuracy"), // percentage 0-100
  speed: integer("speed"), // average response time in ms
  reps: integer("reps"),
  sets: integer("sets"),
  difficulty: text("difficulty"),
  gameData: jsonb("game_data"), // detailed performance metrics
  notes: text("notes"),
  painLevel: integer("pain_level"), // 0-10 scale
  effortLevel: integer("effort_level"), // 0-10 scale
});

export const exerciseScores = pgTable("exercise_scores", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => therapeuticExercises.id, { onDelete: "cascade" }),
  highScore: integer("high_score").notNull().default(0),
  totalSessions: integer("total_sessions").notNull().default(0),
  totalTime: integer("total_time").notNull().default(0), // seconds
  averageScore: integer("average_score").notNull().default(0),
  averageAccuracy: integer("average_accuracy").notNull().default(0),
  lastPlayedAt: timestamp("last_played_at"),
  streak: integer("streak").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// SPEECH & COGNITIVE THERAPY
// ============================================================================

export const speechExercises = pgTable("speech_exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // apraxia, aphasia, articulation, fluency, voice
  difficulty: text("difficulty").notNull(),
  promptType: text("prompt_type").notNull(), // word, phrase, sentence, reading, naming, repetition
  promptContent: text("prompt_content").notNull(),
  audioUrl: text("audio_url"), // model pronunciation
  imageUrl: text("image_url"), // visual prompt
  expectedResponse: text("expected_response"),
  phonemes: text("phonemes").array(), // target sounds
  hints: text("hints").array(),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cognitiveExercises = pgTable("cognitive_exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // memory, attention, problem_solving, processing_speed, language
  subcategory: text("subcategory"), // working_memory, visual_memory, sustained_attention, etc.
  difficulty: text("difficulty").notNull(),
  gameType: text("game_type").notNull(), // matching, sequence, sorting, word_finding, math, etc.
  instructions: text("instructions"),
  gameConfig: jsonb("game_config"), // { grid_size: 4, time_limit: 60, categories: ["animals"], etc. }
  estimatedMinutes: integer("estimated_minutes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// WEARABLE INTEGRATION
// ============================================================================

export const wearableConnections = pgTable("wearable_connections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // fitbit, apple_health, google_fit, garmin, oura
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  deviceId: text("device_id"),
  deviceName: text("device_name"),
  lastSyncAt: timestamp("last_sync_at"),
  syncEnabled: boolean("sync_enabled").notNull().default(true),
  metricsEnabled: jsonb("metrics_enabled"), // { steps: true, heart_rate: true, sleep: true, etc. }
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const wearableMetrics = pgTable("wearable_metrics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectionId: integer("connection_id").notNull().references(() => wearableConnections.id, { onDelete: "cascade" }),
  metricType: text("metric_type").notNull(), // steps, heart_rate, sleep, calories, active_minutes, etc.
  value: integer("value").notNull(),
  unit: text("unit").notNull(), // count, bpm, hours, kcal, etc.
  recordedAt: timestamp("recorded_at").notNull(),
  metadata: jsonb("metadata"), // additional data like heart_rate_zones, sleep_stages, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// DIRECT MESSAGING
// ============================================================================

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("direct"), // direct, group
  name: text("name"), // for group chats
  createdById: varchar("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at"),
  isMuted: boolean("is_muted").notNull().default(false),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"), // image, video, gif, file
  tenorId: text("tenor_id"),
  isRead: boolean("is_read").notNull().default(false),
  isEdited: boolean("is_edited").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// ENHANCED FORUM (Media Support)
// ============================================================================

export const forumPostMedia = pgTable("forum_post_media", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  mediaType: text("media_type").notNull(), // image, video, gif, file
  mediaUrl: text("media_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  tenorId: text("tenor_id"),
  altText: text("alt_text"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// VIDEO SESSIONS (Telemedicine)
// ============================================================================

export const videoSessions = pgTable("video_sessions", {
  id: serial("id").primaryKey(),
  hostId: varchar("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionType: text("session_type").notNull(), // therapy, pod_meeting, coaching, group_class
  title: text("title"),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // minutes
  maxParticipants: integer("max_participants").notNull().default(2),
  meetingUrl: text("meeting_url"),
  roomId: text("room_id"),
  recordingUrl: text("recording_url"),
  status: text("status").notNull().default("scheduled"), // scheduled, live, ended, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const videoSessionParticipants = pgTable("video_session_participants", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => videoSessions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("participant"), // host, co_host, participant
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
  status: text("status").notNull().default("invited"), // invited, joined, left
});

// ============================================================================
// STROKE RECOVERY ACADEMY - Powered by Stroke Lyfe Inc
// Recovery journeys, creative expression, community monetization
// ============================================================================

// Recovery Creator Profiles (extended user profile for stroke survivors)
export const recoveryCreatorProfiles = pgTable("recovery_creator_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  coverImageUrl: text("cover_image_url"),
  recoveryStartDate: timestamp("recovery_start_date"), // When their stroke occurred
  recoveryType: text("recovery_type"), // ischemic, hemorrhagic, tia, other
  affectedAreas: text("affected_areas").array(), // mobility, speech, cognitive, vision, etc.
  
  // Creator monetization
  isMonetized: boolean("is_monetized").notNull().default(false),
  stripeConnectId: text("stripe_connect_id"), // For payouts
  tipJarEnabled: boolean("tip_jar_enabled").notNull().default(false),
  subscriptionEnabled: boolean("subscription_enabled").notNull().default(false),
  monthlySubscriptionPrice: integer("monthly_subscription_price"), // In cents
  
  // Social/engagement
  followerCount: integer("follower_count").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  totalViews: integer("total_views").notNull().default(0),
  totalTips: integer("total_tips").notNull().default(0), // In cents
  
  // Verification & credentials
  isVerified: boolean("is_verified").notNull().default(false),
  verificationDate: timestamp("verification_date"),
  credentials: text("credentials").array(), // survivor, caregiver, therapist, advocate
  websiteUrl: text("website_url"),
  socialLinks: jsonb("social_links").default({}), // {instagram, youtube, twitter, etc}
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Recovery Journey Stories - Main content type for sharing experiences
export const recoveryStories = pgTable("recovery_stories", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  
  // Story classification
  storyType: text("story_type").notNull().default("journey"), // journey, milestone, tip, inspiration, creative
  category: text("category"), // mobility, speech, cognitive, emotional, lifestyle, creative
  tags: text("tags").array(),
  
  // Media
  coverImageUrl: text("cover_image_url"),
  coverImageAlt: text("cover_image_alt"),
  mediaGallery: jsonb("media_gallery").default([]), // [{type, url, caption}]
  videoUrl: text("video_url"), // YouTube/Vimeo embed
  audioUrl: text("audio_url"), // For audio stories/podcasts
  
  // Timeline/milestones
  recoveryStage: text("recovery_stage"), // acute, subacute, chronic, long-term
  daysPostStroke: integer("days_post_stroke"), // Days since stroke when story was written
  milestonesAchieved: text("milestones_achieved").array(),
  
  // Publishing
  status: text("status").notNull().default("draft"), // draft, published, archived, premium
  visibility: text("visibility").notNull().default("public"), // public, subscribers, private
  isPremium: boolean("is_premium").notNull().default(false), // Premium/paywalled content
  premiumPrice: integer("premium_price"), // One-time price in cents
  
  // Engagement
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  bookmarkCount: integer("bookmark_count").notNull().default(0),
  
  // SEO (inherits from premium blog suite)
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  focusKeyphrase: text("focus_keyphrase"),
  seoScore: integer("seo_score"),
  
  // Timestamps
  publishedAt: timestamp("published_at"),
  featuredAt: timestamp("featured_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Journey Milestones - Track specific achievements in personal recovery journey
export const journeyMilestones = pgTable("journey_milestones", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // mobility, speech, cognitive, emotional, daily-living, social
  achievedAt: timestamp("achieved_at").notNull(),
  daysPostStroke: integer("days_post_stroke"),
  
  // Evidence/celebration
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  
  // Sharing
  isPublic: boolean("is_public").notNull().default(true),
  linkedStoryId: integer("linked_story_id").references(() => recoveryStories.id),
  
  // Engagement
  celebrationCount: integer("celebration_count").notNull().default(0), // Like equivalent
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Story Reactions & Engagement
export const recoveryStoryReactions = pgTable("recovery_story_reactions", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull().references(() => recoveryStories.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull().default("heart"), // heart, inspire, strong, support, celebrate
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Story Comments
export const recoveryStoryComments = pgTable("recovery_story_comments", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull().references(() => recoveryStories.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").notNull().default(false),
  likeCount: integer("like_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Creator Following/Subscriptions
export const recoveryCreatorFollows = pgTable("recovery_creator_follows", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isSubscribed: boolean("is_subscribed").notNull().default(false), // Paid subscriber
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tips/Donations
export const recoveryCreatorTips = pgTable("recovery_creator_tips", {
  id: serial("id").primaryKey(),
  fromUserId: varchar("from_user_id").references(() => users.id, { onDelete: "set null" }),
  toCreatorId: varchar("to_creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: integer("story_id").references(() => recoveryStories.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(), // In cents
  currency: text("currency").notNull().default("USD"),
  message: text("message"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  platformFee: integer("platform_fee"), // 15% platform cut
  creatorPayout: integer("creator_payout"), // 85% to creator
  paidOutAt: timestamp("paid_out_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Premium Content Purchases
export const recoveryPremiumPurchases = pgTable("recovery_premium_purchases", {
  id: serial("id").primaryKey(),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: integer("story_id").notNull().references(() => recoveryStories.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").notNull().default("completed"),
  platformFee: integer("platform_fee"),
  creatorPayout: integer("creator_payout"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Recovery Resources (curated content, exercises, tips)
export const recoveryResources = pgTable("recovery_resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  resourceType: text("resource_type").notNull(), // exercise, guide, video, audio, document, link
  category: text("category").notNull(), // mobility, speech, cognitive, emotional, nutrition, lifestyle
  difficultyLevel: text("difficulty_level"), // beginner, intermediate, advanced
  duration: integer("duration"), // In minutes
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  externalUrl: text("external_url"),
  authorId: varchar("author_id").references(() => users.id),
  isOfficial: boolean("is_official").notNull().default(false), // Created by Stroke Lyfe Inc
  isPremium: boolean("is_premium").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  saveCount: integer("save_count").notNull().default(0),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Support Groups/Communities
export const recoverySupportGroups = pgTable("recovery_support_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  category: text("category").notNull(), // condition-specific, age-group, location, topic
  isPrivate: boolean("is_private").notNull().default(false),
  memberCount: integer("member_count").notNull().default(0),
  postCount: integer("post_count").notNull().default(0),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  isOfficial: boolean("is_official").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recoverySupportGroupMembers = pgTable("recovery_support_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => recoverySupportGroups.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // admin, moderator, member
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

// ============================================================================
// SASQUATCH DOCTRINE - FLICKER LOG
// Micro-moment tracking for small victories ("I felt my finger twitch!")
// ============================================================================

export const flickerLogs = pgTable("flicker_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moment: text("moment").notNull(), // Description of the micro-moment
  bodyPart: text("body_part"), // affected_hand, affected_leg, speech, cognitive, etc.
  intensity: integer("intensity").notNull().default(1), // 1-5 scale
  emotionBefore: text("emotion_before"),
  emotionAfter: text("emotion_after"),
  activity: text("activity"), // What were they doing when it happened
  isBreakthrough: boolean("is_breakthrough").notNull().default(false),
  notes: text("notes"),
  mediaUrl: text("media_url"), // Optional video/photo of the moment
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// SASQUATCH DOCTRINE - MEDICAL LOG
// Medications, appointments, vitals tracking
// ============================================================================

export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(), // once_daily, twice_daily, as_needed, etc.
  purpose: text("purpose"),
  prescribedBy: text("prescribed_by"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  sideEffects: text("side_effects").array(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  reminderTimes: text("reminder_times").array(), // ["08:00", "20:00"]
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const medicationLogs = pgTable("medication_logs", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id").notNull().references(() => medications.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  takenAt: timestamp("taken_at").notNull().defaultNow(),
  skipped: boolean("skipped").notNull().default(false),
  skipReason: text("skip_reason"),
  notes: text("notes"),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  providerName: text("provider_name").notNull(),
  providerType: text("provider_type").notNull(), // neurologist, PT, OT, speech, PCP, etc.
  location: text("location"),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration"), // minutes
  notes: text("notes"),
  prepNotes: text("prep_notes"), // What to bring, questions to ask
  followUpNotes: text("follow_up_notes"), // After visit notes
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled, rescheduled
  reminderSent: boolean("reminder_sent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vitalsLogs = pgTable("vitals_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  heartRate: integer("heart_rate"),
  temperature: text("temperature"),
  weight: text("weight"),
  bloodSugar: integer("blood_sugar"),
  oxygenLevel: integer("oxygen_level"),
  painLevel: integer("pain_level"), // 1-10
  sleepHours: text("sleep_hours"),
  sleepQuality: integer("sleep_quality"), // 1-5
  notes: text("notes"),
  measuredAt: timestamp("measured_at").notNull().defaultNow(),
});

// ============================================================================
// SASQUATCH DOCTRINE - C.O.M.P.A.S.S. (7 Pillars Navigation System)
// Community, Optimism, Movement, Purpose, Accountability, Science, Self-care
// ============================================================================

export const compassEntries = pgTable("compass_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pillar: text("pillar").notNull(), // community, optimism, movement, purpose, accountability, science, self_care
  score: integer("score").notNull(), // 1-10 daily rating
  reflection: text("reflection"),
  wins: text("wins").array(),
  challenges: text("challenges").array(),
  tomorrowsGoal: text("tomorrows_goal"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const compassGoals = pgTable("compass_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pillar: text("pillar").notNull(),
  goal: text("goal").notNull(),
  targetDate: timestamp("target_date"),
  status: text("status").notNull().default("active"), // active, completed, paused
  progress: integer("progress").notNull().default(0), // 0-100
  milestones: jsonb("milestones"), // Array of milestone objects
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ============================================================================
// SASQUATCH DOCTRINE - DRAFT YOUR LEGEND (Story Builder)
// Personal autobiography/memoir building tool
// ============================================================================

export const legendDrafts = pgTable("legend_drafts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("My Recovery Legend"),
  subtitle: text("subtitle"),
  coverImageUrl: text("cover_image_url"),
  chapters: jsonb("chapters"), // Array of chapter objects with title, content, order
  currentChapter: integer("current_chapter").notNull().default(1),
  totalWordCount: integer("total_word_count").notNull().default(0),
  status: text("status").notNull().default("draft"), // draft, in_progress, complete
  publishedToStories: boolean("published_to_stories").notNull().default(false),
  lastEditedAt: timestamp("last_edited_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const legendPrompts = pgTable("legend_prompts", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // before_stroke, the_event, early_recovery, breakthrough, wisdom, future
  prompt: text("prompt").notNull(),
  order: integer("order").notNull().default(0),
  isRequired: boolean("is_required").notNull().default(false),
});

export const legendResponses = pgTable("legend_responses", {
  id: serial("id").primaryKey(),
  legendId: integer("legend_id").notNull().references(() => legendDrafts.id, { onDelete: "cascade" }),
  promptId: integer("prompt_id").notNull().references(() => legendPrompts.id),
  response: text("response").notNull(),
  wordCount: integer("word_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// SASQUATCH DOCTRINE - NEVER ZERO (Streak Protection)
// 1 rep = saved streak logic
// ============================================================================

export const neverZeroLogs = pgTable("never_zero_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  habitId: integer("habit_id").references(() => recoveryHabits.id),
  action: text("action").notNull(), // What minimal action was taken
  reps: integer("reps").notNull().default(1), // Number of reps (minimum 1)
  streakSaved: boolean("streak_saved").notNull().default(true),
  difficulty: text("difficulty"), // easy, medium, hard (relative to their condition)
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// RECOVERY JOURNAL (Daily Entries)
// ============================================================================

export const recoveryJournals = pgTable("recovery_journals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content").notNull(),
  mood: integer("mood"), // 1-10
  energy: integer("energy"), // 1-10
  gratitude: text("gratitude").array(),
  wins: text("wins").array(),
  struggles: text("struggles").array(),
  tomorrowsIntention: text("tomorrows_intention"),
  tags: text("tags").array(),
  isPrivate: boolean("is_private").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// COURSE BUILDER (Kajabi-level)
// ============================================================================

export const courseBuilderCourses = pgTable("course_builder_courses", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  longDescription: text("long_description"),
  thumbnailUrl: text("thumbnail_url"),
  promoVideoUrl: text("promo_video_url"),
  category: text("category"), // recovery, wellness, mindset, movement, etc.
  difficulty: text("difficulty").notNull().default("beginner"), // beginner, intermediate, advanced
  estimatedHours: integer("estimated_hours"),
  price: integer("price").notNull().default(0), // cents, 0 = free
  isFree: boolean("is_free").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  enrollmentCount: integer("enrollment_count").notNull().default(0),
  completionRate: integer("completion_rate").notNull().default(0),
  averageRating: integer("average_rating").notNull().default(0),
  totalRatings: integer("total_ratings").notNull().default(0),
  dripEnabled: boolean("drip_enabled").notNull().default(false),
  dripIntervalDays: integer("drip_interval_days").notNull().default(7),
  certificateEnabled: boolean("certificate_enabled").notNull().default(true),
  communityEnabled: boolean("community_enabled").notNull().default(false),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"),
});

export const courseBuilderModules = pgTable("course_builder_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courseBuilderCourses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  isLocked: boolean("is_locked").notNull().default(false),
  unlockAfterDays: integer("unlock_after_days"), // For drip content
  unlockAfterModuleId: integer("unlock_after_module_id"), // Prerequisite module
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courseBuilderLessons = pgTable("course_builder_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => courseBuilderModules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  lessonType: text("lesson_type").notNull().default("video"), // video, text, quiz, exercise, download, audio
  content: text("content"), // Rich text content or video embed
  videoUrl: text("video_url"),
  videoDuration: integer("video_duration"), // seconds
  audioUrl: text("audio_url"),
  downloadUrl: text("download_url"),
  downloadName: text("download_name"),
  thumbnailUrl: text("thumbnail_url"),
  order: integer("order").notNull().default(0),
  estimatedMinutes: integer("estimated_minutes").notNull().default(10),
  isPreview: boolean("is_preview").notNull().default(false), // Free preview
  isRequired: boolean("is_required").notNull().default(true),
  completionCriteria: text("completion_criteria").notNull().default("view"), // view, quiz_pass, exercise_complete
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courseBuilderQuizzes = pgTable("course_builder_quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => courseBuilderLessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").notNull().default(70), // percentage
  allowRetakes: boolean("allow_retakes").notNull().default(true),
  maxRetakes: integer("max_retakes"), // null = unlimited
  shuffleQuestions: boolean("shuffle_questions").notNull().default(false),
  showCorrectAnswers: boolean("show_correct_answers").notNull().default(true),
  timeLimitMinutes: integer("time_limit_minutes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courseBuilderQuestions = pgTable("course_builder_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => courseBuilderQuizzes.id, { onDelete: "cascade" }),
  questionType: text("question_type").notNull().default("multiple_choice"), // multiple_choice, true_false, short_answer, matching
  question: text("question").notNull(),
  options: jsonb("options"), // Array of {id, text, isCorrect}
  correctAnswer: text("correct_answer"),
  explanation: text("explanation"),
  points: integer("points").notNull().default(1),
  order: integer("order").notNull().default(0),
});

export const courseEnrollments = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => courseBuilderCourses.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  progress: integer("progress").notNull().default(0), // 0-100
  currentLessonId: integer("current_lesson_id"),
  lastAccessedAt: timestamp("last_accessed_at"),
  certificateIssuedAt: timestamp("certificate_issued_at"),
  certificateUrl: text("certificate_url"),
});

export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").notNull().references(() => courseBuilderLessons.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed
  progressPercent: integer("progress_percent").notNull().default(0),
  videoWatchTime: integer("video_watch_time").notNull().default(0), // seconds
  completedAt: timestamp("completed_at"),
  startedAt: timestamp("started_at"),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizId: integer("quiz_id").notNull().references(() => courseBuilderQuizzes.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  answers: jsonb("answers"), // {questionId: userAnswer}
  timeTaken: integer("time_taken"), // seconds
  attemptNumber: integer("attempt_number").notNull().default(1),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const courseReviews = pgTable("course_reviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => courseBuilderCourses.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(false),
  helpfulCount: integer("helpful_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// SEO & CONTENT PAGES
// ============================================================================

export const seoPages = pgTable("seo_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords").array(),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  canonicalUrl: text("canonical_url"),
  structuredData: jsonb("structured_data"), // JSON-LD schema.org data
  robots: text("robots").notNull().default("index, follow"),
  priority: integer("priority").notNull().default(5), // 1-10 for sitemap
  changeFrequency: text("change_frequency").notNull().default("weekly"),
  lastModified: timestamp("last_modified").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// BLOGGING SUITE - USER STORIES
// ============================================================================

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  heroImageUrl: text("hero_image_url"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  visibility: text("visibility").notNull().default("public"), // public, private, followers
  tags: text("tags").array(),
  readingTime: integer("reading_time").default(5),
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // ========== PREMIUM SEO FIELDS ==========
  // Meta tags (optimized lengths)
  metaTitle: text("meta_title"), // Max 70 chars
  metaDescription: text("meta_description"), // Max 160 chars
  metaKeywords: text("meta_keywords").array(), // Focus keywords
  
  // Canonical & URLs
  canonicalUrl: text("canonical_url"), // Custom canonical if different
  breadcrumbTitle: text("breadcrumb_title"), // Short title for breadcrumbs
  
  // Featured image SEO
  featuredImageAlt: text("featured_image_alt"), // Alt text for hero image
  featuredImageCaption: text("featured_image_caption"),
  ogImageUrl: text("og_image_url"), // Custom Open Graph image
  twitterImageUrl: text("twitter_image_url"), // Custom Twitter card image
  
  // Schema.org / Structured Data
  schemaType: text("schema_type").default("Article"), // Article, BlogPosting, NewsArticle, HowTo
  primaryCategory: text("primary_category"), // Main category for schema
  secondaryCategories: text("secondary_categories").array(),
  
  // Internal/External Linking
  internalLinks: jsonb("internal_links").default([]), // [{url, anchor, context}]
  externalLinks: jsonb("external_links").default([]), // [{url, anchor, nofollow}]
  relatedPostIds: integer("related_post_ids").array(), // Related posts for internal linking
  
  // Advanced SEO
  focusKeyphrase: text("focus_keyphrase"), // Primary SEO keyphrase
  keyphraseScore: integer("keyphrase_score"), // SEO score 0-100
  readabilityScore: integer("readability_score"), // Flesch-Kincaid score
  seoScore: integer("seo_score"), // Overall SEO score 0-100
  cornerstone: boolean("cornerstone").default(false), // Cornerstone content marker
  
  // Social sharing
  socialTitle: text("social_title"), // Title for social sharing
  socialDescription: text("social_description"), // Description for social sharing
  pinterestImageUrl: text("pinterest_image_url"),
  
  // Technical SEO
  noIndex: boolean("no_index").default(false),
  noFollow: boolean("no_follow").default(false),
  indexPriority: real("index_priority").default(0.7), // Sitemap priority 0.0-1.0
  changeFrequency: text("change_frequency").default("weekly"), // always, hourly, daily, weekly, monthly, yearly, never
  
  // Author E-E-A-T
  authorBio: text("author_bio"), // Author bio for this post
  authorCredentials: text("author_credentials").array(), // Expertise signals
  reviewedBy: text("reviewed_by"), // Expert reviewer name
  reviewedAt: timestamp("reviewed_at"),
  factChecked: boolean("fact_checked").default(false),
  lastFactCheckAt: timestamp("last_fact_check_at"),
  sources: jsonb("sources").default([]), // [{title, url, accessDate}]
  
  // Timestamps for freshness signals
  contentLastUpdated: timestamp("content_last_updated"),
  seoLastAuditedAt: timestamp("seo_last_audited_at"),
});

export const blogPostReactions = pgTable("blog_post_reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type").notNull().default("like"), // like, love, inspire, support
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const blogPostComments = pgTable("blog_post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// INSERT SCHEMAS & TYPES
// ============================================================================

// Recovery University Insert Schemas
export const insertRecoveryProgramSchema = createInsertSchema(recoveryPrograms).omit({ id: true, createdAt: true });
export const insertUserEnrollmentSchema = createInsertSchema(userEnrollments).omit({ id: true, enrolledAt: true, lastActivityAt: true });
export const insertDailyCheckinSchema = createInsertSchema(dailyCheckins).omit({ id: true, createdAt: true });
export const insertUserHabitSchema = createInsertSchema(userHabits).omit({ id: true, currentStreak: true, longestStreak: true, totalCompletions: true });
export const insertHabitLogSchema = createInsertSchema(habitLogs).omit({ id: true, createdAt: true });
export const insertRecoveryExperimentSchema = createInsertSchema(recoveryExperiments).omit({ id: true, createdAt: true });
export const insertAccountabilityPodSchema = createInsertSchema(accountabilityPods).omit({ id: true, createdAt: true, memberCount: true });
export const insertPodMemberSchema = createInsertSchema(podMembers).omit({ id: true, joinedAt: true });

// Reminders & Wellness Insert Schemas
export const insertRecoveryReminderSchema = createInsertSchema(recoveryReminders).omit({ id: true, createdAt: true, lastTriggered: true });
export const insertReminderLogSchema = createInsertSchema(reminderLogs).omit({ id: true, createdAt: true });
export const insertStandGoalSchema = createInsertSchema(standGoals).omit({ id: true, createdAt: true });
export const insertStandLogSchema = createInsertSchema(standLogs).omit({ id: true });
export const insertHydrationGoalSchema = createInsertSchema(hydrationGoals).omit({ id: true, createdAt: true });
export const insertHydrationLogSchema = createInsertSchema(hydrationLogs).omit({ id: true });
export const insertExerciseGoalSchema = createInsertSchema(exerciseGoals).omit({ id: true, createdAt: true });
export const insertExerciseLogSchema = createInsertSchema(exerciseLogs).omit({ id: true });

export const insertPublishingProjectSchema = createInsertSchema(publishingProjects).omit({ id: true, createdAt: true, updatedAt: true, wordCount: true, chapterCount: true });
export const insertManuscriptChapterSchema = createInsertSchema(manuscriptChapters).omit({ id: true, createdAt: true, updatedAt: true, wordCount: true });
export const insertManuscriptAssetSchema = createInsertSchema(manuscriptAssets).omit({ id: true, createdAt: true });
export const insertAiWritingJobSchema = createInsertSchema(aiWritingJobs).omit({ id: true, createdAt: true, completedAt: true });
export const insertCreatorCourseSchema = createInsertSchema(creatorCourses).omit({ id: true, createdAt: true, updatedAt: true, enrollmentCount: true, revenue: true });
export const insertCreatorCourseModuleSchema = createInsertSchema(creatorCourseModules).omit({ id: true, createdAt: true });
export const insertCreatorCourseLessonSchema = createInsertSchema(creatorCourseLessons).omit({ id: true, createdAt: true });
export const insertCoursePurchaseSchema = createInsertSchema(coursePurchases).omit({ id: true, purchasedAt: true });
export const insertCreatorPayoutSchema = createInsertSchema(creatorPayouts).omit({ id: true, createdAt: true, paidAt: true });

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, role: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, updatedAt: true });
export const insertForumCategorySchema = createInsertSchema(forumCategories).omit({ id: true, createdAt: true });
export const insertForumThreadSchema = createInsertSchema(forumThreads).omit({ id: true, createdAt: true, lastActivityAt: true, viewCount: true, replyCount: true });
export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true, likeCount: true, isEdited: true, editedAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true, enrollmentCount: true });
export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({ id: true, createdAt: true });
export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({ id: true, createdAt: true });
export const insertBookSchema = createInsertSchema(books).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBookChapterSchema = createInsertSchema(bookChapters).omit({ id: true, createdAt: true });
export const insertBookPageSchema = createInsertSchema(bookPages).omit({ id: true, createdAt: true });
export const insertAiChatSessionSchema = createInsertSchema(aiChatSessions).omit({ id: true, createdAt: true, messageCount: true, lastMessageAt: true });
export const insertAiChatMessageSchema = createInsertSchema(aiChatMessages).omit({ id: true, createdAt: true });
export const insertDailyLogSchema = createInsertSchema(dailyLogs).omit({ id: true, createdAt: true });
export const insertMarketplaceCategorySchema = createInsertSchema(marketplaceCategories).omit({ id: true, createdAt: true });
export const insertMarketplaceProductSchema = createInsertSchema(marketplaceProducts).omit({ id: true, createdAt: true, updatedAt: true });

// Enhanced User Management Insert Schemas
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true, updatedAt: true });

// Therapist System Insert Schemas
export const insertTherapistProfileSchema = createInsertSchema(therapistProfiles).omit({ id: true, createdAt: true, updatedAt: true, isVerified: true, verifiedAt: true, rating: true, reviewCount: true });
export const insertPatientAssignmentSchema = createInsertSchema(patientAssignments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTherapySessionSchema = createInsertSchema(therapySessions).omit({ id: true, createdAt: true });
export const insertExercisePrescriptionSchema = createInsertSchema(exercisePrescriptions).omit({ id: true, createdAt: true });

// Activity Wall Insert Schemas
export const insertActivityPostSchema = createInsertSchema(activityPosts).omit({ id: true, createdAt: true, updatedAt: true, likeCount: true, commentCount: true, shareCount: true });
export const insertActivityMediaSchema = createInsertSchema(activityMedia).omit({ id: true, createdAt: true });
export const insertActivityReactionSchema = createInsertSchema(activityReactions).omit({ id: true, createdAt: true });
export const insertActivityCommentSchema = createInsertSchema(activityComments).omit({ id: true, createdAt: true, updatedAt: true, likeCount: true });

// Therapeutic Exercises Insert Schemas
export const insertTherapeuticExerciseSchema = createInsertSchema(therapeuticExercises).omit({ id: true, createdAt: true });
export const insertExerciseSessionSchema = createInsertSchema(exerciseSessions).omit({ id: true, startedAt: true });
export const insertExerciseScoreSchema = createInsertSchema(exerciseScores).omit({ id: true, updatedAt: true });
export const insertSpeechExerciseSchema = createInsertSchema(speechExercises).omit({ id: true, createdAt: true });
export const insertCognitiveExerciseSchema = createInsertSchema(cognitiveExercises).omit({ id: true, createdAt: true });

// Wearable Integration Insert Schemas
export const insertWearableConnectionSchema = createInsertSchema(wearableConnections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWearableMetricSchema = createInsertSchema(wearableMetrics).omit({ id: true, createdAt: true });

// Direct Messaging Insert Schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({ id: true, joinedAt: true });
export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({ id: true, createdAt: true, updatedAt: true, isRead: true, isEdited: true });

// Enhanced Forum Insert Schemas
export const insertForumPostMediaSchema = createInsertSchema(forumPostMedia).omit({ id: true, createdAt: true });

// Video Sessions Insert Schemas
export const insertVideoSessionSchema = createInsertSchema(videoSessions).omit({ id: true, createdAt: true });
export const insertVideoSessionParticipantSchema = createInsertSchema(videoSessionParticipants).omit({ id: true });

// SEO Insert Schemas
export const insertSeoPageSchema = createInsertSchema(seoPages).omit({ id: true, createdAt: true, lastModified: true });

// Blogging Suite Insert Schemas
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true, likeCount: true, commentCount: true });
export const insertBlogPostReactionSchema = createInsertSchema(blogPostReactions).omit({ id: true, createdAt: true });
export const insertBlogPostCommentSchema = createInsertSchema(blogPostComments).omit({ id: true, createdAt: true, updatedAt: true, isEdited: true });

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertForumCategory = z.infer<typeof insertForumCategorySchema>;
export type ForumThread = typeof forumThreads.$inferSelect;
export type InsertForumThread = z.infer<typeof insertForumThreadSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;
export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;
export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type BookChapter = typeof bookChapters.$inferSelect;
export type InsertBookChapter = z.infer<typeof insertBookChapterSchema>;
export type BookPage = typeof bookPages.$inferSelect;
export type InsertBookPage = z.infer<typeof insertBookPageSchema>;
export type AiChatSession = typeof aiChatSessions.$inferSelect;
export type InsertAiChatSession = z.infer<typeof insertAiChatSessionSchema>;
export type AiChatMessage = typeof aiChatMessages.$inferSelect;
export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;
export type DailyLog = typeof dailyLogs.$inferSelect;
export type InsertDailyLog = z.infer<typeof insertDailyLogSchema>;
export type UserCourseProgress = typeof userCourseProgress.$inferSelect;
export type UserBookProgress = typeof userBookProgress.$inferSelect;
export type UserNote = typeof userNotes.$inferSelect;
export type UserBookmark = typeof userBookmarks.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type CoachingInsight = typeof coachingInsights.$inferSelect;
export type LearningPackage = typeof learningPackages.$inferSelect;
export type MarketplaceCategory = typeof marketplaceCategories.$inferSelect;
export type InsertMarketplaceCategory = z.infer<typeof insertMarketplaceCategorySchema>;
export type MarketplaceProduct = typeof marketplaceProducts.$inferSelect;
export type InsertMarketplaceProduct = z.infer<typeof insertMarketplaceProductSchema>;

// Stroke Lyfe Publishing Types
export type PublishingProject = typeof publishingProjects.$inferSelect;
export type InsertPublishingProject = z.infer<typeof insertPublishingProjectSchema>;
export type ManuscriptChapter = typeof manuscriptChapters.$inferSelect;
export type InsertManuscriptChapter = z.infer<typeof insertManuscriptChapterSchema>;
export type ManuscriptAsset = typeof manuscriptAssets.$inferSelect;
export type InsertManuscriptAsset = z.infer<typeof insertManuscriptAssetSchema>;
export type AiWritingJob = typeof aiWritingJobs.$inferSelect;
export type InsertAiWritingJob = z.infer<typeof insertAiWritingJobSchema>;
export type CreatorCourse = typeof creatorCourses.$inferSelect;
export type InsertCreatorCourse = z.infer<typeof insertCreatorCourseSchema>;
export type CreatorCourseModule = typeof creatorCourseModules.$inferSelect;
export type InsertCreatorCourseModule = z.infer<typeof insertCreatorCourseModuleSchema>;
export type CreatorCourseLesson = typeof creatorCourseLessons.$inferSelect;
export type InsertCreatorCourseLesson = z.infer<typeof insertCreatorCourseLessonSchema>;
export type CoursePurchase = typeof coursePurchases.$inferSelect;
export type InsertCoursePurchase = z.infer<typeof insertCoursePurchaseSchema>;
export type CreatorPayout = typeof creatorPayouts.$inferSelect;
export type InsertCreatorPayout = z.infer<typeof insertCreatorPayoutSchema>;

// Recovery University Types
export type RecoveryProgram = typeof recoveryPrograms.$inferSelect;
export type InsertRecoveryProgram = z.infer<typeof insertRecoveryProgramSchema>;
export type UserEnrollment = typeof userEnrollments.$inferSelect;
export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type InsertDailyCheckin = z.infer<typeof insertDailyCheckinSchema>;
export type UserHabit = typeof userHabits.$inferSelect;
export type HabitLog = typeof habitLogs.$inferSelect;
export type RecoveryExperiment = typeof recoveryExperiments.$inferSelect;
export type AccountabilityPod = typeof accountabilityPods.$inferSelect;
export type InsertAccountabilityPod = z.infer<typeof insertAccountabilityPodSchema>;
export type PodMember = typeof podMembers.$inferSelect;
export type InsertPodMember = z.infer<typeof insertPodMemberSchema>;
export type RecoveryMilestone = typeof recoveryMilestones.$inferSelect;
export type UserStreak = typeof userStreaks.$inferSelect;

// Enhanced User Management Types
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// Therapist System Types
export type TherapistProfile = typeof therapistProfiles.$inferSelect;
export type InsertTherapistProfile = z.infer<typeof insertTherapistProfileSchema>;
export type PatientAssignment = typeof patientAssignments.$inferSelect;
export type InsertPatientAssignment = z.infer<typeof insertPatientAssignmentSchema>;
export type TherapySession = typeof therapySessions.$inferSelect;
export type InsertTherapySession = z.infer<typeof insertTherapySessionSchema>;
export type ExercisePrescription = typeof exercisePrescriptions.$inferSelect;
export type InsertExercisePrescription = z.infer<typeof insertExercisePrescriptionSchema>;

// Activity Wall Types
export type ActivityPost = typeof activityPosts.$inferSelect;
export type InsertActivityPost = z.infer<typeof insertActivityPostSchema>;
export type ActivityMedia = typeof activityMedia.$inferSelect;
export type InsertActivityMedia = z.infer<typeof insertActivityMediaSchema>;
export type ActivityReaction = typeof activityReactions.$inferSelect;
export type InsertActivityReaction = z.infer<typeof insertActivityReactionSchema>;
export type ActivityComment = typeof activityComments.$inferSelect;
export type InsertActivityComment = z.infer<typeof insertActivityCommentSchema>;

// Therapeutic Exercises Types
export type TherapeuticExercise = typeof therapeuticExercises.$inferSelect;
export type InsertTherapeuticExercise = z.infer<typeof insertTherapeuticExerciseSchema>;
export type ExerciseSession = typeof exerciseSessions.$inferSelect;
export type InsertExerciseSession = z.infer<typeof insertExerciseSessionSchema>;
export type ExerciseScore = typeof exerciseScores.$inferSelect;
export type InsertExerciseScore = z.infer<typeof insertExerciseScoreSchema>;
export type SpeechExercise = typeof speechExercises.$inferSelect;
export type InsertSpeechExercise = z.infer<typeof insertSpeechExerciseSchema>;
export type CognitiveExercise = typeof cognitiveExercises.$inferSelect;
export type InsertCognitiveExercise = z.infer<typeof insertCognitiveExerciseSchema>;

// Wearable Integration Types
export type WearableConnection = typeof wearableConnections.$inferSelect;
export type InsertWearableConnection = z.infer<typeof insertWearableConnectionSchema>;
export type WearableMetric = typeof wearableMetrics.$inferSelect;
export type InsertWearableMetric = z.infer<typeof insertWearableMetricSchema>;

// Direct Messaging Types
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;

// Enhanced Forum Types
export type ForumPostMedia = typeof forumPostMedia.$inferSelect;
export type InsertForumPostMedia = z.infer<typeof insertForumPostMediaSchema>;

// Video Sessions Types
export type VideoSession = typeof videoSessions.$inferSelect;
export type InsertVideoSession = z.infer<typeof insertVideoSessionSchema>;
export type VideoSessionParticipant = typeof videoSessionParticipants.$inferSelect;
export type InsertVideoSessionParticipant = z.infer<typeof insertVideoSessionParticipantSchema>;

// SEO Types
export type SeoPage = typeof seoPages.$inferSelect;
export type InsertSeoPage = z.infer<typeof insertSeoPageSchema>;

// Blogging Suite Types
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPostReaction = typeof blogPostReactions.$inferSelect;
export type InsertBlogPostReaction = z.infer<typeof insertBlogPostReactionSchema>;
export type BlogPostComment = typeof blogPostComments.$inferSelect;
export type InsertBlogPostComment = z.infer<typeof insertBlogPostCommentSchema>;

// Recovery University Curriculum (from The Ultimate Stroke Recovery Revolution)
export const curriculumParts = pgTable("curriculum_parts", {
  id: serial("id").primaryKey(),
  partNumber: integer("part_number").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  iconName: text("icon_name"),
  order: integer("order").notNull(),
  requiredTier: text("required_tier").notNull().default("explorer"), // explorer, warrior, champion, platinum
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const curriculumChapters = pgTable("curriculum_chapters", {
  id: serial("id").primaryKey(),
  partId: integer("part_id").notNull().references(() => curriculumParts.id, { onDelete: "cascade" }),
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"), // Full chapter content
  videoUrl: text("video_url"), // AI-generated or uploaded video
  audioUrl: text("audio_url"), // Audio narration
  estimatedMinutes: integer("estimated_minutes"),
  keyTakeaways: text("key_takeaways").array(),
  exercises: jsonb("exercises"), // Interactive exercises
  requiredTier: text("required_tier").notNull().default("warrior"),
  order: integer("order").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userCurriculumProgress = pgTable("user_curriculum_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id").notNull().references(() => curriculumChapters.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed
  progressPercentage: integer("progress_percentage").notNull().default(0),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCurriculumPartSchema = createInsertSchema(curriculumParts).omit({
  id: true,
  createdAt: true,
});

export const insertCurriculumChapterSchema = createInsertSchema(curriculumChapters).omit({
  id: true,
  createdAt: true,
});

export const insertUserCurriculumProgressSchema = createInsertSchema(userCurriculumProgress).omit({
  id: true,
  createdAt: true,
});

// AI Video Content
export const aiGeneratedVideos = pgTable("ai_generated_videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // in seconds
  contentType: text("content_type").notNull(), // chapter_intro, exercise_demo, motivation, celebration
  contentId: integer("content_id"), // Reference to chapter or exercise
  status: text("status").notNull().default("pending"), // pending, generating, completed, failed
  cost: integer("cost"), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertAiGeneratedVideoSchema = createInsertSchema(aiGeneratedVideos).omit({
  id: true,
  createdAt: true,
});

// Curriculum Types
export type CurriculumPart = typeof curriculumParts.$inferSelect;
export type InsertCurriculumPart = z.infer<typeof insertCurriculumPartSchema>;
export type CurriculumChapter = typeof curriculumChapters.$inferSelect;
export type InsertCurriculumChapter = z.infer<typeof insertCurriculumChapterSchema>;
export type UserCurriculumProgress = typeof userCurriculumProgress.$inferSelect;
export type InsertUserCurriculumProgress = z.infer<typeof insertUserCurriculumProgressSchema>;

// AI Video Types
export type AiGeneratedVideo = typeof aiGeneratedVideos.$inferSelect;
export type InsertAiGeneratedVideo = z.infer<typeof insertAiGeneratedVideoSchema>;

// ============================================================================
// STROKE LYFE MUSIC STUDIO
// ============================================================================

export const musicProjects = pgTable("music_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  genre: text("genre").notNull(), // rap, pop, country, metal, rock, punk, edm, ambient
  subGenre: text("sub_genre"),
  bpm: integer("bpm").notNull().default(120),
  key: text("key").notNull().default("C"),
  scale: text("scale").notNull().default("major"), // major, minor, pentatonic, etc.
  description: text("description"),
  coverArtUrl: text("cover_art_url"),
  status: text("status").notNull().default("draft"), // draft, mixing, mastering, completed
  isPublished: boolean("is_published").notNull().default(false),
  duration: integer("duration"), // in seconds
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const musicStems = pgTable("music_stems", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => musicProjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // drums, bass, guitar, synth, vocals, etc.
  stemType: text("stem_type").notNull(), // instrumental, vocal, ai_generated, sample, recorded
  sourceModel: text("source_model"), // lyria, tonej, user_upload
  audioUrl: text("audio_url"),
  waveformData: jsonb("waveform_data"), // for visualization
  volume: integer("volume").notNull().default(80), // 0-100
  pan: integer("pan").notNull().default(50), // 0-100, 50 = center
  muted: boolean("muted").notNull().default(false),
  solo: boolean("solo").notNull().default(false),
  effects: jsonb("effects"), // reverb, delay, eq settings
  startTime: integer("start_time").notNull().default(0), // ms offset
  duration: integer("duration"), // in ms
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const musicLyrics = pgTable("music_lyrics", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => musicProjects.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  content: text("content").notNull(),
  structure: jsonb("structure"), // verse, chorus, bridge markers with timestamps
  aiGenerated: boolean("ai_generated").notNull().default(false),
  aiPrompt: text("ai_prompt"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vocalRenders = pgTable("vocal_renders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => musicProjects.id, { onDelete: "cascade" }),
  lyricsId: integer("lyrics_id").references(() => musicLyrics.id),
  singerProfile: text("singer_profile").notNull(), // voice type/character
  language: text("language").notNull().default("en"),
  audioUrl: text("audio_url"),
  phonemeMap: jsonb("phoneme_map"), // timing data for lip sync
  style: text("style"), // rap, sing, scream, whisper
  pitch: integer("pitch").notNull().default(0), // -12 to +12 semitones
  status: text("status").notNull().default("pending"), // pending, rendering, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const mixSessions = pgTable("mix_sessions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => musicProjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  masterVolume: integer("master_volume").notNull().default(80),
  masterEffects: jsonb("master_effects"), // master chain: compressor, limiter, eq
  automationCurves: jsonb("automation_curves"), // volume/pan automation over time
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const musicExports = pgTable("music_exports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => musicProjects.id, { onDelete: "cascade" }),
  mixSessionId: integer("mix_session_id").references(() => mixSessions.id),
  format: text("format").notNull(), // wav, mp3, flac
  quality: text("quality").notNull(), // 320kbps, lossless, etc.
  audioUrl: text("audio_url"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  fileSize: integer("file_size"), // in bytes
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const musicVideos = pgTable("music_videos", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => musicProjects.id, { onDelete: "cascade" }),
  exportId: integer("export_id").references(() => musicExports.id),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  style: text("style"), // cinematic, lyric_video, performance, abstract
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // in seconds
  beatMarkers: jsonb("beat_markers"), // sync points for audio-reactive visuals
  status: text("status").notNull().default("pending"), // pending, generating, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const aiMusicJobs = pgTable("ai_music_jobs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => musicProjects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobType: text("job_type").notNull(), // instrumental, vocal, lyrics, video, mastering
  provider: text("provider").notNull(), // lyria, gemini, veo, openai
  prompt: text("prompt").notNull(),
  parameters: jsonb("parameters"), // genre, bpm, key, etc.
  resultUrl: text("result_url"),
  status: text("status").notNull().default("queued"), // queued, processing, completed, failed
  errorMessage: text("error_message"),
  cost: integer("cost"), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

// Insert schemas
export const insertMusicProjectSchema = createInsertSchema(musicProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMusicStemSchema = createInsertSchema(musicStems).omit({
  id: true,
  createdAt: true,
});

export const insertMusicLyricsSchema = createInsertSchema(musicLyrics).omit({
  id: true,
  createdAt: true,
});

export const insertVocalRenderSchema = createInsertSchema(vocalRenders).omit({
  id: true,
  createdAt: true,
});

export const insertMixSessionSchema = createInsertSchema(mixSessions).omit({
  id: true,
  createdAt: true,
});

export const insertMusicExportSchema = createInsertSchema(musicExports).omit({
  id: true,
  createdAt: true,
});

export const insertMusicVideoSchema = createInsertSchema(musicVideos).omit({
  id: true,
  createdAt: true,
});

export const insertAiMusicJobSchema = createInsertSchema(aiMusicJobs).omit({
  id: true,
  createdAt: true,
});

// Music Studio Types
export type MusicProject = typeof musicProjects.$inferSelect;
export type InsertMusicProject = z.infer<typeof insertMusicProjectSchema>;
export type MusicStem = typeof musicStems.$inferSelect;
export type InsertMusicStem = z.infer<typeof insertMusicStemSchema>;
export type MusicLyrics = typeof musicLyrics.$inferSelect;
export type InsertMusicLyrics = z.infer<typeof insertMusicLyricsSchema>;
export type VocalRender = typeof vocalRenders.$inferSelect;
export type InsertVocalRender = z.infer<typeof insertVocalRenderSchema>;
export type MixSession = typeof mixSessions.$inferSelect;
export type InsertMixSession = z.infer<typeof insertMixSessionSchema>;
export type MusicExport = typeof musicExports.$inferSelect;
export type InsertMusicExport = z.infer<typeof insertMusicExportSchema>;
export type MusicVideo = typeof musicVideos.$inferSelect;
export type InsertMusicVideo = z.infer<typeof insertMusicVideoSchema>;
export type AiMusicJob = typeof aiMusicJobs.$inferSelect;
export type InsertAiMusicJob = z.infer<typeof insertAiMusicJobSchema>;

// ============================================================================
// CREATOR EARNINGS & STRIPE CONNECT
// ============================================================================

export const creatorEarnings = pgTable("creator_earnings", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: integer("order_id"),
  productType: text("product_type").notNull(), // book, audiobook, course, music, video
  productId: integer("product_id").notNull(),
  productTitle: text("product_title").notNull(),
  saleAmount: integer("sale_amount").notNull(), // in cents (total sale price)
  platformFee: integer("platform_fee").notNull(), // in cents (15% platform cut)
  creatorShare: integer("creator_share").notNull(), // in cents (85% creator cut)
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, available, paid, failed
  stripeTransferId: text("stripe_transfer_id"),
  payoutId: integer("payout_id"),
  customerEmail: text("customer_email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const insertCreatorEarningSchema = createInsertSchema(creatorEarnings).omit({
  id: true,
  createdAt: true,
});

export type CreatorEarning = typeof creatorEarnings.$inferSelect;
export type InsertCreatorEarning = z.infer<typeof insertCreatorEarningSchema>;

// ============================================================================
// BOOK MARKETPLACE - Lulu Print-on-Demand Integration
// ============================================================================

export const marketplaceListings = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => publishingProjects.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description").notNull(),
  coverImageUrl: text("cover_image_url"),
  previewUrl: text("preview_url"),
  genre: text("genre").notNull(),
  tags: text("tags").array(),
  status: text("status").notNull().default("draft"), // draft, pending_review, approved, published, suspended
  isFeatured: boolean("is_featured").notNull().default(false),
  isDigitalOnly: boolean("is_digital_only").notNull().default(false),
  totalSales: integer("total_sales").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0), // in cents
  averageRating: integer("average_rating"), // 1-50 (x10 for precision)
  reviewCount: integer("review_count").notNull().default(0),
  pageCount: integer("page_count"),
  wordCount: integer("word_count"),
  scheduledPublishAt: timestamp("scheduled_publish_at"),
  scheduledUnpublishAt: timestamp("scheduled_unpublish_at"),
  publishedAt: timestamp("published_at"),
  moderationStatus: text("moderation_status").notNull().default("pending"), // pending, approved, rejected, flagged
  moderatedAt: timestamp("moderated_at"),
  moderatedBy: integer("moderated_by"),
  moderationNotes: text("moderation_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// CONTENT MODERATION SYSTEM
// ============================================================================

export const contentReports = pgTable("content_reports", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id, { onDelete: "cascade" }),
  reporterUserId: varchar("reporter_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(), // inappropriate, copyright, spam, other
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, reviewed, resolved
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
});

export const insertContentReportSchema = createInsertSchema(contentReports).omit({ id: true, createdAt: true, resolvedAt: true, resolvedBy: true });
export type ContentReport = typeof contentReports.$inferSelect;
export type InsertContentReport = z.infer<typeof insertContentReportSchema>;

export const bookEditions = pgTable("book_editions", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id, { onDelete: "cascade" }),
  editionType: text("edition_type").notNull(), // digital_ebook, digital_pdf, print_paperback, print_hardcover
  isActive: boolean("is_active").notNull().default(true),
  // Pricing
  price: integer("price").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),
  printCost: integer("print_cost"), // Lulu print cost in cents (null for digital)
  authorRoyalty: integer("author_royalty").notNull(), // author's cut in cents
  // Print specs (for physical books)
  trimSize: text("trim_size"), // 5x8, 5.5x8.5, 6x9, etc.
  paperType: text("paper_type"), // white, cream
  bindingType: text("binding_type"), // paperback, hardcover, case_laminate
  colorInterior: boolean("color_interior").notNull().default(false),
  luluPackageId: text("lulu_package_id"), // Lulu's product spec code
  luluProductId: text("lulu_product_id"), // Lulu's product ID once created
  // Digital files
  interiorPdfUrl: text("interior_pdf_url"),
  coverPdfUrl: text("cover_pdf_url"),
  epubUrl: text("epub_url"),
  // ISBN
  isbn: text("isbn"),
  isbn13: text("isbn13"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookOrders = pgTable("book_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => users.id, { onDelete: "set null" }),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, processing, shipped, delivered, cancelled, refunded
  // Payment
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  subtotal: integer("subtotal").notNull(), // in cents
  shippingCost: integer("shipping_cost").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  total: integer("total").notNull(),
  currency: text("currency").notNull().default("USD"),
  // Shipping
  shippingMethod: text("shipping_method"), // ground, expedited, express
  shippingName: text("shipping_name"),
  shippingStreet1: text("shipping_street1"),
  shippingStreet2: text("shipping_street2"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingPostcode: text("shipping_postcode"),
  shippingCountry: text("shipping_country"),
  shippingPhone: text("shipping_phone"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  // Timestamps
  paidAt: timestamp("paid_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => bookOrders.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id),
  editionId: integer("edition_id").notNull().references(() => bookEditions.id),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(), // in cents
  printCost: integer("print_cost"), // null for digital
  authorRoyalty: integer("author_royalty").notNull(), // author's cut per unit
  subtotal: integer("subtotal").notNull(),
  // Digital delivery
  downloadUrl: text("download_url"),
  downloadExpiresAt: timestamp("download_expires_at"),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const luluPrintJobs = pgTable("lulu_print_jobs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => bookOrders.id, { onDelete: "cascade" }),
  orderItemId: integer("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  luluOrderId: text("lulu_order_id"), // Lulu's order ID
  luluLineItemId: text("lulu_line_item_id"),
  status: text("status").notNull().default("pending"), // pending, submitted, accepted, in_production, shipped, delivered, cancelled, failed
  // Job details
  productId: text("product_id"),
  quantity: integer("quantity").notNull(),
  interiorSourceUrl: text("interior_source_url"),
  coverSourceUrl: text("cover_source_url"),
  // Shipping
  shippingLevel: text("shipping_level"), // GROUND, EXPEDITED, EXPRESS
  estimatedShipDate: timestamp("estimated_ship_date"),
  actualShipDate: timestamp("actual_ship_date"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  carrier: text("carrier"),
  // Cost
  productionCost: integer("production_cost"), // in cents
  shippingCost: integer("shipping_cost"), // in cents
  // Error handling
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  lastWebhookAt: timestamp("last_webhook_at"),
  webhookPayload: jsonb("webhook_payload"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const authorEarnings = pgTable("author_earnings", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => bookOrders.id, { onDelete: "cascade" }),
  orderItemId: integer("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id),
  // Earnings breakdown
  saleAmount: integer("sale_amount").notNull(), // in cents
  printCost: integer("print_cost").notNull().default(0), // in cents
  platformFee: integer("platform_fee").notNull(), // in cents
  netEarnings: integer("net_earnings").notNull(), // in cents
  // Payout status
  status: text("status").notNull().default("pending"), // pending, available, paid, held
  availableAt: timestamp("available_at"), // when earnings become available (after refund window)
  paidAt: timestamp("paid_at"),
  payoutId: integer("payout_id").references(() => creatorPayouts.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookReviews = pgTable("book_reviews", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => marketplaceListings.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => bookOrders.id, { onDelete: "set null" }), // verified purchase
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  content: text("content"),
  isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(false),
  helpfulCount: integer("helpful_count").notNull().default(0),
  isApproved: boolean("is_approved").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// AI Provider Usage Tracking
export const aiProviderUsage = pgTable("ai_provider_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // gemini, openai, anthropic, xai, perplexity
  model: text("model").notNull(),
  operation: text("operation").notNull(), // text_generation, image_generation, music_generation, etc.
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  costCents: integer("cost_cents").notNull().default(0), // in cents
  cached: boolean("cached").notNull().default(false),
  requestId: text("request_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas for marketplace
export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalSales: true,
  totalRevenue: true,
  averageRating: true,
  reviewCount: true,
});

export const insertBookEditionSchema = createInsertSchema(bookEditions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookOrderSchema = createInsertSchema(bookOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
  downloadCount: true,
});

export const insertLuluPrintJobSchema = createInsertSchema(luluPrintJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  retryCount: true,
});

export const insertAuthorEarningsSchema = createInsertSchema(authorEarnings).omit({
  id: true,
  createdAt: true,
});

export const insertBookReviewSchema = createInsertSchema(bookReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpfulCount: true,
});

export const insertAiProviderUsageSchema = createInsertSchema(aiProviderUsage).omit({
  id: true,
  createdAt: true,
});

// Marketplace Types
export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;
export type BookEdition = typeof bookEditions.$inferSelect;
export type InsertBookEdition = z.infer<typeof insertBookEditionSchema>;
export type BookOrder = typeof bookOrders.$inferSelect;
export type InsertBookOrder = z.infer<typeof insertBookOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type LuluPrintJob = typeof luluPrintJobs.$inferSelect;
export type InsertLuluPrintJob = z.infer<typeof insertLuluPrintJobSchema>;
export type AuthorEarnings = typeof authorEarnings.$inferSelect;
export type InsertAuthorEarnings = z.infer<typeof insertAuthorEarningsSchema>;
export type BookReview = typeof bookReviews.$inferSelect;
export type InsertBookReview = z.infer<typeof insertBookReviewSchema>;
export type AiProviderUsage = typeof aiProviderUsage.$inferSelect;
export type InsertAiProviderUsage = z.infer<typeof insertAiProviderUsageSchema>;

// ============================================================================
// WORKFLOW MARKETPLACE - Sellable automation templates with smart search
// ============================================================================

// Workflow categories for marketplace organization
export const workflowCategories = pgTable("workflow_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"), // Lucide icon name
  parentId: integer("parent_id"), // For nested categories
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Workflow templates - the sellable automation recipes
export const workflowTemplates = pgTable("workflow_templates", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => workflowCategories.id, { onDelete: "set null" }),
  
  // Basic info
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description").notNull(), // For search results
  fullDescription: text("full_description").notNull(), // Rich markdown
  thumbnailUrl: text("thumbnail_url"),
  previewVideoUrl: text("preview_video_url"),
  
  // Workflow definition
  steps: jsonb("steps").notNull(), // Array of workflow steps with prompts, actions, conditions
  estimatedDuration: integer("estimated_duration"), // Minutes to complete
  difficulty: text("difficulty").notNull().default("beginner"), // beginner, intermediate, advanced
  studioType: text("studio_type").notNull(), // book, music, video, course, image, doctrine
  
  // Smart search fields
  searchKeywords: text("search_keywords").array(), // Manually curated keywords
  aiGeneratedTags: text("ai_generated_tags").array(), // AI-extracted tags
  targetAudience: text("target_audience").array(), // Who is this for
  useCases: text("use_cases").array(), // What problems it solves
  outputTypes: text("output_types").array(), // What it produces (ebook, audiobook, etc)
  
  // Pricing & licensing
  price: integer("price").notNull().default(0), // In cents (0 = free)
  currency: text("currency").notNull().default("USD"),
  kreaiteCanUse: boolean("kreaite_can_use").notNull().default(true), // KreAIte gets perpetual license
  kreaiteFeatureLevel: text("kreaite_feature_level").default("standard"), // standard, featured, premium
  
  // Stats
  totalSales: integer("total_sales").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0),
  totalUsage: integer("total_usage").notNull().default(0), // Times used (incl free)
  averageRating: integer("average_rating"), // 1-50 (x10 for precision)
  reviewCount: integer("review_count").notNull().default(0),
  
  // Status
  status: text("status").notNull().default("draft"), // draft, pending_review, published, suspended
  isFeatured: boolean("is_featured").notNull().default(false),
  isKreaiteOfficial: boolean("is_kreaite_official").notNull().default(false), // KreAIte's own workflows
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Workflow purchases
export const workflowPurchases = pgTable("workflow_purchases", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflowTemplates.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  price: integer("price").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull().default("completed"), // pending, completed, refunded
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
});

// Workflow reviews
export const workflowReviews = pgTable("workflow_reviews", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => workflowTemplates.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  content: text("content"),
  helpfulCount: integer("helpful_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User's saved/owned workflows
export const userWorkflows = pgTable("user_workflows", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workflowId: integer("workflow_id").notNull().references(() => workflowTemplates.id, { onDelete: "cascade" }),
  purchaseId: integer("purchase_id").references(() => workflowPurchases.id, { onDelete: "set null" }),
  customizations: jsonb("customizations"), // User's modifications to the workflow
  timesUsed: integer("times_used").notNull().default(0),
  lastUsedAt: timestamp("last_used_at"),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

// Workflow step schema for validation
export const workflowStepSchema = z.object({
  id: z.string(),
  order: z.number(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["ai_prompt", "user_input", "file_upload", "api_call", "conditional", "loop", "delay"]),
  config: z.object({
    prompt: z.string().optional(), // For AI steps
    inputFields: z.array(z.object({ name: z.string(), type: z.string(), required: z.boolean() })).optional(),
    conditions: z.any().optional(), // For conditional steps
    apiEndpoint: z.string().optional(), // For API steps
  }),
  nextStepId: z.string().optional(), // For branching
  estimatedDuration: z.number().optional(), // Minutes
});

export type WorkflowStep = z.infer<typeof workflowStepSchema>;

export const insertWorkflowCategorySchema = createInsertSchema(workflowCategories).omit({ id: true, createdAt: true });
export const insertWorkflowTemplateSchema = createInsertSchema(workflowTemplates).omit({ id: true, createdAt: true, updatedAt: true, totalSales: true, totalRevenue: true, totalUsage: true, reviewCount: true });
export const insertWorkflowPurchaseSchema = createInsertSchema(workflowPurchases).omit({ id: true, purchasedAt: true });
export const insertWorkflowReviewSchema = createInsertSchema(workflowReviews).omit({ id: true, createdAt: true, updatedAt: true, helpfulCount: true });
export const insertUserWorkflowSchema = createInsertSchema(userWorkflows).omit({ id: true, addedAt: true, timesUsed: true });

export type WorkflowCategory = typeof workflowCategories.$inferSelect;
export type InsertWorkflowCategory = z.infer<typeof insertWorkflowCategorySchema>;
export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = z.infer<typeof insertWorkflowTemplateSchema>;
export type WorkflowPurchase = typeof workflowPurchases.$inferSelect;
export type InsertWorkflowPurchase = z.infer<typeof insertWorkflowPurchaseSchema>;
export type WorkflowReview = typeof workflowReviews.$inferSelect;
export type InsertWorkflowReview = z.infer<typeof insertWorkflowReviewSchema>;
export type UserWorkflow = typeof userWorkflows.$inferSelect;
export type InsertUserWorkflow = z.infer<typeof insertUserWorkflowSchema>;

// ============================================================================
// CHILDREN'S BOOK CREATION SYSTEM
// ============================================================================

// Age band configuration for children's books
export const ageBandSchema = z.enum([
  "board-book",      // 0-3 years: 50-200 words, simple concepts
  "picture-book",    // 4-8 years: 500-1000 words, illustrated
  "early-reader",    // 5-7 years: 200-1500 words, simple sentences
  "chapter-book",    // 7-10 years: 4000-15000 words
  "middle-grade",    // 8-12 years: 20000-50000 words
]);

export type AgeBand = z.infer<typeof ageBandSchema>;

// Character definition for consistent illustrations
export const childBookCharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  visualTraits: z.object({
    species: z.string(), // human, animal, fantasy creature
    age: z.string(),
    height: z.string(),
    bodyType: z.string(),
    skinTone: z.string().optional(),
    hairColor: z.string().optional(),
    hairStyle: z.string().optional(),
    eyeColor: z.string().optional(),
    clothingStyle: z.string(),
    distinctiveFeatures: z.array(z.string()),
  }),
  personalityTraits: z.array(z.string()),
  role: z.enum(["protagonist", "sidekick", "mentor", "antagonist", "supporting"]),
  illustrationPrompt: z.string(), // AI-generated consistent prompt
  colorPalette: z.array(z.string()), // Hex colors for this character
});

export type ChildBookCharacter = z.infer<typeof childBookCharacterSchema>;

// Page spread layout options
export const pageLayoutSchema = z.enum([
  "full-bleed-illustration",     // Full page image
  "illustration-left-text-right", // Split layout
  "illustration-right-text-left", // Split layout
  "text-over-illustration",       // Text overlays image
  "illustration-top-text-bottom", // Vertical split
  "text-top-illustration-bottom", // Vertical split
  "centered-vignette",           // Small centered illustration
  "spread-illustration",         // Illustration spans 2 pages
  "text-only",                   // Text page only
]);

export type PageLayout = z.infer<typeof pageLayoutSchema>;

// Single page spread in children's book
export const childBookSpreadSchema = z.object({
  id: z.string(),
  pageNumber: z.number(),
  layout: pageLayoutSchema,
  text: z.string(),
  readAloudText: z.string().optional(), // With phonetic hints
  syllableCount: z.number().optional(),
  rhymeScheme: z.string().optional(),
  illustrationPrompt: z.string(),
  illustrationUrl: z.string().optional(),
  characterIds: z.array(z.string()), // Characters appearing on this page
  emotionalTone: z.string().optional(), // happy, scary, mysterious, etc.
  actionDescription: z.string().optional(),
});

export type ChildBookSpread = z.infer<typeof childBookSpreadSchema>;

// Moral/theme options for children's books
export const childBookThemeSchema = z.enum([
  "friendship",
  "kindness",
  "courage",
  "honesty",
  "sharing",
  "perseverance",
  "self-confidence",
  "empathy",
  "family-love",
  "accepting-differences",
  "handling-emotions",
  "trying-new-things",
  "problem-solving",
  "environmental-care",
  "gratitude",
  "patience",
  "teamwork",
  "creativity",
  "dealing-with-loss",
  "overcoming-fear",
]);

export type ChildBookTheme = z.infer<typeof childBookThemeSchema>;

// Educational alignment tags
export const educationalTagSchema = z.enum([
  "social-emotional-learning",
  "early-literacy",
  "counting-numbers",
  "colors-shapes",
  "alphabet-phonics",
  "rhyming-patterns",
  "vocabulary-building",
  "science-nature",
  "cultural-awareness",
  "problem-solving-skills",
  "motor-skills",
  "sensory-exploration",
]);

export type EducationalTag = z.infer<typeof educationalTagSchema>;

// Illustration style presets
export const illustrationStyleSchema = z.enum([
  "whimsical-watercolor",
  "bold-cartoon",
  "soft-pastel",
  "digital-modern",
  "classic-storybook",
  "collage-mixed-media",
  "minimalist-nordic",
  "vibrant-tropical",
  "cozy-handdrawn",
  "retro-vintage",
  "anime-influenced",
  "realistic-detailed",
]);

export type IllustrationStyle = z.infer<typeof illustrationStyleSchema>;

// Complete children's book project
export const childBookProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  authorName: z.string(),
  illustratorName: z.string().optional(),
  ageBand: ageBandSchema,
  themes: z.array(childBookThemeSchema),
  educationalTags: z.array(educationalTagSchema),
  illustrationStyle: illustrationStyleSchema,
  storyPremise: z.string(),
  characters: z.array(childBookCharacterSchema),
  spreads: z.array(childBookSpreadSchema),
  rhymingMode: z.boolean(),
  targetWordCount: z.number(),
  trimSize: z.string(),
  colorPalette: z.array(z.string()),
  coverImageUrl: z.string().optional(),
  backCoverImageUrl: z.string().optional(),
  dedication: z.string().optional(),
  aboutAuthorPage: z.string().optional(),
});

export type ChildBookProject = z.infer<typeof childBookProjectSchema>;

// Request schemas for API endpoints
export const generateChildStoryRequestSchema = z.object({
  ageBand: ageBandSchema,
  themes: z.array(childBookThemeSchema),
  educationalTags: z.array(educationalTagSchema).optional(),
  mainCharacter: z.object({
    name: z.string(),
    species: z.string(),
    traits: z.array(z.string()),
  }),
  storyPremise: z.string(),
  rhymingMode: z.boolean().optional(),
  targetPageCount: z.number().optional(),
  illustrationStyle: illustrationStyleSchema.optional(),
});

export type GenerateChildStoryRequest = z.infer<typeof generateChildStoryRequestSchema>;

export const generateCharacterPromptRequestSchema = z.object({
  character: childBookCharacterSchema,
  illustrationStyle: illustrationStyleSchema,
  consistencySeed: z.string().optional(),
});

export type GenerateCharacterPromptRequest = z.infer<typeof generateCharacterPromptRequestSchema>;

export const generatePageIllustrationRequestSchema = z.object({
  spread: childBookSpreadSchema,
  characters: z.array(childBookCharacterSchema),
  illustrationStyle: illustrationStyleSchema,
  projectColorPalette: z.array(z.string()).optional(),
});

export type GeneratePageIllustrationRequest = z.infer<typeof generatePageIllustrationRequestSchema>;

// Rhyme conversion request schema
export const rhymeConvertRequestSchema = z.object({
  text: z.string().min(1, "Text is required"),
  ageBand: ageBandSchema,
  rhymeScheme: z.enum(["AABB", "ABAB", "ABCB"]).optional().default("AABB"),
});

export type RhymeConvertRequest = z.infer<typeof rhymeConvertRequestSchema>;

// Read-aloud analysis request schema
export const readAloudAnalyzeRequestSchema = z.object({
  text: z.string().min(1, "Text is required"),
  ageBand: ageBandSchema,
});

export type ReadAloudAnalyzeRequest = z.infer<typeof readAloudAnalyzeRequestSchema>;

// ============================================================================
// ULTRA-PREMIUM CREATOR GRAPH - Cross-Studio Orchestration
// ============================================================================

// Voice Cloning Library - Reusable cloned voices across all projects
export const voiceClones = pgTable("voice_clones", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  voiceType: text("voice_type").notNull(), // custom, celebrity_style, character
  gender: text("gender"), // male, female, neutral
  ageRange: text("age_range"), // child, teen, adult, senior
  accent: text("accent"), // american, british, australian, etc.
  sourceAudioUrl: text("source_audio_url"), // 10+ seconds of source audio
  voiceModelId: text("voice_model_id"), // Google TTS or cloned model ID
  previewAudioUrl: text("preview_audio_url"),
  styleSettings: jsonb("style_settings"), // pitch, rate, emotion presets
  isPublic: boolean("is_public").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  status: text("status").notNull().default("processing"), // processing, ready, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Movie Production Pipeline
export const movieProjects = pgTable("movie_projects", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  logline: text("logline"), // One-sentence summary
  synopsis: text("synopsis"),
  genre: text("genre").notNull(), // action, comedy, horror, romance, scifi, thriller
  targetDuration: integer("target_duration"), // minutes
  aspectRatio: text("aspect_ratio").notNull().default("16:9"),
  style: text("style"), // cinematic, anime, realistic, noir, etc.
  coverImageUrl: text("cover_image_url"),
  trailerUrl: text("trailer_url"),
  status: text("status").notNull().default("development"), // development, pre_production, production, post_production, completed
  totalScenes: integer("total_scenes").notNull().default(0),
  completedScenes: integer("completed_scenes").notNull().default(0),
  estimatedCost: integer("estimated_cost"), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Movie Characters with voice assignments
export const movieCharacters = pgTable("movie_characters", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id").notNull().references(() => movieProjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(), // protagonist, antagonist, supporting, extra
  description: text("description"),
  appearance: text("appearance"), // Visual description for AI image generation
  personality: text("personality"),
  voiceCloneId: integer("voice_clone_id").references(() => voiceClones.id, { onDelete: "set null" }),
  voiceStyle: text("voice_style"), // hero, villain, sidekick, etc.
  referenceImageUrl: text("reference_image_url"),
  aiGeneratedImageUrl: text("ai_generated_image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Movie Scenes with dialogue
export const movieScenes = pgTable("movie_scenes", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id").notNull().references(() => movieProjects.id, { onDelete: "cascade" }),
  sceneNumber: integer("scene_number").notNull(),
  title: text("title").notNull(),
  setting: text("setting").notNull(), // Location description
  timeOfDay: text("time_of_day"), // day, night, dawn, dusk
  mood: text("mood"), // tense, romantic, comedic, scary
  description: text("description"),
  cameraAngles: text("camera_angles").array(),
  duration: integer("duration"), // seconds
  status: text("status").notNull().default("scripted"), // scripted, storyboarded, rendering, completed
  // Generated assets
  storyboardUrls: text("storyboard_urls").array(),
  videoUrl: text("video_url"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Scene Dialogue with multi-character support
export const sceneDialogue = pgTable("scene_dialogue", {
  id: serial("id").primaryKey(),
  sceneId: integer("scene_id").notNull().references(() => movieScenes.id, { onDelete: "cascade" }),
  characterId: integer("character_id").notNull().references(() => movieCharacters.id, { onDelete: "cascade" }),
  lineNumber: integer("line_number").notNull(),
  dialogueText: text("dialogue_text").notNull(),
  emotion: text("emotion"), // angry, sad, happy, sarcastic, etc.
  direction: text("direction"), // Acting/delivery direction
  synthesizedAudioUrl: text("synthesized_audio_url"),
  duration: integer("duration"), // milliseconds
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Audiobook Production System
export const audiobookProjects = pgTable("audiobook_projects", {
  id: serial("id").primaryKey(),
  sourceProjectId: integer("source_project_id").references(() => publishingProjects.id, { onDelete: "set null" }),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author"),
  narratorVoiceId: integer("narrator_voice_id").references(() => voiceClones.id, { onDelete: "set null" }),
  narratorName: text("narrator_name"),
  totalChapters: integer("total_chapters").notNull().default(0),
  completedChapters: integer("completed_chapters").notNull().default(0),
  totalDuration: integer("total_duration"), // seconds
  estimatedCost: integer("estimated_cost"), // in cents
  coverImageUrl: text("cover_image_url"),
  status: text("status").notNull().default("setup"), // setup, narrating, mastering, completed
  // Mastering settings
  masteringPreset: text("mastering_preset"), // podcast, audiobook, broadcast
  noiseReduction: boolean("noise_reduction").notNull().default(true),
  loudnessNormalization: boolean("loudness_normalization").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const audiobookChapters = pgTable("audiobook_chapters", {
  id: serial("id").primaryKey(),
  audiobookId: integer("audiobook_id").notNull().references(() => audiobookProjects.id, { onDelete: "cascade" }),
  sourceChapterId: integer("source_chapter_id").references(() => manuscriptChapters.id, { onDelete: "set null" }),
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  textContent: text("text_content"),
  wordCount: integer("word_count"),
  estimatedDuration: integer("estimated_duration"), // seconds
  actualDuration: integer("actual_duration"), // seconds
  rawAudioUrl: text("raw_audio_url"),
  masteredAudioUrl: text("mastered_audio_url"),
  status: text("status").notNull().default("pending"), // pending, synthesizing, mastering, completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// DJ/Mixing Studio Presets
export const djPresets = pgTable("dj_presets", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(), // eq, compressor, effects, mastering, scratch
  settings: jsonb("settings").notNull(), // Full preset configuration
  isPublic: boolean("is_public").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Cross-Studio Workflow Orchestration
export const creatorWorkflows = pgTable("creator_workflows", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  workflowType: text("workflow_type").notNull(), // book_to_audiobook, book_to_course, movie_production, music_to_video
  status: text("status").notNull().default("active"), // active, paused, completed
  // Source references
  sourceType: text("source_type"), // publishing_project, music_project, movie_project
  sourceId: integer("source_id"),
  // Pipeline configuration
  steps: jsonb("steps").notNull(), // Array of workflow step definitions
  currentStepIndex: integer("current_step_index").notNull().default(0),
  completedSteps: integer("completed_steps").array(),
  // Output references
  outputs: jsonb("outputs"), // Map of output type to IDs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workflowJobs = pgTable("workflow_jobs", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull().references(() => creatorWorkflows.id, { onDelete: "cascade" }),
  stepIndex: integer("step_index").notNull(),
  jobType: text("job_type").notNull(), // ai_generation, tts_synthesis, video_render, export
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  progress: integer("progress").notNull().default(0), // 0-100
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Google Classroom Integration
export const classroomCourses = pgTable("classroom_courses", {
  id: serial("id").primaryKey(),
  creatorCourseId: integer("creator_course_id").notNull().references(() => creatorCourses.id, { onDelete: "cascade" }),
  googleCourseId: text("google_course_id").notNull(),
  googleCourseLink: text("google_course_link"),
  enrollmentCode: text("enrollment_code"),
  syncStatus: text("sync_status").notNull().default("pending"), // pending, synced, error
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const classroomAssignments = pgTable("classroom_assignments", {
  id: serial("id").primaryKey(),
  classroomCourseId: integer("classroom_course_id").notNull().references(() => classroomCourses.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").references(() => creatorCourseLessons.id, { onDelete: "set null" }),
  googleAssignmentId: text("google_assignment_id"),
  googleFormId: text("google_form_id"), // For quizzes
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  maxPoints: integer("max_points"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// MEDIA STUDIO - PROJECTS & ASSETS
// ============================================================================

export const mediaProjects = pgTable("media_projects", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  mode: text("mode").notNull().default("image"), // 'image' or 'video'
  projectData: jsonb("project_data"), // Full project state (layers, clips, etc.)
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // For video projects, in seconds
  width: integer("width"),
  height: integer("height"),
  status: text("status").notNull().default("draft"), // draft, rendering, completed
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const mediaAssets = pgTable("media_assets", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => mediaProjects.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'image', 'video', 'audio'
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // For video/audio
  width: integer("width"),
  height: integer("height"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMediaProjectSchema = createInsertSchema(mediaProjects).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMediaProject = z.infer<typeof insertMediaProjectSchema>;
export type MediaProject = typeof mediaProjects.$inferSelect;

export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({ id: true, createdAt: true });
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;
export type MediaAsset = typeof mediaAssets.$inferSelect;

// ============================================================================
// BOOK STUDIO - IMAGE ASSETS
// ============================================================================

export const bookImageAssets = pgTable("book_image_assets", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  origin: text("origin").notNull().default("uploaded"), // 'uploaded', 'generated'
  purpose: text("purpose").notNull().default("illustration"), // 'cover', 'illustration', 'diagram', 'photo'
  prompt: text("prompt"), // For AI generated images
  style: text("style"), // 'realistic', 'illustrated', 'artistic', 'photographic'
  chapterIndex: integer("chapter_index"), // Optional chapter association
  originalUrl: text("original_url").notNull(),
  editedUrl: text("edited_url"), // After editing in MediaStudio
  noBgUrl: text("no_bg_url"), // After background removal
  kdpUrl: text("kdp_url"), // After KDP formatting (300 DPI, proper dimensions)
  width: integer("width"),
  height: integer("height"),
  dpi: integer("dpi"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  kdpSpec: text("kdp_spec"), // '6x9', '8.5x11', 'full-page', 'half-page', 'spot'
  status: text("status").notNull().default("ready"), // 'ready', 'processing', 'error'
  metadata: jsonb("metadata"), // Additional metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookImageAssetSchema = createInsertSchema(bookImageAssets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBookImageAsset = z.infer<typeof insertBookImageAssetSchema>;
export type BookImageAsset = typeof bookImageAssets.$inferSelect;

// ============================================================================
// BOOK STUDIO - PROJECTS (Save & Resume)
// ============================================================================

export const bookProjects = pgTable("book_projects", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  authorName: text("author_name"),
  genre: text("genre").default("memoir"),
  targetAudience: text("target_audience"),
  manuscriptHtml: text("manuscript_html"), // Full TipTap HTML content
  manuscriptText: text("manuscript_text"), // Plain text for analysis
  wordCount: integer("word_count").default(0),
  pageCount: integer("page_count").default(0),
  chapterCount: integer("chapter_count").default(0),
  currentStep: integer("current_step").default(1), // 1-6 steps in BookStudio
  trimSize: text("trim_size").default("6x9"), // '6x9', '5x8', '8.5x11'
  fontSize: integer("font_size").default(11),
  fontFamily: text("font_family").default("Garamond"),
  marginInner: real("margin_inner").default(0.75), // inches
  marginOuter: real("margin_outer").default(0.5),
  marginTop: real("margin_top").default(0.75),
  marginBottom: real("margin_bottom").default(0.75),
  hasFrontMatter: boolean("has_front_matter").default(false),
  hasBackMatter: boolean("has_back_matter").default(false),
  readinessScore: integer("readiness_score").default(0), // 0-100
  coverImageUrl: text("cover_image_url"),
  spineWidth: real("spine_width"), // Calculated from page count
  status: text("status").notNull().default("draft"), // draft, in_progress, ready, published
  chatHistory: jsonb("chat_history"), // Last 20 AI chat messages for session continuity
  // AI Learning System - Gets smarter with every conversation
  aiKnowledge: jsonb("ai_knowledge"), // Extracted facts: {characters: [], plotPoints: [], themes: [], issues: [], goals: []}
  conversationSummary: text("conversation_summary"), // Rolling summary of all past AI conversations
  authorPreferences: jsonb("author_preferences"), // Learned author style: {tone, pacing, avoidTopics, writingHabits}
  knowledgeVersion: integer("knowledge_version").default(0), // Tracks when knowledge was last updated
  lastEditedAt: timestamp("last_edited_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookProjectSections = pgTable("book_project_sections", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => bookProjects.id, { onDelete: "cascade" }),
  sectionNumber: integer("section_number").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull().default("chapter"), // 'dedication', 'foreword', 'introduction', 'chapter', 'epilogue', 'acknowledgments', 'about'
  content: text("content"), // Section HTML content
  wordCount: integer("word_count").default(0),
  startPage: integer("start_page"),
  endPage: integer("end_page"),
  summary: text("summary"), // AI-generated summary
  suggestedImages: integer("suggested_images").default(0), // AI suggestion count
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bookImagePlacements = pgTable("book_image_placements", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => bookProjects.id, { onDelete: "cascade" }),
  imageAssetId: integer("image_asset_id").references(() => bookImageAssets.id, { onDelete: "set null" }),
  sectionId: integer("section_id").references(() => bookProjectSections.id, { onDelete: "set null" }),
  placementMode: text("placement_mode").notNull().default("manual"), // 'auto', 'manual', 'hybrid'
  anchorType: text("anchor_type").notNull().default("after_paragraph"), // 'start_of_chapter', 'after_paragraph', 'page_break', 'inline'
  anchorOffset: integer("anchor_offset").default(0), // Paragraph number or character offset
  pageNumber: integer("page_number"), // Calculated page position
  positionX: real("position_x").default(0), // 0-1 relative position
  positionY: real("position_y").default(0),
  width: real("width").default(1), // 0-1 relative to column width
  height: real("height"), // Auto or fixed
  caption: text("caption"),
  alignment: text("alignment").default("center"), // 'left', 'center', 'right', 'full-bleed'
  isApproved: boolean("is_approved").default(false), // For hybrid mode
  aiSuggestionReason: text("ai_suggestion_reason"), // Why AI suggested this placement
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookProjectSchema = createInsertSchema(bookProjects).omit({ id: true, createdAt: true, lastEditedAt: true });
export type InsertBookProject = z.infer<typeof insertBookProjectSchema>;
export type BookProject = typeof bookProjects.$inferSelect;

export const insertBookProjectSectionSchema = createInsertSchema(bookProjectSections).omit({ id: true, createdAt: true });
export type InsertBookProjectSection = z.infer<typeof insertBookProjectSectionSchema>;
export type BookProjectSection = typeof bookProjectSections.$inferSelect;

export const insertBookImagePlacementSchema = createInsertSchema(bookImagePlacements).omit({ id: true, createdAt: true });
export type InsertBookImagePlacement = z.infer<typeof insertBookImagePlacementSchema>;
export type BookImagePlacement = typeof bookImagePlacements.$inferSelect;

// ============================================================================
// LULU PUBLISHING - Print-on-Demand Integration
// ============================================================================

// Book Publishing Projects - Links to Lulu print jobs
export const bookPublishingProjects = pgTable("book_publishing_projects", {
  id: serial("id").primaryKey(),
  bookProjectId: integer("book_project_id").notNull().references(() => bookProjects.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Template selection
  templateId: text("template_id"), // From BOOK_TEMPLATES
  customPodPackageId: text("custom_pod_package_id"), // Custom configuration
  
  // Print specifications
  trimSizeCode: text("trim_size_code").notNull(), // e.g., '0600X0900'
  trimSizeName: text("trim_size_name"), // e.g., 'US Trade'
  bindingType: text("binding_type").notNull().default("PB"), // PB, CW, DJ, CO, SS, LW
  printType: text("print_type").notNull().default("BW"), // BW, FC, PC
  paperType: text("paper_type").notNull().default("060UC444"),
  coverFinish: text("cover_finish").notNull().default("M"), // M, G
  pageCount: integer("page_count").notNull(),
  
  // Files
  interiorPdfUrl: text("interior_pdf_url"),
  coverPdfUrl: text("cover_pdf_url"),
  interiorFileStatus: text("interior_file_status").default("pending"), // pending, uploaded, validated, error
  coverFileStatus: text("cover_file_status").default("pending"),
  validationErrors: jsonb("validation_errors").default([]),
  
  // Cover specifications (from Lulu API)
  coverWidth: real("cover_width"), // inches
  coverHeight: real("cover_height"),
  spineWidth: real("spine_width"),
  bleed: real("bleed"),
  safetyMargin: real("safety_margin"),
  
  // ISBN & Publishing Details
  isbn: text("isbn"),
  isbnBarcode: boolean("isbn_barcode").default(true),
  publisherName: text("publisher_name").default("Stroke Lyfe Publishing"),
  copyrightYear: integer("copyright_year"),
  edition: text("edition"),
  
  // Pricing
  estimatedPrintCost: integer("estimated_print_cost"), // cents per unit
  retailPrice: integer("retail_price"), // cents
  wholesalePrice: integer("wholesale_price"), // cents
  royalty: integer("royalty"), // cents per sale
  currency: text("currency").default("USD"),
  
  // Distribution
  distributionChannels: text("distribution_channels").array().default([]),
  amazonListing: boolean("amazon_listing").default(false),
  luluStoreListing: boolean("lulu_store_listing").default(false),
  ingramDistribution: boolean("ingram_distribution").default(false),
  
  // Status
  status: text("status").notNull().default("draft"), // draft, files_uploaded, validated, ready, published, error
  publishedAt: timestamp("published_at"),
  luluProductId: text("lulu_product_id"), // Lulu's product ID once published
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Lulu Webhooks - Track webhook configurations
export const luluWebhooks = pgTable("lulu_webhooks", {
  id: serial("id").primaryKey(),
  luluWebhookId: text("lulu_webhook_id").notNull().unique(),
  callbackUrl: text("callback_url").notNull(),
  events: text("events").array().notNull(),
  signingKey: text("signing_key"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Book Cover Designs - Store cover design iterations
export const bookCoverDesigns = pgTable("book_cover_designs", {
  id: serial("id").primaryKey(),
  publishingProjectId: integer("publishing_project_id").notNull().references(() => bookPublishingProjects.id, { onDelete: "cascade" }),
  
  // Design metadata
  name: text("name").notNull().default("Untitled Design"),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").default(false), // Currently selected design
  
  // Cover elements
  frontCoverImageUrl: text("front_cover_image_url"),
  backCoverImageUrl: text("back_cover_image_url"),
  spineImageUrl: text("spine_image_url"),
  fullWrapImageUrl: text("full_wrap_image_url"), // Combined cover
  
  // Design data (for editor)
  designData: jsonb("design_data").default({}), // Canvas/editor state
  backgroundColor: text("background_color"),
  titleText: text("title_text"),
  subtitleText: text("subtitle_text"),
  authorText: text("author_text"),
  spineText: text("spine_text"),
  backCoverText: text("back_cover_text"),
  
  // Fonts and styling
  titleFont: text("title_font"),
  titleColor: text("title_color"),
  authorFont: text("author_font"),
  authorColor: text("author_color"),
  
  // Generation
  aiGenerated: boolean("ai_generated").default(false),
  aiPrompt: text("ai_prompt"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas for Lulu Publishing
export const insertBookPublishingProjectSchema = createInsertSchema(bookPublishingProjects).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBookPublishingProject = z.infer<typeof insertBookPublishingProjectSchema>;
export type BookPublishingProject = typeof bookPublishingProjects.$inferSelect;

export const insertLuluWebhookSchema = createInsertSchema(luluWebhooks).omit({ id: true, createdAt: true });
export type InsertLuluWebhook = z.infer<typeof insertLuluWebhookSchema>;
export type LuluWebhook = typeof luluWebhooks.$inferSelect;

export const insertBookCoverDesignSchema = createInsertSchema(bookCoverDesigns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBookCoverDesign = z.infer<typeof insertBookCoverDesignSchema>;
export type BookCoverDesign = typeof bookCoverDesigns.$inferSelect;

// Insert schemas for ultra-premium features
export const insertVoiceCloneSchema = createInsertSchema(voiceClones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export const insertMovieProjectSchema = createInsertSchema(movieProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalScenes: true,
  completedScenes: true,
});

export const insertMovieCharacterSchema = createInsertSchema(movieCharacters).omit({
  id: true,
  createdAt: true,
});

export const insertMovieSceneSchema = createInsertSchema(movieScenes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSceneDialogueSchema = createInsertSchema(sceneDialogue).omit({
  id: true,
  createdAt: true,
});

export const insertAudiobookProjectSchema = createInsertSchema(audiobookProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalChapters: true,
  completedChapters: true,
});

export const insertAudiobookChapterSchema = createInsertSchema(audiobookChapters).omit({
  id: true,
  createdAt: true,
});

export const insertDjPresetSchema = createInsertSchema(djPresets).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export const insertCreatorWorkflowSchema = createInsertSchema(creatorWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentStepIndex: true,
});

export const insertWorkflowJobSchema = createInsertSchema(workflowJobs).omit({
  id: true,
  createdAt: true,
  progress: true,
});

export const insertClassroomCourseSchema = createInsertSchema(classroomCourses).omit({
  id: true,
  createdAt: true,
});

export const insertClassroomAssignmentSchema = createInsertSchema(classroomAssignments).omit({
  id: true,
  createdAt: true,
});

// ============================================================================
// CREDIT & BILLING SYSTEM - Enterprise Monetization
// ============================================================================

// Subscription tiers with feature limits (preserves existing columns + new billing columns)
export const subscriptionTiers = pgTable("subscription_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull().default(""),
  monthlyPrice: integer("monthly_price").notNull().default(0),
  annualPrice: integer("annual_price").notNull().default(0),
  stripePriceIdMonthly: text("stripe_price_id_monthly"),
  stripePriceIdAnnual: text("stripe_price_id_annual"),
  stripeProductId: text("stripe_product_id"),
  features: jsonb("features").notNull().default({}),
  limits: jsonb("limits").notNull().default({}),
  // New billing columns
  monthlyCredits: integer("monthly_credits").notNull().default(0),
  maxProjects: integer("max_projects"),
  maxStorageGb: integer("max_storage_gb"),
  maxTeamMembers: integer("max_team_members").default(1),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Feature gates - defines what each tier can access
export const featureGates = pgTable("feature_gates", {
  id: serial("id").primaryKey(),
  featureKey: text("feature_key").notNull(),
  featureName: text("feature_name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  creditCost: integer("credit_cost").notNull().default(1),
  minTier: text("min_tier").notNull().default("free"),
  limitType: text("limit_type").notNull().default("per_use"),
  dailyLimit: integer("daily_limit"),
  monthlyLimit: integer("monthly_limit"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User credit wallets
export const creditWallets = pgTable("credit_wallets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  balance: integer("balance").notNull().default(0),
  bonusCredits: integer("bonus_credits").notNull().default(0),
  lifetimeEarned: integer("lifetime_earned").notNull().default(0),
  lifetimeSpent: integer("lifetime_spent").notNull().default(0),
  lastRefillAt: timestamp("last_refill_at"),
  nextRefillAt: timestamp("next_refill_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Prize entitlements for gaming rewards (non-credit prizes)
export const prizeEntitlements = pgTable("prize_entitlements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  prizeType: text("prize_type").notNull(), // 'free_song', 'course_access', 'book_template', 'image_credits', 'video_template'
  prizeValue: text("prize_value").notNull(), // The specific item or amount
  source: text("source").notNull(), // 'slot_win', 'daily_spin', 'staring_contest', 'promotion'
  sourceId: text("source_id"), // Reference to game session/spin
  status: text("status").notNull().default("available"), // 'available', 'redeemed', 'expired'
  redeemedAt: timestamp("redeemed_at"),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_prize_entitlements_user").on(table.userId),
  index("idx_prize_entitlements_status").on(table.status),
]);

// Credit transactions ledger
export const creditLedger = pgTable("credit_ledger", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  transactionType: text("transaction_type").notNull(),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  description: text("description"),
  featureKey: text("feature_key"),
  referenceType: text("reference_type"),
  referenceId: text("reference_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_credit_ledger_user").on(table.userId),
  index("idx_credit_ledger_created").on(table.createdAt),
]);

// Usage events for analytics
export const usageEvents = pgTable("usage_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  featureKey: text("feature_key").notNull(),
  studioType: text("studio_type"),
  creditsCost: integer("credits_cost").notNull().default(0),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  durationMs: integer("duration_ms"),
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_usage_events_user").on(table.userId),
  index("idx_usage_events_feature").on(table.featureKey),
  index("idx_usage_events_created").on(table.createdAt),
]);

// Credit packages for purchase
export const creditPackages = pgTable("credit_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  credits: integer("credits").notNull(),
  priceUsd: integer("price_usd").notNull(),
  stripePriceId: text("stripe_price_id"),
  bonusPercent: integer("bonus_percent").default(0),
  isPopular: boolean("is_popular").default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Revenue events for tracking all payments and subscription revenue
export const revenueEvents = pgTable("revenue_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  stripeEventId: text("stripe_event_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  eventType: text("event_type").notNull(), // subscription_new, subscription_renewal, subscription_cancel, credit_purchase, marketplace_sale
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  netAmountCents: integer("net_amount_cents"), // After Stripe fees
  platformFeeCents: integer("platform_fee_cents"), // 15% platform cut for marketplace
  creatorPayoutCents: integer("creator_payout_cents"), // 85% creator cut for marketplace
  creatorId: varchar("creator_id").references(() => users.id), // For marketplace sales
  productType: text("product_type"), // subscription, credits, book, course, template
  productId: text("product_id"), // Reference to the product sold
  tierName: text("tier_name"), // For subscriptions
  creditsGranted: integer("credits_granted"), // Credits added from this payment
  billingPeriod: text("billing_period"), // monthly, annual
  status: text("status").notNull().default("succeeded"), // succeeded, pending, failed, refunded
  refundedAt: timestamp("refunded_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_revenue_events_user").on(table.userId),
  index("idx_revenue_events_created").on(table.createdAt),
  index("idx_revenue_events_type").on(table.eventType),
  index("idx_revenue_events_stripe").on(table.stripeEventId),
]);

// User subscription history for tracking renewals
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tierId: integer("tier_id").references(() => subscriptionTiers.id),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").notNull().default("active"), // active, past_due, canceled, paused
  billingPeriod: text("billing_period").notNull().default("monthly"), // monthly, annual
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),
  lastCreditGrantAt: timestamp("last_credit_grant_at"),
  monthlyCreditsQuota: integer("monthly_credits_quota").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_user_subscriptions_user").on(table.userId),
  index("idx_user_subscriptions_stripe").on(table.stripeSubscriptionId),
]);

// ============================================================================
// TEMPLATE LIBRARY SYSTEM
// ============================================================================

export const studioTemplates = pgTable("studio_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  studioType: text("studio_type").notNull(),
  category: text("category").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  templateData: jsonb("template_data").notNull(),
  isPremium: boolean("is_premium").notNull().default(false),
  isOfficial: boolean("is_official").notNull().default(false),
  creatorId: varchar("creator_id").references(() => users.id),
  usageCount: integer("usage_count").notNull().default(0),
  rating: integer("rating").default(0),
  tags: text("tags").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// VERSION HISTORY SYSTEM
// ============================================================================

export const projectVersions = pgTable("project_versions", {
  id: serial("id").primaryKey(),
  projectType: text("project_type").notNull(),
  projectId: integer("project_id").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  snapshotData: jsonb("snapshot_data").notNull(),
  changeDescription: text("change_description"),
  isAutoSave: boolean("is_auto_save").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_project_versions_project").on(table.projectType, table.projectId),
]);

// ============================================================================
// WORKSPACES & COLLABORATION
// ============================================================================

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  logoUrl: text("logo_url"),
  description: text("description"),
  settings: jsonb("settings").default({}),
  tierId: integer("tier_id").references(() => subscriptionTiers.id),
  stripeSubscriptionId: text("stripe_subscription_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaceMembers = pgTable("workspace_members", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  permissions: jsonb("permissions").default({}),
  invitedBy: varchar("invited_by").references(() => users.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const brandKits = pgTable("brand_kits", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  accentColor: text("accent_color"),
  fonts: jsonb("fonts").default({}),
  logos: jsonb("logos").default([]),
  guidelines: text("guidelines"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// MARKETPLACE ENHANCEMENTS
// ============================================================================

export const creatorStorefronts = pgTable("creator_storefronts", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  tagline: text("tagline"),
  bio: text("bio"),
  bannerUrl: text("banner_url"),
  logoUrl: text("logo_url"),
  theme: jsonb("theme").default({}),
  socialLinks: jsonb("social_links").default({}),
  customDomain: text("custom_domain"),
  isVerified: boolean("is_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productBundles = pgTable("product_bundles", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  productIds: integer("product_ids").array().notNull(),
  originalPrice: integer("original_price").notNull(),
  bundlePrice: integer("bundle_price").notNull(),
  stripePriceId: text("stripe_price_id"),
  isActive: boolean("is_active").notNull().default(true),
  salesCount: integer("sales_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const affiliateLinks = pgTable("affiliate_links", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id"),
  code: text("code").notNull().unique(),
  commissionPercent: integer("commission_percent").notNull().default(20),
  clickCount: integer("click_count").notNull().default(0),
  conversionCount: integer("conversion_count").notNull().default(0),
  totalEarnings: integer("total_earnings").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creatorAnalytics = pgTable("creator_analytics", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  views: integer("views").notNull().default(0),
  sales: integer("sales").notNull().default(0),
  revenue: integer("revenue").notNull().default(0),
  newFollowers: integer("new_followers").notNull().default(0),
  productViews: jsonb("product_views").default({}),
  trafficSources: jsonb("traffic_sources").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_creator_analytics_date").on(table.creatorId, table.date),
]);

// ============================================================================
// CREATOR PROFILES & PUBLISHING PRESETS (Stickiness Features)
// ============================================================================

// Author profiles - reusable across books
export const authorProfiles = pgTable("author_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  penName: text("pen_name").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  bio: text("bio"),
  shortBio: text("short_bio"),
  photoUrl: text("photo_url"),
  websiteUrl: text("website_url"),
  socialLinks: jsonb("social_links").default({}),
  genres: text("genres").array(),
  otherBooks: jsonb("other_books").default([]),
  publisherInfo: jsonb("publisher_info").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Publishing presets - saved formatting settings
export const publishingPresets = pgTable("publishing_presets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  presetType: text("preset_type").notNull().default("book"),
  isDefault: boolean("is_default").notNull().default(false),
  trimSize: text("trim_size"),
  paperType: text("paper_type"),
  fontFamily: text("font_family"),
  fontSize: integer("font_size"),
  lineSpacing: real("line_spacing"),
  marginInside: real("margin_inside"),
  marginOutside: real("margin_outside"),
  marginTopBottom: real("margin_top_bottom"),
  hasBleed: boolean("has_bleed").default(false),
  includePageNumbers: boolean("include_page_numbers").default(true),
  includeHeaders: boolean("include_headers").default(true),
  chapterBreakStyle: text("chapter_break_style"),
  frontMatterDefaults: jsonb("front_matter_defaults").default({}),
  backMatterDefaults: jsonb("back_matter_defaults").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Course presets - saved course creation settings
export const coursePresets = pgTable("course_presets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  lessonDuration: integer("lesson_duration"),
  quizSettings: jsonb("quiz_settings").default({}),
  certificateTemplate: text("certificate_template"),
  brandingColors: jsonb("branding_colors").default({}),
  introVideoTemplate: text("intro_video_template"),
  outroVideoTemplate: text("outro_video_template"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Saved cover designs - reusable covers and templates
export const savedCoverDesigns = pgTable("saved_cover_designs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  designData: jsonb("design_data").notNull(),
  designType: text("design_type").notNull().default("book_cover"),
  isTemplate: boolean("is_template").notNull().default(false),
  category: text("category"),
  tags: text("tags").array(),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Inspiration library - uploaded reference images
export const inspirationLibrary = pgTable("inspiration_library", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  title: text("title"),
  notes: text("notes"),
  category: text("category"),
  tags: text("tags").array(),
  colorPalette: jsonb("color_palette").default([]),
  styleAttributes: jsonb("style_attributes").default({}),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// PROJECT NOTES SYSTEM (Annotations for Book/Course Projects)
// ============================================================================

export const projectNotes = pgTable("project_notes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => publishingProjects.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id").references(() => manuscriptChapters.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  noteType: text("note_type").notNull().default("general"), // planning, research, revision, feedback, general
  content: text("content").notNull(),
  status: text("status").notNull().default("open"), // open, resolved, archived
  priority: text("priority").default("normal"), // low, normal, high
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  index("idx_notes_project").on(table.projectId),
  index("idx_notes_chapter").on(table.chapterId),
]);

// ============================================================================
// DOCTRINE OUTLINES (Optional Structured Knowledge for Projects)
// ============================================================================

export const doctrineOutlines = pgTable("doctrine_outlines", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => publishingProjects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const doctrineNodes = pgTable("doctrine_nodes", {
  id: serial("id").primaryKey(),
  outlineId: integer("outline_id").notNull().references(() => doctrineOutlines.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"), // Self-reference for tree structure
  chapterId: integer("chapter_id").references(() => manuscriptChapters.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  content: text("content"),
  nodeType: text("node_type").notNull().default("topic"), // topic, concept, reference, quote, argument
  order: integer("order").notNull().default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_doctrine_outline").on(table.outlineId),
  index("idx_doctrine_chapter").on(table.chapterId),
]);

// Insert schemas for Notes and Doctrine
export const insertProjectNoteSchema = createInsertSchema(projectNotes).omit({ id: true, createdAt: true, updatedAt: true, resolvedAt: true });
export const insertDoctrineOutlineSchema = createInsertSchema(doctrineOutlines).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDoctrineNodeSchema = createInsertSchema(doctrineNodes).omit({ id: true, createdAt: true, updatedAt: true });

// Types for Notes and Doctrine
export type ProjectNote = typeof projectNotes.$inferSelect;
export type InsertProjectNote = z.infer<typeof insertProjectNoteSchema>;
export type DoctrineOutline = typeof doctrineOutlines.$inferSelect;
export type InsertDoctrineOutline = z.infer<typeof insertDoctrineOutlineSchema>;
export type DoctrineNode = typeof doctrineNodes.$inferSelect;
export type InsertDoctrineNode = z.infer<typeof insertDoctrineNodeSchema>;

// ============================================================================
// UNIFIED CONVERSATION SYSTEM (Cross-Studio AI Collaboration)
// ============================================================================

// Conversation sessions - persistent AI chats for all studios
export const conversationSessions = pgTable("conversation_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studio: text("studio").notNull(), // book, music, movie, course, video, doctrine
  title: text("title").notNull(),
  status: text("status").notNull().default("active"), // active, paused, completed, archived
  projectId: integer("project_id"), // Optional link to a project in that studio
  metadata: jsonb("metadata").default({}), // Studio-specific context (genre, style, etc.)
  systemPrompt: text("system_prompt"), // Custom system prompt for this session
  isShared: boolean("is_shared").notNull().default(false),
  sharedWith: text("shared_with").array(), // User IDs who can access
  sharePermission: text("share_permission").default("view"), // view, comment, edit
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_conversation_user_studio").on(table.userId, table.studio),
]);

// Conversation messages - individual chat messages
export const conversationMessages = pgTable("conversation_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => conversationSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  contentType: text("content_type").notNull().default("text"), // text, audio, image, action
  attachments: jsonb("attachments").default([]), // Files, images, audio attached
  actionType: text("action_type"), // generate_song, create_scene, analyze, etc.
  actionPayload: jsonb("action_payload"), // Parameters for the action
  actionResult: jsonb("action_result"), // Result of the action (asset IDs, etc.)
  isStreaming: boolean("is_streaming").notNull().default(false),
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_message_session").on(table.sessionId),
]);

// Conversation actions - queued generation jobs from conversations
export const conversationActions = pgTable("conversation_actions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => conversationSessions.id, { onDelete: "cascade" }),
  messageId: integer("message_id").references(() => conversationMessages.id),
  actionType: text("action_type").notNull(), // generate_song, create_scene, generate_cover, etc.
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  payload: jsonb("payload").notNull(), // Action parameters
  result: jsonb("result"), // Action result (asset IDs, URLs, etc.)
  error: text("error"),
  progress: integer("progress").default(0), // 0-100 progress percentage
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// ASSET REGISTRY (Cross-Studio Asset Sharing)
// ============================================================================

// Unified asset registry - all generated/uploaded assets across studios
export const assetRegistry = pgTable("asset_registry", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceStudio: text("source_studio").notNull(), // book, music, movie, video, image
  assetType: text("asset_type").notNull(), // audio, video, image, document, voice_clone
  name: text("name").notNull(),
  description: text("description"),
  url: text("url"), // Storage URL
  thumbnailUrl: text("thumbnail_url"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  duration: integer("duration"), // For audio/video in seconds
  metadata: jsonb("metadata").default({}), // Type-specific metadata
  tags: text("tags").array(),
  isPublic: boolean("is_public").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0), // How many times used in projects
  sourceProjectId: integer("source_project_id"), // Original project that created this
  sourceConversationId: integer("source_conversation_id"), // Conversation that generated this
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_asset_user_type").on(table.userId, table.assetType),
  index("idx_asset_studio").on(table.sourceStudio),
]);

// ============================================================================
// STUDIO PIPELINES (Workflow Orchestration)
// ============================================================================

// Studio pipelines - sequences like Book→Course→Consultant
export const studioPipelines = pgTable("studio_pipelines", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  pipelineType: text("pipeline_type").notNull(), // book_to_course, music_to_video, doctrine_to_consultant
  status: text("status").notNull().default("active"), // active, paused, completed
  currentStage: text("current_stage").notNull(), // Current stage in the pipeline
  stages: jsonb("stages").notNull(), // Array of stage definitions with status
  sourceAssetId: integer("source_asset_id"), // Original asset that started the pipeline
  outputAssetIds: integer("output_asset_ids").array(), // Assets generated by the pipeline
  metadata: jsonb("metadata").default({}),
  progress: integer("progress").notNull().default(0), // Overall progress 0-100
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// AI Quality Tiers - Different quality levels with credit costs
export const aiQualityTiers = pgTable("ai_quality_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Draft, Standard, Premium, Ultra
  description: text("description").notNull(),
  creditCost: integer("credit_cost").notNull(), // 1, 3, 7, 15
  model: text("model").notNull(), // gemini-2.5-flash, gpt-5-mini, etc.
  temperature: real("temperature").notNull().default(0.7),
  maxTokens: integer("max_tokens").notNull().default(4096),
  promptModifiers: text("prompt_modifiers"), // Extra instructions for this tier
  sortOrder: integer("sort_order").notNull().default(0),
});

// AI Voice Presets - Different writing styles/voices
export const aiVoicePresets = pgTable("ai_voice_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Morgan Freeman, Shakespeare, Hemingway, etc.
  description: text("description").notNull(),
  category: text("category").notNull().default("narrative"), // narrative, educational, poetic, conversational
  systemInstructions: text("system_instructions").notNull(), // Detailed prompt for voice style
  exampleOutput: text("example_output"), // Sample of what this voice sounds like
  isBuiltIn: boolean("is_built_in").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  sortOrder: integer("sort_order").notNull().default(0),
});

// User AI Preferences - Saves user's preferred settings
export const userAiPreferences = pgTable("user_ai_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  preferredTierId: integer("preferred_tier_id").references(() => aiQualityTiers.id),
  preferredVoiceId: integer("preferred_voice_id").references(() => aiVoicePresets.id),
  customVoiceProfile: text("custom_voice_profile"), // User's custom voice description
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas for AI Quality System
export const insertAiQualityTierSchema = createInsertSchema(aiQualityTiers).omit({ id: true });
export const insertAiVoicePresetSchema = createInsertSchema(aiVoicePresets).omit({ id: true });
export const insertUserAiPreferencesSchema = createInsertSchema(userAiPreferences).omit({ id: true, updatedAt: true });

// Insert schemas for billing system
export const insertSubscriptionTierSchema = createInsertSchema(subscriptionTiers).omit({ id: true, createdAt: true });
export const insertFeatureGateSchema = createInsertSchema(featureGates).omit({ id: true, createdAt: true });
export const insertCreditWalletSchema = createInsertSchema(creditWallets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreditLedgerSchema = createInsertSchema(creditLedger).omit({ id: true, createdAt: true });
export const insertUsageEventSchema = createInsertSchema(usageEvents).omit({ id: true, createdAt: true });
export const insertCreditPackageSchema = createInsertSchema(creditPackages).omit({ id: true, createdAt: true });
export const insertRevenueEventSchema = createInsertSchema(revenueEvents).omit({ id: true, createdAt: true });
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStudioTemplateSchema = createInsertSchema(studioTemplates).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true });
export const insertProjectVersionSchema = createInsertSchema(projectVersions).omit({ id: true, createdAt: true });
export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers).omit({ id: true, joinedAt: true });
export const insertBrandKitSchema = createInsertSchema(brandKits).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreatorStorefrontSchema = createInsertSchema(creatorStorefronts).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export const insertProductBundleSchema = createInsertSchema(productBundles).omit({ id: true, createdAt: true, salesCount: true });
export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).omit({ id: true, createdAt: true, clickCount: true, conversionCount: true, totalEarnings: true });
export const insertCreatorAnalyticsSchema = createInsertSchema(creatorAnalytics).omit({ id: true, createdAt: true });
export const insertAuthorProfileSchema = createInsertSchema(authorProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPublishingPresetSchema = createInsertSchema(publishingPresets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCoursePresetSchema = createInsertSchema(coursePresets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSavedCoverDesignSchema = createInsertSchema(savedCoverDesigns).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true });
export const insertInspirationLibrarySchema = createInsertSchema(inspirationLibrary).omit({ id: true, createdAt: true });

// Conversation System Insert Schemas
export const insertConversationSessionSchema = createInsertSchema(conversationSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertConversationMessageSchema = createInsertSchema(conversationMessages).omit({ id: true, createdAt: true });
export const insertConversationActionSchema = createInsertSchema(conversationActions).omit({ id: true, createdAt: true, startedAt: true, completedAt: true });

// Asset Registry Insert Schema
export const insertAssetRegistrySchema = createInsertSchema(assetRegistry).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true });

// Studio Pipeline Insert Schema
export const insertStudioPipelineSchema = createInsertSchema(studioPipelines).omit({ id: true, createdAt: true, updatedAt: true });

// Ultra-Premium Types
export type VoiceClone = typeof voiceClones.$inferSelect;
export type InsertVoiceClone = z.infer<typeof insertVoiceCloneSchema>;
export type MovieProject = typeof movieProjects.$inferSelect;
export type InsertMovieProject = z.infer<typeof insertMovieProjectSchema>;
export type MovieCharacter = typeof movieCharacters.$inferSelect;
export type InsertMovieCharacter = z.infer<typeof insertMovieCharacterSchema>;
export type MovieScene = typeof movieScenes.$inferSelect;
export type InsertMovieScene = z.infer<typeof insertMovieSceneSchema>;
export type SceneDialogue = typeof sceneDialogue.$inferSelect;
export type InsertSceneDialogue = z.infer<typeof insertSceneDialogueSchema>;
export type AudiobookProject = typeof audiobookProjects.$inferSelect;
export type InsertAudiobookProject = z.infer<typeof insertAudiobookProjectSchema>;
export type AudiobookChapter = typeof audiobookChapters.$inferSelect;
export type InsertAudiobookChapter = z.infer<typeof insertAudiobookChapterSchema>;
export type DjPreset = typeof djPresets.$inferSelect;
export type InsertDjPreset = z.infer<typeof insertDjPresetSchema>;
export type CreatorWorkflow = typeof creatorWorkflows.$inferSelect;
export type InsertCreatorWorkflow = z.infer<typeof insertCreatorWorkflowSchema>;
export type WorkflowJob = typeof workflowJobs.$inferSelect;
export type InsertWorkflowJob = z.infer<typeof insertWorkflowJobSchema>;
export type ClassroomCourse = typeof classroomCourses.$inferSelect;
export type InsertClassroomCourse = z.infer<typeof insertClassroomCourseSchema>;
export type ClassroomAssignment = typeof classroomAssignments.$inferSelect;
export type InsertClassroomAssignment = z.infer<typeof insertClassroomAssignmentSchema>;

// Billing & Credits Types
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = z.infer<typeof insertSubscriptionTierSchema>;
export type FeatureGate = typeof featureGates.$inferSelect;
export type InsertFeatureGate = z.infer<typeof insertFeatureGateSchema>;
export type CreditWallet = typeof creditWallets.$inferSelect;
export type InsertCreditWallet = z.infer<typeof insertCreditWalletSchema>;
export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type InsertCreditLedgerEntry = z.infer<typeof insertCreditLedgerSchema>;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type InsertUsageEvent = z.infer<typeof insertUsageEventSchema>;
export type CreditPackage = typeof creditPackages.$inferSelect;
export type InsertCreditPackage = z.infer<typeof insertCreditPackageSchema>;
export type RevenueEvent = typeof revenueEvents.$inferSelect;
export type InsertRevenueEvent = z.infer<typeof insertRevenueEventSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

// Template Library Types
export type StudioTemplate = typeof studioTemplates.$inferSelect;
export type InsertStudioTemplate = z.infer<typeof insertStudioTemplateSchema>;

// Version History Types
export type ProjectVersion = typeof projectVersions.$inferSelect;
export type InsertProjectVersion = z.infer<typeof insertProjectVersionSchema>;

// Workspace & Collaboration Types
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;
export type BrandKit = typeof brandKits.$inferSelect;
export type InsertBrandKit = z.infer<typeof insertBrandKitSchema>;

// Marketplace Types
export type CreatorStorefront = typeof creatorStorefronts.$inferSelect;
export type InsertCreatorStorefront = z.infer<typeof insertCreatorStorefrontSchema>;
export type ProductBundle = typeof productBundles.$inferSelect;
export type InsertProductBundle = z.infer<typeof insertProductBundleSchema>;
export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;
export type CreatorAnalytics = typeof creatorAnalytics.$inferSelect;
export type InsertCreatorAnalytics = z.infer<typeof insertCreatorAnalyticsSchema>;

// Creator Profiles & Presets Types (Stickiness)
export type AuthorProfile = typeof authorProfiles.$inferSelect;
export type InsertAuthorProfile = z.infer<typeof insertAuthorProfileSchema>;
export type PublishingPreset = typeof publishingPresets.$inferSelect;
export type InsertPublishingPreset = z.infer<typeof insertPublishingPresetSchema>;
export type CoursePreset = typeof coursePresets.$inferSelect;
export type InsertCoursePreset = z.infer<typeof insertCoursePresetSchema>;
export type SavedCoverDesign = typeof savedCoverDesigns.$inferSelect;
export type InsertSavedCoverDesign = z.infer<typeof insertSavedCoverDesignSchema>;
export type InspirationItem = typeof inspirationLibrary.$inferSelect;
export type InsertInspirationItem = z.infer<typeof insertInspirationLibrarySchema>;

// Conversation System Types
export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = z.infer<typeof insertConversationSessionSchema>;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type InsertConversationMessage = z.infer<typeof insertConversationMessageSchema>;
export type ConversationAction = typeof conversationActions.$inferSelect;
export type InsertConversationAction = z.infer<typeof insertConversationActionSchema>;

// Asset Registry Types
export type Asset = typeof assetRegistry.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetRegistrySchema>;

// Studio Pipeline Types
export type StudioPipeline = typeof studioPipelines.$inferSelect;
export type InsertStudioPipeline = z.infer<typeof insertStudioPipelineSchema>;

// AI Quality System Types
export type AiQualityTier = typeof aiQualityTiers.$inferSelect;
export type InsertAiQualityTier = z.infer<typeof insertAiQualityTierSchema>;
export type AiVoicePreset = typeof aiVoicePresets.$inferSelect;
export type InsertAiVoicePreset = z.infer<typeof insertAiVoicePresetSchema>;
export type UserAiPreferences = typeof userAiPreferences.$inferSelect;
export type InsertUserAiPreferences = z.infer<typeof insertUserAiPreferencesSchema>;

// ============================================================================
// DOC HUB - Universal Document Management & Merging
// ============================================================================

export const docSources = pgTable("doc_sources", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id"),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size"),
  storageRef: text("storage_ref"),
  parsedContent: text("parsed_content"),
  parsedMetadata: jsonb("parsed_metadata"),
  language: text("language"),
  wordCount: integer("word_count"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const docSnippets = pgTable("doc_snippets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceId: integer("source_id").references(() => docSources.id, { onDelete: "set null" }),
  projectId: integer("project_id"),
  label: text("label").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  category: text("category"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const docMergeSessions = pgTable("doc_merge_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  sourceIds: integer("source_ids").array(),
  sectionOrder: jsonb("section_order"),
  mergedContent: text("merged_content"),
  outputFormat: text("output_format").default("manuscript"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDocSourceSchema = createInsertSchema(docSources).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocSnippetSchema = createInsertSchema(docSnippets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocMergeSessionSchema = createInsertSchema(docMergeSessions).omit({ id: true, createdAt: true, updatedAt: true });

// Doc Hub Types
export type DocSource = typeof docSources.$inferSelect;
export type InsertDocSource = z.infer<typeof insertDocSourceSchema>;
export type DocSnippet = typeof docSnippets.$inferSelect;
export type InsertDocSnippet = z.infer<typeof insertDocSnippetSchema>;
export type DocMergeSession = typeof docMergeSessions.$inferSelect;
export type InsertDocMergeSession = z.infer<typeof insertDocMergeSessionSchema>;

// ============================================================================
// PODCAST STUDIO
// ============================================================================

export const podcasts = pgTable("podcasts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  coverArtUrl: text("cover_art_url"),
  category: text("category"),
  language: text("language").default("en"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  episodeCount: integer("episode_count").notNull().default(0),
  totalDuration: integer("total_duration").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const podcastEpisodes = pgTable("podcast_episodes", {
  id: serial("id").primaryKey(),
  podcastId: integer("podcast_id").notNull().references(() => podcasts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  showNotes: text("show_notes"),
  audioUrl: text("audio_url"),
  coverArtUrl: text("cover_art_url"),
  duration: integer("duration").notNull().default(0),
  transcript: text("transcript"),
  transcriptionStatus: text("transcription_status").default("none"),
  episodeNumber: integer("episode_number"),
  status: text("status").notNull().default("draft"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  playCount: integer("play_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPodcastSchema = createInsertSchema(podcasts).omit({ id: true, createdAt: true, updatedAt: true, episodeCount: true, totalDuration: true });
export const insertPodcastEpisodeSchema = createInsertSchema(podcastEpisodes).omit({ id: true, createdAt: true, updatedAt: true, playCount: true });

export type Podcast = typeof podcasts.$inferSelect;
export type InsertPodcast = z.infer<typeof insertPodcastSchema>;
export type PodcastEpisode = typeof podcastEpisodes.$inferSelect;
export type InsertPodcastEpisode = z.infer<typeof insertPodcastEpisodeSchema>;

// ============================================================================
// MAGIC LINK AUTHENTICATION
// ============================================================================

export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMagicLinkTokenSchema = createInsertSchema(magicLinkTokens).omit({ id: true, createdAt: true, usedAt: true });

export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type InsertMagicLinkToken = z.infer<typeof insertMagicLinkTokenSchema>;

// ============================================================================
// CREATOR PRODUCTION ENGINE - VAULTS
// ============================================================================

export const vaultEntries = pgTable("vault_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // lyric, manuscript, doctrine, idea, research, beat, melody, screenplay, jingle
  title: text("title").notNull(),
  content: text("content"),
  contentJson: jsonb("content_json"), // structured content
  summary: text("summary"),
  tags: text("tags").array(),
  linkedProjectId: integer("linked_project_id"),
  linkedAssetIds: text("linked_asset_ids").array(),
  inspirationScore: real("inspiration_score"),
  status: text("status").notNull().default("active"), // active, archived, draft
  version: integer("version").notNull().default(1),
  parentId: integer("parent_id"), // for versioning
  metadata: jsonb("metadata"), // flexible storage for category-specific data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vaultFolders = pgTable("vault_folders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  category: text("category"), // optional category filter
  color: text("color"),
  icon: text("icon"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vaultEntryFolders = pgTable("vault_entry_folders", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull().references(() => vaultEntries.id, { onDelete: "cascade" }),
  folderId: integer("folder_id").notNull().references(() => vaultFolders.id, { onDelete: "cascade" }),
});

// ============================================================================
// CREATOR PRODUCTION ENGINE - RESEARCH HUB
// ============================================================================

export const researchQueries = pgTable("research_queries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  market: text("market").default("us"),
  serpResult: jsonb("serp_result"),
  insights: jsonb("insights"), // AI-extracted insights
  insightScore: real("insight_score"),
  creditCost: integer("credit_cost").default(1),
  savedToVault: boolean("saved_to_vault").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const trendingTopics = pgTable("trending_topics", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // books, music, courses, movies
  topic: text("topic").notNull(),
  searchVolume: integer("search_volume"),
  trend: text("trend"), // rising, stable, declining
  relatedKeywords: text("related_keywords").array(),
  source: text("source").default("serp"),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// ============================================================================
// CREATOR PRODUCTION ENGINE - BATCH PRODUCTION
// ============================================================================

export const productionBatches = pgTable("production_batches", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  batchType: text("batch_type").notNull(), // book, screenplay, course, song, jingle
  targetFormat: text("target_format"), // pdf, epub, mp3, mp4
  config: jsonb("config"), // generation settings
  totalItems: integer("total_items").notNull().default(0),
  completedItems: integer("completed_items").notNull().default(0),
  failedItems: integer("failed_items").notNull().default(0),
  creditCost: integer("credit_cost").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed, cancelled
  jobId: text("job_id"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const batchItems = pgTable("batch_items", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull().references(() => productionBatches.id, { onDelete: "cascade" }),
  sourceVaultEntryId: integer("source_vault_entry_id").references(() => vaultEntries.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  promptConfig: jsonb("prompt_config"),
  outputType: text("output_type").notNull(),
  aiModel: text("ai_model"),
  creditCost: integer("credit_cost").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  result: jsonb("result"),
  outputUrl: text("output_url"),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// CREATOR PRODUCTION ENGINE - CROSS-FORMAT IDEATION
// ============================================================================

export const ideationLinks = pgTable("ideation_links", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceEntryId: integer("source_entry_id").notNull().references(() => vaultEntries.id, { onDelete: "cascade" }),
  targetEntryId: integer("target_entry_id").notNull().references(() => vaultEntries.id, { onDelete: "cascade" }),
  relationship: text("relationship").notNull(), // inspired, adapted, expanded, remixed
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// CREATOR PRODUCTION ENGINE - LIFE STORY ENGINE
// ============================================================================

export const lifeStories = pgTable("life_stories", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  timeline: jsonb("timeline"), // birth, milestones, key events
  milestones: jsonb("milestones"), // array of life events
  themes: text("themes").array(), // triumph, love, loss, growth
  chapters: jsonb("chapters"), // generated chapter outlines
  attachments: jsonb("attachments"), // photos, documents
  generatedContent: text("generated_content"),
  status: text("status").notNull().default("draft"),
  linkedBookProjectId: integer("linked_book_project_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// CREATOR PRODUCTION ENGINE - SCREENPLAY/SCRIPT STUDIO
// ============================================================================

export const screenplayProjects = pgTable("screenplay_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  logline: text("logline"),
  genre: text("genre"),
  format: text("format").default("feature"), // feature, short, series, pilot
  beats: jsonb("beats"), // story beats
  scenes: jsonb("scenes"), // scene list
  characters: jsonb("characters"), // character profiles
  dialogue: jsonb("dialogue"), // dialogue snippets
  fullScript: text("full_script"),
  status: text("status").notNull().default("draft"),
  linkedVaultEntryId: integer("linked_vault_entry_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// CREATOR PRODUCTION ENGINE - MUSIC SANDBOX
// ============================================================================

export const musicSandboxProjects = pgTable("music_sandbox_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  projectType: text("project_type").notNull(), // beat, melody, soundtrack, jingle, song
  genre: text("genre"),
  tempo: integer("tempo"),
  key: text("key"),
  timeSignature: text("time_signature").default("4/4"),
  lyrics: text("lyrics"),
  structure: jsonb("structure"), // verse, chorus, bridge layout
  tracks: jsonb("tracks"), // multi-track data
  patterns: jsonb("patterns"), // beat patterns, melodies
  mixSettings: jsonb("mix_settings"),
  audioUrl: text("audio_url"),
  stemUrls: jsonb("stem_urls"), // individual track exports
  linkedVaultEntryId: integer("linked_vault_entry_id"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertVaultEntrySchema = createInsertSchema(vaultEntries).omit({ id: true, createdAt: true, updatedAt: true, version: true });
export const insertVaultFolderSchema = createInsertSchema(vaultFolders).omit({ id: true, createdAt: true });
export const insertResearchQuerySchema = createInsertSchema(researchQueries).omit({ id: true, createdAt: true });
export const insertProductionBatchSchema = createInsertSchema(productionBatches).omit({ id: true, createdAt: true, completedItems: true, failedItems: true });
export const insertBatchItemSchema = createInsertSchema(batchItems).omit({ id: true, createdAt: true });
export const insertLifeStorySchema = createInsertSchema(lifeStories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertScreenplayProjectSchema = createInsertSchema(screenplayProjects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMusicSandboxProjectSchema = createInsertSchema(musicSandboxProjects).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type VaultEntry = typeof vaultEntries.$inferSelect;
export type InsertVaultEntry = z.infer<typeof insertVaultEntrySchema>;
export type VaultFolder = typeof vaultFolders.$inferSelect;
export type InsertVaultFolder = z.infer<typeof insertVaultFolderSchema>;
export type ResearchQuery = typeof researchQueries.$inferSelect;
export type InsertResearchQuery = z.infer<typeof insertResearchQuerySchema>;
export type TrendingTopic = typeof trendingTopics.$inferSelect;
export type ProductionBatch = typeof productionBatches.$inferSelect;
export type InsertProductionBatch = z.infer<typeof insertProductionBatchSchema>;
export type BatchItem = typeof batchItems.$inferSelect;
export type InsertBatchItem = z.infer<typeof insertBatchItemSchema>;
export type IdeationLink = typeof ideationLinks.$inferSelect;
export type LifeStory = typeof lifeStories.$inferSelect;
export type InsertLifeStory = z.infer<typeof insertLifeStorySchema>;
export type ScreenplayProject = typeof screenplayProjects.$inferSelect;
export type InsertScreenplayProject = z.infer<typeof insertScreenplayProjectSchema>;
export type MusicSandboxProject = typeof musicSandboxProjects.$inferSelect;
export type InsertMusicSandboxProject = z.infer<typeof insertMusicSandboxProjectSchema>;

// ============================================================================
// BOOK WEBSITES - Dedicated landing pages for books
// ============================================================================

export const bookWebsites = pgTable("book_websites", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => marketplaceListings.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  customDomain: text("custom_domain"),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  tagline: text("tagline"),
  description: text("description"),
  authorBio: text("author_bio"),
  authorName: text("author_name").notNull(),
  authorPhotoUrl: text("author_photo_url"),
  coverImageUrl: text("cover_image_url"),
  bannerImageUrl: text("banner_image_url"),
  logoUrl: text("logo_url"),
  theme: text("theme").notNull().default("classic"), // classic, modern, dark, elegant, bold
  primaryColor: text("primary_color").default("#C9941A"),
  accentColor: text("accent_color").default("#1a1a1a"),
  fontFamily: text("font_family").default("Crimson Pro"),
  genre: text("genre"),
  amazonUrl: text("amazon_url"),
  barnesNobleUrl: text("barnes_noble_url"),
  appleBooksUrl: text("apple_books_url"),
  koboUrl: text("kobo_url"),
  googlePlayUrl: text("google_play_url"),
  luluUrl: text("lulu_url"),
  directBuyUrl: text("direct_buy_url"),
  sampleChapterUrl: text("sample_chapter_url"),
  testimonials: jsonb("testimonials").default([]), // [{name, text, source, rating}]
  awards: jsonb("awards").default([]), // [{name, year, organization}]
  pressQuotes: jsonb("press_quotes").default([]), // [{quote, source, url}]
  bookDetails: jsonb("book_details").default({}), // {pageCount, isbn, publishDate, language, format}
  socialLinks: jsonb("social_links").default({}),
  newsletterEnabled: boolean("newsletter_enabled").notNull().default(false),
  mailchimpListId: text("mailchimp_list_id"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords").array(),
  ogImageUrl: text("og_image_url"),
  analyticsId: text("analytics_id"),
  facebookPixelId: text("facebook_pixel_id"),
  viewCount: integer("view_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookWebsitePages = pgTable("book_website_pages", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").notNull().references(() => bookWebsites.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookWebsiteLeads = pgTable("book_website_leads", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").notNull().references(() => bookWebsites.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name"),
  source: text("source"), // newsletter, download, contact
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookWebsiteSchema = createInsertSchema(bookWebsites).omit({ 
  id: true, createdAt: true, updatedAt: true, viewCount: true, clickCount: true, publishedAt: true 
});
export const insertBookWebsitePageSchema = createInsertSchema(bookWebsitePages).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export const insertBookWebsiteLeadSchema = createInsertSchema(bookWebsiteLeads).omit({ 
  id: true, createdAt: true 
});

export type BookWebsite = typeof bookWebsites.$inferSelect;
export type InsertBookWebsite = z.infer<typeof insertBookWebsiteSchema>;
export type BookWebsitePage = typeof bookWebsitePages.$inferSelect;
export type InsertBookWebsitePage = z.infer<typeof insertBookWebsitePageSchema>;
export type BookWebsiteLead = typeof bookWebsiteLeads.$inferSelect;
export type InsertBookWebsiteLead = z.infer<typeof insertBookWebsiteLeadSchema>;

// ============================================================================
// WEBSITE BUILDER - Full website creation and hosting system
// ============================================================================

export const userWebsites = pgTable("user_websites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // subdomain: slug.kreaite.xyz
  customDomain: text("custom_domain"), // for custom domains
  templateId: text("template_id").notNull().default("blank"),
  industry: text("industry"), // local-business, portfolio, blog, nonprofit, creator, ecommerce
  businessName: text("business_name"),
  businessDescription: text("business_description"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").default("#C9941A"),
  secondaryColor: text("secondary_color").default("#1a1a1a"),
  accentColor: text("accent_color").default("#FAF8F3"),
  fontHeading: text("font_heading").default("Playfair Display"),
  fontBody: text("font_body").default("Inter"),
  socialLinks: jsonb("social_links").default({}), // {facebook, twitter, instagram, linkedin, youtube}
  contactInfo: jsonb("contact_info").default({}), // {email, phone, address, hours}
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords").array(),
  ogImageUrl: text("og_image_url"),
  analyticsId: text("analytics_id"),
  headerCode: text("header_code"), // custom scripts in <head>
  footerCode: text("footer_code"), // custom scripts before </body>
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const websitePages = pgTable("website_pages", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").notNull().references(() => userWebsites.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(), // /about, /services, /contact
  title: text("title").notNull(),
  pageType: text("page_type").notNull().default("page"), // home, about, services, contact, blog, custom
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  content: jsonb("content").default([]), // Array of section components
  isVisible: boolean("is_visible").notNull().default(true),
  isInNavigation: boolean("is_in_navigation").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const websiteBlogPosts = pgTable("website_blog_posts", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").notNull().references(() => userWebsites.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content"),
  featuredImageUrl: text("featured_image_url"),
  authorName: text("author_name"),
  category: text("category"),
  tags: text("tags").array(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const generatedLogos = pgTable("generated_logos", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  websiteId: integer("website_id").references(() => userWebsites.id, { onDelete: "set null" }),
  businessName: text("business_name").notNull(),
  industry: text("industry"),
  style: text("style"), // modern, classic, minimal, bold, playful
  iconType: text("icon_type"), // abstract, lettermark, icon, wordmark
  primaryColor: text("primary_color"),
  imageUrl: text("image_url").notNull(),
  prompt: text("prompt"),
  isSelected: boolean("is_selected").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const websiteLeads = pgTable("website_leads", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").notNull().references(() => userWebsites.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name"),
  phone: text("phone"),
  message: text("message"),
  source: text("source"), // contact-form, newsletter, popup
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserWebsiteSchema = createInsertSchema(userWebsites).omit({ 
  id: true, createdAt: true, updatedAt: true, viewCount: true, publishedAt: true 
});
export const insertWebsitePageSchema = createInsertSchema(websitePages).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export const insertWebsiteBlogPostSchema = createInsertSchema(websiteBlogPosts).omit({ 
  id: true, createdAt: true, updatedAt: true, viewCount: true, publishedAt: true 
});
export const insertGeneratedLogoSchema = createInsertSchema(generatedLogos).omit({ 
  id: true, createdAt: true 
});
export const insertWebsiteLeadSchema = createInsertSchema(websiteLeads).omit({ 
  id: true, createdAt: true 
});

export type UserWebsite = typeof userWebsites.$inferSelect;
export type InsertUserWebsite = z.infer<typeof insertUserWebsiteSchema>;
export type WebsitePage = typeof websitePages.$inferSelect;
export type InsertWebsitePage = z.infer<typeof insertWebsitePageSchema>;
export type WebsiteBlogPost = typeof websiteBlogPosts.$inferSelect;
export type InsertWebsiteBlogPost = z.infer<typeof insertWebsiteBlogPostSchema>;
export type GeneratedLogo = typeof generatedLogos.$inferSelect;
export type InsertGeneratedLogo = z.infer<typeof insertGeneratedLogoSchema>;
export type WebsiteLead = typeof websiteLeads.$inferSelect;
export type InsertWebsiteLead = z.infer<typeof insertWebsiteLeadSchema>;

// ============================================================================
// QUOTE STUDIO - DYNAMIC QR CODE GENERATOR WITH ROTATING QUOTES
// ============================================================================

// Quote Categories - Industries and niches
export const quoteCategories = pgTable("quote_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  parentId: integer("parent_id"),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Quotes - Individual quotes with AI generation metadata
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => quoteCategories.id, { onDelete: "set null" }),
  text: text("text").notNull(),
  author: text("author"),
  tone: text("tone").notNull().default("motivational"), // motivational, actionable, witty, professional, inspirational
  industry: text("industry").notNull(), // e-commerce, coaching, consulting, fitness, real-estate, etc.
  targetAudience: text("target_audience"), // entrepreneurs, managers, athletes, etc.
  rating: integer("rating").default(0), // 1-5 stars
  isApproved: boolean("is_approved").notNull().default(false),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  aiModel: text("ai_model"), // gemini, openai, etc.
  usageCount: integer("usage_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// QR Code Projects - User's QR code campaigns
export const qrCodeProjects = pgTable("qr_code_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  industry: text("industry").notNull(),
  targetUrl: text("target_url"), // Optional override - otherwise uses internal landing page
  backgroundImageUrl: text("background_image_url"),
  logoUrl: text("logo_url"),
  qrColor: text("qr_color").default("#000000"),
  qrBackgroundColor: text("qr_background_color").default("#FFFFFF"),
  qrStyle: text("qr_style").default("square"), // square, rounded, dots
  qrSize: integer("qr_size").default(256),
  generatedQrUrl: text("generated_qr_url"),
  isPublished: boolean("is_published").notNull().default(false),
  totalScans: integer("total_scans").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// QR Code Rotation Settings - Configure how quotes rotate
export const qrCodeRotationSettings = pgTable("qr_code_rotation_settings", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => qrCodeProjects.id, { onDelete: "cascade" }),
  rotationFrequency: text("rotation_frequency").notNull().default("daily"), // hourly, daily, weekly, manual
  rotationTime: text("rotation_time").default("00:00"), // Time of day for rotation (HH:MM)
  timezone: text("timezone").default("UTC"),
  minRating: integer("min_rating").default(0), // Only show quotes with rating >= this
  onlyApproved: boolean("only_approved").notNull().default(true),
  currentQuoteId: integer("current_quote_id").references(() => quotes.id),
  lastRotatedAt: timestamp("last_rotated_at"),
  nextRotationAt: timestamp("next_rotation_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Project Quote Pool - Which quotes are assigned to which project
export const projectQuotePool = pgTable("project_quote_pool", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => qrCodeProjects.id, { onDelete: "cascade" }),
  quoteId: integer("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  displayOrder: integer("display_order").default(0),
  timesDisplayed: integer("times_displayed").notNull().default(0),
  lastDisplayedAt: timestamp("last_displayed_at"),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

// Quote Scan Analytics - Track QR code scans
export const quoteScanAnalytics = pgTable("quote_scan_analytics", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => qrCodeProjects.id, { onDelete: "cascade" }),
  quoteId: integer("quote_id").references(() => quotes.id, { onDelete: "set null" }),
  scanDate: timestamp("scan_date").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  country: text("country"),
  city: text("city"),
  deviceType: text("device_type"), // mobile, tablet, desktop
  referrer: text("referrer"),
});

// ============================================================================
// Push Notification Subscriptions
// ============================================================================

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsed: timestamp("last_used").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true, lastUsed: true });
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

// Insert schemas for Quote Studio
export const insertQuoteCategorySchema = createInsertSchema(quoteCategories).omit({ id: true, createdAt: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true, lastUsedAt: true });
export const insertQrCodeProjectSchema = createInsertSchema(qrCodeProjects).omit({ id: true, createdAt: true, updatedAt: true, totalScans: true });
export const insertQrCodeRotationSettingsSchema = createInsertSchema(qrCodeRotationSettings).omit({ id: true, createdAt: true, lastRotatedAt: true });
export const insertProjectQuotePoolSchema = createInsertSchema(projectQuotePool).omit({ id: true, addedAt: true, timesDisplayed: true, lastDisplayedAt: true });
export const insertQuoteScanAnalyticsSchema = createInsertSchema(quoteScanAnalytics).omit({ id: true });

// Types for Quote Studio
export type QuoteCategory = typeof quoteCategories.$inferSelect;
export type InsertQuoteCategory = z.infer<typeof insertQuoteCategorySchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type QrCodeProject = typeof qrCodeProjects.$inferSelect;
export type InsertQrCodeProject = z.infer<typeof insertQrCodeProjectSchema>;
export type QrCodeRotationSettings = typeof qrCodeRotationSettings.$inferSelect;
export type InsertQrCodeRotationSettings = z.infer<typeof insertQrCodeRotationSettingsSchema>;
export type ProjectQuotePool = typeof projectQuotePool.$inferSelect;
export type InsertProjectQuotePool = z.infer<typeof insertProjectQuotePoolSchema>;
export type QuoteScanAnalytics = typeof quoteScanAnalytics.$inferSelect;
export type InsertQuoteScanAnalytics = z.infer<typeof insertQuoteScanAnalyticsSchema>;

// ─── Recovery University ─────────────────────────────────────────────────────
// 7-part / 33-chapter graded curriculum. Each lesson has substantive markdown
// body + 5 multiple-choice quiz questions. Tier-gated server-side.
// `chapter` is the global 1..33 chapter number — the URL/key contract with the
// frontend so survivors can deep-link straight to a lesson.
export const recoveryUniversityLessons = pgTable("recovery_university_lessons", {
  id: serial("id").primaryKey(),
  chapter: integer("chapter").notNull().unique(), // 1..33
  partNumber: integer("part_number").notNull(), // 1..7
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  requiredTier: text("required_tier").notNull().default("explorer"), // explorer | warrior | champion | platinum
  estimatedMinutes: integer("estimated_minutes").notNull().default(25),
  body: text("body").notNull(), // markdown
  keyTakeaways: text("key_takeaways").array(), // 3-5 bullets
  passingScore: integer("passing_score").notNull().default(70),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  partIdx: index("ru_lesson_part_idx").on(t.partNumber),
}));

export const recoveryUniversityQuestions = pgTable("recovery_university_questions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => recoveryUniversityLessons.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  prompt: text("prompt").notNull(),
  // options shape: [{ id: "a", text: "..." }, ...]
  options: jsonb("options").notNull(),
  correctOptionId: text("correct_option_id").notNull(),
  hint: text("hint").notNull(), // shown when survivor clicks "stuck?" — nudges, doesn't spoil
  explanation: text("explanation").notNull(), // shown after answer is locked in, regardless of right/wrong
}, (t) => ({
  lessonIdx: index("ru_q_lesson_idx").on(t.lessonId),
}));

export const recoveryUniversityLessonProgress = pgTable("recovery_university_lesson_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  chapter: integer("chapter").notNull(), // 1..33
  status: text("status").notNull().default("in_progress"), // in_progress | read | passed
  startedAt: timestamp("started_at").notNull().defaultNow(),
  readAt: timestamp("read_at"),
  passedAt: timestamp("passed_at"),
  bestScore: integer("best_score").notNull().default(0), // 0..100
  attempts: integer("attempts").notNull().default(0),
}, (t) => ({
  userChapterIdx: index("ru_progress_user_chapter_idx").on(t.userId, t.chapter),
}));

export const recoveryUniversityQuizAttempts = pgTable("recovery_university_quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  chapter: integer("chapter").notNull(),
  score: integer("score").notNull(), // 0..100
  passed: boolean("passed").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctCount: integer("correct_count").notNull(),
  hintsUsed: integer("hints_used").notNull().default(0),
  // answers shape: { [questionId]: { picked: "a", correct: true, usedHint: false } }
  answers: jsonb("answers"),
  durationSec: integer("duration_sec"),
  attemptNumber: integer("attempt_number").notNull().default(1),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("ru_attempt_user_idx").on(t.userId),
  chapterIdx: index("ru_attempt_chapter_idx").on(t.chapter),
}));

// Issued automatically when a user has `passed` every chapter inside a part.
export const recoveryUniversityCertificates = pgTable("recovery_university_certificates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  partNumber: integer("part_number").notNull(), // 1..7, or 0 for full-curriculum
  serial: text("serial").notNull().unique(), // human-readable cert id
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
}, (t) => ({
  userPartUnique: uniqueIndex("ru_cert_user_part_unique").on(t.userId, t.partNumber),
}));

export const insertRecoveryUniversityLessonSchema = createInsertSchema(recoveryUniversityLessons).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRecoveryUniversityQuestionSchema = createInsertSchema(recoveryUniversityQuestions).omit({ id: true });
export const insertRecoveryUniversityLessonProgressSchema = createInsertSchema(recoveryUniversityLessonProgress).omit({ id: true, startedAt: true });
export const insertRecoveryUniversityQuizAttemptSchema = createInsertSchema(recoveryUniversityQuizAttempts).omit({ id: true, completedAt: true });
export const insertRecoveryUniversityCertificateSchema = createInsertSchema(recoveryUniversityCertificates).omit({ id: true, issuedAt: true });

export type RecoveryUniversityLesson = typeof recoveryUniversityLessons.$inferSelect;
export type InsertRecoveryUniversityLesson = z.infer<typeof insertRecoveryUniversityLessonSchema>;
export type RecoveryUniversityQuestion = typeof recoveryUniversityQuestions.$inferSelect;
export type InsertRecoveryUniversityQuestion = z.infer<typeof insertRecoveryUniversityQuestionSchema>;
export type RecoveryUniversityLessonProgress = typeof recoveryUniversityLessonProgress.$inferSelect;
export type InsertRecoveryUniversityLessonProgress = z.infer<typeof insertRecoveryUniversityLessonProgressSchema>;
export type RecoveryUniversityQuizAttempt = typeof recoveryUniversityQuizAttempts.$inferSelect;
export type InsertRecoveryUniversityQuizAttempt = z.infer<typeof insertRecoveryUniversityQuizAttemptSchema>;
export type RecoveryUniversityCertificate = typeof recoveryUniversityCertificates.$inferSelect;
export type InsertRecoveryUniversityCertificate = z.infer<typeof insertRecoveryUniversityCertificateSchema>;

// ─── Forge Your Beast — Recovery Personas ────────────────────────────────────
// One persona per user. The persona is the survivor's chosen alter-ego — the
// version of themselves that does the rep when the wounded self can't. Wired
// into dashboard greeting, quiz feedback, certificate name, coach voice line.
export const userPersonas = pgTable("user_personas", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  archetypeKey: text("archetype_key").notNull(), // 'sasquatch' | 'phoenix' | 'wolf' | 'bear' | 'anvil' | 'lighthouse'
  name: text("name").notNull(), // e.g. "Cassie the Phoenix"
  creed: text("creed").notNull(), // one-line manifesto in persona voice
  why: text("why"), // why this archetype matters — persisted so re-forging stays context-aware
  triggerCue: text("trigger_cue"), // physical cue the survivor uses to switch modes (bracelet, song, phrase)
  voicePreset: text("voice_preset"), // ElevenLabs voice id alias
  accentColor: text("accent_color").notNull().default("#C9941A"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserPersonaSchema = createInsertSchema(userPersonas).omit({ createdAt: true, updatedAt: true });
export type UserPersona = typeof userPersonas.$inferSelect;
export type InsertUserPersona = z.infer<typeof insertUserPersonaSchema>;

// ─── Brain Gym ────────────────────────────────────────────────────────────────
export const brainGymCompletions = pgTable("brain_gym_completions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameType: text("game_type").notNull(), // 'wordsearch' | 'crossword' | 'memory'
  packId: text("pack_id").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  durationSec: integer("duration_sec").notNull(),
  hintsUsed: integer("hints_used").notNull().default(0),
  movesOrAttempts: integer("moves_or_attempts"),
  accuracyPct: integer("accuracy_pct"),
  isDailyChallenge: boolean("is_daily_challenge").notNull().default(false),
  challengeDate: text("challenge_date"), // YYYY-MM-DD when isDailyChallenge
  completedAt: timestamp("completed_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("bgc_user_idx").on(t.userId),
  challengeIdx: index("bgc_challenge_idx").on(t.challengeDate, t.durationSec),
}));

export const insertBrainGymCompletionSchema = createInsertSchema(brainGymCompletions).omit({ id: true, completedAt: true });
export type BrainGymCompletion = typeof brainGymCompletions.$inferSelect;
export type InsertBrainGymCompletion = z.infer<typeof insertBrainGymCompletionSchema>;

// ─── Survivor Spotlight ───────────────────────────────────────────────────────
// Monthly featured survivor. Opt-in only, with explicit release-of-likeness
// consent. Selection is weighted-random with paid users counted 3x; admin
// must approve before the pick goes public.
export const spotlights = pgTable("spotlights", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  monthKey: text("month_key").notNull(), // YYYY-MM
  status: text("status").notNull().default("pending"), // pending | approved | rejected | published
  weight: integer("weight").notNull().default(1), // weight at time of pick (1 free, 3 paid)
  // Editorial content captured at publish time
  displayName: text("display_name").notNull(),
  headline: text("headline"),
  story: text("story"), // long-form, markdown allowed
  recoveryDate: timestamp("recovery_date"),
  location: text("location"),
  photoUrl: text("photo_url"),
  pickedAt: timestamp("picked_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  publishedAt: timestamp("published_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectReason: text("reject_reason"),
}, (t) => ({
  monthIdx: index("spotlight_month_idx").on(t.monthKey),
  statusIdx: index("spotlight_status_idx").on(t.status),
}));

export const insertSpotlightSchema = createInsertSchema(spotlights).omit({
  id: true,
  pickedAt: true,
  approvedAt: true,
  publishedAt: true,
  rejectedAt: true,
});
export type Spotlight = typeof spotlights.$inferSelect;
export type InsertSpotlight = z.infer<typeof insertSpotlightSchema>;

// ─── Sasquatch Scale: 5-domain self-assessment ──────────────────────────────
// Each domain scored 1–10. Snapshots are kept so we can chart progress over time.
export const sasquatchAssessments = pgTable("sasquatch_assessments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  physical: integer("physical").notNull(),
  cognitive: integer("cognitive").notNull(),
  speech: integer("speech").notNull(),
  emotional: integer("emotional").notNull(),
  memory: integer("memory").notNull(),
  notes: text("notes"),
  takenAt: timestamp("taken_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("sasquatch_assess_user_idx").on(t.userId, t.takenAt),
}));

export const insertSasquatchAssessmentSchema = createInsertSchema(sasquatchAssessments).omit({
  id: true,
  takenAt: true,
});
export type SasquatchAssessment = typeof sasquatchAssessments.$inferSelect;
export type InsertSasquatchAssessment = z.infer<typeof insertSasquatchAssessmentSchema>;

// User's recovery goals (short and long term)
export const survivorGoals = pgTable("survivor_goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  horizon: text("horizon").notNull(), // "short" (30d) | "long" (1yr)
  domain: text("domain").notNull(), // physical | cognitive | speech | emotional | memory | other
  goal: text("goal").notNull(),
  status: text("status").notNull().default("active"), // active | done | dropped
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("survivor_goals_user_idx").on(t.userId),
}));

export const insertSurvivorGoalSchema = createInsertSchema(survivorGoals).omit({
  id: true,
  createdAt: true,
});
export type SurvivorGoal = typeof survivorGoals.$inferSelect;
export type InsertSurvivorGoal = z.infer<typeof insertSurvivorGoalSchema>;

// Generated AI recovery plan — stored as JSON so we can iterate freely on shape.
export const survivorPlans = pgTable("survivor_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assessmentId: integer("assessment_id"),
  plan: jsonb("plan").notNull(), // { weekly: {...}, exercises: [...], brainGymMinutes, mealTargets, rest, tips: [] }
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("survivor_plans_user_idx").on(t.userId, t.generatedAt),
}));

export const insertSurvivorPlanSchema = createInsertSchema(survivorPlans).omit({
  id: true,
  generatedAt: true,
});
export type SurvivorPlan = typeof survivorPlans.$inferSelect;
export type InsertSurvivorPlan = z.infer<typeof insertSurvivorPlanSchema>;

// Real evidence-based exercise catalog (seeded from Nick's authored protocols)
export const recoveryExercises = pgTable("recovery_exercises", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // lower | upper | spasticity | stretch | hand_fine_motor
  position: text("position").notNull(), // seated | standing | either
  level: text("level").notNull(), // beginner | moderate | advanced (minimum recommended)
  domain: text("domain").notNull().default("physical"), // physical | cognitive | etc
  targets: text("targets").array().notNull().default(sql`ARRAY[]::text[]`), // drop_foot, hand_function, balance, spasticity, coordination, hip_flexion, etc
  description: text("description").notNull(),
  // Three progression levels — sets x reps x optional hold seconds.
  beginnerSets: integer("beginner_sets"),
  beginnerReps: integer("beginner_reps"),
  beginnerHoldSec: integer("beginner_hold_sec"),
  moderateSets: integer("moderate_sets"),
  moderateReps: integer("moderate_reps"),
  moderateHoldSec: integer("moderate_hold_sec"),
  advancedSets: integer("advanced_sets"),
  advancedReps: integer("advanced_reps"),
  advancedHoldSec: integer("advanced_hold_sec"),
  safetyNotes: text("safety_notes"),
  progressionRule: text("progression_rule"),
  saschPhase: text("sasch_phase"), // S | A | S | C | H — letter from S.A.S.C.H. framework
  videoUrl: text("video_url"),
  sortOrder: integer("sort_order").notNull().default(100),
}, (t) => ({
  catIdx: index("recovery_exercises_cat_idx").on(t.category, t.position, t.level),
}));

export const insertRecoveryExerciseSchema = createInsertSchema(recoveryExercises).omit({
  id: true,
});
export type RecoveryExercise = typeof recoveryExercises.$inferSelect;
export type InsertRecoveryExercise = z.infer<typeof insertRecoveryExerciseSchema>;

// User logs of completed exercise sets — fuels monthly re-score and trends.
export const recoveryExerciseLogs = pgTable("recovery_exercise_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => recoveryExercises.id, { onDelete: "cascade" }),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  holdSec: integer("hold_sec").notNull().default(0),
  perceivedEffort: integer("perceived_effort"), // 1-10 RPE
  spasticityAfter: integer("spasticity_after"), // 1-10 (1 = loose, 10 = locked)
  notes: text("notes"),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
}, (t) => ({
  userIdx: index("recovery_ex_logs_user_idx").on(t.userId, t.loggedAt),
  exIdx: index("recovery_ex_logs_ex_idx").on(t.exerciseId),
}));

export const insertRecoveryExerciseLogSchema = createInsertSchema(recoveryExerciseLogs).omit({
  id: true,
  loggedAt: true,
});
export type RecoveryExerciseLog = typeof recoveryExerciseLogs.$inferSelect;
export type InsertRecoveryExerciseLog = z.infer<typeof insertRecoveryExerciseLogSchema>;


// ─── Daily Routine System ──────────────────────────────────────────────────
// Tracks daily routine completions per user with level (0-4) and task IDs.
export const routineCompletions = pgTable("routine_completions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  level: integer("level").notNull().default(2), // 0=Survival 1=Bed 2=Seated 3=Assisted 4=Full
  completedTasks: text("completed_tasks").array().notNull().default([]),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  userDateIdx: uniqueIndex("routine_user_date_idx").on(t.userId, t.date),
}));

export const insertRoutineCompletionSchema = createInsertSchema(routineCompletions).omit({ id: true, updatedAt: true });
export type RoutineCompletion = typeof routineCompletions.$inferSelect;
export type InsertRoutineCompletion = z.infer<typeof insertRoutineCompletionSchema>;

// ============================================================================
// VIDEO STUDIO — user-authored video projects (timeline + assets state)
// ============================================================================
export const videoProjects = pgTable("video_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  duration: integer("duration"),
  timeline: jsonb("timeline"),
  assets: jsonb("assets"),
  aspectRatio: text("aspect_ratio").notNull().default("16:9"),
  resolution: text("resolution").notNull().default("1080p"),
  status: text("status").notNull().default("draft"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const insertVideoProjectSchema = createInsertSchema(videoProjects).omit({ id: true, createdAt: true, updatedAt: true });
export type VideoProject = typeof videoProjects.$inferSelect;
export type InsertVideoProject = z.infer<typeof insertVideoProjectSchema>;

// ============================================================================
// IMAGE STUDIO — user-saved image assets (gallery)
// ============================================================================
export const imageProjects = pgTable("image_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  width: integer("width"),
  height: integer("height"),
  source: text("source").notNull().default("upload"),
  prompt: text("prompt"),
  edits: jsonb("edits"),
  tags: text("tags").array().notNull().default([]),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const insertImageProjectSchema = createInsertSchema(imageProjects).omit({ id: true, createdAt: true, updatedAt: true });
export type ImageProject = typeof imageProjects.$inferSelect;
export type InsertImageProject = z.infer<typeof insertImageProjectSchema>;
