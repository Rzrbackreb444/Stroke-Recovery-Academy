import { Router, Request, Response } from "express";
import { db } from "./db";
import { eq, and, gte, desc, asc, ilike, or, sql } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";
import { checkAiGenerationLimit, recordUsage } from "./rateLimitService";
import { GoogleGenAI } from "@google/genai";
import QRCode from "qrcode";
import {
  quoteCategories,
  quotes,
  qrCodeProjects,
  qrCodeRotationSettings,
  projectQuotePool,
  userStreaks,
  quoteScanAnalytics,
  insertQuoteSchema,
  insertQrCodeProjectSchema,
  insertProjectQuotePoolSchema,
} from "@shared/schema";
import { z } from "zod";

const router = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const generateQuotesRequestSchema = z.object({
  industry: z.string().min(1),
  tone: z.string().default("motivational"),
  targetAudience: z.string().optional(),
  count: z.number().min(1).max(20).default(5),
});

router.get("/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await db
      .select()
      .from(quoteCategories)
      .where(eq(quoteCategories.isActive, true))
      .orderBy(asc(quoteCategories.order), asc(quoteCategories.name));
    
    res.json(categories);
  } catch (error) {
    console.error("Error fetching quote categories:", error);
    res.status(500).json({ message: "Failed to fetch quote categories" });
  }
});

