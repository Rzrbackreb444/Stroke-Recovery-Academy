import { 
  type User, type UpsertUser,
  type ForumCategory, type InsertForumCategory,
  type ForumThread, type InsertForumThread,
  type ForumPost, type InsertForumPost,
  type Book, type InsertBook,
  type AiChatSession, type InsertAiChatSession,
  type AiChatMessage, type InsertAiChatMessage,
  type MarketplaceCategory, type InsertMarketplaceCategory,
  type MarketplaceProduct, type InsertMarketplaceProduct,
  type PublishingProject, type InsertPublishingProject,
  type UserSettings, type InsertUserSettings,
  type TherapistProfile, type InsertTherapistProfile,
  type PatientAssignment, type InsertPatientAssignment,
  type TherapySession, type InsertTherapySession,
  type ExercisePrescription, type InsertExercisePrescription,
  type ActivityPost, type InsertActivityPost,
  type ActivityMedia, type InsertActivityMedia,
  type ActivityReaction, type InsertActivityReaction,
  type ActivityComment, type InsertActivityComment,
  type TherapeuticExercise, type InsertTherapeuticExercise,
  type ExerciseSession, type InsertExerciseSession,
  type ExerciseScore,
  type SpeechExercise, type InsertSpeechExercise,
  type CognitiveExercise, type InsertCognitiveExercise,
  type WearableConnection, type InsertWearableConnection,
  type WearableMetric, type InsertWearableMetric,
  type Conversation, type InsertConversation,
  type ConversationParticipant,
  type DirectMessage, type InsertDirectMessage,
  type ForumPostMedia, type InsertForumPostMedia,
  type VideoSession, type InsertVideoSession,
  type VideoSessionParticipant,
  type SeoPage, type InsertSeoPage,
  type BlogPost, type InsertBlogPost,
  type BlogPostReaction, type InsertBlogPostReaction,
  type BlogPostComment, type InsertBlogPostComment,
  type MarketplaceListing, type InsertMarketplaceListing,
  type BookEdition, type InsertBookEdition,
  type BookOrder, type InsertBookOrder,
  type OrderItem, type InsertOrderItem,
  type BookReview, type InsertBookReview,
  type AuthorEarnings, type InsertAuthorEarnings,
  type LuluPrintJob, type InsertLuluPrintJob,
  type Podcast, type InsertPodcast,
  type PodcastEpisode, type InsertPodcastEpisode,
  type PuzzleBook, type InsertPuzzleBook,
  type Puzzle, type InsertPuzzle,
} from "@shared/schema";
import { 
  users, forumCategories, forumThreads, forumPosts, forumReactions,
  books, aiChatSessions, aiChatMessages,
  marketplaceCategories, marketplaceProducts,
  marketplaceListings, bookEditions, bookOrders, orderItems, bookReviews, authorEarnings, luluPrintJobs,
  publishingProjects,
  recoveryPrograms, programModules, programLessons,
  userEnrollments, dailyCheckins, userStreaks,
  userHabits, habitLogs, recoveryHabits,
  creditWallets, creditLedger,
  recoveryMilestones, userMilestoneLogs,
  userProfiles,
  accountabilityPods, podMembers,
  recoveryReminders, reminderLogs,
  standGoals, standLogs,
  hydrationGoals, hydrationLogs,
  exerciseGoals, exerciseLogs,
  userSettings,
  therapistProfiles, patientAssignments, therapySessions, exercisePrescriptions,
  activityPosts, activityMedia, activityReactions, activityComments,
  therapeuticExercises, exerciseSessions, exerciseScores,
  speechExercises, cognitiveExercises,
  wearableConnections, wearableMetrics,
  conversations, conversationParticipants, directMessages,
  forumPostMedia, videoSessions, videoSessionParticipants, seoPages,
  blogPosts, blogPostReactions, blogPostComments,
  podcasts, podcastEpisodes,
  puzzleBooks, puzzles,
  recoveryBlogPosts,
  type RecoveryBlogPost,
  type AccountabilityPod, type InsertAccountabilityPod,
  type PodMember, type InsertPodMember,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, ilike, or, gte, lt } from "drizzle-orm";
import { textArraySql } from "./neverZeroAuditSql";

export class DailyCheckinAlreadyExistsError extends Error {
  constructor() {
    super("Already checked in today");
    this.name = "DailyCheckinAlreadyExistsError";
  }
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  getForumCategories(): Promise<ForumCategory[]>;
  createForumCategory(category: InsertForumCategory): Promise<ForumCategory>;
  updateForumCategory(id: number, updates: Partial<InsertForumCategory>): Promise<ForumCategory | undefined>;
  deleteForumCategory(id: number): Promise<boolean>;
  getForumThreads(categoryId?: number, limit?: number, offset?: number): Promise<ForumThread[]>;
  getForumThread(id: number): Promise<ForumThread | undefined>;
  createForumThread(thread: InsertForumThread): Promise<ForumThread>;
  updateForumThread(id: number, updates: Partial<InsertForumThread>): Promise<ForumThread | undefined>;
  deleteForumThread(id: number): Promise<boolean>;
  getForumPosts(threadId: number, limit?: number, offset?: number): Promise<ForumPost[]>;
  getForumPost(id: number): Promise<ForumPost | undefined>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  updateForumPost(id: number, content: string): Promise<ForumPost | undefined>;
  deleteForumPost(id: number): Promise<boolean>;
  togglePostReaction(postId: number, userId: string, reactionType: string): Promise<{ added: boolean }>;
  getPostReactions(postId: number): Promise<{ reactionType: string; count: number }[]>;
  getUserReaction(postId: number, userId: string): Promise<string | null>;
  getBooks(): Promise<Book[]>;
  getBookBySlug(slug: string): Promise<Book | undefined>;
  // Puzzle Studio
  getPuzzleBooks(ownerId: string): Promise<PuzzleBook[]>;
  getPuzzleBook(id: number): Promise<PuzzleBook | undefined>;
  createPuzzleBook(book: InsertPuzzleBook): Promise<PuzzleBook>;
  updatePuzzleBook(id: number, updates: Partial<InsertPuzzleBook>): Promise<PuzzleBook | undefined>;
  deletePuzzleBook(id: number): Promise<boolean>;
  getPuzzles(bookId: number): Promise<Puzzle[]>;
  getPuzzle(id: number): Promise<Puzzle | undefined>;
  createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle>;
  updatePuzzle(id: number, updates: Partial<InsertPuzzle>): Promise<Puzzle | undefined>;
  deletePuzzle(id: number): Promise<boolean>;
  reorderPuzzles(bookId: number, orderedIds: number[]): Promise<void>;
  createChatSession(session: InsertAiChatSession): Promise<AiChatSession>;
  getChatSession(id: number): Promise<AiChatSession | undefined>;
  getChatMessages(sessionId: number): Promise<AiChatMessage[]>;
  createChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage>;
  getCategoryStats(): Promise<{ categoryId: number; threadCount: number; postCount: number }[]>;
  getMarketplaceCategories(): Promise<MarketplaceCategory[]>;
  getMarketplaceCategory(id: number): Promise<MarketplaceCategory | undefined>;
  getMarketplaceProducts(filters?: { categoryId?: number; search?: string; featured?: boolean }): Promise<MarketplaceProduct[]>;
  getMarketplaceProduct(id: number): Promise<MarketplaceProduct | undefined>;
  createMarketplaceCategory(data: InsertMarketplaceCategory): Promise<MarketplaceCategory>;
  createMarketplaceProduct(data: InsertMarketplaceProduct): Promise<MarketplaceProduct>;
  getPublishingProjects(userId: string): Promise<PublishingProject[]>;
  createPublishingProject(project: InsertPublishingProject): Promise<PublishingProject>;
  getPublishingProject(id: number): Promise<PublishingProject | undefined>;
  updatePublishingProject(id: number, updates: Partial<PublishingProject>): Promise<PublishingProject | undefined>;
  deletePublishingProject(id: number): Promise<boolean>;
  
  // Recovery Dashboard
  getRecoveryPrograms(): Promise<any[]>;
  getRecoveryProgramBySlug(slug: string): Promise<any | undefined>;
  getUserEnrollment(userId: string): Promise<any | undefined>;
  createUserEnrollment(enrollment: any): Promise<any>;
  updateUserEnrollment(id: number, updates: any): Promise<any | undefined>;
  getDailyCheckin(userId: string, date: Date): Promise<any | undefined>;
  createDailyCheckin(checkin: any): Promise<any>;
  createDailyCheckinWithRewards(checkin: any): Promise<{
    checkin: any;
    streak: { current: number; longest: number };
    creditsEarned: number;
    streakBonusLabel: string | null;
  }>;
  getRecentCheckins(userId: string, days: number): Promise<any[]>;
  getUserStreak(userId: string): Promise<any | undefined>;
  createOrUpdateUserStreak(userId: string, data: any): Promise<any>;
  getUserHabits(userId: string): Promise<any[]>;
  createUserHabit(habit: any): Promise<any>;
  logHabitCompletion(userHabitId: number, date: Date, notes: string | undefined, userId: string): Promise<any>;
  getRecoveryMilestones(): Promise<any[]>;
  getUserMilestones(userId: string): Promise<any[]>;
  awardMilestone(userId: string, milestoneId: number, notes?: string): Promise<any>;
  getDefaultHabits(): Promise<any[]>;
  
  // User Profile
  getUserProfile(userId: string): Promise<any | undefined>;
  createUserProfile(profile: any): Promise<any>;
  updateUserProfile(userId: string, updates: any): Promise<any | undefined>;
  
  // Achievements
  getUserAchievements(userId: string): Promise<any[]>;
  getAvailableMilestones(): Promise<any[]>;
  checkAndAwardStreakMilestones(userId: string, currentStreak: number): Promise<any[]>;
  
  // Accountability Pods
  getAccountabilityPod(podId: number): Promise<AccountabilityPod | null>;
  getUserPod(userId: string): Promise<AccountabilityPod | null>;
  getPodMembers(podId: number): Promise<any[]>;
  createPod(pod: InsertAccountabilityPod): Promise<AccountabilityPod>;
  joinPod(userId: string, podId: number): Promise<PodMember>;
  leavePod(userId: string, podId: number): Promise<void>;
  getOpenPods(): Promise<AccountabilityPod[]>;
  getRecentPodActivity(podId: number, limit?: number): Promise<any[]>;
  
  // Journal
  getJournalEntries(userId: string): Promise<any[]>;
  createJournalEntry(userId: string, data: any): Promise<any>;
  getSharedEntries(filter?: string): Promise<any[]>;
  getJournalInsights(userId: string): Promise<any>;
  updateJournalEntry(id: number, userId: string, updates: any): Promise<any>;
  
  // Reminders & Wellness
  getUserReminders(userId: string): Promise<any[]>;
  createReminder(reminder: any): Promise<any>;
  updateReminder(id: number, updates: any): Promise<any>;
  deleteReminder(id: number): Promise<boolean>;
  logReminderAction(log: any): Promise<any>;
  
  // Stand Goals
  getUserStandGoal(userId: string): Promise<any | undefined>;
  createOrUpdateStandGoal(userId: string, goal: any): Promise<any>;
  logStand(userId: string, duration?: number): Promise<any>;
  getTodayStandCount(userId: string): Promise<number>;
  
  // Hydration Goals
  getUserHydrationGoal(userId: string): Promise<any | undefined>;
  createOrUpdateHydrationGoal(userId: string, goal: any): Promise<any>;
  logHydration(userId: string, amount: number): Promise<any>;
  getTodayHydration(userId: string): Promise<number>;
  
  // Exercise Goals
  getUserExerciseGoal(userId: string): Promise<any | undefined>;
  createOrUpdateExerciseGoal(userId: string, goal: any): Promise<any>;
  logExercise(userId: string, type: string, duration: number, intensity?: string): Promise<any>;
  getTodayExercise(userId: string): Promise<number>;
  
  // User Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createOrUpdateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  updateUsername(userId: string, username: string): Promise<UserSettings | undefined>;
  isUsernameAvailable(username: string): Promise<boolean>;
  
  // Activity Wall
  getActivityPosts(options?: { limit?: number; offset?: number; visibility?: string; podId?: number; authorId?: string }): Promise<ActivityPost[]>;
  getActivityPost(id: number): Promise<ActivityPost | undefined>;
  createActivityPost(post: InsertActivityPost): Promise<ActivityPost>;
  updateActivityPost(id: number, updates: Partial<InsertActivityPost>): Promise<ActivityPost | undefined>;
  deleteActivityPost(id: number): Promise<boolean>;
  addActivityMedia(media: InsertActivityMedia): Promise<ActivityMedia>;
  getActivityMedia(postId: number): Promise<ActivityMedia[]>;
  toggleActivityReaction(postId: number, userId: string, reactionType: string): Promise<{ added: boolean }>;
  getActivityReactions(postId: number): Promise<{ reactionType: string; count: number }[]>;
  getActivityComments(postId: number): Promise<ActivityComment[]>;
  createActivityComment(comment: InsertActivityComment): Promise<ActivityComment>;
  deleteActivityComment(id: number): Promise<boolean>;
  
  // Therapist System
  getTherapistProfile(userId: string): Promise<TherapistProfile | undefined>;
  createTherapistProfile(profile: InsertTherapistProfile): Promise<TherapistProfile>;
  updateTherapistProfile(userId: string, updates: Partial<InsertTherapistProfile>): Promise<TherapistProfile | undefined>;
  getVerifiedTherapists(filters?: { specialization?: string; acceptingPatients?: boolean }): Promise<TherapistProfile[]>;
  getPatientAssignments(therapistId: string): Promise<PatientAssignment[]>;
  getTherapistForPatient(patientId: string): Promise<PatientAssignment | undefined>;
  createPatientAssignment(assignment: InsertPatientAssignment): Promise<PatientAssignment>;
  updatePatientAssignment(id: number, updates: Partial<InsertPatientAssignment>): Promise<PatientAssignment | undefined>;
  getTherapySessions(assignmentId?: number, userId?: string): Promise<TherapySession[]>;
  createTherapySession(session: InsertTherapySession): Promise<TherapySession>;
  updateTherapySession(id: number, updates: Partial<TherapySession>): Promise<TherapySession | undefined>;
  getExercisePrescriptions(patientId: string): Promise<ExercisePrescription[]>;
  createExercisePrescription(prescription: InsertExercisePrescription): Promise<ExercisePrescription>;
  
  // Therapeutic Exercises
  getTherapeuticExercises(filters?: { category?: string; difficulty?: string }): Promise<TherapeuticExercise[]>;
  getTherapeuticExercise(id: number): Promise<TherapeuticExercise | undefined>;
  getTherapeuticExerciseBySlug(slug: string): Promise<TherapeuticExercise | undefined>;
  createTherapeuticExercise(exercise: InsertTherapeuticExercise): Promise<TherapeuticExercise>;
  recordExerciseSession(session: InsertExerciseSession): Promise<ExerciseSession>;
  getExerciseSessions(userId: string, exerciseId?: number): Promise<ExerciseSession[]>;
  getUserExerciseScores(userId: string): Promise<ExerciseScore[]>;
  updateExerciseScore(userId: string, exerciseId: number, score: number, accuracy: number, time: number): Promise<ExerciseScore>;
  getSpeechExercises(category?: string): Promise<SpeechExercise[]>;
  getCognitiveExercises(category?: string): Promise<CognitiveExercise[]>;
  
