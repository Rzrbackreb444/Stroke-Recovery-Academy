/**
 * Universal Publishing Platform Distribution Service
 * Distribute books from Marketplace to ALL major publishing platforms
 * 
 * Supported Platforms:
 * - Amazon KDP (Kindle Direct Publishing)
 * - Apple Books
 * - Barnes & Noble Press
 * - Lulu (Print-on-Demand)
 * - Draft2Digital (Wide Distribution)
 * - IngramSpark (Library/Bookstore Distribution)
 * - Kobo Writing Life
 * - Google Play Books
 * - Smashwords
 * - Scribd
 * - OverDrive (Libraries)
 * 
 * Export Formats:
 * - EPUB 2.0, EPUB 3.0, EPUB 3.2
 * - PDF (Print-Ready, Web, KDP-Compliant)
 * - DOCX (Word)
 * - MOBI (Legacy Kindle)
 * - HTML (Web Publishing)
 * - RTF (Rich Text)
 * - TXT (Plain Text)
 * - ODT (OpenDocument)
 * - AZW3 (Kindle Format 8)
 */

export interface PublishingPlatform {
  id: string;
  name: string;
  type: 'ebook' | 'print' | 'both' | 'audiobook' | 'distribution';
  logo: string;
  description: string;
  royaltyRate: string;
  requirements: PlatformRequirements;
  supportedFormats: ExportFormat[];
  features: string[];
  apiAvailable: boolean;
  setupUrl: string;
  status: 'active' | 'coming_soon' | 'beta';
}

export interface PlatformRequirements {
  minPages?: number;
  maxPages?: number;
  minCoverWidth?: number;
  minCoverHeight?: number;
  aggregator?: string;
  coverDPI?: number;
  interiorDPI?: number;
  isbn?: 'required' | 'optional' | 'provided';
  taxInfo?: boolean;
  bankAccount?: boolean;
}

export type ExportFormat = 
  | 'epub2' 
  | 'epub3' 
  | 'epub3.2'
  | 'pdf_print' 
  | 'pdf_web' 
  | 'pdf_kdp'
  | 'pdf_ingram'
  | 'docx' 
  | 'doc'
  | 'mobi' 
  | 'azw3'
  | 'html' 
  | 'rtf' 
  | 'txt' 
  | 'odt'
  | 'cbz'
  | 'fb2';