router.post("/quotes/generate", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parseResult = generateQuotesRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        message: "Invalid request body", 
        errors: parseResult.error.errors 
      });
    }

    // Tier-based daily/monthly AI generation quota. Bypasses cost
    // controls otherwise — this route calls Gemini directly without
    // going through aiOrchestrator (which has its own 150k tokens/day cap).
    const quota = await checkAiGenerationLimit(userId);
    if (!quota.allowed) {
      return res.status(429).json({ message: quota.message ?? "Quota exceeded" });
    }
    // Best-effort post-call usage record. Failure to record must not
    // block the response, but without this the quota check above would
    // never advance.
    recordUsage(userId, "quote_generate").catch(() => {});

    const { industry, tone, targetAudience, count } = parseResult.data;

    const prompt = `Generate ${count} unique, compelling quotes for the ${industry} industry.

Tone: ${tone}
${targetAudience ? `Target Audience: ${targetAudience}` : ""}

Requirements:
- Each quote should be 1-3 sentences
- Make them memorable and actionable
- Avoid clichés and generic phrases
- Include a mix of motivational, practical, and thought-provoking quotes
- Do NOT include attribution or author names

Return ONLY a JSON array of strings, with no additional text or formatting. Example:
["Quote 1 text here.", "Quote 2 text here.", "Quote 3 text here."]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = response.text || "[]";
    
    let generatedQuotes: string[];
    try {
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, "").trim();
      generatedQuotes = JSON.parse(cleanedText);
      
      if (!Array.isArray(generatedQuotes)) {
        throw new Error("Response is not an array");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      return res.status(500).json({ message: "Failed to parse AI-generated quotes" });
    }

    const savedQuotes = [];
    for (const quoteText of generatedQuotes) {
      if (typeof quoteText === "string" && quoteText.trim()) {
        const [savedQuote] = await db
          .insert(quotes)
          .values({
            userId,
            text: quoteText.trim(),
            industry,
            tone,
            targetAudience: targetAudience || null,
            isAiGenerated: true,
            aiModel: "gemini-2.5-flash",
            isApproved: false,
          })
          .returning();
        savedQuotes.push(savedQuote);
      }
    }

    res.json({ 
      message: `Generated ${savedQuotes.length} quotes`,
      quotes: savedQuotes 
    });
  } catch (error) {
    console.error("Error generating quotes:", error);
    res.status(500).json({ message: "Failed to generate quotes" });
  }
});

router.get("/quotes", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { industry, approved, rating, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [eq(quotes.userId, userId)];

    if (industry) {
      conditions.push(eq(quotes.industry, industry as string));
    }

    if (approved !== undefined) {
      conditions.push(eq(quotes.isApproved, approved === "true"));
    }

    if (rating) {
      conditions.push(gte(quotes.rating, parseInt(rating as string, 10)));
    }

    const userQuotes = await db
      .select()
      .from(quotes)
      .where(and(...conditions))
      .orderBy(desc(quotes.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(quotes)
      .where(and(...conditions));

    res.json({
      quotes: userQuotes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    res.status(500).json({ message: "Failed to fetch quotes" });
  }
});

router.post("/quotes", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validationSchema = insertQuoteSchema.extend({
      text: z.string().min(1, "Quote text is required"),
      industry: z.string().min(1, "Industry is required"),
    });

    const parseResult = validationSchema.safeParse({ ...req.body, userId });
    if (!parseResult.success) {
      return res.status(400).json({ 
        message: "Invalid request body", 
        errors: parseResult.error.errors 
      });
    }

    const [newQuote] = await db
      .insert(quotes)
      .values({
        ...parseResult.data,
        isAiGenerated: false,
      })
      .returning();

    res.status(201).json(newQuote);
  } catch (error) {
    console.error("Error creating quote:", error);
    res.status(500).json({ message: "Failed to create quote" });
  }
});

router.patch("/quotes/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const quoteId = parseInt(req.params.id, 10);
    if (isNaN(quoteId)) {
      return res.status(400).json({ message: "Invalid quote ID" });
    }

    const [existingQuote] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.userId, userId)));

    if (!existingQuote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    const allowedFields = ["text", "author", "tone", "industry", "targetAudience", "rating", "isApproved", "tags"];
    const updates: Record<string, any> = { updatedAt: new Date() };

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const [updatedQuote] = await db
      .update(quotes)
      .set(updates)
      .where(eq(quotes.id, quoteId))
      .returning();

    res.json(updatedQuote);
  } catch (error) {
    console.error("Error updating quote:", error);
    res.status(500).json({ message: "Failed to update quote" });
  }
});

router.delete("/quotes/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const quoteId = parseInt(req.params.id, 10);
    if (isNaN(quoteId)) {
      return res.status(400).json({ message: "Invalid quote ID" });
    }

    const [existingQuote] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.userId, userId)));

    if (!existingQuote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    await db.delete(quotes).where(eq(quotes.id, quoteId));

    res.json({ message: "Quote deleted successfully" });
  } catch (error) {
    console.error("Error deleting quote:", error);
    res.status(500).json({ message: "Failed to delete quote" });
  }
});

router.post("/projects", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validationSchema = insertQrCodeProjectSchema.extend({
      name: z.string().min(1, "Project name is required"),
      industry: z.string().min(1, "Industry is required"),
    });

    const slug = req.body.name
      ? req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : `project-${Date.now()}`;

    const parseResult = validationSchema.safeParse({ ...req.body, userId, slug });
    if (!parseResult.success) {
      return res.status(400).json({ 
        message: "Invalid request body", 
        errors: parseResult.error.errors 
      });
    }

    const [newProject] = await db
      .insert(qrCodeProjects)
      .values(parseResult.data)
      .returning();

    await db
      .insert(qrCodeRotationSettings)
      .values({
        projectId: newProject.id,
        rotationFrequency: "daily",
      });

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Failed to create project" });
  }
});

router.get("/projects", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userProjects = await db
      .select()
      .from(qrCodeProjects)
      .where(eq(qrCodeProjects.userId, userId))
      .orderBy(desc(qrCodeProjects.createdAt));

    res.json(userProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

router.get("/projects/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const [project] = await db
      .select()
      .from(qrCodeProjects)
      .where(and(eq(qrCodeProjects.id, projectId), eq(qrCodeProjects.userId, userId)));

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const [rotationSettings] = await db
      .select()
      .from(qrCodeRotationSettings)
      .where(eq(qrCodeRotationSettings.projectId, projectId));

    const quotePool = await db
      .select({
        poolEntry: projectQuotePool,
        quote: quotes,
      })
      .from(projectQuotePool)
      .leftJoin(quotes, eq(projectQuotePool.quoteId, quotes.id))
      .where(eq(projectQuotePool.projectId, projectId))
      .orderBy(asc(projectQuotePool.displayOrder));

    res.json({
      ...project,
      rotationSettings,
      quotes: quotePool.map((p) => ({
        ...p.poolEntry,
        quote: p.quote,
      })),
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ message: "Failed to fetch project" });
  }
});

router.patch("/projects/:id", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const [existingProject] = await db
      .select()
      .from(qrCodeProjects)
      .where(and(eq(qrCodeProjects.id, projectId), eq(qrCodeProjects.userId, userId)));

    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    const allowedFields = [
      "name", "description", "industry", "targetUrl", "backgroundImageUrl",
      "logoUrl", "qrColor", "qrBackgroundColor", "qrStyle", "qrSize", "isPublished"
    ];
    const updates: Record<string, any> = { updatedAt: new Date() };

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.body.name && req.body.name !== existingProject.name) {
      updates.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    const [updatedProject] = await db
      .update(qrCodeProjects)
      .set(updates)
      .where(eq(qrCodeProjects.id, projectId))
      .returning();

    if (req.body.rotationSettings) {
      const rotationUpdates: Record<string, any> = {};
      const rotationFields = ["rotationFrequency", "rotationTime", "timezone", "minRating", "onlyApproved"];
      for (const field of rotationFields) {
        if (req.body.rotationSettings[field] !== undefined) {
          rotationUpdates[field] = req.body.rotationSettings[field];
        }
      }

      if (Object.keys(rotationUpdates).length > 0) {
        await db
          .update(qrCodeRotationSettings)
          .set(rotationUpdates)
          .where(eq(qrCodeRotationSettings.projectId, projectId));
      }
    }

    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Failed to update project" });
  }
});

router.post("/projects/:id/generate-qr", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const [project] = await db
      .select()
      .from(qrCodeProjects)
      .where(and(eq(qrCodeProjects.id, projectId), eq(qrCodeProjects.userId, userId)));

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const baseUrl = process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000";
    const qrUrl = `https://${baseUrl}/q/${project.slug}`;

    const qrOptions: QRCode.QRCodeToDataURLOptions = {
      type: "image/png",
      width: project.qrSize || 256,
      color: {
        dark: project.qrColor || "#000000",
        light: project.qrBackgroundColor || "#FFFFFF",
      },
      margin: 2,
    };

    const qrDataUrl = await QRCode.toDataURL(qrUrl, qrOptions);

    const [updatedProject] = await db
      .update(qrCodeProjects)
      .set({ generatedQrUrl: qrDataUrl, updatedAt: new Date() })
      .where(eq(qrCodeProjects.id, projectId))
      .returning();

    res.json({
      qrCodeUrl: qrDataUrl,
      targetUrl: qrUrl,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).json({ message: "Failed to generate QR code" });
  }
});