  // Direct Messaging
  getConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation, participantIds: string[]): Promise<Conversation>;
  getConversationMessages(conversationId: number, limit?: number, offset?: number): Promise<DirectMessage[]>;
  sendDirectMessage(message: InsertDirectMessage): Promise<DirectMessage>;
  markMessagesAsRead(conversationId: number, userId: string): Promise<void>;
  
  // Video Sessions
  getVideoSessions(userId: string, status?: string): Promise<VideoSession[]>;
  getVideoSession(id: number): Promise<VideoSession | undefined>;
  createVideoSession(session: InsertVideoSession): Promise<VideoSession>;
  updateVideoSession(id: number, updates: Partial<VideoSession>): Promise<VideoSession | undefined>;
  
  // Forum Media
  addForumPostMedia(media: InsertForumPostMedia): Promise<ForumPostMedia>;
  getForumPostMedia(postId: number): Promise<ForumPostMedia[]>;
  
  // SEO
  getSeoPage(slug: string): Promise<SeoPage | undefined>;
  getAllSeoPages(): Promise<SeoPage[]>;
  createOrUpdateSeoPage(page: InsertSeoPage & { slug: string }): Promise<SeoPage>;
  
  // Extended Vitals
  getVitals(userId: string): Promise<any[]>;
  createVital(vital: any): Promise<any>;
  
  // Extended Wearables
  getWearableConnections(userId: string): Promise<WearableConnection[]>;
  createWearableConnection(connection: any): Promise<WearableConnection>;
  deleteWearableConnection(id: number): Promise<boolean>;
  syncWearableData(connectionId: number): Promise<void>;
  getWearableMetrics(userId: string): Promise<WearableMetric[]>;
  getWearableTodayStats(userId: string): Promise<any>;
  
  // Social Network
  getFollowers(userId: string): Promise<any[]>;
  getFollowing(userId: string): Promise<any[]>;
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  searchUsers(query: string): Promise<User[]>;
  
  // Extended Messages
  getMessages(conversationId: number): Promise<DirectMessage[]>;
  createMessage(message: any): Promise<DirectMessage>;
  
  // Extended Video
  joinVideoSession(sessionId: number, userId: string): Promise<void>;
  endVideoSession(sessionId: number): Promise<void>;
  
  // Therapist Marketplace
  getTherapistStorefronts(): Promise<any[]>;
  getTherapistProducts(therapistId: string): Promise<any[]>;
  createTherapistProduct(product: any): Promise<any>;
  getTherapistEarnings(therapistId: string): Promise<any>;
  purchaseTherapistProduct(userId: string, productId: number): Promise<string>;
  
  // Admin Recovery Plans
  getRecoveryPlans(): Promise<any[]>;
  createRecoveryPlan(plan: any): Promise<any>;
  deleteRecoveryPlan(id: number): Promise<boolean>;
  assignRecoveryPlan(planId: number, userIds: string[]): Promise<void>;
  
  // Blogging Suite
  getBlogPosts(filters?: { authorId?: string; status?: string; featured?: boolean }): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  publishBlogPost(id: number): Promise<BlogPost | undefined>;
  getUserBlogPosts(userId: string): Promise<BlogPost[]>;
  toggleBlogReaction(postId: number, userId: string, reactionType: string): Promise<{ added: boolean }>;
  getBlogComments(postId: number): Promise<BlogPostComment[]>;
  createBlogComment(comment: InsertBlogPostComment): Promise<BlogPostComment>;
  deleteBlogComment(id: number): Promise<boolean>;
  incrementBlogViews(id: number): Promise<void>;
  
  // Book Marketplace
  getMarketplaceListings(filters?: { genre?: string; sortBy?: string; featuredOnly?: boolean; status?: string }): Promise<MarketplaceListing[]>;
  getMarketplaceListing(id: number): Promise<MarketplaceListing | undefined>;
  getAuthorListings(authorId: string): Promise<MarketplaceListing[]>;
  createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing>;
  updateMarketplaceListing(id: number, updates: Partial<MarketplaceListing>): Promise<MarketplaceListing | undefined>;
  getBookEditions(listingId: number): Promise<BookEdition[]>;
  getBookEdition(id: number): Promise<BookEdition | undefined>;
  createBookEdition(edition: InsertBookEdition): Promise<BookEdition>;
  getBookReviews(listingId: number): Promise<BookReview[]>;
  createBookReview(review: InsertBookReview): Promise<BookReview>;
  updateListingRating(listingId: number): Promise<void>;
  createBookOrder(order: InsertBookOrder): Promise<BookOrder>;
  getBookOrder(id: number): Promise<BookOrder | undefined>;
  getBookOrderBySessionId(sessionId: string): Promise<BookOrder | undefined>;
  getBookOrderByOrderNumber(orderNumber: string): Promise<BookOrder | undefined>;
  updateBookOrder(id: number, updates: Partial<BookOrder>): Promise<BookOrder | undefined>;
  getCustomerOrders(customerId: string): Promise<BookOrder[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  updateOrderItem(id: number, updates: Partial<OrderItem>): Promise<OrderItem | undefined>;
  createLuluPrintJob(job: InsertLuluPrintJob): Promise<LuluPrintJob>;
  getLuluPrintJob(id: number): Promise<LuluPrintJob | undefined>;
  getLuluPrintJobsByOrder(orderId: number): Promise<LuluPrintJob[]>;
  updateLuluPrintJob(id: number, updates: Partial<LuluPrintJob>): Promise<LuluPrintJob | undefined>;
  createAuthorEarning(earning: InsertAuthorEarnings): Promise<AuthorEarnings>;
  getAuthorEarnings(authorId: string): Promise<AuthorEarnings[]>;
  getAuthorEarningsSummary(authorId: string): Promise<{ total: number; pending: number; available: number; paid: number }>;
  getAuthorAnalytics(authorId: string): Promise<{ totalSales: number; totalRevenue: number; topBooks: any[] }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getForumCategories(): Promise<ForumCategory[]> {
    return db.select().from(forumCategories).orderBy(forumCategories.order);
  }

  async createForumCategory(category: InsertForumCategory): Promise<ForumCategory> {
    const [newCategory] = await db.insert(forumCategories).values(category).returning();
    return newCategory;
  }

  async updateForumCategory(id: number, updates: Partial<InsertForumCategory>): Promise<ForumCategory | undefined> {
    const [category] = await db.update(forumCategories)
      .set(updates)
      .where(eq(forumCategories.id, id))
      .returning();
    return category;
  }

  async deleteForumCategory(id: number): Promise<boolean> {
    const result = await db.delete(forumCategories).where(eq(forumCategories.id, id));
    return true;
  }

  async getForumThreads(categoryId?: number, limit = 20, offset = 0): Promise<ForumThread[]> {
    if (categoryId) {
      return db.select().from(forumThreads)
        .where(eq(forumThreads.categoryId, categoryId))
        .orderBy(desc(forumThreads.lastActivityAt))
        .limit(limit)
        .offset(offset);
    }
    return db.select().from(forumThreads)
      .orderBy(desc(forumThreads.lastActivityAt))
      .limit(limit)
      .offset(offset);
  }

  async getForumThread(id: number): Promise<ForumThread | undefined> {
    const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.id, id));
    if (thread) {
      await db.update(forumThreads)
        .set({ viewCount: sql`${forumThreads.viewCount} + 1` })
        .where(eq(forumThreads.id, id));
    }
    return thread;
  }

  async createForumThread(thread: InsertForumThread): Promise<ForumThread> {
    const [newThread] = await db.insert(forumThreads).values(thread).returning();
    return newThread;
  }

  async updateForumThread(id: number, updates: Partial<InsertForumThread>): Promise<ForumThread | undefined> {
    const [thread] = await db.update(forumThreads)
      .set(updates)
      .where(eq(forumThreads.id, id))
      .returning();
    return thread;
  }

  async deleteForumThread(id: number): Promise<boolean> {
    await db.delete(forumThreads).where(eq(forumThreads.id, id));
    return true;
  }

  async getForumPosts(threadId: number, limit = 50, offset = 0): Promise<ForumPost[]> {
    return db.select().from(forumPosts)
      .where(eq(forumPosts.threadId, threadId))
      .orderBy(forumPosts.createdAt)
      .limit(limit)
      .offset(offset);
  }

  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    return post;
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const [newPost] = await db.insert(forumPosts).values(post).returning();
    await db.update(forumThreads)
      .set({ 
        replyCount: sql`${forumThreads.replyCount} + 1`,
        lastActivityAt: new Date()
      })
      .where(eq(forumThreads.id, post.threadId));
    return newPost;
  }

  async updateForumPost(id: number, content: string): Promise<ForumPost | undefined> {
    const [post] = await db.update(forumPosts)
      .set({ content, isEdited: true, editedAt: new Date() })
      .where(eq(forumPosts.id, id))
      .returning();
    return post;
  }

  async deleteForumPost(id: number): Promise<boolean> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    if (post) {
      await db.delete(forumPosts).where(eq(forumPosts.id, id));
      await db.update(forumThreads)
        .set({ replyCount: sql`GREATEST(${forumThreads.replyCount} - 1, 0)` })
        .where(eq(forumThreads.id, post.threadId));
    }
    return true;
  }

  async togglePostReaction(postId: number, userId: string, reactionType: string): Promise<{ added: boolean }> {
    const existing = await db.select().from(forumReactions)
      .where(and(
        eq(forumReactions.postId, postId),
        eq(forumReactions.userId, userId)
      ));
    
    if (existing.length > 0) {
      if (existing[0].reactionType === reactionType) {
        await db.delete(forumReactions).where(eq(forumReactions.id, existing[0].id));
        await db.update(forumPosts)
          .set({ likeCount: sql`GREATEST(${forumPosts.likeCount} - 1, 0)` })
          .where(eq(forumPosts.id, postId));
        return { added: false };
      } else {
        await db.update(forumReactions)
          .set({ reactionType })
          .where(eq(forumReactions.id, existing[0].id));
        return { added: true };
      }
    } else {
      await db.insert(forumReactions).values({ postId, userId, reactionType });
      if (reactionType === 'like') {
        await db.update(forumPosts)
          .set({ likeCount: sql`${forumPosts.likeCount} + 1` })
          .where(eq(forumPosts.id, postId));
      }
      return { added: true };
    }
  }

  async getPostReactions(postId: number): Promise<{ reactionType: string; count: number }[]> {
    const result = await db.select({
      reactionType: forumReactions.reactionType,
      count: count()
    })
      .from(forumReactions)
      .where(eq(forumReactions.postId, postId))
      .groupBy(forumReactions.reactionType);
    
    return result.map(r => ({ reactionType: r.reactionType, count: Number(r.count) }));
  }

  async getUserReaction(postId: number, userId: string): Promise<string | null> {
    const [reaction] = await db.select().from(forumReactions)
      .where(and(
        eq(forumReactions.postId, postId),
        eq(forumReactions.userId, userId)
      ));
    return reaction?.reactionType || null;
  }

  async getBooks(): Promise<Book[]> {
    return db.select().from(books)
      .where(eq(books.isPublished, true))
      .orderBy(books.order);
  }

  async getBookBySlug(slug: string): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.slug, slug));
    return book;
  }

  async createChatSession(session: InsertAiChatSession): Promise<AiChatSession> {
    const [newSession] = await db.insert(aiChatSessions).values(session).returning();
    return newSession;
  }

  async getChatSession(id: number): Promise<AiChatSession | undefined> {
    const [session] = await db.select().from(aiChatSessions).where(eq(aiChatSessions.id, id));
    return session;
  }

  async getChatMessages(sessionId: number): Promise<AiChatMessage[]> {
    return db.select().from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, sessionId))
      .orderBy(aiChatMessages.createdAt);
  }

  async createChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage> {
    const [newMessage] = await db.insert(aiChatMessages).values(message).returning();
    await db.update(aiChatSessions)
      .set({ 
        messageCount: sql`${aiChatSessions.messageCount} + 1`,
        lastMessageAt: new Date()
      })
      .where(eq(aiChatSessions.id, message.sessionId));
    return newMessage;
  }

  async getCategoryStats(): Promise<{ categoryId: number; threadCount: number; postCount: number }[]> {
    const stats = await db.select({
      categoryId: forumCategories.id,
      threadCount: sql<number>`COALESCE((SELECT COUNT(*) FROM forum_threads ft WHERE ft.category_id = forum_categories.id), 0)::int`,
      postCount: sql<number>`COALESCE((SELECT COUNT(*) FROM forum_posts fp JOIN forum_threads ft ON fp.thread_id = ft.id WHERE ft.category_id = forum_categories.id), 0)::int`
    }).from(forumCategories);
    
    return stats.map(s => ({
      categoryId: s.categoryId,
      threadCount: Number(s.threadCount),
      postCount: Number(s.postCount)
    }));
  }

  async getMarketplaceCategories(): Promise<MarketplaceCategory[]> {
    return db.select().from(marketplaceCategories)
      .where(eq(marketplaceCategories.isActive, true))
      .orderBy(marketplaceCategories.order);
  }

  async getMarketplaceCategory(id: number): Promise<MarketplaceCategory | undefined> {
    const [category] = await db.select().from(marketplaceCategories)
      .where(eq(marketplaceCategories.id, id));
    return category;
  }

  async getMarketplaceProducts(filters?: { categoryId?: number; search?: string; featured?: boolean }): Promise<MarketplaceProduct[]> {
    const conditions = [eq(marketplaceProducts.isActive, true)];

    if (filters?.categoryId) {
      conditions.push(eq(marketplaceProducts.categoryId, filters.categoryId));
    }

    if (filters?.featured !== undefined) {
      conditions.push(eq(marketplaceProducts.isFeatured, filters.featured));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(marketplaceProducts.title, searchTerm),
          ilike(marketplaceProducts.description, searchTerm),
          ilike(marketplaceProducts.brand, searchTerm)
        )!
      );
    }

    return db.select().from(marketplaceProducts)
      .where(and(...conditions))
      .orderBy(desc(marketplaceProducts.isFeatured), marketplaceProducts.title);
  }

  async getMarketplaceProduct(id: number): Promise<MarketplaceProduct | undefined> {
    const [product] = await db.select().from(marketplaceProducts)
      .where(eq(marketplaceProducts.id, id));
    return product;
  }

  async createMarketplaceCategory(data: InsertMarketplaceCategory): Promise<MarketplaceCategory> {
    const [category] = await db.insert(marketplaceCategories).values(data).returning();
    return category;
  }

  async createMarketplaceProduct(data: InsertMarketplaceProduct): Promise<MarketplaceProduct> {
    const [product] = await db.insert(marketplaceProducts).values(data).returning();
    return product;
  }

  async getPublishingProjects(userId: string): Promise<PublishingProject[]> {
    return db.select().from(publishingProjects)
      .where(eq(publishingProjects.authorId, userId))
      .orderBy(desc(publishingProjects.updatedAt));
  }

  async createPublishingProject(project: InsertPublishingProject): Promise<PublishingProject> {
    const [newProject] = await db.insert(publishingProjects).values(project).returning();
    return newProject;
  }

  async getPublishingProject(id: number): Promise<PublishingProject | undefined> {
    const [project] = await db.select().from(publishingProjects)
      .where(eq(publishingProjects.id, id));
    return project;
  }

  async updatePublishingProject(id: number, updates: Partial<PublishingProject>): Promise<PublishingProject | undefined> {
    const [project] = await db.update(publishingProjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(publishingProjects.id, id))
      .returning();
    return project;
  }

  async deletePublishingProject(id: number): Promise<boolean> {
    await db.delete(publishingProjects).where(eq(publishingProjects.id, id));
    return true;
  }

  // Recovery Dashboard Methods
  async getRecoveryPrograms(): Promise<any[]> {
    return db.select().from(recoveryPrograms)
      .where(eq(recoveryPrograms.isActive, true))
      .orderBy(recoveryPrograms.id);
  }

  async getRecoveryProgramBySlug(slug: string): Promise<any | undefined> {
    const [program] = await db.select().from(recoveryPrograms)
      .where(eq(recoveryPrograms.slug, slug));
    return program;
  }

  async getUserEnrollment(userId: string): Promise<any | undefined> {
    const [enrollment] = await db.select().from(userEnrollments)
      .where(eq(userEnrollments.userId, userId));
    if (enrollment) {
      const [program] = await db.select().from(recoveryPrograms)
        .where(eq(recoveryPrograms.id, enrollment.programId));
      const modules = await db.select().from(programModules)
        .where(eq(programModules.programId, enrollment.programId))
        .orderBy(programModules.order);
      let currentModule = null;
      let currentLesson = null;
      if (enrollment.currentModuleId) {
        [currentModule] = await db.select().from(programModules)
          .where(eq(programModules.id, enrollment.currentModuleId));
      }
      if (enrollment.currentLessonId) {
        [currentLesson] = await db.select().from(programLessons)
          .where(eq(programLessons.id, enrollment.currentLessonId));
      }
      return { ...enrollment, program, modules, currentModule, currentLesson };
    }
    return undefined;
  }

  async createUserEnrollment(enrollment: any): Promise<any> {
    const [newEnrollment] = await db.insert(userEnrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateUserEnrollment(id: number, updates: any): Promise<any | undefined> {
    const [enrollment] = await db.update(userEnrollments)
      .set({ ...updates, lastActivityAt: new Date() })
      .where(eq(userEnrollments.id, id))
      .returning();
    return enrollment;
  }

  async getDailyCheckin(userId: string, date: Date): Promise<any | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const [checkin] = await db.select().from(dailyCheckins)
      .where(and(
        eq(dailyCheckins.userId, userId),
        gte(dailyCheckins.checkinDate, startOfDay),
        sql`${dailyCheckins.checkinDate} <= ${endOfDay}`
      ));
    return checkin;
  }

  async createDailyCheckin(checkin: any): Promise<any> {
    const [newCheckin] = await db.insert(dailyCheckins).values(checkin).returning();
    return newCheckin;
  }

  /**
   * Persist a check-in, its streak, and its reward as one unit. The advisory
   * lock closes the race between two clicks before the check-in row exists;
   * the transaction makes any reward/streak failure roll the check-in back too.
   */
  async createDailyCheckinWithRewards(checkin: any): Promise<{
    checkin: any;
    streak: { current: number; longest: number };
    creditsEarned: number;
    streakBonusLabel: string | null;
  }> {
    const startOfDay = new Date(checkin.checkinDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkin.checkinDate);
    endOfDay.setHours(23, 59, 59, 999);
    const yesterday = new Date(startOfDay);
    yesterday.setDate(yesterday.getDate() - 1);
    const lockKey = `daily-checkin:${checkin.userId}:${startOfDay.toISOString()}`;

    return db.transaction(async (tx) => {
      await tx.execute(sql`
        SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
      `);

      const [existing] = await tx.select().from(dailyCheckins).where(and(
        eq(dailyCheckins.userId, checkin.userId),
        gte(dailyCheckins.checkinDate, startOfDay),
        sql`${dailyCheckins.checkinDate} <= ${endOfDay}`,
      ));
      if (existing) {
        throw new DailyCheckinAlreadyExistsError();
      }

      const [savedCheckin] = await tx.insert(dailyCheckins).values(checkin).returning();
      const streakRows = await tx.execute(sql`
        SELECT current_streak, longest_streak, last_activity_date, total_active_days
        FROM user_streaks
        WHERE user_id = ${checkin.userId}
        FOR UPDATE
      `);
      const previous = (streakRows.rows[0] as any) || null;
      const lastActivity = previous?.last_activity_date
        ? new Date(previous.last_activity_date)
        : null;
      if (lastActivity) lastActivity.setHours(0, 0, 0, 0);

      const current = lastActivity?.getTime() === yesterday.getTime()
        ? Number(previous.current_streak || 0) + 1
        : 1;
      const longest = Math.max(current, Number(previous?.longest_streak || 0));
      const totalActiveDays = Number(previous?.total_active_days || 0) + 1;

      await tx.execute(sql`
        INSERT INTO user_streaks
          (user_id, current_streak, longest_streak, last_activity_date, total_active_days, updated_at)
        VALUES
          (${checkin.userId}, ${current}, ${longest}, ${checkin.checkinDate}, ${totalActiveDays}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          current_streak = ${current},
          longest_streak = ${longest},
          last_activity_date = ${checkin.checkinDate},
          total_active_days = ${totalActiveDays},
          updated_at = NOW()
      `);

      let creditsEarned = 10;
      let streakBonusLabel: string | null = null;
      if (current === 7) {
        creditsEarned += 25;
        streakBonusLabel = '7-day Streak';
      } else if (current === 30) {
        creditsEarned += 50;
        streakBonusLabel = '30-day Streak';
      } else if (current === 66) {
        creditsEarned += 100;
        streakBonusLabel = '66-day Transformation';
      }

      // Keep wallet creation, balance update, and ledger entry in this same
      // transaction. This also avoids the read/modify/write race in addCredits.
      await tx.execute(sql`
        INSERT INTO credit_wallets
          (user_id, balance, bonus_credits, lifetime_earned, lifetime_spent)
        VALUES (${checkin.userId}, 500, 0, 500, 0)
        ON CONFLICT (user_id) DO NOTHING
      `);
      const walletRows = await tx.execute(sql`
        UPDATE credit_wallets
        SET bonus_credits = bonus_credits + ${creditsEarned},
            lifetime_earned = lifetime_earned + ${creditsEarned},
            updated_at = NOW()
        WHERE user_id = ${checkin.userId}
        RETURNING balance + bonus_credits AS total
      `);
      const newTotal = Number((walletRows.rows[0] as any)?.total ?? creditsEarned);
      await tx.execute(sql`
        INSERT INTO credit_ledger
          (user_id, transaction_type, amount, balance_after, description, feature_key, metadata)
        VALUES (
          ${checkin.userId},
          'bonus',
          ${creditsEarned},
          ${newTotal},
          ${`Daily check-in${streakBonusLabel ? ` + ${streakBonusLabel}` : ''}`},
          'bonus',
          ${JSON.stringify({ streak: current })}::jsonb
        )
      `);

      return {
        checkin: savedCheckin,
        streak: { current, longest },
        creditsEarned,
        streakBonusLabel,
      };
    });
  }

  async getRecentCheckins(userId: string, days: number): Promise<any[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return db.select().from(dailyCheckins)
      .where(and(
        eq(dailyCheckins.userId, userId),
        gte(dailyCheckins.checkinDate, daysAgo)
      ))
      .orderBy(desc(dailyCheckins.checkinDate));
  }

  async getUserStreak(userId: string): Promise<any | undefined> {
    const [streak] = await db.select().from(userStreaks)
      .where(eq(userStreaks.userId, userId));
    return streak;
  }

  async createOrUpdateUserStreak(userId: string, data: any): Promise<any> {
    const existing = await this.getUserStreak(userId);
    if (existing) {
      const [streak] = await db.update(userStreaks)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userStreaks.userId, userId))
        .returning();
      return streak;
    }
    const [streak] = await db.insert(userStreaks)
      .values({ userId, ...data })
      .returning();
    return streak;
  }

  async getUserHabits(userId: string): Promise<any[]> {
    const habits = await db.select({
      userHabit: userHabits,
      habit: recoveryHabits
    })
      .from(userHabits)
      .innerJoin(recoveryHabits, eq(userHabits.habitId, recoveryHabits.id))
      .where(eq(userHabits.userId, userId));
    
    const result = [];
    for (const row of habits) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 66);
      const logs = await db.select().from(habitLogs)
        .where(and(
          eq(habitLogs.userHabitId, row.userHabit.id),
          gte(habitLogs.logDate, daysAgo)
        ))
        .orderBy(desc(habitLogs.logDate));
      result.push({
        ...row.userHabit,
        habitName: row.habit.name,
        habitDescription: row.habit.description,
        habitCategory: row.habit.category,
        logs
      });
    }
    return result;
  }

  async createUserHabit(habit: any): Promise<any> {
    const [newHabit] = await db.insert(userHabits).values(habit).returning();
    return newHabit;
  }

  async logHabitCompletion(userHabitId: number, date: Date, notes: string | undefined, userId: string): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const lockKey = `habit-log:${userId}:${userHabitId}:${startOfDay.toISOString()}`;

    return db.transaction(async (tx) => {
      await tx.execute(sql`
        SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
      `);
      const [ownedHabit] = await tx.select({ id: userHabits.id })
        .from(userHabits)
        .where(and(eq(userHabits.id, userHabitId), eq(userHabits.userId, userId)));
      if (!ownedHabit) {
        throw new Error("Habit not found");
      }

      const [existing] = await tx.select().from(habitLogs)
        .where(and(
          eq(habitLogs.userHabitId, userHabitId),
          gte(habitLogs.logDate, startOfDay),
          sql`${habitLogs.logDate} <= ${endOfDay}`,
        ));

      if (existing) {
        const [log] = await tx.update(habitLogs)
          .set({ isCompleted: !existing.isCompleted, notes })
          .where(eq(habitLogs.id, existing.id))
          .returning();

        await tx.update(userHabits)
          .set({
            totalCompletions: log.isCompleted
              ? sql`${userHabits.totalCompletions} + 1`
              : sql`GREATEST(${userHabits.totalCompletions} - 1, 0)`,
          })
          .where(eq(userHabits.id, userHabitId));
        return log;
      }

      const [log] = await tx.insert(habitLogs)
        .values({ userHabitId, logDate: date, isCompleted: true, notes })
        .returning();

      await tx.update(userHabits)
        .set({ totalCompletions: sql`${userHabits.totalCompletions} + 1` })
        .where(eq(userHabits.id, userHabitId));
      return log;
    });
  }

  async getRecoveryMilestones(): Promise<any[]> {
    return db.select().from(recoveryMilestones)
      .orderBy(recoveryMilestones.order);
  }

  async getUserMilestones(userId: string): Promise<any[]> {
    const milestones = await db.select({
      log: userMilestoneLogs,
      milestone: recoveryMilestones
    })
      .from(userMilestoneLogs)
      .innerJoin(recoveryMilestones, eq(userMilestoneLogs.milestoneId, recoveryMilestones.id))
      .where(eq(userMilestoneLogs.userId, userId))
      .orderBy(desc(userMilestoneLogs.achievedAt));
    
    return milestones.map(m => ({
      ...m.log,
      name: m.milestone.name,
      description: m.milestone.description,
      category: m.milestone.category,
      iconUrl: m.milestone.iconUrl,
      badgeUrl: m.milestone.badgeUrl,
      pointsAwarded: m.milestone.pointsAwarded
    }));
  }

  async awardMilestone(userId: string, milestoneId: number, notes?: string): Promise<any> {
    const [existing] = await db.select().from(userMilestoneLogs)
      .where(and(
        eq(userMilestoneLogs.userId, userId),
        eq(userMilestoneLogs.milestoneId, milestoneId)
      ));
    
    if (existing) return existing;
    
    const [log] = await db.insert(userMilestoneLogs)
      .values({ userId, milestoneId, celebrationNotes: notes })
      .returning();
    return log;
  }

  async getDefaultHabits(): Promise<any[]> {
    return db.select().from(recoveryHabits)
      .where(eq(recoveryHabits.isDefault, true))
      .orderBy(recoveryHabits.id);
  }

  async getUserProfile(userId: string): Promise<any | undefined> {
    const [profile] = await db.select().from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: any): Promise<any> {
    const [newProfile] = await db.insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateUserProfile(userId: string, updates: any): Promise<any | undefined> {
    const [profile] = await db.update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return profile;
  }

  // Accountability Pod Methods
  async getAccountabilityPod(podId: number): Promise<AccountabilityPod | null> {
    const [pod] = await db.select().from(accountabilityPods)
      .where(eq(accountabilityPods.id, podId));
    return pod || null;
  }

  async getUserPod(userId: string): Promise<AccountabilityPod | null> {
    const [membership] = await db.select({
      pod: accountabilityPods
    })
      .from(podMembers)
      .innerJoin(accountabilityPods, eq(podMembers.podId, accountabilityPods.id))
      .where(eq(podMembers.userId, userId));
    return membership?.pod || null;
  }

  async getPodMembers(podId: number): Promise<any[]> {
    const members = await db.select({
      member: podMembers,
      user: users
    })
      .from(podMembers)
      .innerJoin(users, eq(podMembers.userId, users.id))
      .where(eq(podMembers.podId, podId))
      .orderBy(podMembers.joinedAt);
    
    return members.map(m => ({
      ...m.member,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      profileImageUrl: m.user.profileImageUrl,
    }));
  }

  async createPod(pod: InsertAccountabilityPod): Promise<AccountabilityPod> {
    const [newPod] = await db.insert(accountabilityPods)
      .values({ ...pod, memberCount: 0 })
      .returning();
    return newPod;
  }

  async joinPod(userId: string, podId: number): Promise<PodMember> {
    const existing = await db.select().from(podMembers)
      .where(and(
        eq(podMembers.userId, userId),
        eq(podMembers.podId, podId)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [member] = await db.insert(podMembers)
      .values({ userId, podId, role: 'member' })
      .returning();
    
    await db.update(accountabilityPods)
      .set({ memberCount: sql`${accountabilityPods.memberCount} + 1` })
      .where(eq(accountabilityPods.id, podId));
    
    return member;
  }

  async leavePod(userId: string, podId: number): Promise<void> {
    const result = await db.delete(podMembers)
      .where(and(
        eq(podMembers.userId, userId),
        eq(podMembers.podId, podId)
      ));
    
    await db.update(accountabilityPods)
      .set({ memberCount: sql`GREATEST(${accountabilityPods.memberCount} - 1, 0)` })
      .where(eq(accountabilityPods.id, podId));
  }

  async getOpenPods(): Promise<AccountabilityPod[]> {
    return db.select().from(accountabilityPods)
      .where(and(
        eq(accountabilityPods.isActive, true),
        eq(accountabilityPods.isPrivate, false),
        sql`${accountabilityPods.memberCount} < ${accountabilityPods.maxMembers}`
      ))
      .orderBy(desc(accountabilityPods.createdAt));
  }

  async getRecentPodActivity(podId: number, limit: number = 20): Promise<any[]> {
    const members = await db.select().from(podMembers)
      .where(eq(podMembers.podId, podId));
    
    if (members.length === 0) return [];
    
    const memberIds = members.map(m => m.userId);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const checkins = await db.select({
      checkin: dailyCheckins,
      user: users
    })
      .from(dailyCheckins)
      .innerJoin(users, eq(dailyCheckins.userId, users.id))
      .where(and(
        sql`${dailyCheckins.userId} IN ${memberIds}`,
        gte(dailyCheckins.checkinDate, sevenDaysAgo)
      ))
      .orderBy(desc(dailyCheckins.checkinDate))
      .limit(limit);
    
    return checkins.map(c => ({
      id: c.checkin.id,
      type: 'checkin',
      userId: c.checkin.userId,
      firstName: c.user.firstName,
      lastName: c.user.lastName,
      profileImageUrl: c.user.profileImageUrl,
      moodScore: c.checkin.moodScore,
      energyScore: c.checkin.energyScore,
      winsToday: c.checkin.winsToday,
      createdAt: c.checkin.checkinDate,
    }));
  }

  // Achievements Methods
  async getUserAchievements(userId: string): Promise<any[]> {
    const milestones = await db.select({
      log: userMilestoneLogs,
      milestone: recoveryMilestones
    })
      .from(userMilestoneLogs)
      .innerJoin(recoveryMilestones, eq(userMilestoneLogs.milestoneId, recoveryMilestones.id))
      .where(eq(userMilestoneLogs.userId, userId))
      .orderBy(desc(userMilestoneLogs.achievedAt));
    
    return milestones.map(m => ({
      id: m.log.id,
      milestoneId: m.milestone.id,
      userId: m.log.userId,
      name: m.milestone.name,
      description: m.milestone.description,
      category: m.milestone.category,
      iconUrl: m.milestone.iconUrl,
      badgeUrl: m.milestone.badgeUrl,
      pointsAwarded: m.milestone.pointsAwarded,
      celebrationNotes: m.log.celebrationNotes,
      achievedAt: m.log.achievedAt,
    }));
  }

  async getAvailableMilestones(): Promise<any[]> {
    return db.select().from(recoveryMilestones)
      .orderBy(recoveryMilestones.category, recoveryMilestones.order);
  }

  async checkAndAwardStreakMilestones(userId: string, currentStreak: number): Promise<any[]> {
    const streakMilestones = [
      { streak: 3, name: "3 Day Warrior" },
      { streak: 7, name: "Week Warrior" },
      { streak: 14, name: "Two Week Champion" },
      { streak: 21, name: "21 Day Habit Builder" },
      { streak: 30, name: "30 Day Veteran" },
      { streak: 66, name: "66 Day Master" },
      { streak: 100, name: "Century Champion" },
    ];
    
    const awardedMilestones: any[] = [];
    const allMilestones = await this.getAvailableMilestones();
    const userMilestones = await this.getUserMilestones(userId);
    const userMilestoneIds = new Set(userMilestones.map(m => m.milestoneId));
    
    for (const streakMilestone of streakMilestones) {
      if (currentStreak >= streakMilestone.streak) {
        const milestone = allMilestones.find(m => 
          m.name.toLowerCase().includes(streakMilestone.name.toLowerCase()) ||
          (m.category === 'streak' && m.name.includes(String(streakMilestone.streak)))
        );
        
        if (milestone && !userMilestoneIds.has(milestone.id)) {
          const awarded = await this.awardMilestone(userId, milestone.id, `Achieved ${streakMilestone.streak} day streak!`);
          awardedMilestones.push({
            ...awarded,
            name: milestone.name,
            description: milestone.description,
            category: milestone.category,
            pointsAwarded: milestone.pointsAwarded,
          });
        }
      }
    }
    
    return awardedMilestones;
  }

  // Reminders
  async getUserReminders(userId: string): Promise<any[]> {
    return db.select().from(recoveryReminders).where(eq(recoveryReminders.userId, userId)).orderBy(recoveryReminders.time);
  }

  async createReminder(reminder: any): Promise<any> {
    const [result] = await db.insert(recoveryReminders).values(reminder).returning();
    return result;
  }

  async updateReminder(id: number, updates: any): Promise<any> {
    const [result] = await db.update(recoveryReminders).set(updates).where(eq(recoveryReminders.id, id)).returning();
    return result;
  }

  async deleteReminder(id: number): Promise<boolean> {
    const result = await db.delete(recoveryReminders).where(eq(recoveryReminders.id, id));
    return !!result;
  }

  async logReminderAction(log: any): Promise<any> {
    const [result] = await db.insert(reminderLogs).values(log).returning();
    return result;
  }

  // Stand Goals
  async getUserStandGoal(userId: string): Promise<any | undefined> {
    const [goal] = await db.select().from(standGoals).where(eq(standGoals.userId, userId));
    return goal;
  }

  async createOrUpdateStandGoal(userId: string, goal: any): Promise<any> {
    const existing = await this.getUserStandGoal(userId);
    if (existing) {
      const [result] = await db.update(standGoals).set(goal).where(eq(standGoals.userId, userId)).returning();
      return result;
    }
    const [result] = await db.insert(standGoals).values({ ...goal, userId }).returning();
    return result;
  }

  async logStand(userId: string, duration?: number): Promise<any> {
    const [result] = await db.insert(standLogs).values({ userId, duration }).returning();
    return result;
  }

  async getTodayStandCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = await db.select({ count: sql<number>`count(*)` }).from(standLogs).where(and(eq(standLogs.userId, userId), gte(standLogs.standAt, today), lt(standLogs.standAt, tomorrow)));
    return result[0]?.count || 0;
  }

  // Hydration Goals
  async getUserHydrationGoal(userId: string): Promise<any | undefined> {
    const [goal] = await db.select().from(hydrationGoals).where(eq(hydrationGoals.userId, userId));
    return goal;
  }

  async createOrUpdateHydrationGoal(userId: string, goal: any): Promise<any> {
    const existing = await this.getUserHydrationGoal(userId);
    if (existing) {
      const [result] = await db.update(hydrationGoals).set(goal).where(eq(hydrationGoals.userId, userId)).returning();
      return result;
    }
    const [result] = await db.insert(hydrationGoals).values({ ...goal, userId }).returning();
    return result;
  }

  async logHydration(userId: string, amount: number): Promise<any> {
    const [result] = await db.insert(hydrationLogs).values({ userId, amount }).returning();
    return result;
  }

  async getTodayHydration(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = await db.select({ total: sql<number>`sum(amount)` }).from(hydrationLogs).where(and(eq(hydrationLogs.userId, userId), gte(hydrationLogs.loggedAt, today), lt(hydrationLogs.loggedAt, tomorrow)));
    return result[0]?.total || 0;
  }

  // Exercise Goals
  async getUserExerciseGoal(userId: string): Promise<any | undefined> {
    const [goal] = await db.select().from(exerciseGoals).where(eq(exerciseGoals.userId, userId));
    return goal;
  }

  async createOrUpdateExerciseGoal(userId: string, goal: any): Promise<any> {
    const existing = await this.getUserExerciseGoal(userId);
    if (existing) {
      const [result] = await db.update(exerciseGoals).set(goal).where(eq(exerciseGoals.userId, userId)).returning();
      return result;
    }
    const [result] = await db.insert(exerciseGoals).values({ ...goal, userId }).returning();
    return result;
  }

  async logExercise(userId: string, type: string, duration: number, intensity?: string): Promise<any> {
    const [result] = await db.insert(exerciseLogs).values({ userId, type, duration, intensity }).returning();
    return result;
  }

  async getTodayExercise(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = await db.select({ total: sql<number>`sum(duration)` }).from(exerciseLogs).where(and(eq(exerciseLogs.userId, userId), gte(exerciseLogs.loggedAt, today), lt(exerciseLogs.loggedAt, tomorrow)));
    return result[0]?.total || 0;
  }

  // ============================================================================
  // USER SETTINGS
  // ============================================================================

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async createOrUpdateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    if (existing) {
      const [result] = await db.update(userSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();
      return result;
    }
    const [result] = await db.insert(userSettings)
      .values({ ...settings, userId })
      .returning();
    return result;
  }

  async updateUsername(userId: string, username: string): Promise<UserSettings | undefined> {
    const [result] = await db.update(userSettings)
      .set({ username, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
      .returning();
    return result;
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const [existing] = await db.select().from(userSettings).where(eq(userSettings.username, username));
    return !existing;
  }

  // ============================================================================
  // ACTIVITY WALL
  // ============================================================================

  async getActivityPosts(options: { limit?: number; offset?: number; visibility?: string; podId?: number; authorId?: string } = {}): Promise<ActivityPost[]> {
    const { limit = 20, offset = 0, visibility, podId, authorId } = options;
    let query = db.select().from(activityPosts);
    
    const conditions = [];
    if (visibility) conditions.push(eq(activityPosts.visibility, visibility));
    if (podId) conditions.push(eq(activityPosts.podId, podId));
    if (authorId) conditions.push(eq(activityPosts.authorId, authorId));
    
    if (conditions.length > 0) {
      return db.select().from(activityPosts)
        .where(and(...conditions))
        .orderBy(desc(activityPosts.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return db.select().from(activityPosts)
      .orderBy(desc(activityPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getActivityPost(id: number): Promise<ActivityPost | undefined> {
    const [post] = await db.select().from(activityPosts).where(eq(activityPosts.id, id));
    return post;
  }

  async createActivityPost(post: InsertActivityPost): Promise<ActivityPost> {
    const [result] = await db.insert(activityPosts).values(post).returning();
    return result;
  }

  async updateActivityPost(id: number, updates: Partial<InsertActivityPost>): Promise<ActivityPost | undefined> {
    const [result] = await db.update(activityPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(activityPosts.id, id))
      .returning();
    return result;
  }

  async deleteActivityPost(id: number): Promise<boolean> {
    await db.delete(activityPosts).where(eq(activityPosts.id, id));
    return true;
  }

  async addActivityMedia(media: InsertActivityMedia): Promise<ActivityMedia> {
    const [result] = await db.insert(activityMedia).values(media).returning();
    return result;
  }

  async getActivityMedia(postId: number): Promise<ActivityMedia[]> {
    return db.select().from(activityMedia)
      .where(eq(activityMedia.postId, postId))
      .orderBy(activityMedia.order);
  }

  async toggleActivityReaction(postId: number, userId: string, reactionType: string): Promise<{ added: boolean }> {
    const [existing] = await db.select().from(activityReactions)
      .where(and(eq(activityReactions.postId, postId), eq(activityReactions.userId, userId)));
    
    if (existing) {
      if (existing.reactionType === reactionType) {
        await db.delete(activityReactions)
          .where(and(eq(activityReactions.postId, postId), eq(activityReactions.userId, userId)));
        await db.update(activityPosts)
          .set({ likeCount: sql`${activityPosts.likeCount} - 1` })
          .where(eq(activityPosts.id, postId));
        return { added: false };
      } else {
        await db.update(activityReactions)
          .set({ reactionType })
          .where(and(eq(activityReactions.postId, postId), eq(activityReactions.userId, userId)));
        return { added: true };
      }
    }
    
    await db.insert(activityReactions).values({ postId, userId, reactionType });
    await db.update(activityPosts)
      .set({ likeCount: sql`${activityPosts.likeCount} + 1` })
      .where(eq(activityPosts.id, postId));
    return { added: true };
  }

  async getActivityReactions(postId: number): Promise<{ reactionType: string; count: number }[]> {
    const result = await db
      .select({ reactionType: activityReactions.reactionType, count: sql<number>`count(*)` })
      .from(activityReactions)
      .where(eq(activityReactions.postId, postId))
      .groupBy(activityReactions.reactionType);
    return result;
  }

  async getActivityComments(postId: number): Promise<ActivityComment[]> {
    return db.select().from(activityComments)
      .where(eq(activityComments.postId, postId))
      .orderBy(activityComments.createdAt);
  }

  async createActivityComment(comment: InsertActivityComment): Promise<ActivityComment> {
    const [result] = await db.insert(activityComments).values(comment).returning();
    await db.update(activityPosts)
      .set({ commentCount: sql`${activityPosts.commentCount} + 1` })
      .where(eq(activityPosts.id, comment.postId));
    return result;
  }

  async deleteActivityComment(id: number): Promise<boolean> {
    const [comment] = await db.select().from(activityComments).where(eq(activityComments.id, id));
    if (comment) {
      await db.delete(activityComments).where(eq(activityComments.id, id));
      await db.update(activityPosts)
        .set({ commentCount: sql`${activityPosts.commentCount} - 1` })
        .where(eq(activityPosts.id, comment.postId));
    }
    return true;
  }

  // ============================================================================
  // THERAPIST SYSTEM
  // ============================================================================

  async getTherapistProfile(userId: string): Promise<TherapistProfile | undefined> {
    const [profile] = await db.select().from(therapistProfiles).where(eq(therapistProfiles.userId, userId));
    return profile;
  }

  async createTherapistProfile(profile: InsertTherapistProfile): Promise<TherapistProfile> {
    const [result] = await db.insert(therapistProfiles).values(profile).returning();
    return result;
  }

  async updateTherapistProfile(userId: string, updates: Partial<InsertTherapistProfile>): Promise<TherapistProfile | undefined> {
    const [result] = await db.update(therapistProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(therapistProfiles.userId, userId))
      .returning();
    return result;
  }

  async getVerifiedTherapists(filters: { specialization?: string; acceptingPatients?: boolean } = {}): Promise<TherapistProfile[]> {
    const conditions = [eq(therapistProfiles.isVerified, true)];
    if (filters.acceptingPatients !== undefined) {
      conditions.push(eq(therapistProfiles.acceptingPatients, filters.acceptingPatients));
    }
    return db.select().from(therapistProfiles).where(and(...conditions));
  }

  async getPatientAssignments(therapistId: string): Promise<PatientAssignment[]> {
    return db.select().from(patientAssignments)
      .where(eq(patientAssignments.therapistId, therapistId))
      .orderBy(desc(patientAssignments.createdAt));
  }

  async getTherapistForPatient(patientId: string): Promise<PatientAssignment | undefined> {
    const [assignment] = await db.select().from(patientAssignments)
      .where(and(eq(patientAssignments.patientId, patientId), eq(patientAssignments.status, "active")));
    return assignment;
  }

  async createPatientAssignment(assignment: InsertPatientAssignment): Promise<PatientAssignment> {
    const [result] = await db.insert(patientAssignments).values(assignment).returning();
    return result;
  }

  async updatePatientAssignment(id: number, updates: Partial<InsertPatientAssignment>): Promise<PatientAssignment | undefined> {
    const [result] = await db.update(patientAssignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patientAssignments.id, id))
      .returning();
    return result;
  }

  async getTherapySessions(assignmentId?: number, userId?: string): Promise<TherapySession[]> {
    if (assignmentId) {
      return db.select().from(therapySessions)
        .where(eq(therapySessions.assignmentId, assignmentId))
        .orderBy(desc(therapySessions.scheduledAt));
    }
    if (userId) {
      return db.select().from(therapySessions)
        .where(or(eq(therapySessions.therapistId, userId), eq(therapySessions.patientId, userId)))
        .orderBy(desc(therapySessions.scheduledAt));
    }
    return [];
  }

  async createTherapySession(session: InsertTherapySession): Promise<TherapySession> {
    const [result] = await db.insert(therapySessions).values(session).returning();
    return result;
  }

  async updateTherapySession(id: number, updates: Partial<TherapySession>): Promise<TherapySession | undefined> {
    const [result] = await db.update(therapySessions)
      .set(updates)
      .where(eq(therapySessions.id, id))
      .returning();
    return result;
  }

  async getExercisePrescriptions(patientId: string): Promise<ExercisePrescription[]> {
    return db.select().from(exercisePrescriptions)
      .where(and(eq(exercisePrescriptions.patientId, patientId), eq(exercisePrescriptions.isActive, true)))
      .orderBy(exercisePrescriptions.createdAt);
  }

  async createExercisePrescription(prescription: InsertExercisePrescription): Promise<ExercisePrescription> {
    const [result] = await db.insert(exercisePrescriptions).values(prescription).returning();
    return result;
  }

  // ============================================================================
  // THERAPEUTIC EXERCISES
  // ============================================================================

  async getTherapeuticExercises(filters: { category?: string; difficulty?: string } = {}): Promise<TherapeuticExercise[]> {
    const conditions = [eq(therapeuticExercises.isActive, true)];
    if (filters.category) conditions.push(eq(therapeuticExercises.category, filters.category));
    if (filters.difficulty) conditions.push(eq(therapeuticExercises.difficulty, filters.difficulty));
    return db.select().from(therapeuticExercises).where(and(...conditions));
  }

  async getTherapeuticExercise(id: number): Promise<TherapeuticExercise | undefined> {
    const [exercise] = await db.select().from(therapeuticExercises).where(eq(therapeuticExercises.id, id));
    return exercise;
  }

  async getTherapeuticExerciseBySlug(slug: string): Promise<TherapeuticExercise | undefined> {
    const [exercise] = await db.select().from(therapeuticExercises).where(eq(therapeuticExercises.slug, slug));
    return exercise;
  }

  async createTherapeuticExercise(exercise: InsertTherapeuticExercise): Promise<TherapeuticExercise> {
    const [result] = await db.insert(therapeuticExercises).values(exercise).returning();
    return result;
  }

  async recordExerciseSession(session: InsertExerciseSession): Promise<ExerciseSession> {
    const [result] = await db.insert(exerciseSessions).values(session).returning();
    return result;
  }

  async getExerciseSessions(userId: string, exerciseId?: number): Promise<ExerciseSession[]> {
    const conditions = [eq(exerciseSessions.userId, userId)];
    if (exerciseId) conditions.push(eq(exerciseSessions.exerciseId, exerciseId));
    return db.select().from(exerciseSessions)
      .where(and(...conditions))
      .orderBy(desc(exerciseSessions.startedAt))
      .limit(50);
  }

  async getUserExerciseScores(userId: string): Promise<ExerciseScore[]> {
    return db.select().from(exerciseScores).where(eq(exerciseScores.userId, userId));
  }

  async updateExerciseScore(userId: string, exerciseId: number, score: number, accuracy: number, time: number): Promise<ExerciseScore> {
    const [existing] = await db.select().from(exerciseScores)
      .where(and(eq(exerciseScores.userId, userId), eq(exerciseScores.exerciseId, exerciseId)));
    
    if (existing) {
      const newHighScore = Math.max(existing.highScore, score);
      const newTotalSessions = existing.totalSessions + 1;
      const newTotalTime = existing.totalTime + time;
      const newAvgScore = Math.round((existing.averageScore * existing.totalSessions + score) / newTotalSessions);
      const newAvgAccuracy = Math.round((existing.averageAccuracy * existing.totalSessions + accuracy) / newTotalSessions);
      
      const [result] = await db.update(exerciseScores)
        .set({
          highScore: newHighScore,
          totalSessions: newTotalSessions,
          totalTime: newTotalTime,
          averageScore: newAvgScore,
          averageAccuracy: newAvgAccuracy,
          lastPlayedAt: new Date(),
          streak: existing.streak + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(exerciseScores.userId, userId), eq(exerciseScores.exerciseId, exerciseId)))
        .returning();
      return result;
    }
    
    const [result] = await db.insert(exerciseScores).values({
      userId,
      exerciseId,
      highScore: score,
      totalSessions: 1,
      totalTime: time,
      averageScore: score,
      averageAccuracy: accuracy,
      lastPlayedAt: new Date(),
      streak: 1,
    }).returning();
    return result;
  }

  async getSpeechExercises(category?: string): Promise<SpeechExercise[]> {
    if (category) {
      return db.select().from(speechExercises)
        .where(and(eq(speechExercises.category, category), eq(speechExercises.isActive, true)))
        .orderBy(speechExercises.order);
    }
    return db.select().from(speechExercises)
      .where(eq(speechExercises.isActive, true))
      .orderBy(speechExercises.order);
  }

  async getCognitiveExercises(category?: string): Promise<CognitiveExercise[]> {
    if (category) {
      return db.select().from(cognitiveExercises)
        .where(and(eq(cognitiveExercises.category, category), eq(cognitiveExercises.isActive, true)));
    }
    return db.select().from(cognitiveExercises).where(eq(cognitiveExercises.isActive, true));
  }

  // ============================================================================
  // DIRECT MESSAGING
  // ============================================================================

  async getConversations(userId: string): Promise<Conversation[]> {
    const participations = await db.select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId));
    
    if (participations.length === 0) return [];
    
    const conversationIds = participations.map(p => p.conversationId);
    return db.select().from(conversations)
      .where(sql`${conversations.id} IN (${sql.join(conversationIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(conversation: InsertConversation, participantIds: string[]): Promise<Conversation> {
    const [result] = await db.insert(conversations).values(conversation).returning();
    for (const participantId of participantIds) {
      await db.insert(conversationParticipants).values({ conversationId: result.id, userId: participantId });
    }
    return result;
  }

  async getConversationMessages(conversationId: number, limit = 50, offset = 0): Promise<DirectMessage[]> {
    return db.select().from(directMessages)
      .where(eq(directMessages.conversationId, conversationId))
      .orderBy(desc(directMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async sendDirectMessage(message: InsertDirectMessage): Promise<DirectMessage> {
    const [result] = await db.insert(directMessages).values(message).returning();
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));
    return result;
  }

  async markMessagesAsRead(conversationId: number, userId: string): Promise<void> {
    await db.update(directMessages)
      .set({ isRead: true })
      .where(and(
        eq(directMessages.conversationId, conversationId),
        sql`${directMessages.senderId} != ${userId}`
      ));
    await db.update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ));
  }

  // ============================================================================
  // VIDEO SESSIONS
  // ============================================================================

  async getVideoSessions(userId: string, status?: string): Promise<VideoSession[]> {
    const participations = await db.select({ sessionId: videoSessionParticipants.sessionId })
      .from(videoSessionParticipants)
      .where(eq(videoSessionParticipants.userId, userId));
    
    if (participations.length === 0) return [];
    
    const sessionIds = participations.map(p => p.sessionId);
    const conditions = [sql`${videoSessions.id} IN (${sql.join(sessionIds.map(id => sql`${id}`), sql`, `)})`];
    if (status) conditions.push(eq(videoSessions.status, status));
    
    return db.select().from(videoSessions)
      .where(and(...conditions))
      .orderBy(desc(videoSessions.scheduledAt));
  }

  async getVideoSession(id: number): Promise<VideoSession | undefined> {
    const [session] = await db.select().from(videoSessions).where(eq(videoSessions.id, id));
    return session;
  }

  async createVideoSession(session: InsertVideoSession): Promise<VideoSession> {
    const [result] = await db.insert(videoSessions).values(session).returning();
    await db.insert(videoSessionParticipants).values({
      sessionId: result.id,
      userId: session.hostId,
      role: "host",
    });
    return result;
  }

  async updateVideoSession(id: number, updates: Partial<VideoSession>): Promise<VideoSession | undefined> {
    const [result] = await db.update(videoSessions)
      .set(updates)
      .where(eq(videoSessions.id, id))
      .returning();
    return result;
  }

  // ============================================================================
  // FORUM MEDIA
  // ============================================================================

  async addForumPostMedia(media: InsertForumPostMedia): Promise<ForumPostMedia> {
    const [result] = await db.insert(forumPostMedia).values(media).returning();
    return result;
  }

  async getForumPostMedia(postId: number): Promise<ForumPostMedia[]> {
    return db.select().from(forumPostMedia)
      .where(eq(forumPostMedia.postId, postId))
      .orderBy(forumPostMedia.order);
  }

  // ============================================================================
  // SEO
  // ============================================================================

  async getSeoPage(slug: string): Promise<SeoPage | undefined> {
    const [page] = await db.select().from(seoPages).where(eq(seoPages.slug, slug));
    return page;
  }

  async getAllSeoPages(): Promise<SeoPage[]> {
    return db.select().from(seoPages).orderBy(desc(seoPages.priority));
  }

  async createOrUpdateSeoPage(page: InsertSeoPage & { slug: string }): Promise<SeoPage> {
    const existing = await this.getSeoPage(page.slug);
    if (existing) {
      const [result] = await db.update(seoPages)
        .set({ ...page, lastModified: new Date() })
        .where(eq(seoPages.slug, page.slug))
        .returning();
      return result;
    }
    const [result] = await db.insert(seoPages).values(page).returning();
    return result;
  }

  // ============================================================================
  // EXTENDED VITALS
  // ============================================================================

  async getVitals(userId: string): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 7);
    
    const hydrationData = await db.select().from(hydrationLogs)
      .where(and(eq(hydrationLogs.userId, userId), gte(hydrationLogs.loggedAt, yesterday)))
      .orderBy(desc(hydrationLogs.loggedAt));
    
    const exerciseData = await db.select().from(exerciseLogs)
      .where(and(eq(exerciseLogs.userId, userId), gte(exerciseLogs.loggedAt, yesterday)))
      .orderBy(desc(exerciseLogs.loggedAt));
    
    return [
      ...hydrationData.map(h => ({ vitalType: 'hydration', ...h })),
      ...exerciseData.map(e => ({ vitalType: 'exercise', ...e })),
    ];
  }

  async createVital(vital: any): Promise<any> {
    const { userId, type, ...data } = vital;
    if (type === 'hydration') {
      return this.logHydration(userId, data.amount);
    } else if (type === 'exercise') {
      return this.logExercise(userId, data.exerciseType, data.duration, data.intensity);
    } else if (type === 'stand') {
      return this.logStand(userId, data.duration);
    }
    return vital;
  }

  // ============================================================================
  // EXTENDED WEARABLES
  // ============================================================================

  async getWearableConnections(userId: string): Promise<WearableConnection[]> {
    return db.select().from(wearableConnections)
      .where(eq(wearableConnections.userId, userId))
      .orderBy(desc(wearableConnections.createdAt));
  }

  async createWearableConnection(connection: any): Promise<WearableConnection> {
    const [result] = await db.insert(wearableConnections).values(connection).returning();
    return result;
  }

  async deleteWearableConnection(id: number): Promise<boolean> {
    await db.delete(wearableConnections).where(eq(wearableConnections.id, id));
    return true;
  }

  async syncWearableData(connectionId: number): Promise<void> {
    await db.update(wearableConnections)
      .set({ lastSyncAt: new Date() })
      .where(eq(wearableConnections.id, connectionId));
  }

  async getWearableMetrics(userId: string): Promise<WearableMetric[]> {
    return db.select().from(wearableMetrics)
      .where(eq(wearableMetrics.userId, userId))
      .orderBy(desc(wearableMetrics.recordedAt))
      .limit(100);
  }

  async getWearableTodayStats(userId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const metrics = await db.select().from(wearableMetrics)
      .where(and(
        eq(wearableMetrics.userId, userId),
        gte(wearableMetrics.recordedAt, today)
      ));
    
    return {
      steps: metrics.filter(m => m.metricType === 'steps').reduce((sum, m) => sum + Number(m.value), 0),
      heartRate: metrics.find(m => m.metricType === 'heart_rate')?.value || 0,
      calories: metrics.filter(m => m.metricType === 'calories').reduce((sum, m) => sum + Number(m.value), 0),
      activeMinutes: metrics.filter(m => m.metricType === 'active_minutes').reduce((sum, m) => sum + Number(m.value), 0),
    };
  }

  // ============================================================================
  // SOCIAL NETWORK
  // ============================================================================

  async getFollowers(userId: string): Promise<any[]> {
    return [];
  }

  async getFollowing(userId: string): Promise<any[]> {
    return [];
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!query) return [];
    return db.select().from(users)
      .where(or(
        ilike(users.email, `%${query}%`),
        ilike(users.firstName, `%${query}%`),
        ilike(users.lastName, `%${query}%`)
      ))
      .limit(20);
  }

  // ============================================================================
  // EXTENDED MESSAGES
  // ============================================================================

  async getMessages(conversationId: number): Promise<DirectMessage[]> {
    return this.getConversationMessages(conversationId);
  }

  async createMessage(message: any): Promise<DirectMessage> {
    return this.sendDirectMessage(message);
  }

  // ============================================================================
  // EXTENDED VIDEO
  // ============================================================================

  async joinVideoSession(sessionId: number, userId: string): Promise<void> {
    await db.insert(videoSessionParticipants).values({
      sessionId,
      userId,
      role: 'participant',
    }).onConflictDoNothing();
    
    await db.update(videoSessions)
      .set({ status: 'live', startedAt: new Date() })
      .where(eq(videoSessions.id, sessionId));
  }

  async endVideoSession(sessionId: number): Promise<void> {
    await db.update(videoSessions)
      .set({ status: 'ended', endedAt: new Date() })
      .where(eq(videoSessions.id, sessionId));
  }

  // ============================================================================
  // THERAPIST MARKETPLACE
  // ============================================================================

  async getTherapistStorefronts(): Promise<any[]> {
    const therapists = await db.select().from(therapistProfiles)
      .where(eq(therapistProfiles.isVerified, true));
    return therapists.map(t => ({
      ...t,
      productCount: 0,
      rating: 4.8,
    }));
  }

  async getTherapistProducts(therapistId: string): Promise<any[]> {
    return db.select().from(marketplaceProducts)
      .orderBy(desc(marketplaceProducts.createdAt));
  }

  async createTherapistProduct(product: any): Promise<any> {
    const [result] = await db.insert(marketplaceProducts).values({
      categoryId: product.categoryId || 1,
      title: product.title,
      description: product.description,
      amazonUrl: product.amazonUrl || '#',
      priceDisplay: product.price,
      isFeatured: false,
      isActive: true,
    }).returning();
    return result;
  }

  async getTherapistEarnings(therapistId: string): Promise<any> {
    return {
      totalEarnings: 0,
      pendingPayout: 0,
      platformFee: 15,
      salesCount: 0,
      recentSales: [],
    };
  }

  async purchaseTherapistProduct(userId: string, productId: number): Promise<string> {
    return `/checkout?product=${productId}`;
  }

  // ============================================================================
  // ADMIN RECOVERY PLANS
  // ============================================================================

  async getRecoveryPlans(): Promise<any[]> {
    return db.select().from(recoveryPrograms).orderBy(desc(recoveryPrograms.createdAt));
  }

  async createRecoveryPlan(plan: any): Promise<any> {
    const [result] = await db.insert(recoveryPrograms).values({
      name: plan.name,
      slug: plan.name.toLowerCase().replace(/\s+/g, '-'),
      description: plan.description,
      tier: plan.tier || 'explorer',
      difficulty: plan.difficulty || 'beginner',
      estimatedWeeks: plan.duration || 12,
      isActive: true,
    }).returning();
    return result;
  }

  async deleteRecoveryPlan(id: number): Promise<boolean> {
    await db.delete(recoveryPrograms).where(eq(recoveryPrograms.id, id));
    return true;
  }

  async assignRecoveryPlan(planId: number, userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      await db.insert(userEnrollments).values({
        userId,
        programId: planId,
        status: 'active',
      }).onConflictDoNothing();
    }
  }

  // ============================================================================
  // BLOGGING SUITE
  // ============================================================================

  async getBlogPosts(filters?: { authorId?: string; status?: string; featured?: boolean }): Promise<BlogPost[]> {
    let query = db.select().from(blogPosts);
    
    if (filters?.authorId) {
      query = query.where(eq(blogPosts.authorId, filters.authorId)) as any;
    }
    if (filters?.status) {
      query = query.where(eq(blogPosts.status, filters.status)) as any;
    }
    if (filters?.featured) {
      query = query.where(eq(blogPosts.isFeatured, true)) as any;
    }
    
    return query.orderBy(desc(blogPosts.publishedAt));
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const wordCount = post.content.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    
    const [result] = await db.insert(blogPosts).values({
      ...post,
      slug,
      readingTime,
    }).returning();
    return result;
  }

  async updateBlogPost(id: number, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    
    if (updates.content) {
      const wordCount = updates.content.split(/\s+/).length;
      updateData.readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }
    
    const [result] = await db.update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();
    return result;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return true;
  }

  async publishBlogPost(id: number): Promise<BlogPost | undefined> {
    const [result] = await db.update(blogPosts)
      .set({ 
        status: 'published', 
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(blogPosts.id, id))
      .returning();
    return result;
  }

  async getUserBlogPosts(userId: string): Promise<BlogPost[]> {
    return db.select().from(blogPosts)
      .where(eq(blogPosts.authorId, userId))
      .orderBy(desc(blogPosts.createdAt));
  }

  async toggleBlogReaction(postId: number, userId: string, reactionType: string): Promise<{ added: boolean }> {
    const [existing] = await db.select().from(blogPostReactions)
      .where(and(
        eq(blogPostReactions.postId, postId),
        eq(blogPostReactions.userId, userId)
      ));
    
    if (existing) {
      await db.delete(blogPostReactions).where(eq(blogPostReactions.id, existing.id));
      await db.update(blogPosts)
        .set({ likeCount: sql`${blogPosts.likeCount} - 1` })
        .where(eq(blogPosts.id, postId));
      return { added: false };
    } else {
      await db.insert(blogPostReactions).values({ postId, userId, reactionType });
      await db.update(blogPosts)
        .set({ likeCount: sql`${blogPosts.likeCount} + 1` })
        .where(eq(blogPosts.id, postId));
      return { added: true };
    }
  }

  async getBlogComments(postId: number): Promise<BlogPostComment[]> {
    return db.select().from(blogPostComments)
      .where(eq(blogPostComments.postId, postId))
      .orderBy(desc(blogPostComments.createdAt));
  }

  async createBlogComment(comment: InsertBlogPostComment): Promise<BlogPostComment> {
    const [result] = await db.insert(blogPostComments).values(comment).returning();
    await db.update(blogPosts)
      .set({ commentCount: sql`${blogPosts.commentCount} + 1` })
      .where(eq(blogPosts.id, comment.postId));
    return result;
  }

  async deleteBlogComment(id: number): Promise<boolean> {
    const [comment] = await db.select().from(blogPostComments).where(eq(blogPostComments.id, id));
    if (comment) {
      await db.delete(blogPostComments).where(eq(blogPostComments.id, id));
      await db.update(blogPosts)
        .set({ commentCount: sql`${blogPosts.commentCount} - 1` })
        .where(eq(blogPosts.id, comment.postId));
    }
    return true;
  }

  async incrementBlogViews(id: number): Promise<void> {
    await db.update(blogPosts)
      .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
      .where(eq(blogPosts.id, id));
  }

  // ============================================================================
  // BOOK MARKETPLACE
  // ============================================================================

  async getMarketplaceListings(filters: { genre?: string; sortBy?: string; featuredOnly?: boolean; status?: string } = {}): Promise<MarketplaceListing[]> {
    const conditions = [];
    
    if (filters.genre) {
      conditions.push(eq(marketplaceListings.genre, filters.genre));
    }
    if (filters.featuredOnly) {
      conditions.push(eq(marketplaceListings.isFeatured, true));
    }
    if (filters.status) {
      conditions.push(eq(marketplaceListings.status, filters.status));
    } else {
      conditions.push(eq(marketplaceListings.status, 'published'));
    }
    
    let query = db.select().from(marketplaceListings);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    if (filters.sortBy === 'sales') {
      return query.orderBy(desc(marketplaceListings.totalSales));
    } else if (filters.sortBy === 'rating') {
      return query.orderBy(desc(marketplaceListings.averageRating));
    } else if (filters.sortBy === 'newest') {
      return query.orderBy(desc(marketplaceListings.publishedAt));
    }
    
    return query.orderBy(desc(marketplaceListings.createdAt));
  }

  async getMarketplaceListing(id: number): Promise<MarketplaceListing | undefined> {
    const [listing] = await db.select().from(marketplaceListings).where(eq(marketplaceListings.id, id));
    return listing;
  }

  async getAuthorListings(authorId: string): Promise<MarketplaceListing[]> {
    return db.select().from(marketplaceListings)
      .where(eq(marketplaceListings.authorId, authorId))
      .orderBy(desc(marketplaceListings.createdAt));
  }

  async createMarketplaceListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing> {
    const [result] = await db.insert(marketplaceListings).values(listing).returning();
    return result;
  }

  async updateMarketplaceListing(id: number, updates: Partial<MarketplaceListing>): Promise<MarketplaceListing | undefined> {
    const [result] = await db.update(marketplaceListings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceListings.id, id))
      .returning();
    return result;
  }

  async getBookEditions(listingId: number): Promise<BookEdition[]> {
    return db.select().from(bookEditions)
      .where(eq(bookEditions.listingId, listingId))
      .orderBy(bookEditions.editionType);
  }

  async getBookEdition(id: number): Promise<BookEdition | undefined> {
    const [edition] = await db.select().from(bookEditions).where(eq(bookEditions.id, id));
    return edition;
  }

  async createBookEdition(edition: InsertBookEdition): Promise<BookEdition> {
    const [result] = await db.insert(bookEditions).values(edition).returning();
    return result;
  }

  async getBookReviews(listingId: number): Promise<BookReview[]> {
    return db.select().from(bookReviews)
      .where(and(eq(bookReviews.listingId, listingId), eq(bookReviews.isApproved, true)))
      .orderBy(desc(bookReviews.createdAt));
  }

  async createBookReview(review: InsertBookReview): Promise<BookReview> {
    const [result] = await db.insert(bookReviews).values(review).returning();
    await this.updateListingRating(review.listingId);
    return result;
  }

  async updateListingRating(listingId: number): Promise<void> {
    const reviews = await db.select({
      avgRating: sql<number>`AVG(${bookReviews.rating})`,
      count: count()
    })
      .from(bookReviews)
      .where(and(eq(bookReviews.listingId, listingId), eq(bookReviews.isApproved, true)));
    
    if (reviews[0]) {
      await db.update(marketplaceListings)
        .set({
          averageRating: Math.round((reviews[0].avgRating || 0) * 10),
          reviewCount: Number(reviews[0].count),
          updatedAt: new Date()
        })
        .where(eq(marketplaceListings.id, listingId));
    }
  }

  async createBookOrder(order: InsertBookOrder): Promise<BookOrder> {
    const [result] = await db.insert(bookOrders).values(order).returning();
    return result;
  }

  async getBookOrder(id: number): Promise<BookOrder | undefined> {
    const [order] = await db.select().from(bookOrders).where(eq(bookOrders.id, id));
    return order;
  }

  async getBookOrderBySessionId(sessionId: string): Promise<BookOrder | undefined> {
    const [order] = await db.select().from(bookOrders).where(eq(bookOrders.stripeCheckoutSessionId, sessionId));
    return order;
  }

  async getBookOrderByOrderNumber(orderNumber: string): Promise<BookOrder | undefined> {
    const [order] = await db.select().from(bookOrders).where(eq(bookOrders.orderNumber, orderNumber));
    return order;
  }

  async updateBookOrder(id: number, updates: Partial<BookOrder>): Promise<BookOrder | undefined> {
    const [result] = await db.update(bookOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bookOrders.id, id))
      .returning();
    return result;
  }

  async getCustomerOrders(customerId: string): Promise<BookOrder[]> {
    return db.select().from(bookOrders)
      .where(eq(bookOrders.customerId, customerId))
      .orderBy(desc(bookOrders.createdAt));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [result] = await db.insert(orderItems).values(item).returning();
    return result;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return db.select().from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async updateOrderItem(id: number, updates: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const [result] = await db.update(orderItems)
      .set(updates)
      .where(eq(orderItems.id, id))
      .returning();
    return result;
  }

  async createLuluPrintJob(job: InsertLuluPrintJob): Promise<LuluPrintJob> {
    const [result] = await db.insert(luluPrintJobs).values(job).returning();
    return result;
  }

  async getLuluPrintJob(id: number): Promise<LuluPrintJob | undefined> {
    const [job] = await db.select().from(luluPrintJobs).where(eq(luluPrintJobs.id, id));
    return job;
  }

  async getLuluPrintJobsByOrder(orderId: number): Promise<LuluPrintJob[]> {
    return db.select().from(luluPrintJobs)
      .where(eq(luluPrintJobs.orderId, orderId))
      .orderBy(luluPrintJobs.createdAt);
  }

  async updateLuluPrintJob(id: number, updates: Partial<LuluPrintJob>): Promise<LuluPrintJob | undefined> {
    const [result] = await db.update(luluPrintJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(luluPrintJobs.id, id))
      .returning();
    return result;
  }

  async createAuthorEarning(earning: InsertAuthorEarnings): Promise<AuthorEarnings> {
    const [result] = await db.insert(authorEarnings).values(earning).returning();
    return result;
  }

  async getAuthorEarnings(authorId: string): Promise<AuthorEarnings[]> {
    return db.select().from(authorEarnings)
      .where(eq(authorEarnings.authorId, authorId))
      .orderBy(desc(authorEarnings.createdAt));
  }

  async getAuthorEarningsSummary(authorId: string): Promise<{ total: number; pending: number; available: number; paid: number }> {
    const earnings = await db.select({
      status: authorEarnings.status,
      total: sql<number>`SUM(${authorEarnings.netEarnings})`
    })
      .from(authorEarnings)
      .where(eq(authorEarnings.authorId, authorId))
      .groupBy(authorEarnings.status);
    
    let total = 0;
    let pending = 0;
    let available = 0;
    let paid = 0;
    
    for (const row of earnings) {
      const amount = Number(row.total) || 0;
      total += amount;
      if (row.status === 'pending') pending = amount;
      else if (row.status === 'available') available = amount;
      else if (row.status === 'paid') paid = amount;
    }
    
    return { total, pending, available, paid };
  }

  async getAuthorAnalytics(authorId: string): Promise<{ totalSales: number; totalRevenue: number; topBooks: any[] }> {
    const listings = await db.select({
      id: marketplaceListings.id,
      title: marketplaceListings.title,
      totalSales: marketplaceListings.totalSales,
      totalRevenue: marketplaceListings.totalRevenue
    })
      .from(marketplaceListings)
      .where(eq(marketplaceListings.authorId, authorId))
      .orderBy(desc(marketplaceListings.totalSales))
      .limit(5);
    
    const totals = await db.select({
      totalSales: sql<number>`SUM(${marketplaceListings.totalSales})`,
      totalRevenue: sql<number>`SUM(${marketplaceListings.totalRevenue})`
    })
      .from(marketplaceListings)
      .where(eq(marketplaceListings.authorId, authorId));
    
    return {
      totalSales: Number(totals[0]?.totalSales) || 0,
      totalRevenue: Number(totals[0]?.totalRevenue) || 0,
      topBooks: listings
    };
  }

  // Podcast Studio methods
  async getPodcasts(userId: string): Promise<Podcast[]> {
    return db.select().from(podcasts)
      .where(eq(podcasts.userId, userId))
      .orderBy(desc(podcasts.updatedAt));
  }

  async getPodcast(id: number): Promise<Podcast | undefined> {
    const [podcast] = await db.select().from(podcasts).where(eq(podcasts.id, id));
    return podcast;
  }

  async createPodcast(podcast: InsertPodcast): Promise<Podcast> {
    const [result] = await db.insert(podcasts).values(podcast).returning();
    return result;
  }

  async updatePodcast(id: number, updates: Partial<Podcast>): Promise<Podcast | undefined> {
    const [result] = await db.update(podcasts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(podcasts.id, id))
      .returning();
    return result;
  }

  async deletePodcast(id: number): Promise<boolean> {
    const result = await db.delete(podcasts).where(eq(podcasts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Puzzle Studio methods
  async getPuzzleBooks(ownerId: string): Promise<PuzzleBook[]> {
    return db.select().from(puzzleBooks)
      .where(eq(puzzleBooks.ownerId, ownerId))
      .orderBy(desc(puzzleBooks.lastEditedAt));
  }

  async getPuzzleBook(id: number): Promise<PuzzleBook | undefined> {
    const [book] = await db.select().from(puzzleBooks).where(eq(puzzleBooks.id, id));
    return book;
  }

  async createPuzzleBook(book: InsertPuzzleBook): Promise<PuzzleBook> {
    const [result] = await db.insert(puzzleBooks).values(book).returning();
    return result;
  }

  async updatePuzzleBook(id: number, updates: Partial<InsertPuzzleBook>): Promise<PuzzleBook | undefined> {
    const [result] = await db.update(puzzleBooks)
      .set({ ...updates, lastEditedAt: new Date() })
      .where(eq(puzzleBooks.id, id))
      .returning();
    return result;
  }

  async deletePuzzleBook(id: number): Promise<boolean> {
    const result = await db.delete(puzzleBooks).where(eq(puzzleBooks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPuzzles(bookId: number): Promise<Puzzle[]> {
    return db.select().from(puzzles)
      .where(eq(puzzles.bookId, bookId))
      .orderBy(puzzles.position);
  }

  async getPuzzle(id: number): Promise<Puzzle | undefined> {
    const [puzzle] = await db.select().from(puzzles).where(eq(puzzles.id, id));
    return puzzle;
  }

  async createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle> {
    const [result] = await db.insert(puzzles).values(puzzle).returning();
    await db.update(puzzleBooks)
      .set({ lastEditedAt: new Date() })
      .where(eq(puzzleBooks.id, puzzle.bookId));
    return result;
  }

  async updatePuzzle(id: number, updates: Partial<InsertPuzzle>): Promise<Puzzle | undefined> {
    const [result] = await db.update(puzzles)
      .set(updates)
      .where(eq(puzzles.id, id))
      .returning();
    if (result) {
      await db.update(puzzleBooks)
        .set({ lastEditedAt: new Date() })
        .where(eq(puzzleBooks.id, result.bookId));
    }
    return result;
  }

  async deletePuzzle(id: number): Promise<boolean> {
    const result = await db.delete(puzzles).where(eq(puzzles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async reorderPuzzles(bookId: number, orderedIds: number[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.update(puzzles)
          .set({ position: i })
          .where(and(eq(puzzles.id, orderedIds[i]), eq(puzzles.bookId, bookId)));
      }
    });
  }

  async getPodcastEpisodes(podcastId: number): Promise<PodcastEpisode[]> {
    return db.select().from(podcastEpisodes)
      .where(eq(podcastEpisodes.podcastId, podcastId))
      .orderBy(desc(podcastEpisodes.createdAt));
  }

  async getPodcastEpisode(id: number): Promise<PodcastEpisode | undefined> {
    const [episode] = await db.select().from(podcastEpisodes).where(eq(podcastEpisodes.id, id));
    return episode;
  }

  async createPodcastEpisode(episode: InsertPodcastEpisode): Promise<PodcastEpisode> {
    const [result] = await db.insert(podcastEpisodes).values(episode).returning();
    await db.update(podcasts)
      .set({ 
        episodeCount: sql`${podcasts.episodeCount} + 1`,
        totalDuration: sql`${podcasts.totalDuration} + ${episode.duration || 0}`,
        updatedAt: new Date()
      })
      .where(eq(podcasts.id, episode.podcastId));
    return result;
  }

  async updatePodcastEpisode(id: number, updates: Partial<PodcastEpisode>): Promise<PodcastEpisode | undefined> {
    const [result] = await db.update(podcastEpisodes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(podcastEpisodes.id, id))
      .returning();
    return result;
  }

  async deletePodcastEpisode(id: number): Promise<boolean> {
    const [episode] = await db.select().from(podcastEpisodes).where(eq(podcastEpisodes.id, id));
    if (episode) {
      await db.update(podcasts)
        .set({ 
          episodeCount: sql`GREATEST(${podcasts.episodeCount} - 1, 0)`,
          totalDuration: sql`GREATEST(${podcasts.totalDuration} - ${episode.duration || 0}, 0)`,
          updatedAt: new Date()
        })
        .where(eq(podcasts.id, episode.podcastId));
    }
    const result = await db.delete(podcastEpisodes).where(eq(podcastEpisodes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // White Label Configuration Methods
  async getWhiteLabelConfig(userId: string): Promise<any | undefined> {
    try {
      const result = await db.execute(sql`
        SELECT id, user_id, brand_name, logo_url, favicon_url, primary_color, accent_color, background_color, custom_domain, openai_api_key, anthropic_api_key, gemini_api_key, grok_api_key, perplexity_api_key, stability_api_key, remove_bg_api_key, hide_kreaite_branding, custom_footer_text, custom_terms_url, custom_privacy_url, creator_revenue_share, platform_revenue_share, domain_verified, created_at, updated_at FROM white_label_configs WHERE user_id = ${userId} LIMIT 1
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error getting white label config:", error);
      return undefined;
    }
  }

  async createWhiteLabelConfig(config: any): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO white_label_configs (
          user_id, brand_name, logo_url, favicon_url, primary_color, accent_color, 
          background_color, custom_domain, openai_api_key, anthropic_api_key, 
          gemini_api_key, grok_api_key, perplexity_api_key, stability_api_key,
          remove_bg_api_key, hide_kreaite_branding, custom_footer_text, 
          custom_terms_url, custom_privacy_url, creator_revenue_share, platform_revenue_share
        ) VALUES (
          ${config.userId}, ${config.brandName}, ${config.logoUrl || null}, 
          ${config.faviconUrl || null}, ${config.primaryColor}, ${config.accentColor},
          ${config.backgroundColor}, ${config.customDomain || null}, 
          ${config.openaiApiKey || null}, ${config.anthropicApiKey || null},
          ${config.geminiApiKey || null}, ${config.grokApiKey || null},
          ${config.perplexityApiKey || null}, ${config.stabilityApiKey || null},
          ${config.removeBgApiKey || null}, ${config.hideKreaiteBranding || false},
          ${config.customFooterText || null}, ${config.customTermsUrl || null},
          ${config.customPrivacyUrl || null}, ${config.creatorRevenueShare || 85},
          ${config.platformRevenueShare || 15}
        ) RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error creating white label config:", error);
      throw error;
    }
  }

  async updateWhiteLabelConfig(id: number, config: any): Promise<any> {
    try {
      const result = await db.execute(sql`
        UPDATE white_label_configs SET
          brand_name = ${config.brandName},
          logo_url = ${config.logoUrl || null},
          favicon_url = ${config.faviconUrl || null},
          primary_color = ${config.primaryColor},
          accent_color = ${config.accentColor},
          background_color = ${config.backgroundColor},
          custom_domain = ${config.customDomain || null},
          openai_api_key = ${config.openaiApiKey || null},
          anthropic_api_key = ${config.anthropicApiKey || null},
          gemini_api_key = ${config.geminiApiKey || null},
          grok_api_key = ${config.grokApiKey || null},
          perplexity_api_key = ${config.perplexityApiKey || null},
          stability_api_key = ${config.stabilityApiKey || null},
          remove_bg_api_key = ${config.removeBgApiKey || null},
          hide_kreaite_branding = ${config.hideKreaiteBranding || false},
          custom_footer_text = ${config.customFooterText || null},
          custom_terms_url = ${config.customTermsUrl || null},
          custom_privacy_url = ${config.customPrivacyUrl || null},
          creator_revenue_share = ${config.creatorRevenueShare || 85},
          platform_revenue_share = ${config.platformRevenueShare || 15},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error updating white label config:", error);
      throw error;
    }
  }

  async updateWhiteLabelDomainStatus(userId: string, domain: string, verified: boolean): Promise<void> {
    try {
      await db.execute(sql`
        UPDATE white_label_configs 
        SET custom_domain = ${domain}, domain_verified = ${verified}, updated_at = NOW()
        WHERE user_id = ${userId}
      `);
    } catch (error) {
      console.error("Error updating domain status:", error);
    }
  }

  async trackWhiteLabelApiUsage(usage: any): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO white_label_api_usage (white_label_id, api_provider, endpoint, tokens_used, cost_usd)
        VALUES (${usage.whiteLabelId}, ${usage.apiProvider}, ${usage.endpoint || null}, 
                ${usage.tokensUsed || 0}, ${usage.costUsd || 0})
      `);
    } catch (error) {
      console.error("Error tracking API usage:", error);
    }
  }

  async getWhiteLabelApiUsageStats(whiteLabelId: number): Promise<any> {
    try {
      const result = await db.execute(sql`
        SELECT 
          api_provider,
          SUM(tokens_used) as total_tokens,
          SUM(cost_usd) as total_cost,
          COUNT(*) as request_count
        FROM white_label_api_usage 
        WHERE white_label_id = ${whiteLabelId}
        GROUP BY api_provider
      `);
      return { usage: result.rows || [] };
    } catch (error) {
      console.error("Error getting usage stats:", error);
      return { usage: [] };
    }
  }

  // ============================================================================
  // SASQUATCH DOCTRINE - FLICKER LOG
  // ============================================================================

  async getFlickerLogs(userId: string): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM flicker_logs 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 100
      `);
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching flicker logs:", error);
      return [];
    }
  }

  async createFlickerLog(userId: string, data: any): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO flicker_logs (user_id, moment, body_part, intensity, emotion_before, emotion_after, activity, is_breakthrough, notes, tags)
        VALUES (${userId}, ${data.moment}, ${data.bodyPart || null}, ${data.intensity || 1}, 
                ${data.emotionBefore || null}, ${data.emotionAfter || null}, ${data.activity || null},
                ${data.isBreakthrough || false}, ${data.notes || null}, ${data.tags || null})
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error creating flicker log:", error);
      throw error;
    }
  }

  // ============================================================================
  // SASQUATCH DOCTRINE - MEDICAL LOG
  // ============================================================================

  async getMedicalLogs(userId: string): Promise<any> {
    try {
      const [meds, appts, vitals] = await Promise.all([
        db.execute(sql`SELECT * FROM medications WHERE user_id = ${userId} ORDER BY created_at DESC`),
        db.execute(sql`SELECT * FROM appointments WHERE user_id = ${userId} ORDER BY appointment_date DESC LIMIT 50`),
        db.execute(sql`SELECT * FROM vitals_logs WHERE user_id = ${userId} ORDER BY measured_at DESC LIMIT 30`)
      ]);
      return {
        medications: meds.rows || [],
        appointments: appts.rows || [],
        vitals: vitals.rows || []
      };
    } catch (error) {
      console.error("Error fetching medical logs:", error);
      return { medications: [], appointments: [], vitals: [] };
    }
  }

  async createMedication(userId: string, data: any): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO medications (user_id, name, dosage, frequency, purpose, prescribed_by, start_date, notes, reminder_times)
        VALUES (${userId}, ${data.name}, ${data.dosage}, ${data.frequency}, ${data.purpose || null}, 
                ${data.prescribedBy || null}, ${data.startDate || null}, ${data.notes || null}, ${data.reminderTimes || null})
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error creating medication:", error);
      throw error;
    }
  }

  async createAppointment(userId: string, data: any): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO appointments (user_id, title, provider_name, provider_type, location, appointment_date, duration, notes, prep_notes)
        VALUES (${userId}, ${data.title}, ${data.providerName}, ${data.providerType}, ${data.location || null},
                ${data.appointmentDate}, ${data.duration || null}, ${data.notes || null}, ${data.prepNotes || null})
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }
  }

  async logVitals(userId: string, data: any): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO vitals_logs (user_id, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, 
                                 temperature, weight, blood_sugar, oxygen_level, pain_level, sleep_hours, sleep_quality, notes)
        VALUES (${userId}, ${data.bloodPressureSystolic || null}, ${data.bloodPressureDiastolic || null}, 
                ${data.heartRate || null}, ${data.temperature || null}, ${data.weight || null},
                ${data.bloodSugar || null}, ${data.oxygenLevel || null}, ${data.painLevel || null},
                ${data.sleepHours || null}, ${data.sleepQuality || null}, ${data.notes || null})
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error logging vitals:", error);
      throw error;
    }
  }

  // ============================================================================
  // SASQUATCH DOCTRINE - C.O.M.P.A.S.S.
  // ============================================================================

  async getCompassData(userId: string): Promise<any> {
    try {
      const [entries, goals] = await Promise.all([
        db.execute(sql`
          SELECT * FROM compass_entries 
          WHERE user_id = ${userId} 
          ORDER BY created_at DESC 
          LIMIT 100
        `),
        db.execute(sql`
          SELECT * FROM compass_goals 
          WHERE user_id = ${userId} AND status = 'active'
          ORDER BY created_at DESC
        `)
      ]);
      return {
        entries: entries.rows || [],
        goals: goals.rows || []
      };
    } catch (error) {
      console.error("Error fetching compass data:", error);
      return { entries: [], goals: [] };
    }
  }

  async updateCompassPillar(userId: string, data: any): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO compass_entries (user_id, pillar, score, reflection, wins, challenges, tomorrows_goal)
        VALUES (${userId}, ${data.pillar}, ${data.score}, ${data.reflection || null}, 
                ${data.wins || null}, ${data.challenges || null}, ${data.tomorrowsGoal || null})
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error updating compass pillar:", error);
      throw error;
    }
  }

  // ============================================================================
  // SASQUATCH DOCTRINE - DRAFT YOUR LEGEND
  // ============================================================================

  async getLegend(userId: string): Promise<any> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM legend_drafts 
        WHERE user_id = ${userId}
        ORDER BY last_edited_at DESC
        LIMIT 1
      `);
      return result.rows?.[0] || null;
    } catch (error) {
      console.error("Error fetching legend:", error);
      return null;
    }
  }

  async saveLegend(userId: string, data: any): Promise<any> {
    try {
      const existing = await this.getLegend(userId);
      
      if (existing) {
        const result = await db.execute(sql`
          UPDATE legend_drafts 
          SET title = ${data.title || existing.title},
              subtitle = ${data.subtitle || existing.subtitle},
              chapters = ${JSON.stringify(data.chapters || existing.chapters)},
              current_chapter = ${data.currentChapter || existing.current_chapter},
              total_word_count = ${data.totalWordCount || existing.total_word_count},
              status = ${data.status || existing.status},
              last_edited_at = NOW()
          WHERE id = ${existing.id}
          RETURNING *
        `);
        return result.rows?.[0];
      } else {
        const result = await db.execute(sql`
          INSERT INTO legend_drafts (user_id, title, subtitle, chapters, current_chapter, total_word_count, status)
          VALUES (${userId}, ${data.title || 'My Recovery Legend'}, ${data.subtitle || null}, 
                  ${JSON.stringify(data.chapters || [])}, ${data.currentChapter || 1}, 
                  ${data.totalWordCount || 0}, ${data.status || 'draft'})
          RETURNING *
        `);
        return result.rows?.[0];
      }
    } catch (error) {
      console.error("Error saving legend:", error);
      throw error;
    }
  }

  // Never Zero Methods
  async getNeverZeroData(userId: string): Promise<any> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM never_zero_logs 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `);
      const logs = result.rows || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get unique dates
      const logDates = new Set(logs.map((log: any) => {
        const d = new Date(log.created_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }));
      
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const loggedToday = logDates.has(todayStr);
      
      // Calculate current streak
      let currentStreak = 0;
      const sortedDates = Array.from(logDates).sort().reverse();
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        
        if (logDates.has(checkStr)) {
          currentStreak++;
        } else if (i === 0) {
          continue; // Allow today to be empty if streak started yesterday
        } else {
          break;
        }
      }
      
      // Calculate longest streak by iterating through all sorted dates
      let longestStreak = 0;
      let tempStreak = 0;
      let prevDate: Date | null = null;
      
      for (const dateStr of sortedDates.reverse()) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const currentDate = new Date(year, month - 1, day);
        
        if (prevDate === null) {
          tempStreak = 1;
        } else {
          const diffTime = prevDate.getTime() - currentDate.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        prevDate = currentDate;
      }
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
      
      return {
        currentStreak,
        longestStreak,
        totalDays: logDates.size,
        loggedToday,
        logs: logs.slice(0, 30),
      };
    } catch (error) {
      console.error("Error fetching never zero data:", error);
      return { currentStreak: 0, longestStreak: 0, totalDays: 0, loggedToday: false, logs: [] };
    }
  }

  async logNeverZero(userId: string, data: any): Promise<any> {
    try {
      const result = await db.execute(sql`
        INSERT INTO never_zero_logs (user_id, action, notes, reps, difficulty)
        VALUES (${userId}, ${data.action}, ${data.notes || null}, ${data.reps || 1}, ${data.category || 'movement'})
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error logging never zero:", error);
      throw error;
    }
  }

  // Daily Sasquatch audit persistence — one row per (userId, auditDate).
  async getNeverZeroAuditByDate(userId: string, auditDate: string): Promise<any | null> {
    try {
      const result = await db.execute(sql`
        SELECT id, audit_date AS "auditDate", streak, today_count AS "todayCount",
               categories_covered AS "categoriesCovered", categories_missed AS "categoriesMissed",
               stood_out AS "stoodOut", missing, verdict, tomorrow,
               raw_message AS "rawMessage", created_at AS "createdAt"
        FROM never_zero_audits
        WHERE user_id = ${userId} AND audit_date = ${auditDate}
        LIMIT 1
      `);
      return result.rows?.[0] ?? null;
    } catch (error) {
      console.error("Error fetching never-zero audit:", error);
      return null;
    }
  }

  async getNeverZeroAudits(userId: string, limit: number = 30): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT id, audit_date AS "auditDate", streak, today_count AS "todayCount",
               categories_covered AS "categoriesCovered", categories_missed AS "categoriesMissed",
               stood_out AS "stoodOut", missing, verdict, tomorrow,
               raw_message AS "rawMessage", created_at AS "createdAt"
        FROM never_zero_audits
        WHERE user_id = ${userId}
        ORDER BY audit_date DESC
        LIMIT ${limit}
      `);
      return (result.rows ?? []) as any[];
    } catch (error) {
      console.error("Error fetching never-zero audits:", error);
      return [];
    }
  }

  async upsertNeverZeroAudit(payload: {
    userId: string;
    auditDate: string;
    streak: number;
    todayCount: number;
    categoriesCovered: string[];
    categoriesMissed: string[];
    stoodOut: string | null;
    missing: string | null;
    verdict: string | null;
    tomorrow: string | null;
    rawMessage: string;
  }): Promise<any | null> {
    try {
      const result = await db.execute(sql`
        INSERT INTO never_zero_audits (
          user_id, audit_date, streak, today_count,
          categories_covered, categories_missed,
          stood_out, missing, verdict, tomorrow, raw_message
        ) VALUES (
          ${payload.userId}, ${payload.auditDate}, ${payload.streak}, ${payload.todayCount},
          ${textArraySql(payload.categoriesCovered)}, ${textArraySql(payload.categoriesMissed)},
          ${payload.stoodOut}, ${payload.missing}, ${payload.verdict}, ${payload.tomorrow}, ${payload.rawMessage}
        )
        ON CONFLICT (user_id, audit_date) DO UPDATE SET
          streak = EXCLUDED.streak,
          today_count = EXCLUDED.today_count,
          categories_covered = EXCLUDED.categories_covered,
          categories_missed = EXCLUDED.categories_missed,
          stood_out = EXCLUDED.stood_out,
          missing = EXCLUDED.missing,
          verdict = EXCLUDED.verdict,
          tomorrow = EXCLUDED.tomorrow,
          raw_message = EXCLUDED.raw_message
        RETURNING id, audit_date AS "auditDate", today_count AS "todayCount"
      `);
      return result.rows?.[0] ?? null;
    } catch (error) {
      console.error("Error upserting never-zero audit:", error);
      return null;
    }
  }

  // Journal Methods
  async getJournalEntries(userId: string): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM recovery_journals
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 100
      `);
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      return [];
    }
  }

  async createJournalEntry(userId: string, data: any): Promise<any> {
    try {
      // Build content from the various fields
      const contentParts = [];
      if (data.reflection) contentParts.push(data.reflection);
      if (data.wins) contentParts.push(`Wins: ${data.wins}`);
      if (data.challenges) contentParts.push(`Challenges: ${data.challenges}`);
      if (data.tomorrowsGoal) contentParts.push(`Tomorrow's Goal: ${data.tomorrowsGoal}`);

      // Reflections v2: composer modes
      const wordCount = (data.content || data.reflection || data.freeText || '').split(/\s+/).filter((w: string) => w.length > 0).length;
      const content = data.content || contentParts.join('\n\n') || 'Journal entry';
      const moodLabel = data.moodLabel || (data.mood === 'good' || data.mood === 'great' ? 'good' : data.mood === 'okay' || data.mood === 'struggling' ? 'okay' : 'hard');
      const energyLevel = data.energyLevel ? Math.min(5, Math.max(1, data.energyLevel)) : 3;

      const result = await db.execute(sql`
        INSERT INTO recovery_journals (
          user_id, content, mood, energy, gratitude, wins,
          struggles, tomorrows_intention, tags, is_private,
          entry_type, entry_sub_type, mood_label, energy_level,
          is_shared, haiku_lines, photo_url, photo_caption,
          voice_url, voice_transcript, word_count
        )
        VALUES (
          ${userId}, ${content}, ${data.mood || 5}, ${data.energy || 5},
          ${data.gratitude ? [data.gratitude] : null},
          ${data.wins ? [data.wins] : null},
          ${data.challenges ? [data.challenges] : null},
          ${data.tomorrowsGoal || null},
          ${data.tags || null},
          ${data.isPrivate !== undefined ? data.isPrivate : true},
          ${data.entryType || 'free'}, ${data.entrySubType || 'triumph'}, ${moodLabel}, ${energyLevel},
          ${data.isShared || false},
          ${data.haikuLines || null}, ${data.photoUrl || null}, ${data.photoCaption || null},
          ${data.voiceUrl || null}, ${data.voiceTranscript || null}, ${wordCount}
        )
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error creating journal entry:", error);
      throw error;
    }
  }

  async getSharedEntries(filter?: string, viewerId?: string): Promise<any[]> {
    try {
      let extra = sql``;
      if (filter === 'triumphs') extra = sql` AND rj.entry_sub_type = 'triumph'`;
      else if (filter === 'pitfalls') extra = sql` AND rj.entry_sub_type = 'pitfall'`;
      else if (filter === 'this-week') extra = sql` AND rj.shared_at >= NOW() - INTERVAL '7 days'`;
      const viewer = viewerId || null;
      const result = await db.execute(sql`
        SELECT rj.*, u.first_name AS first_name, u.last_name AS last_name,
          COALESCE(rc.cnt, 0)::int AS reaction_count,
          (vr.user_id IS NOT NULL) AS viewer_reacted
        FROM recovery_journals rj
        LEFT JOIN users u ON rj.user_id = u.id
        LEFT JOIN (
          SELECT entry_id, COUNT(*) AS cnt FROM journal_reactions GROUP BY entry_id
        ) rc ON rc.entry_id = rj.id
        LEFT JOIN journal_reactions vr ON vr.entry_id = rj.id AND vr.user_id = ${viewer}
        WHERE rj.is_shared = true AND rj.is_private = false${extra}
        ORDER BY rj.shared_at DESC
        LIMIT 50
      `);
      return result.rows || [];
    } catch (error) {
      console.error("Error fetching shared entries:", error);
      return [];
    }
  }

  // "Felt this" reactions — only on shared, non-private entries. Returns the
  // new count, or null when the entry isn't a valid shared target (route -> 404,
  // no existence oracle).
  async addJournalReaction(entryId: number, userId: string): Promise<{ count: number } | null> {
    try {
      const check = await db.execute(sql`
        SELECT 1 FROM recovery_journals WHERE id = ${entryId} AND is_shared = true AND is_private = false
      `);
      if (!check.rows?.length) return null;
      await db.execute(sql`
        INSERT INTO journal_reactions (entry_id, user_id)
        VALUES (${entryId}, ${userId})
        ON CONFLICT (entry_id, user_id) DO NOTHING
      `);
      const c = await db.execute(sql`SELECT COUNT(*)::int AS count FROM journal_reactions WHERE entry_id = ${entryId}`);
      return { count: (c.rows?.[0] as any)?.count ?? 0 };
    } catch (error) {
      console.error("Error adding journal reaction:", error);
      throw error;
    }
  }

  async removeJournalReaction(entryId: number, userId: string): Promise<{ count: number } | null> {
    try {
      const check = await db.execute(sql`
        SELECT 1 FROM recovery_journals WHERE id = ${entryId} AND is_shared = true AND is_private = false
      `);
      if (!check.rows?.length) return null;
      await db.execute(sql`DELETE FROM journal_reactions WHERE entry_id = ${entryId} AND user_id = ${userId}`);
      const c = await db.execute(sql`SELECT COUNT(*)::int AS count FROM journal_reactions WHERE entry_id = ${entryId}`);
      return { count: (c.rows?.[0] as any)?.count ?? 0 };
    } catch (error) {
      console.error("Error removing journal reaction:", error);
      throw error;
    }
  }

  // Real impact numbers only — sums over actually-confirmed author earnings.
  // Everything is 0 until real sales land; nothing is fabricated. accountsFunded
  // is derived transparently from the platform giveback at the $19 digital price.
  async getJournalImpact(userId: string): Promise<{ userEarningsCents: number; globalGivebackCents: number; accountsFunded: number }> {
    try {
      // Reads the LIVE earnings table (author_earnings) that real marketplace
      // fulfillment writes to via recordAuthorEarning. Counts every confirmed
      // sale (pending/available/paid/held), excludes failed/refunded. Stays $0
      // until a real sale lands — no fabrication.
      const mine = await db.execute(sql`
        SELECT COALESCE(SUM(net_earnings), 0)::int AS cents
        FROM author_earnings
        WHERE author_id = ${userId} AND status IN ('pending', 'available', 'paid', 'held')
      `);
      const global = await db.execute(sql`
        SELECT COALESCE(SUM(platform_fee), 0)::int AS cents
        FROM author_earnings
        WHERE status IN ('pending', 'available', 'paid', 'held')
      `);
      const userEarningsCents = (mine.rows?.[0] as any)?.cents ?? 0;
      const globalGivebackCents = (global.rows?.[0] as any)?.cents ?? 0;
      const accountsFunded = Math.floor(globalGivebackCents / 1900);
      return { userEarningsCents, globalGivebackCents, accountsFunded };
    } catch (error) {
      console.error("Error computing journal impact:", error);
      return { userEarningsCents: 0, globalGivebackCents: 0, accountsFunded: 0 };
    }
  }

  // Compile a survivor's own journal entries (oldest -> newest) into a Book
  // Studio draft. Pure passthrough of their words — no AI, no fabrication.
  // Returns the new project id, or null when there's nothing to compile.
  async createBookProjectFromJournal(userId: string, authorName: string): Promise<{ id: number } | null> {
    try {
      const rowsDesc = await this.getJournalEntries(userId);
      if (!rowsDesc.length) return null;
      const entries = [...rowsDesc].reverse();

      const esc = (s: any) =>
        String(s ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

      const htmlParts: string[] = [];
      const textParts: string[] = [];
      for (const e of entries) {
        const d = e.created_at ? new Date(e.created_at) : null;
        const dateStr = d
          ? d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : "Undated";
        const moodSuffix = e.mood_label ? ` — ${esc(e.mood_label)}` : "";
        htmlParts.push(`<h2>${esc(dateStr)}${moodSuffix}</h2>`);
        textParts.push(`${dateStr}${e.mood_label ? " — " + e.mood_label : ""}`);

        const content = String(e.content || "").trim();
        for (const para of content.split(/\n+/).map((p) => p.trim()).filter(Boolean)) {
          htmlParts.push(`<p>${esc(para)}</p>`);
          textParts.push(para);
        }

        const transcript = String(e.voice_transcript || "").trim();
        if (transcript) {
          htmlParts.push(`<blockquote>${esc(transcript)}</blockquote>`);
          textParts.push(transcript);
        }

        const caption = String(e.photo_caption || "").trim();
        if (caption) {
          htmlParts.push(`<p><em>Photo — ${esc(caption)}</em></p>`);
          textParts.push(`Photo — ${caption}`);
        }
      }

      const manuscriptHtml = htmlParts.join("\n");
      const manuscriptText = textParts.join("\n\n");
      const wordCount = manuscriptText.split(/\s+/).filter((w) => w.length > 0).length;
      const subtitle = `${entries.length} ${entries.length === 1 ? "entry" : "entries"} from the fight`;

      const result = await db.execute(sql`
        INSERT INTO book_projects (
          owner_id, title, subtitle, author_name, genre,
          manuscript_html, manuscript_text, word_count, status, current_step
        )
        VALUES (
          ${userId}, 'My Reflections', ${subtitle}, ${authorName || "A Survivor"}, 'memoir',
          ${manuscriptHtml}, ${manuscriptText}, ${wordCount}, 'draft', 1
        )
        RETURNING id
      `);
      const row = result.rows?.[0] as any;
      return row ? { id: Number(row.id) } : null;
    } catch (error) {
      console.error("Error compiling journal into book project:", error);
      throw error;
    }
  }

  async getJournalInsights(userId: string): Promise<any> {
    try {
      const stats = await db.execute(sql`
        SELECT
          COUNT(*) as total_entries,
          COUNT(DISTINCT DATE(created_at)) as days_with_entries,
          SUM(word_count) as total_words,
          MAX(word_count) as longest_entry
        FROM recovery_journals
        WHERE user_id = ${userId}
      `);

      const moodTrends = await db.execute(sql`
        SELECT
          DATE_TRUNC('week', created_at) as week,
          mood_label,
          COUNT(*) as count
        FROM recovery_journals
        WHERE user_id = ${userId} AND mood_label IS NOT NULL
        GROUP BY week, mood_label
        ORDER BY week DESC
        LIMIT 12
      `);

      const tagBreakdown = await db.execute(sql`
        SELECT unnest(tags) as tag, COUNT(*) as count
        FROM recovery_journals
        WHERE user_id = ${userId} AND tags IS NOT NULL
        GROUP BY tag
        ORDER BY count DESC
      `);

      return {
        stats: stats.rows?.[0] || {},
        moodTrends: moodTrends.rows || [],
        tagBreakdown: tagBreakdown.rows || [],
      };
    } catch (error) {
      console.error("Error fetching journal insights:", error);
      return { stats: {}, moodTrends: [], tagBreakdown: [] };
    }
  }

  async updateJournalEntry(id: number, userId: string, updates: any): Promise<any> {
    try {
      const result = await db.execute(sql`
        UPDATE recovery_journals
        SET is_shared = ${updates.isShared},
            shared_at = ${updates.isShared ? new Date() : null}
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
      `);
      return result.rows?.[0];
    } catch (error) {
      console.error("Error updating journal entry:", error);
      throw error;
    }
  }

  // Recovery Blog Methods
  async getRecoveryBlogPosts(category?: string, featured?: boolean): Promise<RecoveryBlogPost[]> {
    try {
      const conditions = [eq(recoveryBlogPosts.status, 'published')];
      if (category) conditions.push(eq(recoveryBlogPosts.category, category));
      if (featured !== undefined) conditions.push(eq(recoveryBlogPosts.featured, featured));
      const results = await db
        .select()
        .from(recoveryBlogPosts)
        .where(and(...conditions))
        .orderBy(desc(recoveryBlogPosts.createdAt))
        .limit(50);
      return results;
    } catch (error) {
      console.error("Error fetching recovery blog posts:", error);
      return [];
    }
  }

  async getRecoveryBlogPostBySlug(slug: string): Promise<RecoveryBlogPost | undefined> {
    try {
      const [result] = await db
        .select()
        .from(recoveryBlogPosts)
        .where(and(
          eq(recoveryBlogPosts.slug, slug),
          eq(recoveryBlogPosts.status, 'published'),
        ))
        .limit(1);
      return result;
    } catch (error) {
      console.error("Error fetching recovery blog post by slug:", error);
      return undefined;
    }
  }

  async initRecoveryBlogPosts(): Promise<void> {
    try {
      const existing = await db.select({ id: recoveryBlogPosts.id }).from(recoveryBlogPosts).limit(1);
      if (existing.length > 0) return;
      await this.seedRecoveryBlogPosts();
      console.log("Recovery blog posts seeded to DB");
    } catch (error) {
      console.error("Error initializing recovery blog posts:", error);
    }
  }

  private async seedRecoveryBlogPosts(): Promise<void> {
    const posts = this.getSeedRecoveryBlogPosts();
    for (const p of posts as any[]) {
      await db.insert(recoveryBlogPosts).values({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt || '',
        content: p.content,
        category: p.category || 'philosophy',
        tags: p.tags || [],
        heroImageUrl: p.featuredImage || null,
        authorName: p.authorName || 'Nick Kremers',
        status: 'published',
        featured: p.featured || false,
        viewCount: p.viewCount || 0,
        likeCount: p.likeCount || 0,
        commentCount: p.commentCount || 0,
        readTime: p.readTime || 5,
      }).onConflictDoNothing();
    }
  }

  private getSeedRecoveryBlogPosts(category?: string, featured?: boolean): BlogPost[] {
    const seedPosts: any[] = [
      {
        id: 1,
        slug: "never-zero-philosophy",
        title: "The Never Zero Philosophy: Why Every Action Counts",
        excerpt: "How the simple principle of 'never zero' transformed my recovery and can transform yours.",
        content: `I had my stroke at 36 years old.

One day I was coaching youth football, running around a practice field, living a normal life. The next day I woke up and couldn't move the left side of my body.

The doctors told me I had a hemorrhagic stroke. They told me I was lucky to be alive. What they didn't tell me was what came next — the psychological avalanche that hits when you realize your body won't do what you tell it to.

## The Day I Discovered Never Zero

About three months into my recovery, I hit a wall.

I'd been doing my exercises. I'd been going to therapy. But progress had slowed to almost nothing, and depression was creeping in. I remember laying in bed one morning thinking, "What's the point?"

Then something shifted.

I decided that no matter what, I would do at least one rep. One movement. One action. Even if it was the smallest, weakest, most pathetic version of the thing I was supposed to do — I would not do zero.

That day, I did one arm curl with a one-pound weight.

The next day, I did three.

The day after that, I did ten.

**Never Zero became my religion.**

## What Never Zero Actually Means

Never Zero doesn't mean you have to crush every workout. It doesn't mean you have to be at 100% every day. It means you refuse to let the number reach zero.

Zero is where momentum goes to die. Zero is where habits dissolve. Zero is where the brain stops getting the signal that recovery is still happening.

When you do at least one rep — no matter how small — you send your nervous system a message: *We're still fighting. We're still here. We're still working.*

Neuroplasticity is the science behind this. Every single movement you make is literally rewiring your brain. Every repetition creates a neural pathway. Every day you exercise, even minimally, your brain is building the map it needs to restore function.

Zero repetitions = zero rewiring.

One rep = the beginning of everything.

## The Three Situations Where Never Zero Saves You

### 1. Bad Days

You're going to have bad days. Pain flares. Fatigue that won't lift. Frustration that makes you want to throw your resistance band across the room. These are the days Never Zero matters most.

On bad days, your only job is to not reach zero. Do one movement. Sit up once. Squeeze your hand once. That's it.

The bad day passes. Your momentum doesn't — because you never let it hit zero.

### 2. Plateaus

Recovery plateaus are brutal. You've been working hard, and suddenly the progress stops. You're doing the same exercises and getting the same results.

Never Zero keeps you doing *something* through the plateau. And plateaus always end — for the people who keep showing up.

### 3. After Setbacks

Maybe you got sick. Maybe you had a fall. Maybe life happened and you missed a week. The danger after a setback isn't the setback itself — it's the zero streak that forms afterward.

Never Zero gets you back in action immediately. Not perfectly. Not powerfully. Just back in action.

## How to Apply Never Zero Today

Set your absolute minimum. What is the one thing you can do, even on your worst day?

For me early on, it was one arm lift. That's it. One.

Write it down. "My Never Zero is: [one exercise]."

Then commit to it. Not on good days — every day.

The beautiful thing about Never Zero is that it almost always leads to more. You start your one rep and then you do five. You do five and then you do twenty. But even if you don't — even if all you do is your one — you've kept the streak alive and your brain is still receiving the recovery signal.

## The Proof

I went from 0% function on my left side to 90% function over two years.

I'm not going to pretend I know exactly how much of that was Never Zero. But I know this: the people I've seen stop — the ones who take weeks off, who let the zeros pile up — they don't come back with the same momentum. Some of them don't come back at all.

Never Zero isn't just a workout principle. It's a statement about who you are.

You are someone who does not quit.

Not even on bad days.

Not even one.`,
        authorId: "nick-kremers",
        authorName: "Nick Kremers",
        category: "philosophy",
        tags: ["motivation", "recovery", "mindset", "never zero"],
        featuredImage: "/images/never-zero.jpg",
        status: "published",
        featured: true,
        viewCount: 15234,
        likeCount: 892,
        commentCount: 156,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        readTime: 8,
      },
      {
        id: 2,
        slug: "constraint-induced-movement-therapy",
        title: "Constraint-Induced Movement Therapy: A Complete Guide",
        excerpt: "Everything you need to know about CIMT and how it can accelerate your recovery.",
        content: `If you've been in stroke rehabilitation for any length of time, you've probably heard about Constraint-Induced Movement Therapy — or CIMT. It's one of the most researched and validated rehabilitation techniques available to stroke survivors. And yet a lot of survivors still don't fully understand how it works or whether it's right for them.

This guide covers everything.

## What Is CIMT?

Constraint-Induced Movement Therapy is a rehabilitation approach that involves:

1. **Restraining your stronger arm** — using a sling, mitt, or cast — for a significant portion of your waking hours
2. **Intensively using your weaker arm** — through repetitive, task-focused practice

The key insight behind CIMT is that stroke survivors often develop something called "learned non-use." After a stroke, the affected arm doesn't work well, so you naturally start compensating with your stronger arm. This compensation feels like adaptation — but it's actually making the problem worse. Your brain gets the message: *we don't need the weak arm anymore.* And so it stops trying to rebuild those pathways.

CIMT reverses this. By restraining the good arm, you force the brain to start rebuilding the pathways for the affected side.

## The Science Behind It

CIMT works because of neuroplasticity — the brain's ability to reorganize itself by forming new neural connections.

Every time you use your affected arm, even poorly, you're sending a signal to your brain to keep building that pathway. The more repetitions you do, the stronger that pathway gets.

Studies have shown that CIMT produces measurable improvements in arm function even years after stroke. This is critical: CIMT works in the chronic phase of recovery, not just the acute phase. You don't have to be in the first few months after your stroke for this to be effective.

## What Does a CIMT Program Look Like?

Traditional CIMT protocols involve:

- **Restraining the unaffected arm for 90% of waking hours** for 2-3 weeks
- **6 hours of structured therapy per day** during the treatment period
- **Task practice**: reaching, grasping, picking up objects, daily life tasks

This intensive format isn't always accessible or practical. Modified CIMT programs have emerged that are less intense but still effective:

- Restraint for 5 hours per day
- 30 minutes of structured practice per day
- Spread over a longer period (10-12 weeks)

Both approaches have evidence behind them. If you can access intensive CIMT, go for it. If not, the modified protocol is still worth pursuing.

## What Gains Can You Expect?

This depends on your starting level of function. In general:

- Survivors with *some* active movement in the wrist or hand tend to respond best
- Improvements are most often seen in speed and quality of arm use, not just strength
- Many survivors report improved confidence using the affected arm in daily life

What CIMT won't do is restore function that requires completely healed tissue. If there's no movement at all in the hand, CIMT is less effective. But if you have even a flicker of movement — which is exactly the kind of early recovery signal we watch for — CIMT can amplify that significantly.

## How to Access CIMT

### Option 1: Inpatient or Outpatient Rehab Program

Many rehab facilities now offer CIMT or modified CIMT. Ask your physiatrist or neurologist directly: "Do you offer constraint-induced movement therapy?" If they don't, ask for a referral to someone who does.

### Option 2: Home-Based Modified CIMT

You can implement the core principle of CIMT at home with guidance:

- Use a lightweight mitt or sling to restrain your stronger arm during specific daily activities
- Practice repetitive tasks with the affected arm: picking up sponges, stacking cups, turning doorknobs, pouring water
- Aim for 300-400 repetitions per session

This won't replace professional CIMT, but it applies the core neuroplasticity principle to your daily routine.

### Option 3: Research Studies

Universities and medical centers frequently conduct CIMT research studies that provide the therapy free of charge. Search clinicaltrials.gov for "constraint-induced movement therapy" to find studies near you.

## The Mental Side of CIMT

I won't pretend CIMT is comfortable. Restraining your good arm is frustrating. Struggling to do simple tasks with an arm that doesn't work well is humiliating.

Here's what I tell people: the frustration is part of the process. Your brain needs to feel the need before it builds the solution. The struggle is the signal.

Embrace it.`,
        authorId: "nick-kremers",
        authorName: "Nick Kremers",
        category: "therapy",
        tags: ["physical therapy", "CIMT", "arm recovery", "neuroplasticity"],
        featuredImage: "/images/cimt-therapy.jpg",
        status: "published",
        featured: true,
        viewCount: 12456,
        likeCount: 734,
        commentCount: 89,
        createdAt: new Date("2024-02-20"),
        updatedAt: new Date("2024-02-20"),
        readTime: 12,
      },
      {
        id: 3,
        slug: "neuroplasticity-and-recovery",
        title: "How Neuroplasticity Powers Your Recovery",
        excerpt: "Understanding your brain's remarkable ability to rewire itself after stroke.",
        content: `When I first heard the word "neuroplasticity" in my rehabilitation, I thought it was just medical jargon. Doctor-speak for something that didn't actually matter to me practically.

I was wrong. Understanding neuroplasticity is the single most important thing a stroke survivor can do — because it completely changes how you think about your recovery and what's actually possible.

## Your Brain Is Not Fixed

For most of medical history, scientists believed that the adult brain was essentially static. Once you lost brain cells, they were gone. Damage was permanent.

This is now understood to be completely wrong.

Your brain is dynamic. It constantly reorganizes itself, forms new connections, and reassigns functions from damaged areas to healthy ones. This is neuroplasticity.

After a stroke destroys brain tissue, the surrounding healthy tissue can literally learn to take over the functions that were lost. This doesn't happen automatically — it requires input. It requires practice. It requires repetition.

But it happens. That's the miracle.

## How Neuroplasticity Works in Practice

Think of it like this: before your stroke, your brain had well-worn paths for every movement and function. These paths were built over years of use. They were efficient, automatic, and fast.

A stroke damages or destroys some of those paths.

Neuroplasticity allows your brain to build new paths — different routes to the same destination. But building new paths requires effort. You have to walk them over and over until they become efficient.

This is why repetition is everything in stroke recovery.

**400-1,000 repetitions per therapy session** is the range supported by research for driving meaningful neuroplastic change. This sounds like a lot. Most traditional therapy sessions achieve 30-50 repetitions.

The gap between what research shows works and what standard therapy delivers is one of the biggest problems in stroke rehabilitation today.

## The Key Principles That Drive Neuroplasticity

### 1. Use It or Lose It

Pathways that aren't used weaken and eventually disappear. This is why learned non-use — compensating with your stronger side — works against your recovery. Your brain gets the message that the affected side isn't needed, and it stops devoting resources to rebuilding it.

### 2. Use It and Improve It

The flip side: pathways that are used regularly strengthen and become more efficient. Every repetition counts. Every movement your affected limb makes sends a signal to your brain: *build this.*

### 3. Specificity

The brain builds what you practice. If you practice lifting a cup, your brain gets better at lifting a cup. If you practice walking, your brain gets better at walking. Generic exercise has some benefit, but task-specific practice drives the most targeted neuroplastic change.

### 4. Intensity Matters

More repetitions within a session drive stronger neuroplastic signals. This is why intensive therapy — even for short bursts — tends to outperform low-intensity therapy stretched over a longer period.

### 5. It's Never Too Late

This is the most important principle. Research has consistently shown neuroplastic changes occurring in stroke survivors who are months and years post-stroke. The brain doesn't stop being plastic.

If someone tells you recovery stops at 6 months or 1 year, they are wrong. The science does not support this. I am living proof — my most significant gains came 18-24 months after my stroke.

## What This Means for You

Every single exercise you do today is not just physical effort — it is literally rewiring your brain.

That's not motivational language. That's neuroscience.

When you do your 400 arm curls, you are building neural pathways. When you practice writing your name, you are reorganizing your motor cortex. When you work on your speech, you are creating new language processing routes.

This is why quitting is so costly. Every day you don't practice, those pathways don't strengthen. Every day you do practice, they do.

## Practical Steps to Maximize Neuroplasticity

- **High repetition**: aim for hundreds of reps per session, not dozens
- **Task-specific practice**: focus on real movements you need for daily life
- **Mental rehearsal**: research shows that *imagining* movements activates similar neural pathways as performing them — powerful for days when physical practice is limited
- **Challenge yourself**: the brain responds most strongly to effortful, slightly difficult tasks. Easy tasks that require no concentration drive less neuroplastic change
- **Sleep**: neuroplastic consolidation happens during sleep. Prioritizing sleep is not optional.

Your brain is ready to rebuild. Give it the signal.`,
        authorId: "nick-kremers",
        authorName: "Nick Kremers",
        category: "science",
        tags: ["brain", "neuroplasticity", "science", "recovery principles"],
        featuredImage: "/images/neuroplasticity.jpg",
        status: "published",
        featured: false,
        viewCount: 9823,
        likeCount: 567,
        commentCount: 72,
        createdAt: new Date("2024-03-10"),
        updatedAt: new Date("2024-03-10"),
        readTime: 10,
      },
      {
        id: 4,
        slug: "caregiver-burnout-prevention",
        title: "Preventing Caregiver Burnout: A Guide for Families",
        excerpt: "Essential strategies for caregivers to maintain their own health while supporting recovery.",
        content: `Nobody warned my wife about what was coming.

She was suddenly the caregiver, the breadwinner, the scheduler, the advocate, the cook, the driver, the emotional support system — all at once. And she was watching her husband fight to relearn how to button a shirt.

This article is for people like her.

## What Caregiver Burnout Actually Is

Caregiver burnout is not laziness. It is not weakness. It is not a sign that you don't love the person you're caring for.

It is a state of physical, emotional, and mental exhaustion that results from the sustained, relentless demands of caregiving without adequate support.

Symptoms include:

- Persistent exhaustion that sleep doesn't fix
- Increasing resentment or frustration toward the survivor (followed by guilt)
- Withdrawing from friends, family, and activities
- Neglecting your own health needs
- Feeling like you have no life outside of caregiving
- Physical symptoms: headaches, sleep problems, illness

According to research, over 40% of stroke caregivers experience significant depression within the first year. This is not a small problem.

## Why Caregivers Resist Getting Help

Most caregivers I've encountered have a version of this thought: *"If I take time for myself, I'm abandoning them."*

This is the lie that drives burnout.

The airplane oxygen mask analogy exists for a reason: you cannot help anyone else from a position of depletion. A burned-out caregiver is not a good caregiver. A burned-out caregiver is at risk — for their own health, and for the quality of care they can provide.

Taking care of yourself is part of taking care of the survivor. Not separate from it.

## Practical Strategies for Caregivers

### Build a Team

You were not designed to do this alone. Nobody is.

Make a list of every task you handle for the survivor. Then make a list of people who could help with even one of those tasks. Family, friends, neighbors, church members, volunteers.

Ask specifically. "Can you drive Nick to therapy on Thursdays?" is a request people can say yes to. "Let me know if you can help" gets no response.

### Protect Non-Negotiable Time

Pick two to three hours per week that belong entirely to you. Not recovery errands. Not calls to insurance companies. Time for something you actually want to do.

This time is non-negotiable. Treat it the same way you treat the survivor's therapy appointments.

### Connect With Other Caregivers

Stroke caregiver support groups exist in most cities and in abundance online. Talking with people who actually understand what you're experiencing is genuinely therapeutic in a way that general support cannot be.

The American Stroke Association maintains a list of caregiver support groups at stroke.org.

### Separate Your Identity From the Caregiving Role

You are not just a caregiver. You are a person with interests, needs, relationships, and a future.

Recovery takes years. If you spend those years fully submerged in the caregiver identity, you will emerge from this period not knowing who you are anymore. Keep something — even one small thing — that is yours.

### Name the Grief

Caregivers experience real grief. The loss of the person they knew before the stroke, even when that person is still here. The loss of the plans you had. The loss of the equal partnership.

This grief is valid. It does not make you a bad person. Name it, acknowledge it, and ideally talk about it with a therapist or support group.

## A Note to Stroke Survivors

If you're reading this as a survivor: your caregiver needs your acknowledgment.

I know you're fighting your own battle. I know everything is hard. But the people caring for you are fighting too — mostly invisibly.

Thank them specifically. Name what they do. Ask how they're doing and actually listen. These things cost you nothing and matter enormously.

The strongest recoveries I've seen involve survivors and caregivers who treat each other as partners — not patient and helper.

You're in this together.`,
        authorId: "nick-kremers",
        authorName: "Nick Kremers",
        category: "caregivers",
        tags: ["caregivers", "mental health", "family", "burnout prevention"],
        featuredImage: "/images/caregiver-support.jpg",
        status: "published",
        featured: false,
        viewCount: 7654,
        likeCount: 445,
        commentCount: 98,
        createdAt: new Date("2024-03-25"),
        updatedAt: new Date("2024-03-25"),
        readTime: 7,
      },
      {
        id: 5,
        slug: "speech-therapy-exercises-home",
        title: "10 Speech Therapy Exercises You Can Do at Home",
        excerpt: "Practical exercises to improve speech and language recovery between therapy sessions.",
        content: `Speech recovery is one of the most emotionally difficult parts of stroke rehabilitation.

You know what you want to say. The words are in your mind. But the path from thought to speech is broken, and watching people struggle to understand you — watching their eyes shift, watching them try to fill in the gap — is its own particular kind of agony.

I know this because I lived it.

The good news: speech recovery doesn't only happen in your therapist's office. Research consistently shows that more practice — not just better practice — drives speech gains. The exercises below are evidence-based practices you can do at home, in between therapy sessions.

## Before You Start

A few guidelines:

- **Consistency beats intensity**: 20 minutes daily outperforms 2 hours once a week
- **Record yourself**: hearing your speech is uncomfortable but essential for noticing progress
- **Don't rush**: slow, deliberate production is more effective than fast, sloppy attempts
- **Rest when fatigued**: speech fatigue is real and counterproductive

## The 10 Exercises

### 1. Tongue Tip Lateralization

Touch the tip of your tongue to your upper right molars. Then move to upper left. Then lower right. Then lower left.

Repeat 10 times in each direction.

This builds the fine motor control that clear speech requires. Do it slowly and deliberately.

### 2. Syllable Repetition Drills

Choose a syllable set: ba-ba-ba, da-da-da, ka-ka-ka, la-la-la, pa-pa-pa.

Say each 20 times with clear articulation. Then progress to: ba-da-ka, pa-ta-ka, ma-na-la.

These are the same drills used in formal speech therapy. They target the muscle coordination needed for consonant clarity.

### 3. Sentence Completion Practice

Have someone start sentences that you complete:

- "I am feeling very ___."
- "My favorite food is ___."
- "Tomorrow I want to ___."

This is less intimidating than generating full sentences and activates the word-retrieval network in a supported way.

### 4. Word-to-Category Sorting

Name as many items as you can from a category in 60 seconds.

- Animals
- Fruits
- Things in a kitchen
- Sports
- Countries

This targets word fluency and lexical retrieval — the process of finding words when you need them.

### 5. Reading Aloud

Choose something to read out loud for 10-15 minutes daily. Start with children's books or short news articles. Progress to more complex material as clarity improves.

Reading aloud engages visual processing, comprehension, and speech production simultaneously — a powerful combination.

### 6. Tongue Strengthening

Stick your tongue out as far as possible. Hold 5 seconds. Retract. Repeat 10 times.

Then push your tongue into each cheek, holding 5 seconds each side.

Tongue strength directly impacts clarity for sounds like L, T, D, N, and TH.

### 7. Melodic Intonation Therapy (Basic Version)

This technique, used in formal therapy, leverages the brain's intact musical processing centers when speech is damaged.

Choose a short phrase: "I want water." Hum it. Then say it with an exaggerated sing-song melody. Then say it normally.

This pathway — hum → melody → speech — can unlock words that feel inaccessible through standard speaking attempts.

### 8. Video Modeling

Find videos of people clearly speaking your target sounds or words. Watch, then mimic immediately.

Mirror neurons in the brain activate when we observe others performing actions, facilitating imitation learning. This is more effective than practicing in isolation.

### 9. Breathing Exercises for Speech

Strong speech requires breath support. Practice:

- Deep diaphragmatic breaths (belly, not chest)
- Extended vowel sounds on a single breath: "Aaaaaah" for 10 seconds
- Counting aloud on a single breath: "1, 2, 3, 4, 5..." as far as you can go before needing a breath

These exercises directly improve voice volume and endurance.

### 10. Conversation Simulation

Ask a family member to have a structured 10-minute conversation with you on a specific topic each day.

The topic helps you prepare vocabulary. The structure reduces the overwhelm of open-ended conversation. And the daily repetition builds the habit of communication even when it's hard.

## Tracking Progress

Keep a simple log:
- Which exercises you did
- Duration
- How it felt (easy / moderate / hard)

Progress in speech recovery is often invisible day-to-day and only clear over weeks and months. Your log will show you how far you've come.

## When to Push, When to Rest

Push through mild discomfort. Speech work is inherently fatiguing.

Rest when you notice your speech getting *worse* during practice — this is a sign of genuine fatigue, and pushing through it reinforces errors rather than corrections.

The goal is effortful but successful practice. Not impossible, not too easy.

You have more speech in you than you think. Let's get it out.`,
        authorId: "nick-kremers",
        authorName: "Nick Kremers",
        category: "exercises",
        tags: ["speech", "exercises", "home therapy", "aphasia"],
        featuredImage: "/images/speech-therapy.jpg",
        status: "published",
        featured: true,
        viewCount: 18234,
        likeCount: 1023,
        commentCount: 234,
        createdAt: new Date("2024-04-05"),
        updatedAt: new Date("2024-04-05"),
        readTime: 9,
      },
      {
        id: 6,
        slug: "stroke-survivor-income-from-home",
        title: "How Stroke Survivors Can Generate Real Income From Home",
        excerpt: "Cognitive and physical limitations don't have to mean financial helplessness. Here's a realistic roadmap for earning while you recover.",
        content: `After a stroke, many survivors face a brutal double blow: their ability to work is reduced or eliminated just as medical bills start piling up. It feels impossible. But it doesn't have to be.

The key insight is this: traditional employment was built for able-bodied people on a fixed schedule. Recovery doesn't work on a schedule. Your income strategy shouldn't either.

**What Actually Works for Stroke Survivors**

The best income opportunities for survivors share three traits: they require no fixed schedule, have minimal physical demands, and leverage skills or relationships you already have.

**1. Referral Programs**

If you know people — and you do — you can earn money connecting them to services they need. Business loan referral programs like ROK Financial's partner program are a prime example. Business owners constantly need capital. You don't need to sell anything. You introduce someone, their team handles the rest, and you earn a commission when the deal closes.

This works because your network — built over decades before your stroke — doesn't disappear when you have a stroke. It's still there. It's still valuable.

**2. Consulting and Knowledge Work**

Your professional expertise didn't evaporate. If you spent 20 years in accounting, marketing, healthcare, or any other field, that knowledge is still marketable — just in a different format. Short consulting calls, written guides, or answering questions in forums can all generate income.

**3. Selling Digital Products**

Templates, guides, ebooks — once created, these sell while you sleep. The upfront effort is real, but the ongoing demand on your time and body is minimal.

**Starting Point: One Referral**

Don't try to build an empire on day one. Start with one referral through one program. See what the process feels like. Build from there.

The ROK Financial partner program is a good starting point because it's genuinely simple: you give them a name and contact info, they do the rest, and you earn when the deal funds. [Learn more and apply here](/recovery/survivor-income).

Recovery takes time. Financial recovery doesn't have to wait until physical recovery is complete.`,
        authorId: "nick-kremers",
        authorName: "Nick Kremers",
        category: "income",
        tags: ["income", "financial recovery", "work from home", "stroke survivor"],
        metaTitle: "How Stroke Survivors Can Earn Real Income From Home | Stroke Recovery Academy",
        metaDescription: "Cognitive and physical limitations don't have to mean financial helplessness. Nick Kremers shares realistic income strategies built specifically for stroke survivors.",
        focusKeyphrase: "stroke survivor income from home",
        featuredImage: "/images/survivor-income.jpg",
        status: "published",
        featured: true,
        viewCount: 4821,
        likeCount: 312,
        commentCount: 47,
        createdAt: new Date("2025-01-10"),
        updatedAt: new Date("2025-01-10"),
        readTime: 6,
      },
      {
        id: 7,
        slug: "business-loan-referrals-passive-income",
        title: "Business Loan Referrals: The Simplest Passive Income Strategy Most People Overlook",
        excerpt: "If you know business owners, you have an asset worth money. Here's exactly how the referral model works and what you can expect to earn.",
        content: `Most people think passive income requires a big upfront investment — money, time, or technical skill. Business loan referrals are different. They require none of those things. They require relationships.

**The Basic Mechanics**

A business loan referral program works like this:
1. You sign up as a referral partner (free to join)
2. You refer a business owner who needs funding
3. The lending company handles everything: application, approval, terms, closing
4. When the loan funds, you receive a commission

That's the entire model. No licenses, no financial expertise, no selling.

**Who Qualifies as a "Business Owner You Know"?**

Think broader than you might initially. A business owner is:
- Your neighbor who runs a landscaping company
- A friend from church who owns a restaurant
- A former coworker who started a consulting practice
- Your cousin who runs an e-commerce store
- Anyone who owns a business with employees, inventory, or commercial space

Most people know 5-15 of these people without realizing it.

**What Does ROK Financial Actually Do?**

ROK Financial works with 75+ commercial lenders to find the best financing for businesses. They handle: SBA loans, business term loans, lines of credit, equipment financing, and more.

Their partner program has a 4.9-star rating on Trustpilot based on 1,000+ reviews. The advisors are real people who handle every step after you make the introduction.

**Commission Expectations**

Commissions vary by deal size. Typical ranges:
- Small business loan ($25K-$100K): $200-$800 commission
- Mid-size deal ($100K-$500K): $500-$2,500 commission
- Larger commercial deal ($500K+): $1,500-$5,000+ commission

For a stroke survivor working from home, one funded referral per month could meaningfully supplement disability income or Social Security benefits.

**Getting Started**

The application takes about 5 minutes. [Apply as a ROK Financial partner here](/recovery/survivor-income). Once approved, you'll have access to their partner portal and can start submitting referrals immediately.`,
        authorId: "nick-kremers",
        authorName: "Nick Kremers",
        category: "income",
        tags: ["passive income", "business loans", "referral program", "income for survivors"],
        metaTitle: "Business Loan Referrals: Simple Passive Income for Stroke Survivors | Stroke Recovery Academy",
        metaDescription: "If you know business owners, you can earn real commissions referring them to commercial financing. Here's exactly how ROK Financial's referral program works for stroke survivors.",
        focusKeyphrase: "business loan referral passive income",
        featuredImage: "/images/business-loan-referrals.jpg",
        status: "published",
        featured: true,
        viewCount: 3256,
        likeCount: 198,
        commentCount: 29,
        createdAt: new Date("2025-01-20"),
        updatedAt: new Date("2025-01-20"),
        readTime: 7,
      },
      {
        id: 8,
        slug: "rebuilding-financial-confidence-after-stroke",
        title: "Rebuilding Financial Confidence After Stroke",
        excerpt: "A stroke doesn't just affect your body. It hits your identity, your income, and your sense of financial control. Here's how to start rebuilding — one step at a time.",
        content: `Nobody talks about the financial grief that comes with stroke.

You lose your job, or your hours, or your ability to do the work that defined you. You lose the feeling that you're contributing. You watch savings shrink. Medical bills grow. And on top of all of it, you're supposed to do your exercises and stay positive.

This article is for the person who's done being told to stay positive without being given a plan.

**The Financial Reality of Stroke**

According to the American Stroke Association, stroke is a leading cause of long-term disability in the United States. For working-age survivors, this often means:
- Partial or full loss of income
- Increased medical expenses
- Reduced ability to manage complex financial tasks
- Dependence that feels humiliating when you're used to providing

These are real problems. Acknowledging them isn't pessimism — it's the first step toward solving them.

**What Financial Recovery Actually Looks Like**

Financial recovery from stroke isn't about getting back to where you were. That may take years — or it may look different than before. It's about building a new foundation that matches your current capabilities.

Start here:

**1. Know what's available to you**

Social Security Disability Insurance (SSDI), Supplemental Security Income (SSI), and state-level programs exist for a reason. Accessing them isn't weakness. It's using systems you've already paid into.

**2. Identify what you can still do**

Your professional network, your knowledge, your relationships — these survived your stroke. They can generate income in new forms. Consulting, referrals, teaching, writing. The format changes. The underlying value doesn't.

**3. Start one small thing**

Financial confidence doesn't come from a plan. It comes from doing one small thing, then another. Sign up for a referral program. Sell one thing. Make one call. Movement matters more than magnitude.

**The Survivor Income Program**

At Stroke Recovery Academy, we've partnered with ROK Financial to give survivors a concrete income starting point. If you know business owners who need financing, you can earn commissions referring them — no experience required, no schedule required, no physical demands.

[Explore the Survivor Income Program here](/recovery/survivor-income).

Your recovery is your job right now. But financial recovery deserves attention too. You don't have to choose between them.`,
        authorId: "nick-kremers",
        authorName: "Nick Kremers",
        category: "income",
        tags: ["financial recovery", "stroke identity", "income", "SSDI", "financial confidence"],
        metaTitle: "Rebuilding Financial Confidence After Stroke | Stroke Recovery Academy",
        metaDescription: "A stroke hits your income, your identity, and your sense of control. Nick Kremers shares a realistic, step-by-step approach to rebuilding financial confidence while still in recovery.",
        focusKeyphrase: "rebuilding financial confidence after stroke",
        featuredImage: "/images/financial-recovery.jpg",
        status: "published",
        featured: false,
        viewCount: 2891,
        likeCount: 241,
        commentCount: 63,
        createdAt: new Date("2025-02-05"),
        updatedAt: new Date("2025-02-05"),
        readTime: 8,
      },
      {
        id: 9,
        slug: "journaling-after-stroke-rewires-your-brain",
        title: "Why Journaling After a Stroke Rewires Your Brain",
        excerpt: "A cheap spiral notebook was the rehab tool nobody warned me about. Here's the science on why journaling after a stroke is reps for your brain — not busywork.",
        content: `Three months after my stroke, a therapist handed me a cheap spiral notebook and told me to write one sentence a day.

I thought it was busywork. I was wrong.

## The science nobody mentions in the hospital

Neuroplasticity is the brain's ability to rebuild — to route function around dead tissue by firing new pathways over and over until they hold. Reps build it. You already know that part.

What the discharge papers don't tell you: language is reps too.

When you put words to what happened — the fall, the fear, the small win nobody else noticed — you fire the language network, the memory network, and the emotional-regulation network at the same time. Expressive writing has decades of research behind it. James Pennebaker's work showed people who wrote about hard experiences had measurably better health outcomes than people who wrote about nothing at all.

For a stroke survivor, that's not a wellness hack. That's rehab.

## What journaling actually does for recovery

**It externalizes the chaos.** A stroke scrambles your sense of time and self. Writing pins it down. Once it's on the page, your brain stops spending energy holding it — and frees that energy for the next rep.

**It tracks progress your eyes miss.** Day to day, you feel stuck. But read back three weeks and you'll see it — the grip that came back, the word you couldn't find that you now use without thinking. Progress is invisible in the moment and obvious in the record.

**It regulates the emotional avalanche.** Naming a feeling lowers its charge. That's not soft — that's measurable. Survivors who process the grief instead of swallowing it tend to stay in the fight longer.

## You don't need a notebook

Here's the part that would've saved me a year of frustration: you don't have to write with a broken hand.

Our [Reflections journal](/recovery/journal) lets you talk instead of type — record a voice note and it transcribes itself. Add a photo of today's win. Everything autosaves as you go, so a dropped connection or a tired hand never costs you your words.

One working hand, one working voice, one sentence. That's the whole bar.

## Start with one sentence

You don't need to write your memoir today. You need to not write zero.

Open [Reflections](/recovery/journal) and put down one true thing about today. Tomorrow, one more.

That's how the pathway gets built — one rep at a time. Heart's still thumpin'.`,
        authorId: "nick-kremers",
        authorName: "Nick Kremers",
        category: "science",
        tags: ["journaling", "neuroplasticity", "recovery", "expressive writing", "brain health"],
        metaTitle: "Why Journaling After a Stroke Rewires Your Brain | Stroke Recovery Academy",
        metaDescription: "Journaling after a stroke isn't busywork — it's reps for your brain. Nick Kremers breaks down the neuroplasticity and expressive-writing science, and how to start with one sentence.",
        focusKeyphrase: "journaling after stroke",
        featuredImage: "/images/journaling-brain.jpg",
        status: "published",
        featured: false,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        createdAt: new Date("2026-05-12"),
        updatedAt: new Date("2026-05-12"),
        readTime: 6,
      },
      {
        id: 10,
        slug: "how-to-start-a-stroke-recovery-journal",
        title: "How to Start a Stroke Recovery Journal (Even With One Working Hand)",
        excerpt: "A practical, no-pressure guide to starting a stroke recovery journal when typing is hard — voice notes, photos, and the one-sentence rule that actually sticks.",
        content: `Most "how to journal" advice assumes two good hands, a quiet hour, and a calm mind. After a stroke, you might have none of those.

This guide is for the rest of us.

## Forget the blank page

The blank page is the enemy. It asks for too much. So we don't ask for a page — we ask for one sentence.

One true sentence about today. That's the entire assignment. "My arm felt heavy." "I walked to the mailbox." "I'm angry and I don't know why." All of those count.

The one-sentence rule works because it removes the excuse. You're never too tired for one sentence.

## Use the tool that fits the day

Some days your hand cooperates. Most days early on, it won't. So don't fight it.

- **Talk it.** In [Reflections](/recovery/journal) you can record a voice note instead of typing. It transcribes for you — your words, on the page, without the keyboard battle. For survivors working through aphasia, speaking is often the lower hill to climb.
- **Show it.** Snap a photo of the win — the full glass you didn't spill, the shoes you tied, the path you walked. Some progress doesn't fit in words.
- **Type it when you can.** On a good day, write more. On a bad day, write one line. Both keep the streak alive.

## Make it stick to something you already do

A habit needs an anchor. Pick a thing you already do every day and bolt the journal to it.

After your morning coffee. After your last therapy rep. Before you turn off the light. The anchor does the remembering so you don't have to.

## Don't edit. Don't perform.

Nobody's grading this. Spelling doesn't matter. Grammar doesn't matter. This isn't for an audience — it's for the version of you reading it back in a month who needs proof the work is paying off.

Your journal is private by default. You choose if a single entry ever gets shared.

## The payoff

Six weeks in, you'll have something most survivors never get: a record. Proof of the climb. On the days the wall feels permanent, you'll flip back and see exactly how far you've already come.

Start now — one sentence in [Reflections](/recovery/journal). Don't do zero.`,
        authorId: "nick-kremers",
        authorName: "Nick Kremers",
        category: "philosophy",
        tags: ["journaling", "stroke recovery", "habits", "voice notes", "getting started"],
        metaTitle: "How to Start a Stroke Recovery Journal (Even With One Hand) | Stroke Recovery Academy",
        metaDescription: "A practical, no-pressure guide to starting a stroke recovery journal when typing is hard. Voice notes, photos, and the one-sentence rule that actually sticks.",
        focusKeyphrase: "stroke recovery journal",
        featuredImage: "/images/start-journal.jpg",
        status: "published",
        featured: false,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        createdAt: new Date("2026-05-19"),
        updatedAt: new Date("2026-05-19"),
        readTime: 5,
      },
      {
        id: 11,
        slug: "voice-journaling-for-aphasia-and-speech-recovery",
        title: "Voice Journaling for Aphasia and Speech Recovery",
        excerpt: "When the words are in your head but won't come out, a keyboard makes it worse. Here's how voice journaling turns daily reflection into speech practice.",
        content: `Aphasia is its own particular hell. You know what you want to say. The thought is right there. But the road from thought to speech is washed out, and watching people wait for you — watching their eyes drift — wears you down fast.

Writing it doesn't always help, because for many survivors the writing pathway took the same hit as the speaking one.

So we use the voice. On purpose. As practice.

## Why speaking out loud is rehab

Speech-language therapy runs on one principle: more practice drives more recovery. Not just better practice in the clinic — more of it, everywhere, in between sessions.

Voice journaling smuggles practice into your day. You're not "doing exercises." You're just talking about your day. But every word you push out is a rep on the exact pathway you're trying to rebuild.

And because you're talking about something real — your day, your win, your frustration — the words come easier than they do from a flashcard. Meaning pulls language out when drills can't.

## How to do it

In [Reflections](/recovery/journal), hit record and just talk. Don't script it. Don't restart every time a word sticks — push through, the way you would in therapy.

When you stop, it transcribes what you said. Two things happen:

1. You get your entry without ever touching a keyboard.
2. You get a mirror. Reading back the transcript shows you which words landed and which didn't — quiet feedback, no audience, no pressure.

If the transcript is rough on a hard day, that's data, not failure. Compare it to last month's. That's the progress speech therapy is famously bad at showing you in the moment.

## Keep the bar on the floor

Some days you'll get a paragraph. Some days you'll get four words and they'll be a fight. Both count. Both are reps.

The goal was never a perfect recording. The goal is that you spoke today instead of going silent.

## Pair it with your therapist

Bring your transcripts to your speech-language pathologist. A month of real-world samples is gold for them — far more useful than how you sound in a clinic chair.

Open [Reflections](/recovery/journal), hit record, and say one true thing out loud. That's the rep.`,
        authorId: "nick-kremers",
        authorName: "Nick Kremers",
        category: "therapy",
        tags: ["aphasia", "speech recovery", "voice journaling", "speech therapy", "journaling"],
        metaTitle: "Voice Journaling for Aphasia and Speech Recovery | Stroke Recovery Academy",
        metaDescription: "When words are in your head but won't come out, a keyboard makes it worse. Learn how voice journaling turns daily reflection into real speech practice for aphasia recovery.",
        focusKeyphrase: "voice journaling for aphasia",
        featuredImage: "/images/voice-journaling.jpg",
        status: "published",
        featured: false,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        createdAt: new Date("2026-05-26"),
        updatedAt: new Date("2026-05-26"),
        readTime: 6,
      },
      {
        id: 12,
        slug: "turn-your-recovery-journal-into-a-book",
        title: "Turn Your Recovery Journal Into a Book",
        excerpt: "The entries you write to survive can become something more — a book that helps the next survivor, and maybe a little income. Here's how to compile yours.",
        content: `I never set out to write a book. I set out to not lose my mind.

I wrote to track the reps, to vent the rage, to remember the wins before they slipped away. Years later, those scattered entries became the spine of everything I teach now.

Your journal can do the same thing. Here's how.

## Your words are already the hard part

People freeze at "write a book" because they picture a blank document and a year of discipline. But if you've been journaling, you've already done the part that stops everyone else — you've put true words on the page, consistently, about something that matters.

The book isn't a new project. It's a compile.

## From entries to manuscript

In [Reflections](/recovery/journal), your entries can be compiled — in order, in your words — straight into a Book Studio draft. No AI rewriting your voice. No ghostwriter flattening your story. Your reps, your rage, your wins, lined up as a manuscript you can shape.

From there you can edit, arrange, and add the connective tissue. The raw material — the honest daily record — is the part that was always going to be hardest, and you already have it.

## Why bother making it a book

**Because the next survivor needs it.** The most useful thing I ever read in recovery wasn't from a doctor. It was from someone six months ahead of me who'd written down what it actually felt like. You are six months ahead of someone right now.

**Because it closes the loop.** Turning the worst chapter of your life into something that helps somebody else — that changes what the stroke means. It stops being only the thing that happened to you.

**Because it can pay.** When a survivor's book sells on our marketplace, the author earns from it. We don't promise numbers — your impact stats start at zero and only move when a real sale lands, no fabricated figures. But the door is open. Your story can carry weight and put something back in your pocket.

## Start where you are

You don't need a finished book today. You need entries. The book is downstream of the habit.

Open [Reflections](/recovery/journal), keep writing the true thing each day, and let the manuscript build itself one entry at a time. When you're ready, compile it.

Heart's still thumpin'. So is your story.`,
        authorId: "nick-kremers",
        authorName: "Nick Kremers",
        category: "income",
        tags: ["journaling", "writing a book", "survivor income", "book studio", "stroke story"],
        metaTitle: "Turn Your Recovery Journal Into a Book | Stroke Recovery Academy",
        metaDescription: "The entries you write to survive can become a book that helps the next survivor — and maybe earns a little income. Learn how to compile your stroke recovery journal into a manuscript.",
        focusKeyphrase: "turn recovery journal into a book",
        featuredImage: "/images/journal-to-book.jpg",
        status: "published",
        featured: false,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        createdAt: new Date("2026-06-02"),
        updatedAt: new Date("2026-06-02"),
        readTime: 6,
      },
    ];

    let filtered = seedPosts;
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    if (featured) {
      filtered = filtered.filter(p => p.featured);
    }
    return filtered as BlogPost[];
  }

  // Recovery Book Methods
  async getRecoveryBook(userId: string): Promise<any> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM recovery_books 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1
      `);
      
      if (result.rows && result.rows.length > 0) {
        return result.rows[0];
      }
      
      // Return default structure if no book exists
      return {
        title: "My Recovery Story",
        subtitle: "",
        chapters: [],
        wordCount: 0,
        lastSaved: null,
      };
    } catch (error) {
      console.error("Error fetching recovery book:", error);
      return {
        title: "My Recovery Story",
        subtitle: "",
        chapters: [],
        wordCount: 0,
        lastSaved: null,
      };
    }
  }

  async saveRecoveryBook(userId: string, data: any): Promise<any> {
    try {
      // First check if user has existing book
      const existing = await this.getRecoveryBook(userId);
      
      if (existing && existing.id) {
        const result = await db.execute(sql`
          UPDATE recovery_books 
          SET title = ${data.title || existing.title},
              subtitle = ${data.subtitle || existing.subtitle},
              chapters = ${JSON.stringify(data.chapters || existing.chapters)},
              word_count = ${data.wordCount || existing.word_count},
              last_saved = NOW()
          WHERE id = ${existing.id}
          RETURNING *
        `);
        return result.rows?.[0];
      } else {
        const result = await db.execute(sql`
          INSERT INTO recovery_books (user_id, title, subtitle, chapters, word_count)
          VALUES (${userId}, ${data.title || 'My Recovery Story'}, ${data.subtitle || ''}, 
                  ${JSON.stringify(data.chapters || [])}, ${data.wordCount || 0})
          RETURNING *
        `);
        return result.rows?.[0];
      }
    } catch (error) {
      console.error("Error saving recovery book:", error);
      throw error;
    }
  }

  async saveRecoveryChapter(userId: string, chapterId: string, title: string, content: string): Promise<any> {
    try {
      const book = await this.getRecoveryBook(userId);
      let chapters = book.chapters || [];
      
      const existingIndex = chapters.findIndex((c: any) => c.id === chapterId);
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      
      const chapter = {
        id: chapterId,
        title,
        content,
        wordCount,
        lastEdited: new Date().toISOString(),
      };
      
      if (existingIndex >= 0) {
        chapters[existingIndex] = chapter;
      } else {
        chapters.push(chapter);
      }
      
      const totalWordCount = chapters.reduce((sum: number, c: any) => sum + (c.wordCount || 0), 0);
      
      return await this.saveRecoveryBook(userId, {
        ...book,
        chapters,
        wordCount: totalWordCount,
      });
    } catch (error) {
      console.error("Error saving recovery chapter:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