export const PUBLISHING_PLATFORMS: PublishingPlatform[] = [
  {
    id: 'amazon_kdp',
    name: 'Amazon KDP',
    type: 'both',
    logo: '/platforms/amazon-kdp.svg',
    description: 'The world\'s largest ebook marketplace. Reach millions of Kindle readers worldwide.',
    royaltyRate: '35-70%',
    requirements: {
      minPages: 24,
      maxPages: 828,
      minCoverWidth: 1600,
      minCoverHeight: 2560,
      coverDPI: 300,
      interiorDPI: 300,
      isbn: 'optional',
      taxInfo: true,
      bankAccount: true,
    },
    supportedFormats: ['epub3', 'pdf_kdp', 'docx', 'mobi', 'azw3', 'html'],
    features: [
      'Kindle Unlimited enrollment',
      'Print-on-Demand paperbacks',
      'Hardcover options',
      'Pre-order setup',
      'A+ Content marketing',
      'Kindle Countdown Deals',
      'Free Book Promotions',
      'Author Central integration',
      'Series management',
      'Global distribution (13 marketplaces)',
    ],
    apiAvailable: false,
    setupUrl: 'https://kdp.amazon.com',
    status: 'active',
  },
  {
    id: 'apple_books',
    name: 'Apple Books',
    type: 'ebook',
    logo: '/platforms/apple-books.svg',
    description: 'Reach Apple device users worldwide through the premium Apple Books store.',
    royaltyRate: '70%',
    requirements: {
      minCoverWidth: 1400,
      minCoverHeight: 1873,
      coverDPI: 72,
      isbn: 'required',
      taxInfo: true,
      bankAccount: true,
    },
    supportedFormats: ['epub3', 'epub3.2', 'pdf_web'],
    features: [
      'Premium Apple ecosystem',
      'iBooks Author integration',
      'Pre-order campaigns',
      'Enhanced ebook features',
      'Multi-Touch books',
      'Sample downloads',
      '51 countries distribution',
      'Apple Books bestseller lists',
    ],
    apiAvailable: true,
    setupUrl: 'https://authors.apple.com',
    status: 'active',
  },
  {
    id: 'barnes_noble',
    name: 'Barnes & Noble Press',
    type: 'both',
    logo: '/platforms/barnes-noble.svg',
    description: 'America\'s largest book retailer. Sell ebooks and print books to Nook readers.',
    royaltyRate: '40-65%',
    requirements: {
      minPages: 24,
      maxPages: 800,
      minCoverWidth: 1400,
      minCoverHeight: 2100,
      coverDPI: 300,
      isbn: 'optional',
      taxInfo: true,
      bankAccount: true,
    },
    supportedFormats: ['epub3', 'pdf_print', 'docx'],
    features: [
      'Nook ebook store',
      'Print-on-Demand',
      'In-store availability',
      'B&N bestseller lists',
      'Author events support',
      'Educational market access',
      'Gift card promotions',
    ],
    apiAvailable: false,
    setupUrl: 'https://press.barnesandnoble.com',
    status: 'active',
  },
  {
    id: 'lulu',
    name: 'Lulu',
    type: 'print',
    logo: '/platforms/lulu.svg',
    description: 'Premium print-on-demand with global distribution and exceptional print quality.',
    royaltyRate: '80%',
    requirements: {
      minPages: 2,
      maxPages: 800,
      minCoverWidth: 1800,
      minCoverHeight: 2700,
      coverDPI: 300,
      interiorDPI: 300,
      isbn: 'optional',
      taxInfo: true,
      bankAccount: true,
    },
    supportedFormats: ['pdf_print', 'docx', 'epub3'],
    features: [
      'Premium print quality',
      'Hardcover & paperback',
      'Photo books',
      'Calendars & journals',
      'Global distribution',
      'Retail network access',
      'White-label printing',
      'API integration available',
      'Bulk ordering discounts',
    ],
    apiAvailable: true,
    setupUrl: 'https://www.lulu.com',
    status: 'active',
  },
  {
    id: 'draft2digital',
    name: 'Draft2Digital',
    type: 'distribution',
    logo: '/platforms/d2d.svg',
    description: 'Wide distribution aggregator reaching 100+ retailers and libraries worldwide.',
    royaltyRate: '60-70%',
    requirements: {
      minCoverWidth: 1600,
      minCoverHeight: 2400,
      isbn: 'provided',
      taxInfo: true,
      bankAccount: true,
    },
    supportedFormats: ['epub3', 'docx', 'pdf_web'],
    features: [
      'One-click wide distribution',
      'Free ISBN assignment',
      'Universal Book Links',
      'Print-on-Demand via D2D Print',
      'Automated formatting',
      'Library distribution',
      'Subscription services',
      'Audiobook distribution',
      'Books2Read landing pages',
    ],
    apiAvailable: false,
    setupUrl: 'https://www.draft2digital.com',
    status: 'active',
  },
  {
    id: 'ingram_spark',
    name: 'IngramSpark',
    type: 'both',
    logo: '/platforms/ingram.svg',
    description: 'Professional-grade distribution to 40,000+ retailers, libraries, and schools.',
    royaltyRate: '40-55%',
    requirements: {
      minPages: 24,
      maxPages: 2000,
      minCoverWidth: 1800,
      minCoverHeight: 2700,
      coverDPI: 300,
      interiorDPI: 300,
      isbn: 'required',
      taxInfo: true,
      bankAccount: true,
    },
    supportedFormats: ['pdf_ingram', 'epub3', 'pdf_print'],
    features: [
      '40,000+ retail partners',
      'Library distribution (OverDrive)',
      'Bookstore wholesaler access',
      'Returns program',
      'Global print facilities',
      'Hardcover, paperback, ebook',
      'Educational market access',
      'Professional catalogs',
    ],
    apiAvailable: true,
    setupUrl: 'https://www.ingramspark.com',
    status: 'active',
  },
  {
    id: 'kobo',
    name: 'Kobo Writing Life',
    type: 'ebook',
    logo: '/platforms/kobo.svg',
    description: 'Global ebook retailer popular in Canada, Europe, and beyond.',
    royaltyRate: '45-70%',
    requirements: {
      minCoverWidth: 1400,
      minCoverHeight: 2100,
      isbn: 'optional',
      taxInfo: true,
      bankAccount: true,
    },
    supportedFormats: ['epub3', 'epub2', 'docx'],
    features: [
      'Kobo Plus subscription',
      'International reach',
      'Pre-order support',
      'Price promotions',
      'Beta reading program',
      'Kobo Originals',
      '190+ countries',
    ],
    apiAvailable: false,
    setupUrl: 'https://www.kobo.com/writinglife',
    status: 'active',
  },
  {
    id: 'google_play',
    name: 'Google Play Books',
    type: 'ebook',
    logo: '/platforms/google-play.svg',
    description: 'Reach Android users and Google ecosystem through Google Play Books.',
    royaltyRate: '52-70%',
    requirements: {
      minCoverWidth: 1410,
      minCoverHeight: 2250,
      isbn: 'optional',
      taxInfo: true,
      bankAccount: true,
    },
    supportedFormats: ['epub3', 'pdf_web'],
    features: [
      'Android ecosystem',
      'Google Search integration',
      'Sample chapters',
      'Pre-order campaigns',
      'Dynamic pricing',
      '75+ countries',
      'Google Books preview',
    ],
    apiAvailable: true,
    setupUrl: 'https://play.google.com/books/publish',
    status: 'active',
  },
  {
    id: 'smashwords',
    name: 'Smashwords',
    type: 'distribution',
    logo: '/platforms/smashwords.svg',
    description: 'Indie-friendly distribution to major retailers and libraries.',
    royaltyRate: '60-80%',
    requirements: {
      minCoverWidth: 1400,
      minCoverHeight: 2100,
      isbn: 'provided',
      taxInfo: true,
    },
    supportedFormats: ['epub3', 'epub2', 'mobi', 'pdf_web', 'rtf', 'txt'],
    features: [
      'Multiple format generation',
      'Free ISBN',
      'Library distribution',
      'Coupon system',
      'Affiliate program',
      'Author interviews',
      'Preorder support',
    ],
    apiAvailable: false,
    setupUrl: 'https://www.smashwords.com',
    status: 'active',
  },
  {
    id: 'scribd',
    name: 'Scribd (Everand)',
    type: 'ebook',
    logo: '/platforms/scribd.svg',
    description: 'Subscription platform with 100M+ readers. Distribute via Draft2Digital or PublishDrive.',
    royaltyRate: 'Per-read threshold',
    requirements: {
      isbn: 'optional',
      aggregator: 'Required - use Draft2Digital, PublishDrive, or Smashwords',
    },
    supportedFormats: ['epub3', 'pdf_web'],
    features: [
      'Subscription model income',
      '100M+ monthly readers',
      'Audiobook support',
      'Everand subscription service',
      'Discovery features',
    ],
    apiAvailable: false,
    setupUrl: 'https://support.scribd.com/hc/en-us/articles/210134806-My-books-on-Everand',
    status: 'active',
  },
  {
    id: 'overdrive',
    name: 'OverDrive (Libraries)',
    type: 'ebook',
    logo: '/platforms/overdrive.svg',
    description: 'Reach 92,000+ libraries via Libby app. Distribute via Draft2Digital or PublishDrive.',
    royaltyRate: 'Per-checkout',
    requirements: {
      isbn: 'required',
      aggregator: 'Required - use Draft2Digital, Kobo Writing Life, or PublishDrive',
    },
    supportedFormats: ['epub3', 'pdf_web'],
    features: [
      '92,000+ libraries worldwide',
      'School distribution',
      'Libby & Sora apps',
      'Institutional sales',
      '115 countries',
    ],
    apiAvailable: false,
    setupUrl: 'https://company.overdrive.com/publishers/',
    status: 'active',
  },
];

