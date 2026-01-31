import { Router, Request, Response } from "express";
import { db } from "./db";
import { eq, and, gte, desc, asc, ilike, or, sql } from "drizzle-orm";
import { isAuthenticated } from "./replitAuth";
import { GoogleGenAI } from "@google/genai";
import QRCode from "qrcode";
import {
  quoteCategories,
  quotes,
  qrCodeProjects,
  qrCodeRotationSettings,
  projectQuotePool,
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

export default router;