router.post("/projects/:id/quotes", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const [project] = await db
      .select()
      .from(qrCodeProjects)
      .where(and(eq(qrCodeProjects.id, projectId), eq(qrCodeProjects.userId, userId)));

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const { quoteIds } = req.body;
    if (!Array.isArray(quoteIds) || quoteIds.length === 0) {
      return res.status(400).json({ message: "quoteIds array is required" });
    }

    const userQuotes = await db
      .select()
      .from(quotes)
      .where(and(
        eq(quotes.userId, userId),
        sql`${quotes.id} = ANY(${quoteIds})`
      ));

    if (userQuotes.length === 0) {
      return res.status(400).json({ message: "No valid quotes found" });
    }

    const existingPoolEntries = await db
      .select()
      .from(projectQuotePool)
      .where(eq(projectQuotePool.projectId, projectId));

    const existingQuoteIds = new Set(existingPoolEntries.map((e) => e.quoteId));
    const maxOrder = existingPoolEntries.length > 0 
      ? Math.max(...existingPoolEntries.map((e) => e.displayOrder || 0))
      : -1;

    const newEntries = [];
    let order = maxOrder + 1;
    for (const quote of userQuotes) {
      if (!existingQuoteIds.has(quote.id)) {
        newEntries.push({
          projectId,
          quoteId: quote.id,
          displayOrder: order++,
        });
      }
    }

    if (newEntries.length > 0) {
      await db.insert(projectQuotePool).values(newEntries);
    }

    res.json({
      message: `Added ${newEntries.length} quotes to project`,
      addedCount: newEntries.length,
      skippedCount: userQuotes.length - newEntries.length,
    });
  } catch (error) {
    console.error("Error adding quotes to project:", error);
    res.status(500).json({ message: "Failed to add quotes to project" });
  }
});

