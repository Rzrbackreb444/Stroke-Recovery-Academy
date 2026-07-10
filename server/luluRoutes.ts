/**
 * Lulu Publishing API Routes
 * Professional book publishing workflows for Stroke Lyfe Publishing
 */

import { Router, Request, Response } from 'express';
import { getUserId, getUserEmail } from './lib/authUtils';
import { requireAdmin } from './middleware/requireAdmin';
import { z } from 'zod';
import { db } from './db';
import { 
  bookPublishingProjects, 
  bookCoverDesigns, 
  luluWebhooks,
  luluPrintJobs,
  bookProjects,
  users
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { 
  luluPublishingService, 
  BOOK_TEMPLATES, 
  TRIM_SIZES, 
  BINDING_TYPES, 
  PRINT_TYPES, 
  PAPER_TYPES, 
  COVER_FINISHES,
  SHIPPING_LEVELS,
  generatePodPackageId,
  verifyWebhookSignature
} from './luluPublishingService';

const router = Router();

// Validation schemas
const createPublishingProjectSchema = z.object({
  bookProjectId: z.number(),
  templateId: z.string().optional(),
  trimSizeCode: z.string(),
  bindingType: z.string().default('PB'),
  printType: z.string().default('BW'),
  paperType: z.string().default('060UC444'),
  coverFinish: z.string().default('M'),
  pageCount: z.number().min(1),
  isbn: z.string().optional(),
  publisherName: z.string().optional(),
  retailPrice: z.number().optional(),
});

const calculateCostSchema = z.object({
  pageCount: z.number().min(1),
  podPackageId: z.string(),
  quantity: z.number().min(1),
  countryCode: z.string().default('US'),
  postcode: z.string().optional(),
  shippingOption: z.string().optional(),
});

const createPrintJobSchema = z.object({
  publishingProjectId: z.number(),
  quantity: z.number().min(1),
  shippingAddress: z.object({
    name: z.string(),
    street1: z.string(),
    street2: z.string().optional(),
    city: z.string(),
    stateCode: z.string().optional(),
    postcode: z.string(),
    countryCode: z.string(),
    phoneNumber: z.string(),
    email: z.string().optional(),
  }),
  shippingLevel: z.enum(['MAIL', 'GROUND', 'EXPEDITED', 'EXPRESS']).default('MAIL'),
});

// Get all book templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = Object.values(BOOK_TEMPLATES).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      trimSize: t.trimSize,
      binding: t.binding,
      printType: t.printType,
      paper: t.paper,
      coverFinish: t.coverFinish,
      pageCountRange: t.pageCountRange,
      features: t.features,
    }));
    
    res.json({ templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get templates by category
router.get('/templates/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const templates = luluPublishingService.getTemplatesByCategory(category);
    res.json({ templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get template categories
router.get('/templates/categories', async (req: Request, res: Response) => {
  try {
    const categories = luluPublishingService.getTemplateCategories();
    res.json({ categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all print specifications (for custom configuration)
router.get('/specifications', async (req: Request, res: Response) => {
  try {
    res.json({
      trimSizes: TRIM_SIZES,
      bindingTypes: BINDING_TYPES,
      printTypes: PRINT_TYPES,
      paperTypes: PAPER_TYPES,
      coverFinishes: COVER_FINISHES,
      shippingLevels: SHIPPING_LEVELS,
    });
  } catch (error: any) {
    console.error('Error fetching specifications:', error);
    res.status(500).json({ error: 'Failed to fetch specifications' });
  }
});

// Create publishing project
router.post('/projects', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const validated = createPublishingProjectSchema.parse(req.body);
    
    // Verify book project exists and belongs to user
    const [bookProject] = await db
      .select()
      .from(bookProjects)
      .where(and(
        eq(bookProjects.id, validated.bookProjectId),
        eq(bookProjects.ownerId, userId)
      ));
    
    if (!bookProject) {
      return res.status(404).json({ error: 'Book project not found' });
    }
    
    // Generate POD package ID
    const trimSize = Object.values(TRIM_SIZES).find(t => t.code === validated.trimSizeCode);
    const binding = Object.values(BINDING_TYPES).find(b => b.code === validated.bindingType);
    const printType = Object.values(PRINT_TYPES).find(p => p.code === validated.printType);
    const paper = Object.values(PAPER_TYPES).find(p => p.code === validated.paperType);
    const coverFinish = Object.values(COVER_FINISHES).find(c => c.code === validated.coverFinish);
    
    if (!trimSize || !binding || !printType || !paper || !coverFinish) {
      return res.status(400).json({ error: 'Invalid print specifications' });
    }
    
    const podPackageId = generatePodPackageId({
      trimSize,
      printType,
      binding,
      paper,
      coverFinish,
    });
    
    // Create publishing project
    const [project] = await db
      .insert(bookPublishingProjects)
      .values({
        bookProjectId: validated.bookProjectId,
        ownerId: userId,
        templateId: validated.templateId,
        customPodPackageId: podPackageId,
        trimSizeCode: validated.trimSizeCode,
        trimSizeName: trimSize.name,
        bindingType: validated.bindingType,
        printType: validated.printType,
        paperType: validated.paperType,
        coverFinish: validated.coverFinish,
        pageCount: validated.pageCount,
        isbn: validated.isbn,
        publisherName: validated.publisherName || 'Stroke Lyfe Publishing',
        retailPrice: validated.retailPrice,
        copyrightYear: new Date().getFullYear(),
      })
      .returning();
    
    res.status(201).json({ project });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating publishing project:', error);
    res.status(500).json({ error: 'Failed to create publishing project' });
  }
});

// Get user's publishing projects
router.get('/projects', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const projects = await db
      .select()
      .from(bookPublishingProjects)
      .where(eq(bookPublishingProjects.ownerId, userId))
      .orderBy(desc(bookPublishingProjects.createdAt));
    
    res.json({ projects });
  } catch (error: any) {
    console.error('Error fetching publishing projects:', error);
    res.status(500).json({ error: 'Failed to fetch publishing projects' });
  }
});

// Get single publishing project
router.get('/projects/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const projectId = parseInt(req.params.id);
    
    const [project] = await db
      .select()
      .from(bookPublishingProjects)
      .where(and(
        eq(bookPublishingProjects.id, projectId),
        eq(bookPublishingProjects.ownerId, userId)
      ));
    
    if (!project) {
      return res.status(404).json({ error: 'Publishing project not found' });
    }
    
    // Get associated cover designs
    const designs = await db
      .select()
      .from(bookCoverDesigns)
      .where(eq(bookCoverDesigns.publishingProjectId, projectId))
      .orderBy(desc(bookCoverDesigns.version));
    
    res.json({ project, designs });
  } catch (error: any) {
    console.error('Error fetching publishing project:', error);
    res.status(500).json({ error: 'Failed to fetch publishing project' });
  }
});

// Calculate printing cost
router.post('/calculate-cost', async (req: Request, res: Response) => {
  try {
    const validated = calculateCostSchema.parse(req.body);
    
    const cost = await luluPublishingService.calculateCost({
      lineItems: [{
        pageCount: validated.pageCount,
        podPackageId: validated.podPackageId,
        quantity: validated.quantity,
      }],
      shippingAddress: {
        countryCode: validated.countryCode,
        postcode: validated.postcode,
      },
      shippingOption: validated.shippingOption,
    });
    
    res.json({ cost });
  } catch (error: any) {
    console.error('Error calculating cost:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate cost' });
  }
});

// Get cover specifications for a POD package
router.get('/cover-specs/:podPackageId/:pageCount', async (req: Request, res: Response) => {
  try {
    const { podPackageId, pageCount } = req.params;
    
    const specs = await luluPublishingService.getCoverSpecifications(
      podPackageId,
      parseInt(pageCount)
    );
    
    res.json({ specs });
  } catch (error: any) {
    console.error('Error getting cover specifications:', error);
    res.status(500).json({ error: error.message || 'Failed to get cover specifications' });
  }
});

// Create print job
router.post('/print-jobs', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const validated = createPrintJobSchema.parse(req.body);
    
    // Get publishing project
    const [project] = await db
      .select()
      .from(bookPublishingProjects)
      .where(and(
        eq(bookPublishingProjects.id, validated.publishingProjectId),
        eq(bookPublishingProjects.ownerId, userId)
      ));
    
    if (!project) {
      return res.status(404).json({ error: 'Publishing project not found' });
    }
    
    if (!project.interiorPdfUrl || !project.coverPdfUrl) {
      return res.status(400).json({ error: 'Interior and cover PDFs are required' });
    }
    
    // Get book project for title
    const [bookProject] = await db
      .select()
      .from(bookProjects)
      .where(eq(bookProjects.id, project.bookProjectId));
    
    // Create print job with Lulu
    const printJob = await luluPublishingService.createPrintJob({
      contactEmail: getUserEmail(req) || '',
      lineItems: [{
        title: bookProject?.title || 'Untitled Book',
        coverSourceUrl: project.coverPdfUrl,
        interiorSourceUrl: project.interiorPdfUrl,
        podPackageId: project.customPodPackageId || '',
        quantity: validated.quantity,
      }],
      shippingAddress: validated.shippingAddress,
      shippingLevel: validated.shippingLevel,
      externalId: `pub-${project.id}-${Date.now()}`,
    });
    
    // Save print job to database
    const [dbJob] = await db
      .insert(luluPrintJobs)
      .values({
        orderId: project.id,
        orderItemId: project.id, // Using publishing project ID
        luluOrderId: printJob.id,
        status: printJob.status.name.toLowerCase(),
        productId: project.customPodPackageId,
        quantity: validated.quantity,
        interiorSourceUrl: project.interiorPdfUrl,
        coverSourceUrl: project.coverPdfUrl,
        shippingLevel: validated.shippingLevel,
      })
      .returning();
    
    res.status(201).json({ printJob, dbJob });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating print job:', error);
    res.status(500).json({ error: error.message || 'Failed to create print job' });
  }
});

// Get print job status
router.get('/print-jobs/:jobId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { jobId } = req.params;

    // Ownership check: jobId is the Lulu order id stored on lulu_print_jobs;
    // verify the linked book_orders.customer_id is this user before proxying
    // to the Lulu API. Without this any authenticated survivor could read any
    // other survivor's print-job status by guessing/scraping ids.
    const [owned] = await db
      .select({ id: luluPrintJobs.id })
      .from(luluPrintJobs)
      .innerJoin(bookOrders, eq(bookOrders.id, luluPrintJobs.orderId))
      .where(and(eq(luluPrintJobs.luluOrderId, jobId), eq(bookOrders.customerId, userId)))
      .limit(1);
    if (!owned) {
      return res.status(404).json({ error: 'Print job not found' });
    }

    // Get from Lulu API
    const printJob = await luluPublishingService.getPrintJob(jobId);

    res.json({ printJob });
  } catch (error: any) {
    console.error('Error getting print job:', error);
    res.status(500).json({ error: error.message || 'Failed to get print job' });
  }
});

