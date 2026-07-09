/**
 * D-ID Avatar Video Service
 * AI-powered talking avatar video generation with credit billing
 */

import { chargeForAPIUsage } from './apiPricingService';

const DID_API_ENDPOINT = "https://api.d-id.com";

export interface AvatarVideo {
  id: string;
  status: 'created' | 'started' | 'done' | 'error';
  resultUrl?: string;
  duration?: number;
  error?: string;
}

export interface AvatarPresenter {
  id: string;
  name: string;
  thumbnailUrl: string;
  gender: 'male' | 'female';
}

const STOCK_PRESENTERS: AvatarPresenter[] = [
  { id: 'amy-Aq6OmGZnMt', name: 'Amy', thumbnailUrl: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg', gender: 'female' },
  { id: 'anna-kCYs8Mh4Cx', name: 'Anna', thumbnailUrl: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/anna.jpg', gender: 'female' },
  { id: 'josh-7FcKV7vX3v', name: 'Josh', thumbnailUrl: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/josh.jpg', gender: 'male' },
  { id: 'matthew-QNnXmKjn7T', name: 'Matthew', thumbnailUrl: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/matthew.jpg', gender: 'male' },
];

function getAuthHeaders(): HeadersInit {
  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) {
    throw new Error("DID_API_KEY not set");
  }
  return {
    'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
    'Content-Type': 'application/json'
  };
}

export async function createTalkingAvatar(
  userId: string,
  options: {
    text: string;
    presenterId?: string;
    voiceId?: string;
    language?: string;
  }
): Promise<{ success: boolean; video?: AvatarVideo; error?: string; creditsUsed?: number }> {
  try {
    // Charge credits upfront
    const chargeResult = await chargeForAPIUsage(userId, 'video_avatar', 1, {
      textLength: options.text.length,
      presenterId: options.presenterId
    });

    if (!chargeResult.success) {
      return { success: false, error: chargeResult.error };
    }

    const requestBody = {
      source_url: options.presenterId 
        ? `https://d-id-public-bucket.s3.amazonaws.com/${options.presenterId.split('-')[0]}.jpg`
        : 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg',
      script: {
        type: 'text',
        input: options.text,
        provider: {
          type: 'microsoft',
          voice_id: options.voiceId || 'en-US-JennyNeural'
        }
      },
      config: {
        stitch: true
      }
    };

    const response = await fetch(`${DID_API_ENDPOINT}/talks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`D-ID API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { id: string; status: string };

    return {
      success: true,
      video: {
        id: data.id,
        status: data.status as AvatarVideo['status']
      },
      creditsUsed: chargeResult.creditsDeducted
    };
  } catch (error) {
    console.error('D-ID create error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getAvatarVideoStatus(
  videoId: string
): Promise<{ success: boolean; video?: AvatarVideo; error?: string }> {
  try {
    const response = await fetch(`${DID_API_ENDPOINT}/talks/${videoId}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`D-ID status error: ${response.status}`);
    }

    const data = await response.json() as {
      id: string;
      status: string;
      result_url?: string;
      duration?: number;
      error?: { description: string };
    };

    return {
      success: true,
      video: {
        id: data.id,
        status: data.status as AvatarVideo['status'],
        resultUrl: data.result_url,
        duration: data.duration,
        error: data.error?.description
      }
    };
  } catch (error) {
    console.error('D-ID status error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function getStockPresenters(): AvatarPresenter[] {
  return STOCK_PRESENTERS;
}

export async function getAvailableVoices(): Promise<{ success: boolean; voices?: Array<{ id: string; name: string; language: string; gender: string }>; error?: string }> {
  // Common Microsoft voices supported by D-ID
  const voices = [
    { id: 'en-US-JennyNeural', name: 'Jenny', language: 'en-US', gender: 'female' },
    { id: 'en-US-GuyNeural', name: 'Guy', language: 'en-US', gender: 'male' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia', language: 'en-GB', gender: 'female' },
    { id: 'en-GB-RyanNeural', name: 'Ryan', language: 'en-GB', gender: 'male' },
    { id: 'es-ES-ElviraNeural', name: 'Elvira', language: 'es-ES', gender: 'female' },
    { id: 'es-MX-DaliaNeural', name: 'Dalia', language: 'es-MX', gender: 'female' },
    { id: 'fr-FR-DeniseNeural', name: 'Denise', language: 'fr-FR', gender: 'female' },
    { id: 'de-DE-KatjaNeural', name: 'Katja', language: 'de-DE', gender: 'female' },
    { id: 'it-IT-ElsaNeural', name: 'Elsa', language: 'it-IT', gender: 'female' },
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca', language: 'pt-BR', gender: 'female' },
    { id: 'ja-JP-NanamiNeural', name: 'Nanami', language: 'ja-JP', gender: 'female' },
    { id: 'ko-KR-SunHiNeural', name: 'SunHi', language: 'ko-KR', gender: 'female' },
    { id: 'zh-CN-XiaoxiaoNeural', name: 'Xiaoxiao', language: 'zh-CN', gender: 'female' },
  ];

  return { success: true, voices };
}
