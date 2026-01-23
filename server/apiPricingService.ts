/**
 * API Pricing Service
 * Centralized pricing configuration for all external API calls
 * Credits are deducted based on usage type and volume
 */

import { deductCredits, hasEnoughCredits } from './creditService';

export interface APIPricing {
  featureKey: string;
  name: string;
  creditsPerUnit: number;
  unit: string;
  description: string;
  category: 'vision' | 'speech' | 'video' | 'translation' | 'ai' | 'publishing' | 'media';
}

export const API_PRICING: Record<string, APIPricing> = {
  // Vision APIs
  vision_analyze: {
    featureKey: 'vision_analyze',
    name: 'Image Analysis',
    creditsPerUnit: 5,
    unit: 'image',
    description: 'AI image analysis with labels, objects, text, faces',
    category: 'vision',
  },
  vision_ocr: {
    featureKey: 'vision_ocr',
    name: 'Text Extraction (OCR)',
    creditsPerUnit: 3,
    unit: 'image',
    description: 'Extract text from images',
    category: 'vision',
  },
  vision_safe_search: {
    featureKey: 'vision_safe_search',
    name: 'Content Moderation',
    creditsPerUnit: 2,
    unit: 'image',
    description: 'Safe search content analysis',
    category: 'vision',
  },
  background_remove: {
    featureKey: 'background_remove',
    name: 'Background Removal',
    creditsPerUnit: 10,
    unit: 'image',
    description: 'Remove image background using AI',
    category: 'vision',
  },

  // Speech APIs
  speech_to_text: {
    featureKey: 'speech_to_text',
    name: 'Speech to Text',
    creditsPerUnit: 10,
    unit: 'minute',
    description: 'Transcribe audio to text',
    category: 'speech',
  },
  text_to_speech: {
    featureKey: 'text_to_speech',
    name: 'Text to Speech',
    creditsPerUnit: 5,
    unit: '1000 chars',
    description: 'Convert text to natural speech',
    category: 'speech',
  },
  voice_clone: {
    featureKey: 'voice_clone',
    name: 'Voice Cloning',
    creditsPerUnit: 50,
    unit: 'voice',
    description: 'Clone voice from audio sample',
    category: 'speech',
  },

  // Video APIs
  video_intelligence: {
    featureKey: 'video_intelligence',
    name: 'Video Analysis',
    creditsPerUnit: 15,
    unit: 'minute',
    description: 'AI video scene detection, captions, content analysis',
    category: 'video',
  },
  video_avatar: {
    featureKey: 'video_avatar',
    name: 'AI Avatar Video',
    creditsPerUnit: 25,
    unit: 'video',
    description: 'Generate talking avatar video using D-ID',
    category: 'video',
  },
  video_generation: {
    featureKey: 'video_generation',
    name: 'AI Video Generation',
    creditsPerUnit: 100,
    unit: 'video',
    description: 'Generate video from text prompt',
    category: 'video',
  },

  // Translation APIs
  translation: {
    featureKey: 'translation',
    name: 'Text Translation',
    creditsPerUnit: 2,
    unit: '1000 chars',
    description: 'Translate text between 100+ languages',
    category: 'translation',
  },

  // AI Generation
  ai_text_generation: {
    featureKey: 'ai_text_generation',
    name: 'AI Text Generation',
    creditsPerUnit: 1,
    unit: '1000 tokens',
    description: 'Generate text using AI models',
    category: 'ai',
  },
  ai_image_generation: {
    featureKey: 'ai_image_generation',
    name: 'AI Image Generation',
    creditsPerUnit: 15,
    unit: 'image',
    description: 'Generate images from text prompts',
    category: 'ai',
  },
  ai_music_generation: {
    featureKey: 'ai_music_generation',
    name: 'AI Music Generation',
    creditsPerUnit: 20,
    unit: 'track',
    description: 'Generate music using AI',
    category: 'ai',
  },

  // Publishing APIs
  lulu_print_order: {
    featureKey: 'lulu_print_order',
    name: 'Print Order (Lulu)',
    creditsPerUnit: 50,
    unit: 'order',
    description: 'Submit print-on-demand order to Lulu',
    category: 'publishing',
  },
  kdp_export: {
    featureKey: 'kdp_export',
    name: 'KDP Export',
    creditsPerUnit: 25,
    unit: 'export',
    description: 'Export manuscript for Kindle Direct Publishing',
    category: 'publishing',
  },

  // Media APIs (Free)
  youtube_embed: {
    featureKey: 'youtube_embed',
    name: 'YouTube Embed',
    creditsPerUnit: 0,
    unit: 'embed',
    description: 'Embed YouTube videos (free)',
    category: 'media',
  },
  tenor_gif: {
    featureKey: 'tenor_gif',
    name: 'Tenor GIF Search',
    creditsPerUnit: 0,
    unit: 'search',
    description: 'Search and use GIFs (free)',
    category: 'media',
  },
};

export async function chargeForAPIUsage(
  userId: string,
  featureKey: string,
  units: number = 1,
  metadata?: Record<string, any>
): Promise<{ success: boolean; creditsDeducted: number; newBalance?: number; error?: string }> {
  const pricing = API_PRICING[featureKey];
  
  if (!pricing) {
    return { success: false, creditsDeducted: 0, error: `Unknown feature: ${featureKey}` };
  }

  const totalCredits = pricing.creditsPerUnit * units;
  
  if (totalCredits === 0) {
    return { success: true, creditsDeducted: 0 };
  }

  const hasCredits = await hasEnoughCredits(userId, totalCredits);
  if (!hasCredits) {
    return {
      success: false,
      creditsDeducted: 0,
      error: `Insufficient credits. Required: ${totalCredits}, Feature: ${pricing.name}`,
    };
  }

  const result = await deductCredits(
    userId,
    totalCredits,
    `${pricing.name} (${units} ${pricing.unit}${units > 1 ? 's' : ''})`,
    featureKey,
    { ...metadata, units, pricePerUnit: pricing.creditsPerUnit }
  );

  if (result.success) {
    return {
      success: true,
      creditsDeducted: totalCredits,
      newBalance: result.newBalance,
    };
  }

  return {
    success: false,
    creditsDeducted: 0,
    error: result.error || 'Failed to deduct credits',
  };
}

export function calculateCost(featureKey: string, units: number = 1): number {
  const pricing = API_PRICING[featureKey];
  if (!pricing) return 0;
  return pricing.creditsPerUnit * units;
}

export function getPricingInfo(featureKey: string): APIPricing | null {
  return API_PRICING[featureKey] || null;
}

export function getAllPricing(): APIPricing[] {
  return Object.values(API_PRICING);
}

export function getPricingByCategory(category: APIPricing['category']): APIPricing[] {
  return Object.values(API_PRICING).filter(p => p.category === category);
}