export interface ExportFormatSpec {
  id: ExportFormat;
  name: string;
  extension: string;
  mimeType: string;
  description: string;
  platforms: string[];
  features: string[];
}

export const EXPORT_FORMATS: ExportFormatSpec[] = [
  {
    id: 'epub3',
    name: 'EPUB 3.0',
    extension: '.epub',
    mimeType: 'application/epub+zip',
    description: 'Modern ebook standard with rich formatting, multimedia, and accessibility.',
    platforms: ['apple_books', 'kobo', 'google_play', 'barnes_noble', 'draft2digital'],
    features: ['Reflowable text', 'CSS3 styling', 'Audio/Video support', 'JavaScript', 'Accessibility'],
  },
  {
    id: 'epub3.2',
    name: 'EPUB 3.2',
    extension: '.epub',
    mimeType: 'application/epub+zip',
    description: 'Latest EPUB standard with enhanced web platform integration.',
    platforms: ['apple_books'],
    features: ['Web Components', 'Enhanced accessibility', 'Remote resources', 'Modern CSS'],
  },
  {
    id: 'epub2',
    name: 'EPUB 2.0',
    extension: '.epub',
    mimeType: 'application/epub+zip',
    description: 'Legacy EPUB format for maximum device compatibility.',
    platforms: ['kobo', 'smashwords'],
    features: ['Maximum compatibility', 'Simple structure', 'Wide device support'],
  },
  {
    id: 'pdf_kdp',
    name: 'PDF (KDP Print-Ready)',
    extension: '.pdf',
    mimeType: 'application/pdf',
    description: 'Amazon KDP compliant PDF with proper bleeds and margins.',
    platforms: ['amazon_kdp'],
    features: ['KDP specifications', '300 DPI', 'Bleed margins', 'Embedded fonts', 'PDF/X-1a'],
  },
  {
    id: 'pdf_ingram',
    name: 'PDF (IngramSpark)',
    extension: '.pdf',
    mimeType: 'application/pdf',
    description: 'IngramSpark compliant PDF for professional print distribution.',
    platforms: ['ingram_spark'],
    features: ['Ingram specifications', 'Color profiles', 'Spine calculations', 'Barcode placement'],
  },
  {
    id: 'pdf_print',
    name: 'PDF (Print-Ready)',
    extension: '.pdf',
    mimeType: 'application/pdf',
    description: 'Generic print-ready PDF for professional printing.',
    platforms: ['lulu', 'barnes_noble'],
    features: ['300 DPI', 'CMYK color', 'Crop marks', 'Bleed area'],
  },
  {
    id: 'pdf_web',
    name: 'PDF (Web/Digital)',
    extension: '.pdf',
    mimeType: 'application/pdf',
    description: 'Optimized PDF for digital distribution and screen reading.',
    platforms: ['google_play', 'scribd', 'overdrive'],
    features: ['RGB color', 'Hyperlinks', 'Bookmarks', 'Optimized size'],
  },
  {
    id: 'docx',
    name: 'Microsoft Word',
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    description: 'Editable Word document for further formatting or submissions.',
    platforms: ['amazon_kdp', 'barnes_noble', 'draft2digital', 'kobo'],
    features: ['Editable', 'Track changes', 'Comments', 'Styles'],
  },
  {
    id: 'mobi',
    name: 'MOBI (Legacy Kindle)',
    extension: '.mobi',
    mimeType: 'application/x-mobipocket-ebook',
    description: 'Legacy Kindle format for older devices.',
    platforms: ['amazon_kdp', 'smashwords'],
    features: ['Older Kindle support', 'Simple formatting'],
  },
  {
    id: 'azw3',
    name: 'AZW3 (Kindle Format 8)',
    extension: '.azw3',
    mimeType: 'application/vnd.amazon.ebook',
    description: 'Modern Kindle format with enhanced formatting.',
    platforms: ['amazon_kdp'],
    features: ['Rich formatting', 'Kindle features', 'Enhanced typography'],
  },
  {
    id: 'html',
    name: 'HTML',
    extension: '.html',
    mimeType: 'text/html',
    description: 'Web-ready HTML for online publishing.',
    platforms: ['amazon_kdp'],
    features: ['Web publishing', 'Blog integration', 'SEO-friendly'],
  },
  {
    id: 'rtf',
    name: 'Rich Text Format',
    extension: '.rtf',
    mimeType: 'application/rtf',
    description: 'Universal rich text format for cross-platform editing.',
    platforms: ['smashwords'],
    features: ['Universal compatibility', 'Basic formatting'],
  },
  {
    id: 'txt',
    name: 'Plain Text',
    extension: '.txt',
    mimeType: 'text/plain',
    description: 'Simple plain text without formatting.',
    platforms: ['smashwords'],
    features: ['Maximum compatibility', 'Smallest size'],
  },
  {
    id: 'odt',
    name: 'OpenDocument Text',
    extension: '.odt',
    mimeType: 'application/vnd.oasis.opendocument.text',
    description: 'Open standard document format.',
    platforms: [],
    features: ['Open standard', 'LibreOffice compatible'],
  },
];