// PUBLIC: Get today's quote for a project (no auth required - for QR scanning)
router.get("/public/quote/:projectId", async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const [project] = await db
      .select()
      .from(qrCodeProjects)
      .where(and(eq(qrCodeProjects.id, projectId), eq(qrCodeProjects.isPublished, true)));

    if (!project) {
      return res.status(404).json({ message: "Project not found or not published" });
    }

    // Get rotation settings
    const [settings] = await db
      .select()
      .from(qrCodeRotationSettings)
      .where(eq(qrCodeRotationSettings.projectId, projectId));

    // Get all approved quotes in the pool
    const poolQuotes = await db
      .select({
        quote: quotes,
        pool: projectQuotePool,
      })
      .from(projectQuotePool)
      .innerJoin(quotes, eq(projectQuotePool.quoteId, quotes.id))
      .where(and(
        eq(projectQuotePool.projectId, projectId),
        eq(quotes.isApproved, true)
      ))
      .orderBy(asc(projectQuotePool.displayOrder));

    if (poolQuotes.length === 0) {
      return res.json({
        id: 0,
        text: "No quotes available yet. Check back soon!",
        projectName: project.name,
        brandColor: (project as any).brandColor || "#1B4332",
        isWhiteLabel: (project as any).isWhiteLabel || false,
        streak: 0,
        badges: [],
      });
    }

    // Determine which quote to show based on rotation
    const rotationType = (settings as any)?.rotationType || "daily";
    let quoteIndex = 0;

    if (rotationType === "daily") {
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      quoteIndex = dayOfYear % poolQuotes.length;
    } else if (rotationType === "random") {
      quoteIndex = Math.floor(Math.random() * poolQuotes.length);
    } else if (rotationType === "sequential") {
      // Use current index from settings
      quoteIndex = ((settings as any)?.currentIndex || 0) % poolQuotes.length;
    }

    const selectedQuote = poolQuotes[quoteIndex].quote;

    // Calculate next quote time for daily rotation
    let nextQuoteTime: string | undefined;
    if (rotationType === "daily") {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const hoursLeft = Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60));
      const minsLeft = Math.floor(((tomorrow.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
      nextQuoteTime = `${hoursLeft}h ${minsLeft}m`;
    }

    res.json({
      id: selectedQuote.id,
      text: selectedQuote.text,
      author: selectedQuote.author,
      projectName: project.name,
      brandColor: (project as any).brandColor || "#1B4332",
      brandLogo: project.logoUrl,
      isWhiteLabel: (project as any).isWhiteLabel || false,
      streak: 0, // TODO: Implement user streak tracking
      badges: [],
      nextQuoteTime,
    });
  } catch (error) {
    console.error("Error fetching public quote:", error);
    res.status(500).json({ message: "Failed to fetch quote" });
  }
});

// PUBLIC: Track a scan event (no auth required)
router.post("/scans", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    const parsedProjectId = parseInt(projectId, 10);
    if (isNaN(parsedProjectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    // Increment scan count on the project
    await db
      .update(qrCodeProjects)
      .set({
        totalScans: sql`COALESCE(${qrCodeProjects.totalScans}, 0) + 1`,
      } as any)
      .where(eq(qrCodeProjects.id, parsedProjectId));

    res.json({ message: "Scan tracked" });
  } catch (error) {
    console.error("Error tracking scan:", error);
    res.status(500).json({ message: "Failed to track scan" });
  }
});

// Get user streak for gamification
router.get("/streaks", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let [streak] = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId));

    if (!streak) {
      // Create a new streak record
      [streak] = await db
        .insert(userStreaks)
        .values({ userId, currentStreak: 0, longestStreak: 0, totalActiveDays: 0 })
        .returning();
    }

    // Calculate badges based on streak
    const badges: { name: string; icon: string; earned: boolean }[] = [
      { name: "First Scan", icon: "Star", earned: streak.totalActiveDays >= 1 },
      { name: "Week Warrior", icon: "Flame", earned: streak.currentStreak >= 7 },
      { name: "Consistency King", icon: "Crown", earned: streak.currentStreak >= 30 },
      { name: "Century Club", icon: "Trophy", earned: streak.totalActiveDays >= 100 },
      { name: "Daily Devotee", icon: "Heart", earned: streak.longestStreak >= 14 },
    ];

    res.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalActiveDays: streak.totalActiveDays,
      lastActivityDate: streak.lastActivityDate,
      badges: badges.filter(b => b.earned),
      nextBadge: badges.find(b => !b.earned) || null,
    });
  } catch (error) {
    console.error("Error fetching streak:", error);
    res.status(500).json({ message: "Failed to fetch streak" });
  }
});

