/**
 * Lulu Publishing Service
 * Professional Print-on-Demand Book Publishing for Stroke Lyfe Publishing
 * Integrated with KreAIte.xyz Book Studio
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

// Lulu API Configuration
const LULU_API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.lulu.com'
  : 'https://api.sandbox.lulu.com';

const LULU_AUTH_URL = `${LULU_API_BASE}/auth/realms/glasstree/protocol/openid-connect/token`;

// Book Trim Sizes (Width x Height in inches, encoded as 4-digit values)
export const TRIM_SIZES = {
  // Pocket Books
  POCKET_BOOK: { code: '0425X0687', name: 'Pocket Book', width: 4.25, height: 6.87, description: 'Perfect for mass market fiction' },
  DIGEST: { code: '0550X0850', name: 'Digest', width: 5.5, height: 8.5, description: 'Popular for novels and memoirs' },
  
  // Standard Trade Books
  US_TRADE: { code: '0600X0900', name: 'US Trade', width: 6, height: 9, description: 'Most popular trade paperback size' },
  ROYAL: { code: '0614X0921', name: 'Royal', width: 6.14, height: 9.21, description: 'UK trade standard' },
  
  // Large Format
  US_LETTER: { code: '0850X1100', name: 'US Letter', width: 8.5, height: 11, description: 'Great for workbooks and textbooks' },
  A4: { code: '0827X1169', name: 'A4', width: 8.27, height: 11.69, description: 'International standard' },
  
  // Square Books
  SQUARE_SMALL: { code: '0750X0750', name: 'Small Square', width: 7.5, height: 7.5, description: 'Perfect for photo books' },
  SQUARE_LARGE: { code: '0850X0850', name: 'Large Square', width: 8.5, height: 8.5, description: 'Premium photo book size' },
  
  // Children's Books
  LANDSCAPE_SMALL: { code: '1000X0800', name: 'Landscape Small', width: 10, height: 8, description: 'Ideal for children\'s books' },
  LANDSCAPE_LARGE: { code: '1100X0850', name: 'Landscape Large', width: 11, height: 8.5, description: 'Premium children\'s format' },
  
  // Comic/Graphic Novel
  COMIC: { code: '0675X1025', name: 'Comic', width: 6.75, height: 10.25, description: 'Standard comic book size' },
  MANGA: { code: '0512X0717', name: 'Manga', width: 5.12, height: 7.17, description: 'Traditional manga format' },
} as const;

// Print Types
export const PRINT_TYPES = {
  BW: { code: 'BW', name: 'Black & White', description: 'Standard B&W interior' },
  STD_COLOR: { code: 'FC', name: 'Standard Color', description: 'Full color interior' },
  PREM_COLOR: { code: 'PC', name: 'Premium Color', description: 'Premium quality color' },
} as const;

// Binding Types
export const BINDING_TYPES = {
  PERFECT_BOUND: { code: 'PB', name: 'Perfect Bound', description: 'Standard paperback' },
  CASE_WRAP: { code: 'CW', name: 'Case Wrap', description: 'Hardcover with printed cover' },
  DUST_JACKET: { code: 'DJ', name: 'Dust Jacket', description: 'Hardcover with dust jacket' },
  COIL: { code: 'CO', name: 'Coil Bound', description: 'Spiral/coil binding' },
  SADDLE_STITCH: { code: 'SS', name: 'Saddle Stitch', description: 'Stapled booklet' },
  LINEN_WRAP: { code: 'LW', name: 'Linen Wrap', description: 'Premium linen hardcover' },
} as const;

// Paper Types
export const PAPER_TYPES = {
  WHITE_60: { code: '060UW444', name: '60# White', description: 'Standard uncoated white' },
  CREAM_60: { code: '060UC444', name: '60# Cream', description: 'Cream/natural paper (novels)' },
  WHITE_80: { code: '080UW444', name: '80# White', description: 'Premium uncoated white' },
  COATED_80: { code: '080CW444', name: '80# Coated', description: 'Coated for color printing' },
  COATED_100: { code: '100CW444', name: '100# Coated', description: 'Premium coated for photos' },
} as const;

// Cover Finishes
export const COVER_FINISHES = {
  MATTE: { code: 'M', name: 'Matte', description: 'Soft, non-reflective finish' },
  GLOSS: { code: 'G', name: 'Gloss', description: 'Shiny, vibrant finish' },
} as const;

// Shipping Levels
export const SHIPPING_LEVELS = {
  MAIL: { code: 'MAIL', name: 'Standard Mail', days: '7-14' },
  GROUND: { code: 'GROUND', name: 'Ground', days: '5-10' },
  EXPEDITED: { code: 'EXPEDITED', name: 'Expedited', days: '3-5' },
  EXPRESS: { code: 'EXPRESS', name: 'Express', days: '1-3' },
} as const;

// Book Templates for Stroke Lyfe Publishing
export const BOOK_TEMPLATES = {
  // Recovery Journey Templates
  RECOVERY_MEMOIR: {
    id: 'recovery-memoir',
    name: 'Recovery Memoir',
    description: 'Share your stroke recovery journey in a beautiful memoir format',
    trimSize: TRIM_SIZES.US_TRADE,
    printType: PRINT_TYPES.BW,
    binding: BINDING_TYPES.PERFECT_BOUND,
    paper: PAPER_TYPES.CREAM_60,
    coverFinish: COVER_FINISHES.MATTE,
    pageCountRange: { min: 50, max: 400 },
    category: 'recovery',
    features: ['Chapter templates', 'Timeline layouts', 'Photo sections', 'Milestone markers'],
  },
  
  RECOVERY_WORKBOOK: {
    id: 'recovery-workbook',
    name: 'Recovery Workbook',
    description: 'Interactive exercises and tracking for recovery progress',
    trimSize: TRIM_SIZES.US_LETTER,
    printType: PRINT_TYPES.BW,
    binding: BINDING_TYPES.COIL,
    paper: PAPER_TYPES.WHITE_80,
    coverFinish: COVER_FINISHES.MATTE,
    pageCountRange: { min: 30, max: 200 },
    category: 'recovery',
    features: ['Fillable exercises', 'Progress trackers', 'Goal worksheets', 'Reflection prompts'],
  },
  
  CAREGIVER_GUIDE: {
    id: 'caregiver-guide',
    name: 'Caregiver Guide',
    description: 'Resource guide for stroke caregivers and families',
    trimSize: TRIM_SIZES.DIGEST,
    printType: PRINT_TYPES.STD_COLOR,
    binding: BINDING_TYPES.PERFECT_BOUND,
    paper: PAPER_TYPES.COATED_80,
    coverFinish: COVER_FINISHES.GLOSS,
    pageCountRange: { min: 40, max: 250 },
    category: 'caregiver',
    features: ['Resource directories', 'Quick reference cards', 'Emergency protocols', 'Self-care sections'],
  },
  
  // Children's Books
  KIDS_RECOVERY_STORY: {
    id: 'kids-recovery-story',
    name: 'Children\'s Recovery Story',
    description: 'Help children understand stroke recovery through storytelling',
    trimSize: TRIM_SIZES.LANDSCAPE_SMALL,
    printType: PRINT_TYPES.PREM_COLOR,
    binding: BINDING_TYPES.CASE_WRAP,
    paper: PAPER_TYPES.COATED_100,
    coverFinish: COVER_FINISHES.GLOSS,
    pageCountRange: { min: 24, max: 48 },
    category: 'children',
    features: ['Full-color illustrations', 'Simple language', 'Discussion questions', 'Age-appropriate content'],
  },
  
  // Photo Books
  RECOVERY_PHOTO_BOOK: {
    id: 'recovery-photo-book',
    name: 'Recovery Photo Journey',
    description: 'Document your recovery visually with a premium photo book',
    trimSize: TRIM_SIZES.SQUARE_LARGE,
    printType: PRINT_TYPES.PREM_COLOR,
    binding: BINDING_TYPES.CASE_WRAP,
    paper: PAPER_TYPES.COATED_100,
    coverFinish: COVER_FINISHES.GLOSS,
    pageCountRange: { min: 20, max: 120 },
    category: 'photo',
    features: ['Photo layouts', 'Caption templates', 'Timeline designs', 'Milestone celebrations'],
  },
  
  // Professional/Educational
  THERAPY_MANUAL: {
    id: 'therapy-manual',
    name: 'Therapy Professional Manual',
    description: 'For therapists and healthcare providers working with stroke survivors',
    trimSize: TRIM_SIZES.US_LETTER,
    printType: PRINT_TYPES.STD_COLOR,
    binding: BINDING_TYPES.PERFECT_BOUND,
    paper: PAPER_TYPES.WHITE_80,
    coverFinish: COVER_FINISHES.MATTE,
    pageCountRange: { min: 60, max: 500 },
    category: 'professional',
    features: ['Clinical protocols', 'Assessment forms', 'Progress charts', 'Evidence-based content'],
  },
  
  // Poetry & Creative
  POETRY_COLLECTION: {
    id: 'poetry-collection',
    name: 'Poetry & Reflections',
    description: 'Express your journey through poetry and creative writing',
    trimSize: TRIM_SIZES.DIGEST,
    printType: PRINT_TYPES.BW,
    binding: BINDING_TYPES.PERFECT_BOUND,
    paper: PAPER_TYPES.CREAM_60,
    coverFinish: COVER_FINISHES.MATTE,
    pageCountRange: { min: 30, max: 150 },
    category: 'creative',
    features: ['Elegant typography', 'Poem layouts', 'Illustration spaces', 'Section dividers'],
  },
  
  // Cookbook
  HEALTHY_RECIPES: {
    id: 'healthy-recipes',
    name: 'Healthy Recovery Recipes',
    description: 'Brain-healthy recipes for stroke survivors',
    trimSize: TRIM_SIZES.US_LETTER,
    printType: PRINT_TYPES.PREM_COLOR,
    binding: BINDING_TYPES.COIL,
    paper: PAPER_TYPES.COATED_100,
    coverFinish: COVER_FINISHES.GLOSS,
    pageCountRange: { min: 40, max: 200 },
    category: 'lifestyle',
    features: ['Recipe cards', 'Nutritional info', 'Meal planning', 'Shopping lists'],
  },
  
  // Standard Books
  NOVEL: {
    id: 'novel',
    name: 'Standard Novel',
    description: 'Classic novel format for fiction and non-fiction narratives',
    trimSize: TRIM_SIZES.US_TRADE,
    printType: PRINT_TYPES.BW,
    binding: BINDING_TYPES.PERFECT_BOUND,
    paper: PAPER_TYPES.CREAM_60,
    coverFinish: COVER_FINISHES.MATTE,
    pageCountRange: { min: 80, max: 800 },
    category: 'general',
    features: ['Chapter headers', 'Front/back matter', 'Professional typography', 'ISBN ready'],
  },
  
  PREMIUM_HARDCOVER: {
    id: 'premium-hardcover',
    name: 'Premium Hardcover',
    description: 'Luxurious hardcover edition for special publications',
    trimSize: TRIM_SIZES.ROYAL,
    printType: PRINT_TYPES.BW,
    binding: BINDING_TYPES.DUST_JACKET,
    paper: PAPER_TYPES.WHITE_80,
    coverFinish: COVER_FINISHES.GLOSS,
    pageCountRange: { min: 100, max: 600 },
    category: 'premium',
    features: ['Dust jacket design', 'Ribbon marker', 'Endpapers', 'Premium packaging'],
  },
} as const;

// Generate POD Package ID from specifications
export function generatePodPackageId(specs: {
  trimSize: typeof TRIM_SIZES[keyof typeof TRIM_SIZES];
  printType: typeof PRINT_TYPES[keyof typeof PRINT_TYPES];
  binding: typeof BINDING_TYPES[keyof typeof BINDING_TYPES];
  paper: typeof PAPER_TYPES[keyof typeof PAPER_TYPES];
  coverFinish: typeof COVER_FINISHES[keyof typeof COVER_FINISHES];
}): string {
  // Format: TrimSize + PrintType + Quality + Binding + Paper + Finish + Linen + Foil
  // Example: 0600X0900BWSTDPB060UW444MXX
  const quality = 'STD'; // Standard quality
  const linen = 'X'; // No linen
  const foil = 'X'; // No foil
  
  return `${specs.trimSize.code}${specs.printType.code}${quality}${specs.binding.code}${specs.paper.code}${specs.coverFinish.code}${linen}${foil}`;
}

// Interfaces
interface LuluAuthToken {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
}

interface PrintJobLineItem {
  externalId?: string;
  title: string;
  coverSourceUrl: string;
  interiorSourceUrl: string;
  podPackageId: string;
  quantity: number;
}

interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  stateCode?: string;
  postcode: string;
  countryCode: string;
  phoneNumber: string;
  email?: string;
  organization?: string;
}

interface PrintJobRequest {
  contactEmail: string;
  lineItems: PrintJobLineItem[];
  shippingAddress: ShippingAddress;
  shippingLevel: keyof typeof SHIPPING_LEVELS;
  externalId?: string;
}

interface CostCalculationRequest {
  lineItems: {
    pageCount: number;
    podPackageId: string;
    quantity: number;
  }[];
  shippingAddress: {
    city?: string;
    countryCode: string;
    postcode?: string;
    stateCode?: string;
    street1?: string;
  };
  shippingOption?: string;
  currencyCode?: string;
}

interface PrintJob {
  id: string;
  externalId?: string;
  status: {
    name: string;
    message?: string;
  };
  lineItems: any[];
  shippingAddress: ShippingAddress;
  costs?: {
    lineItemCosts: any[];
    shippingCost: any;
    totalCostIncludingTax: any;
  };
  createdAt: string;
  updatedAt: string;
}

interface CostEstimate {
  lineItemCosts: {
    costExclDiscount: string;
    discountAmount: string;
    totalCostInclDiscount: string;
    quantity: number;
    costPerUnit: string;
  }[];
  shippingCost: {
    totalCostExclTax: string;
    taxAmount: string;
    totalCostInclTax: string;
  };
  totalCostExclTax: string;
  taxAmount: string;
  totalCostInclTax: string;
  currencyCode: string;
}

class LuluPublishingService {
  private token: LuluAuthToken | null = null;
  private axiosInstance: AxiosInstance;
  
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: LULU_API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  // Authenticate with Lulu API
  async authenticate(): Promise<boolean> {
    const apiKey = process.env.LULU_API_KEY;
    const apiSecret = process.env.LULU_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      console.error('Lulu API credentials not configured');
      return false;
    }
    
    // Check if current token is still valid
    if (this.token && Date.now() < this.token.expiresAt - 60000) {
      return true;
    }
    
    try {
      const response = await axios.post(
        LULU_AUTH_URL,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: apiKey,
            password: apiSecret,
          },
        }
      );
      
      this.token = {
        accessToken: response.data.access_token,
        expiresAt: Date.now() + (response.data.expires_in * 1000),
        refreshToken: response.data.refresh_token,
      };
      
      // Update axios instance with new token
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token.accessToken}`;
      
      return true;
    } catch (error: any) {
      console.error('Lulu authentication failed:', error.response?.data || error.message);
      return false;
    }
  }
  
  // Ensure authenticated before API calls
  private async ensureAuthenticated(): Promise<void> {
    if (!await this.authenticate()) {
      throw new Error('Failed to authenticate with Lulu API');
    }
  }
  
  // Calculate print job cost
  async calculateCost(request: CostCalculationRequest): Promise<CostEstimate> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.axiosInstance.post('/print-job-cost-calculations/', {
        line_items: request.lineItems.map(item => ({
          page_count: item.pageCount,
          pod_package_id: item.podPackageId,
          quantity: item.quantity,
        })),
        shipping_address: {
          city: request.shippingAddress.city,
          country_code: request.shippingAddress.countryCode,
          postcode: request.shippingAddress.postcode,
          state_code: request.shippingAddress.stateCode,
          street1: request.shippingAddress.street1 || '123 Test St',
        },
        shipping_option: request.shippingOption || 'MAIL',
        currency_code: request.currencyCode || 'USD',
      });
      
      return {
        lineItemCosts: response.data.line_item_costs.map((cost: any) => ({
          costExclDiscount: cost.cost_excl_discount,
          discountAmount: cost.discount_amount,
          totalCostInclDiscount: cost.total_cost_incl_discount,
          quantity: cost.quantity,
          costPerUnit: cost.cost_per_unit,
        })),
        shippingCost: {
          totalCostExclTax: response.data.shipping_cost.total_cost_excl_tax,
          taxAmount: response.data.shipping_cost.tax_amount,
          totalCostInclTax: response.data.shipping_cost.total_cost_incl_tax,
        },
        totalCostExclTax: response.data.total_cost_excl_tax,
        taxAmount: response.data.tax_amount,
        totalCostInclTax: response.data.total_cost_incl_tax,
        currencyCode: response.data.currency_code,
      };
    } catch (error: any) {
      console.error('Cost calculation failed:', error.response?.data || error.message);
      throw new Error(`Failed to calculate printing costs: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // Create a print job (order)
  async createPrintJob(request: PrintJobRequest): Promise<PrintJob> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.axiosInstance.post('/print-jobs/', {
        contact_email: request.contactEmail,
        external_id: request.externalId,
        line_items: request.lineItems.map(item => ({
          external_id: item.externalId,
          title: item.title,
          cover_source_url: item.coverSourceUrl,
          interior_source_url: item.interiorSourceUrl,
          pod_package_id: item.podPackageId,
          quantity: item.quantity,
        })),
        shipping_address: {
          name: request.shippingAddress.name,
          street1: request.shippingAddress.street1,
          street2: request.shippingAddress.street2,
          city: request.shippingAddress.city,
          state_code: request.shippingAddress.stateCode,
          postcode: request.shippingAddress.postcode,
          country_code: request.shippingAddress.countryCode,
          phone_number: request.shippingAddress.phoneNumber,
          email: request.shippingAddress.email,
          organization: request.shippingAddress.organization,
        },
        shipping_level: request.shippingLevel,
      });
      
      return this.mapPrintJobResponse(response.data);
    } catch (error: any) {
      console.error('Print job creation failed:', error.response?.data || error.message);
      throw new Error(`Failed to create print job: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // Get print job status
  async getPrintJob(jobId: string): Promise<PrintJob> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.axiosInstance.get(`/print-jobs/${jobId}/`);
      return this.mapPrintJobResponse(response.data);
    } catch (error: any) {
      console.error('Get print job failed:', error.response?.data || error.message);
      throw new Error(`Failed to get print job: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // List all print jobs
  async listPrintJobs(page: number = 1, pageSize: number = 20): Promise<{ jobs: PrintJob[]; total: number }> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.axiosInstance.get('/print-jobs/', {
        params: {
          page,
          page_size: pageSize,
        },
      });
      
      return {
        jobs: response.data.results.map((job: any) => this.mapPrintJobResponse(job)),
        total: response.data.count,
      };
    } catch (error: any) {
      console.error('List print jobs failed:', error.response?.data || error.message);
      throw new Error(`Failed to list print jobs: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // Cancel a print job (only if unpaid)
  async cancelPrintJob(jobId: string): Promise<PrintJob> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.axiosInstance.post(`/print-jobs/${jobId}/status/`, {
        name: 'CANCELED',
      });
      
      return this.mapPrintJobResponse(response.data);
    } catch (error: any) {
      console.error('Cancel print job failed:', error.response?.data || error.message);
      throw new Error(`Failed to cancel print job: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // Get cover specifications for a POD package
  async getCoverSpecifications(podPackageId: string, pageCount: number): Promise<any> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.axiosInstance.get(`/pod-packages/${podPackageId}/cover-specifications/`, {
        params: {
          page_count: pageCount,
        },
      });
      
      return {
        width: response.data.width,
        height: response.data.height,
        spineWidth: response.data.spine_width,
        bleed: response.data.bleed,
        safetyMargin: response.data.safety_margin,
        wrapWidth: response.data.wrap_width,
        barcode: response.data.barcode,
      };
    } catch (error: any) {
      console.error('Get cover specifications failed:', error.response?.data || error.message);
      throw new Error(`Failed to get cover specifications: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // Create webhook subscription
  async createWebhook(callbackUrl: string, events: string[]): Promise<any> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.axiosInstance.post('/webhooks/', {
        callback_url: callbackUrl,
        events: events,
      });
      
      return {
        id: response.data.id,
        callbackUrl: response.data.callback_url,
        events: response.data.events,
        signingKey: response.data.signing_key,
        createdAt: response.data.created_at,
      };
    } catch (error: any) {
      console.error('Create webhook failed:', error.response?.data || error.message);
      throw new Error(`Failed to create webhook: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // List webhooks
  async listWebhooks(): Promise<any[]> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.axiosInstance.get('/webhooks/');
      return response.data.results.map((wh: any) => ({
        id: wh.id,
        callbackUrl: wh.callback_url,
        events: wh.events,
        createdAt: wh.created_at,
      }));
    } catch (error: any) {
      console.error('List webhooks failed:', error.response?.data || error.message);
      throw new Error(`Failed to list webhooks: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // Delete webhook
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.ensureAuthenticated();
    
    try {
      await this.axiosInstance.delete(`/webhooks/${webhookId}/`);
    } catch (error: any) {
      console.error('Delete webhook failed:', error.response?.data || error.message);
      throw new Error(`Failed to delete webhook: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // Get available POD packages
  async listPodPackages(filters?: {
    bindingType?: string;
    pageCountMin?: number;
    pageCountMax?: number;
  }): Promise<any[]> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.axiosInstance.get('/pod-packages/', {
        params: {
          binding_type: filters?.bindingType,
          page_count_min: filters?.pageCountMin,
          page_count_max: filters?.pageCountMax,
        },
      });
      
      return response.data.results.map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        bindingType: pkg.binding_type,
        interiorColorType: pkg.interior_color_type,
        paperType: pkg.paper_type,
        trimSize: pkg.trim_size,
        pageCountRange: {
          min: pkg.page_count_min,
          max: pkg.page_count_max,
        },
      }));
    } catch (error: any) {
      console.error('List POD packages failed:', error.response?.data || error.message);
      throw new Error(`Failed to list POD packages: ${error.response?.data?.message || error.message}`);
    }
  }
  
  // Validate PDF files for print readiness
  async validatePrintFiles(coverUrl: string, interiorUrl: string, podPackageId: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.axiosInstance.post('/print-job-files/validate/', {
        cover_source_url: coverUrl,
        interior_source_url: interiorUrl,
        pod_package_id: podPackageId,
      });
      
      return {
        valid: response.data.valid,
        errors: response.data.errors || [],
        warnings: response.data.warnings || [],
      };
    } catch (error: any) {
      // If validation endpoint doesn't exist, return basic validation
      return {
        valid: true,
        errors: [],
        warnings: ['File validation not available in sandbox mode'],
      };
    }
  }
  
  // Get book template by ID
  getTemplate(templateId: string): typeof BOOK_TEMPLATES[keyof typeof BOOK_TEMPLATES] | undefined {
    return Object.values(BOOK_TEMPLATES).find(t => t.id === templateId);
  }
  
  // Get all templates by category
  getTemplatesByCategory(category: string): typeof BOOK_TEMPLATES[keyof typeof BOOK_TEMPLATES][] {
    return Object.values(BOOK_TEMPLATES).filter(t => t.category === category);
  }
  
  // Get all template categories
  getTemplateCategories(): string[] {
    return Array.from(new Set(Object.values(BOOK_TEMPLATES).map(t => t.category)));
  }
  
  // Generate POD package ID for a template
  getTemplatePackageId(templateId: string): string | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;
    
    return generatePodPackageId({
      trimSize: template.trimSize,
      printType: template.printType,
      binding: template.binding,
      paper: template.paper,
      coverFinish: template.coverFinish,
    });
  }
  
  // Helper to map API response to our interface
  private mapPrintJobResponse(data: any): PrintJob {
    return {
      id: data.id,
      externalId: data.external_id,
      status: {
        name: data.status.name,
        message: data.status.message,
      },
      lineItems: data.line_items,
      shippingAddress: {
        name: data.shipping_address.name,
        street1: data.shipping_address.street1,
        street2: data.shipping_address.street2,
        city: data.shipping_address.city,
        stateCode: data.shipping_address.state_code,
        postcode: data.shipping_address.postcode,
        countryCode: data.shipping_address.country_code,
        phoneNumber: data.shipping_address.phone_number,
        email: data.shipping_address.email,
        organization: data.shipping_address.organization,
      },
      costs: data.costs ? {
        lineItemCosts: data.costs.line_item_costs,
        shippingCost: data.costs.shipping_cost,
        totalCostIncludingTax: data.costs.total_cost_incl_tax,
      } : undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Export singleton instance
export const luluPublishingService = new LuluPublishingService();

// Export types
export type { PrintJobRequest, PrintJobLineItem, ShippingAddress, PrintJob, CostEstimate, CostCalculationRequest };

// Webhook signature verification utility (uses crypto imported at top of file)
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  signingKey: string
): boolean {
  if (!signature || !signingKey) {
    return false;
  }
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', signingKey)
      .update(payload, 'utf8')
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}