export interface DistributionStatus {
  platformId: string;
  status: 'pending' | 'processing' | 'published' | 'failed' | 'draft';
  publishedUrl?: string;
  errorMessage?: string;
  lastUpdated: Date;
  salesData?: {
    units: number;
    revenue: number;
    currency: string;
  };
}

export interface BookDistribution {
  bookId: number;
  title: string;
  author: string;
  isbn?: string;
  platforms: DistributionStatus[];
  exports: {
    format: ExportFormat;
    url: string;
    createdAt: Date;
  }[];
}

export function getPlatformById(id: string): PublishingPlatform | undefined {
  return PUBLISHING_PLATFORMS.find(p => p.id === id);
}

export function getPlatformsForFormat(format: ExportFormat): PublishingPlatform[] {
  return PUBLISHING_PLATFORMS.filter(p => p.supportedFormats.includes(format));
}

export function getFormatsForPlatform(platformId: string): ExportFormatSpec[] {
  const platform = getPlatformById(platformId);
  if (!platform) return [];
  return EXPORT_FORMATS.filter(f => platform.supportedFormats.includes(f.id));
}

export function getActivePlatforms(): PublishingPlatform[] {
  return PUBLISHING_PLATFORMS.filter(p => p.status === 'active');
}

export function getPlatformsByType(type: PublishingPlatform['type']): PublishingPlatform[] {
  return PUBLISHING_PLATFORMS.filter(p => p.type === type || p.type === 'both');
}

