/**
 * Google Cloud Video Intelligence Service
 * Video analysis with auto-captioning, scene detection, and content moderation
 * All operations charged via credit system
 */

import { chargeForAPIUsage } from './apiPricingService';

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function createSignedJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const crypto = await import('crypto');
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: credentials.token_uri,
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  };
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${base64Header}.${base64Payload}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  return `${signatureInput}.${sign.sign(credentials.private_key, 'base64url')}`;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }
  
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
  
  const credentials: ServiceAccountCredentials = JSON.parse(serviceAccountKey);
  const jwt = await createSignedJWT(credentials);
  
  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  
  if (!response.ok) throw new Error(`Token error: ${response.status}`);
  const tokenData = await response.json() as { access_token: string; expires_in: number };
  cachedToken = { token: tokenData.access_token, expiresAt: Date.now() + (tokenData.expires_in * 1000) };
  return tokenData.access_token;
}

const VIDEO_INTELLIGENCE_ENDPOINT = "https://videointelligence.googleapis.com/v1/videos:annotate";

export interface VideoScene {
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface VideoLabel {
  description: string;
  confidence: number;
  segments: Array<{ startTime: number; endTime: number }>;
}

export interface VideoTranscript {
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface VideoAnalysisResult {
  scenes: VideoScene[];
  labels: VideoLabel[];
  transcripts: VideoTranscript[];
  explicitContent: Array<{ timeOffset: number; likelihood: string }>;
  durationMinutes: number;
}

export async function analyzeVideo(
  userId: string,
  videoUri: string,
  options: {
    detectScenes?: boolean;
    detectLabels?: boolean;
    transcribe?: boolean;
    detectExplicitContent?: boolean;
    languageCode?: string;
  } = {}
): Promise<{ success: boolean; operationName?: string; result?: VideoAnalysisResult; error?: string; creditsUsed?: number }> {
  try {
    const accessToken = await getAccessToken();

    const features: string[] = [];
    if (options.detectScenes !== false) features.push('SHOT_CHANGE_DETECTION');
    if (options.detectLabels !== false) features.push('LABEL_DETECTION');
    if (options.transcribe) features.push('SPEECH_TRANSCRIPTION');
    if (options.detectExplicitContent) features.push('EXPLICIT_CONTENT_DETECTION');

    const requestBody: any = {
      inputUri: videoUri,
      features
    };

    if (options.transcribe) {
      requestBody.videoContext = {
        speechTranscriptionConfig: {
          languageCode: options.languageCode || 'en-US',
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true
        }
      };
    }

    const response = await fetch(VIDEO_INTELLIGENCE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Video Intelligence API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { name: string };
    
    return {
      success: true,
      operationName: data.name,
      creditsUsed: 0 // Credits charged when results are retrieved
    };
  } catch (error) {
    console.error('Video analysis error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getVideoAnalysisResult(
  userId: string,
  operationName: string,
  estimatedMinutes: number = 1
): Promise<{ success: boolean; complete: boolean; result?: VideoAnalysisResult; error?: string; creditsUsed?: number }> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(`https://videointelligence.googleapis.com/v1/${operationName}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Operation status error: ${response.status}`);
    }

    const data = await response.json() as any;
    
    if (!data.done) {
      return { success: true, complete: false };
    }

    if (data.error) {
      return { success: false, complete: true, error: data.error.message };
    }

    // Charge credits based on video duration
    const chargeResult = await chargeForAPIUsage(userId, 'video_intelligence', estimatedMinutes, {
      operationName,
      features: data.response?.annotationResults?.[0] ? Object.keys(data.response.annotationResults[0]) : []
    });

    if (!chargeResult.success) {
      return { success: false, complete: true, error: chargeResult.error };
    }

    const annotations = data.response?.annotationResults?.[0] || {};
    
    const result: VideoAnalysisResult = {
      scenes: (annotations.shotAnnotations || []).map((shot: any) => ({
        startTime: parseFloat(shot.startTimeOffset?.replace('s', '') || '0'),
        endTime: parseFloat(shot.endTimeOffset?.replace('s', '') || '0'),
        confidence: 1
      })),
      labels: (annotations.segmentLabelAnnotations || []).map((label: any) => ({
        description: label.entity?.description || '',
        confidence: label.segments?.[0]?.confidence || 0,
        segments: (label.segments || []).map((seg: any) => ({
          startTime: parseFloat(seg.segment?.startTimeOffset?.replace('s', '') || '0'),
          endTime: parseFloat(seg.segment?.endTimeOffset?.replace('s', '') || '0')
        }))
      })),
      transcripts: (annotations.speechTranscriptions || []).flatMap((transcription: any) =>
        (transcription.alternatives || []).map((alt: any) => ({
          text: alt.transcript || '',
          startTime: 0,
          endTime: 0,
          confidence: alt.confidence || 0
        }))
      ),
      explicitContent: (annotations.explicitAnnotation?.frames || []).map((frame: any) => ({
        timeOffset: parseFloat(frame.timeOffset?.replace('s', '') || '0'),
        likelihood: frame.pornographyLikelihood || 'UNKNOWN'
      })),
      durationMinutes: estimatedMinutes
    };

    return {
      success: true,
      complete: true,
      result,
      creditsUsed: chargeResult.creditsDeducted
    };
  } catch (error) {
    console.error('Get video result error:', error);
    return { success: false, complete: true, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