// List user's print jobs
router.get('/print-jobs', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Scope to this user's orders only — prior implementation returned the
    // global newest 50 jobs, leaking every other survivor's print activity
    // (shipping addresses on Lulu side, order ids that could be replayed
    // against /print-jobs/:jobId, etc.).
    const jobs = await db
      .select({
        id: luluPrintJobs.id,
        orderId: luluPrintJobs.orderId,
        luluOrderId: luluPrintJobs.luluOrderId,
        status: luluPrintJobs.status,
        quantity: luluPrintJobs.quantity,
        shippingLevel: luluPrintJobs.shippingLevel,
        estimatedShipDate: luluPrintJobs.estimatedShipDate,
        actualShipDate: luluPrintJobs.actualShipDate,
        trackingNumber: luluPrintJobs.trackingNumber,
        trackingUrl: luluPrintJobs.trackingUrl,
        carrier: luluPrintJobs.carrier,
        productionCost: luluPrintJobs.productionCost,
        shippingCost: luluPrintJobs.shippingCost,
        createdAt: luluPrintJobs.createdAt,
      })
      .from(luluPrintJobs)
      .innerJoin(bookOrders, eq(bookOrders.id, luluPrintJobs.orderId))
      .where(eq(bookOrders.customerId, userId))
      .orderBy(desc(luluPrintJobs.createdAt))
      .limit(50);

    res.json({ jobs });
  } catch (error: any) {
    console.error('Error listing print jobs:', error);
    res.status(500).json({ error: 'Failed to list print jobs' });
  }
});