// Record daily activity (call when user views quote)
router.post("/streaks/activity", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let [streak] = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId));

    if (!streak) {
      // First activity ever
      [streak] = await db
        .insert(userStreaks)
        .values({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          totalActiveDays: 1,
          lastActivityDate: today,
        })
        .returning();
      
      return res.json({
        currentStreak: 1,
        isNewStreak: true,
        message: "Welcome! You've started your first streak!",
      });
    }

    const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
    }

    const daysDiff = lastActivity 
      ? Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let newCurrentStreak = streak.currentStreak;
    let isNewStreak = false;
    let message = "";

    if (daysDiff === 0) {
      // Already logged today
      message = "You've already checked in today!";
    } else if (daysDiff === 1) {
      // Consecutive day - extend streak
      newCurrentStreak = streak.currentStreak + 1;
      message = `Amazing! ${newCurrentStreak} day streak!`;
    } else {
      // Streak broken - start fresh
      newCurrentStreak = 1;
      isNewStreak = true;
      message = "New streak started! Keep it going!";
    }

    const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);
    const newTotalDays = daysDiff > 0 ? streak.totalActiveDays + 1 : streak.totalActiveDays;

    await db
      .update(userStreaks)
      .set({
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        totalActiveDays: newTotalDays,
        lastActivityDate: today,
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.userId, userId));

    res.json({
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      totalActiveDays: newTotalDays,
      isNewStreak,
      message,
    });
  } catch (error) {
    console.error("Error recording activity:", error);
    res.status(500).json({ message: "Failed to record activity" });
  }
});

// Per-user ElevenLabs synthesis rate bucket (20/hour). Resets on restart;
// good enough as a coarse cost-cap. Previously this route was public + ungated,
// turning it into an open ElevenLabs proxy that could drain credits.
const voiceRate = new Map<string, number[]>();
// Hard cap on the number of distinct users we track in-memory. When the cap is
// hit, drop the oldest-touched bucket. Prevents unbounded growth from abusive
// userId enumeration until a shared store limiter lands.
const VOICE_RATE_MAX_USERS = 5000;

// Text-to-speech using ElevenLabs
router.post("/voice", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub || req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Per-user rate limit — bound ElevenLabs cost. Max 20 syntheses per hour.
    const now = Date.now();
    const bucket = (voiceRate.get(userId) ?? []).filter(t => now - t < 60 * 60 * 1000);
    if (bucket.length >= 20) {
      // Save the pruned bucket so older timestamps aren't re-counted next call.
      voiceRate.set(userId, bucket);
      return res.status(429).json({ message: "Too many voice generations this hour. Try again later." });
    }
    bucket.push(now);
    if (bucket.length === 0) {
      voiceRate.delete(userId);
    } else {
      voiceRate.set(userId, bucket);
    }
    // Enforce map size cap by evicting the first (oldest insertion-order) entry.
    if (voiceRate.size > VOICE_RATE_MAX_USERS) {
      const firstKey = voiceRate.keys().next().value;
      if (firstKey !== undefined) voiceRate.delete(firstKey);
    }

    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = req.body; // Default to Rachel voice

    if (!text || typeof text !== "string") {
      return res.status(400).json({ message: "Text is required" });
    }
    // Cap input length so a single request can't ship a novel to ElevenLabs.
    if (text.length > 2000) {
      return res.status(400).json({ message: "Text too long (max 2000 chars)" });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      // Fallback to browser TTS
      return res.json({ useBrowserTTS: true, text });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      console.error("ElevenLabs API error:", response.status);
      return res.json({ useBrowserTTS: true, text });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    res.json({
      audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
      useBrowserTTS: false,
    });
  } catch (error) {
    console.error("Error generating voice:", error);
    res.json({ useBrowserTTS: true, text: req.body?.text });
  }
});