export function calculateRoyalty(
  platformId: string, 
  listPrice: number, 
  printCost?: number
): { royalty: number; royaltyPercent: number } {
  const platform = getPlatformById(platformId);
  if (!platform) return { royalty: 0, royaltyPercent: 0 };

  let royaltyPercent = 0;
  
  switch (platformId) {
    case 'amazon_kdp':
      royaltyPercent = listPrice >= 2.99 && listPrice <= 9.99 ? 0.70 : 0.35;
      break;
    case 'apple_books':
      royaltyPercent = 0.70;
      break;
    case 'barnes_noble':
      royaltyPercent = listPrice >= 2.99 ? 0.65 : 0.40;
      break;
    case 'lulu':
      royaltyPercent = 0.80;
      break;
    case 'draft2digital':
      royaltyPercent = 0.60;
      break;
    case 'ingram_spark':
      royaltyPercent = 0.40;
      break;
    case 'kobo':
      royaltyPercent = listPrice >= 2.99 ? 0.70 : 0.45;
      break;
    case 'google_play':
      royaltyPercent = 0.52;
      break;
    case 'smashwords':
      royaltyPercent = 0.60;
      break;
    default:
      royaltyPercent = 0.50;
  }

  const royalty = (listPrice * royaltyPercent) - (printCost || 0);
  return { royalty: Math.max(0, royalty), royaltyPercent };
}