// Cancel print job
router.post('/print-jobs/:jobId/cancel', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { jobId } = req.params;

    // Ownership check before mutating Lulu state — without this any authed
    // survivor could cancel any other survivor's print job by id.
    const [owned] = await db
      .select({ id: luluPrintJobs.id })
      .from(luluPrintJobs)
      .innerJoin(bookOrders, eq(bookOrders.id, luluPrintJobs.orderId))
      .where(and(eq(luluPrintJobs.luluOrderId, jobId), eq(bookOrders.customerId, userId)))
      .limit(1);
    if (!owned) {
      return res.status(404).json({ error: 'Print job not found' });
    }

    const result = await luluPublishingService.cancelPrintJob(jobId);

    // Update database
    await db
      .update(luluPrintJobs)
      .set({ status: 'cancelled' })
      .where(eq(luluPrintJobs.luluOrderId, jobId));

    res.json({ result });
  } catch (error: any) {
    console.error('Error cancelling print job:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel print job' });
  }
});

// Lulu webhook endpoint with signature verification
router.post('/webhooks/lulu', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    const signature = req.headers['x-lulu-signature'] as string;
    
    // Get the signing key from the database (stored during webhook setup)
    const [webhookConfig] = await db
      .select()
      .from(luluWebhooks)
      .where(eq(luluWebhooks.isActive, true))
      .limit(1);
    
    // Enforce signature verification when signing key is configured
    if (webhookConfig?.signingKey) {
      // Reject if signature header is missing
      if (!signature) {
        console.warn('Missing Lulu webhook signature - request rejected');
        return res.status(401).json({ error: 'Missing webhook signature' });
      }
      
      // Use raw body if available, otherwise stringify (less secure fallback)
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const isValid = verifyWebhookSignature(rawBody, signature, webhookConfig.signingKey);
      
      if (!isValid) {
        console.warn('Invalid Lulu webhook signature - request rejected');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }
    
    console.log('Lulu webhook received:', event.type || event.event_type);
    
    // Handle different event types
    switch (event.type || event.event_type) {
      case 'PRINT_JOB_STATUS_CHANGED':
        const jobId = event.data?.print_job_id;
        const newStatus = event.data?.status?.name;
        
        if (jobId && newStatus) {
          await db
            .update(luluPrintJobs)
            .set({
              status: newStatus.toLowerCase(),
              trackingNumber: event.data?.tracking_number,
              trackingUrl: event.data?.tracking_url,
              webhookPayload: event,
              lastWebhookAt: new Date(),
            })
            .where(eq(luluPrintJobs.luluOrderId, jobId));
        }
        break;
        
      case 'PRINT_JOB_SHIPPED':
        const shippedJobId = event.data?.print_job_id;
        if (shippedJobId) {
          await db
            .update(luluPrintJobs)
            .set({
              status: 'shipped',
              actualShipDate: new Date(),
              trackingNumber: event.data?.tracking_number,
              trackingUrl: event.data?.tracking_url,
              carrier: event.data?.carrier,
              webhookPayload: event,
              lastWebhookAt: new Date(),
            })
            .where(eq(luluPrintJobs.luluOrderId, shippedJobId));
        }
        break;
        
      default:
        console.log('Unhandled Lulu webhook event:', event.type || event.event_type);
    }
    
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error processing Lulu webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Setup Lulu webhooks (admin-only — uses shared requireAdmin middleware
// so the gate is visible at the registration line and works for both
// Replit Auth and multi-provider sessions via getUserId() fallback)
router.post('/webhooks/setup', requireAdmin, async (req: Request, res: Response) => {
  try {
    const webhookUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/lulu/webhooks/lulu`;
    
    const webhook = await luluPublishingService.createWebhook(webhookUrl, [
      'PRINT_JOB_STATUS_CHANGED',
      'PRINT_JOB_SHIPPED',
    ]);
    
    // Save webhook to database
    await db
      .insert(luluWebhooks)
      .values({
        luluWebhookId: webhook.id,
        callbackUrl: webhook.callbackUrl,
        events: webhook.events,
        signingKey: webhook.signingKey,
      });
    
    res.json({ webhook });
  } catch (error: any) {
    console.error('Error setting up webhooks:', error);
    res.status(500).json({ error: error.message || 'Failed to setup webhooks' });
  }
});

// List webhooks
router.get('/webhooks', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const webhooks = await luluPublishingService.listWebhooks();
    res.json({ webhooks });
  } catch (error: any) {
    console.error('Error listing webhooks:', error);
    res.status(500).json({ error: error.message || 'Failed to list webhooks' });
  }
});

// Create cover design
router.post('/projects/:projectId/covers', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const projectId = parseInt(req.params.projectId);
    
    // Verify project belongs to user
    const [project] = await db
      .select()
      .from(bookPublishingProjects)
      .where(and(
        eq(bookPublishingProjects.id, projectId),
        eq(bookPublishingProjects.ownerId, userId)
      ));
    
    if (!project) {
      return res.status(404).json({ error: 'Publishing project not found' });
    }
    
    // Get latest version
    const latestDesigns = await db
      .select()
      .from(bookCoverDesigns)
      .where(eq(bookCoverDesigns.publishingProjectId, projectId))
      .orderBy(desc(bookCoverDesigns.version))
      .limit(1);
    
    const newVersion = latestDesigns.length > 0 ? latestDesigns[0].version + 1 : 1;
    
    const [design] = await db
      .insert(bookCoverDesigns)
      .values({
        publishingProjectId: projectId,
        name: req.body.name || `Cover Design v${newVersion}`,
        version: newVersion,
        isActive: req.body.isActive ?? true,
        frontCoverImageUrl: req.body.frontCoverImageUrl,
        backCoverImageUrl: req.body.backCoverImageUrl,
        spineImageUrl: req.body.spineImageUrl,
        fullWrapImageUrl: req.body.fullWrapImageUrl,
        designData: req.body.designData || {},
        backgroundColor: req.body.backgroundColor,
        titleText: req.body.titleText,
        subtitleText: req.body.subtitleText,
        authorText: req.body.authorText,
        spineText: req.body.spineText,
        backCoverText: req.body.backCoverText,
        titleFont: req.body.titleFont,
        titleColor: req.body.titleColor,
        authorFont: req.body.authorFont,
        authorColor: req.body.authorColor,
        aiGenerated: req.body.aiGenerated,
        aiPrompt: req.body.aiPrompt,
      })
      .returning();
    
    // If this is the active design, deactivate others
    if (design.isActive) {
      await db
        .update(bookCoverDesigns)
        .set({ isActive: false })
        .where(and(
          eq(bookCoverDesigns.publishingProjectId, projectId),
          eq(bookCoverDesigns.id, design.id)
        ));
    }
    
    res.status(201).json({ design });
  } catch (error: any) {
    console.error('Error creating cover design:', error);
    res.status(500).json({ error: 'Failed to create cover design' });
  }
});

// Get cover designs for a project
router.get('/projects/:projectId/covers', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const projectId = parseInt(req.params.projectId);
    
    // Verify project belongs to user
    const [project] = await db
      .select()
      .from(bookPublishingProjects)
      .where(and(
        eq(bookPublishingProjects.id, projectId),
        eq(bookPublishingProjects.ownerId, userId)
      ));
    
    if (!project) {
      return res.status(404).json({ error: 'Publishing project not found' });
    }
    
    const designs = await db
      .select()
      .from(bookCoverDesigns)
      .where(eq(bookCoverDesigns.publishingProjectId, projectId))
      .orderBy(desc(bookCoverDesigns.version));
    
    res.json({ designs });
  } catch (error: any) {
    console.error('Error fetching cover designs:', error);
    res.status(500).json({ error: 'Failed to fetch cover designs' });
  }
});

export default router;