// Get leaderboard for gamification
router.get("/leaderboard", async (_req: Request, res: Response) => {
  try {
    const topStreaks = await db
      .select({
        currentStreak: userStreaks.currentStreak,
        longestStreak: userStreaks.longestStreak,
        totalActiveDays: userStreaks.totalActiveDays,
      })
      .from(userStreaks)
      .orderBy(desc(userStreaks.currentStreak))
      .limit(10);

    res.json({
      leaderboard: topStreaks.map((s, i) => ({
        rank: i + 1,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        totalActiveDays: s.totalActiveDays,
      })),
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

// Analytics endpoint - Get real scan data for SquatchQR
router.get("/analytics", isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user's projects first
    const userProjects = await db
      .select({ id: qrCodeProjects.id })
      .from(qrCodeProjects)
      .where(eq(qrCodeProjects.userId, userId));

    const projectIds = userProjects.map((p) => p.id);

    // If user has no projects, return empty analytics
    if (projectIds.length === 0) {
      return res.json({
        totalScans: 0,
        uniqueVisitors: 0,
        avgScansPerDay: 0,
        topProjects: [],
        scansByDay: [],
        deviceBreakdown: [],
      });
    }

    // Total scans for user's projects
    const [totalScansResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(quoteScanAnalytics)
      .where(sql`${quoteScanAnalytics.projectId} = ANY(${projectIds})`);

    const totalScans = totalScansResult?.count || 0;

    // Unique visitors (by IP address)
    const [uniqueVisitorsResult] = await db
      .select({ count: sql<number>`count(distinct ${quoteScanAnalytics.ipAddress})::int` })
      .from(quoteScanAnalytics)
      .where(sql`${quoteScanAnalytics.projectId} = ANY(${projectIds})`);

    const uniqueVisitors = uniqueVisitorsResult?.count || 0;

    // Calculate average scans per day
    let avgScansPerDay = 0;
    if (totalScans > 0) {
      const [firstScanResult] = await db
        .select({ firstScan: sql<Date>`min(${quoteScanAnalytics.scanDate})` })
        .from(quoteScanAnalytics)
        .where(sql`${quoteScanAnalytics.projectId} = ANY(${projectIds})`);

      if (firstScanResult?.firstScan) {
        const firstScanDate = new Date(firstScanResult.firstScan);
        const daysSinceFirst = Math.max(
          1,
          Math.ceil((Date.now() - firstScanDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        avgScansPerDay = Math.round(totalScans / daysSinceFirst);
      }
    }

    // Top projects with scan counts
    const topProjectsResult = await db
      .select({
        projectId: quoteScanAnalytics.projectId,
        projectName: qrCodeProjects.name,
        scans: sql<number>`count(*)::int`,
      })
      .from(quoteScanAnalytics)
      .innerJoin(qrCodeProjects, eq(quoteScanAnalytics.projectId, qrCodeProjects.id))
      .where(sql`${quoteScanAnalytics.projectId} = ANY(${projectIds})`)
      .groupBy(quoteScanAnalytics.projectId, qrCodeProjects.name)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    const topProjects = topProjectsResult.map((p) => ({
      name: p.projectName || "Unnamed Project",
      scans: p.scans,
    }));

    // Scans by day for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const scansByDayResult = await db
      .select({
        date: sql<string>`to_char(${quoteScanAnalytics.scanDate}, 'Dy')`,
        dateOrder: sql<string>`to_char(${quoteScanAnalytics.scanDate}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(quoteScanAnalytics)
      .where(
        and(
          sql`${quoteScanAnalytics.projectId} = ANY(${projectIds})`,
          gte(quoteScanAnalytics.scanDate, sevenDaysAgo)
        )
      )
      .groupBy(
        sql`to_char(${quoteScanAnalytics.scanDate}, 'Dy')`,
        sql`to_char(${quoteScanAnalytics.scanDate}, 'YYYY-MM-DD')`
      )
      .orderBy(sql`to_char(${quoteScanAnalytics.scanDate}, 'YYYY-MM-DD')`);

    // Fill in missing days with zero counts
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const scansByDay: { date: string; count: number }[] = [];
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(sevenDaysAgo);
      checkDate.setDate(sevenDaysAgo.getDate() + i);
      const dayName = dayNames[checkDate.getDay()];
      const dateStr = checkDate.toISOString().split("T")[0];
      
      const found = scansByDayResult.find((r) => r.dateOrder === dateStr);
      scansByDay.push({
        date: dayName,
        count: found?.count || 0,
      });
    }

    // Device breakdown with percentage
    const deviceResult = await db
      .select({
        device: sql<string>`coalesce(${quoteScanAnalytics.deviceType}, 'Unknown')`,
        count: sql<number>`count(*)::int`,
      })
      .from(quoteScanAnalytics)
      .where(sql`${quoteScanAnalytics.projectId} = ANY(${projectIds})`)
      .groupBy(quoteScanAnalytics.deviceType)
      .orderBy(desc(sql`count(*)`));

    const deviceBreakdown = deviceResult.map((d) => ({
      device: d.device === "mobile" ? "Mobile" : d.device === "tablet" ? "Tablet" : d.device === "desktop" ? "Desktop" : d.device,
      percentage: totalScans > 0 ? Math.round((d.count / totalScans) * 100) : 0,
    }));

    res.json({
      totalScans,
      uniqueVisitors,
      avgScansPerDay,
      topProjects,
      scansByDay,
      deviceBreakdown,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

export default router;