export interface PublishingChecklist {
  category: string;
  items: {
    id: string;
    label: string;
    required: boolean;
    completed: boolean;
    helpText?: string;
  }[];
}

export function generatePublishingChecklist(platformId: string): PublishingChecklist[] {
  const platform = getPlatformById(platformId);
  if (!platform) return [];

  return [
    {
      category: 'Manuscript',
      items: [
        { id: 'manuscript_complete', label: 'Manuscript is complete and edited', required: true, completed: false },
        { id: 'manuscript_formatted', label: 'Manuscript is properly formatted', required: true, completed: false },
        { id: 'toc_included', label: 'Table of contents included', required: false, completed: false },
        { id: 'copyright_page', label: 'Copyright page added', required: true, completed: false },
      ],
    },
    {
      category: 'Cover',
      items: [
        { id: 'cover_created', label: 'Professional cover designed', required: true, completed: false },
        { id: 'cover_dimensions', label: `Cover meets minimum ${platform.requirements.minCoverWidth}x${platform.requirements.minCoverHeight}px`, required: true, completed: false, helpText: `${platform.name} requires ${platform.requirements.coverDPI || 300} DPI` },
        { id: 'cover_spine', label: 'Spine calculated (for print)', required: false, completed: false },
      ],
    },
    {
      category: 'Metadata',
      items: [
        { id: 'title_subtitle', label: 'Title and subtitle finalized', required: true, completed: false },
        { id: 'description', label: 'Book description (blurb) written', required: true, completed: false },
        { id: 'categories', label: 'Categories/genres selected', required: true, completed: false },
        { id: 'keywords', label: 'Keywords optimized', required: true, completed: false },
        { id: 'isbn', label: 'ISBN assigned', required: platform.requirements.isbn === 'required', completed: false },
      ],
    },
    {
      category: 'Account Setup',
      items: [
        { id: 'account_created', label: `${platform.name} account created`, required: true, completed: false, helpText: platform.setupUrl },
        { id: 'tax_info', label: 'Tax information submitted', required: platform.requirements.taxInfo || false, completed: false },
        { id: 'bank_account', label: 'Bank account connected', required: platform.requirements.bankAccount || false, completed: false },
      ],
    },
  ];
}

export const DISTRIBUTION_STRATEGIES = {
  wide: {
    name: 'Wide Distribution',
    description: 'Publish everywhere for maximum reach',
    platforms: ['amazon_kdp', 'apple_books', 'barnes_noble', 'kobo', 'google_play', 'draft2digital'],
    pros: ['Maximum visibility', 'Multiple income streams', 'Reader preference'],
    cons: ['No Kindle Unlimited', 'More management'],
  },
  kdp_exclusive: {
    name: 'Amazon Exclusive (KDP Select)',
    description: 'Exclusive to Amazon for Kindle Unlimited benefits',
    platforms: ['amazon_kdp'],
    pros: ['Kindle Unlimited income', 'Promotional tools', 'Higher visibility on Amazon'],
    cons: ['Single platform', 'No other retailers'],
  },
  hybrid: {
    name: 'Hybrid Approach',
    description: 'Some books exclusive, others wide',
    platforms: ['amazon_kdp', 'draft2digital'],
    pros: ['Flexibility', 'Test what works', 'Series strategies'],
    cons: ['Complex management', 'Strategy required'],
  },
  library_focus: {
    name: 'Library Distribution',
    description: 'Focus on library and institutional sales',
    platforms: ['ingram_spark', 'overdrive', 'draft2digital'],
    pros: ['Institutional sales', 'Long-tail income', 'Discoverability'],
    cons: ['Lower per-unit royalty', 'Slower sales cycle'],
  },
};
