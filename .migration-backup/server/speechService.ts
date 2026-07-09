/**
 * Google Cloud Speech Services
 * Speech-to-Text and Text-to-Speech with credit billing
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
  const signature = sign.sign(credentials.private_key, 'base64url');
  
  return `${signatureInput}.${signature}`;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }
  
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
  }
  
  const credentials: ServiceAccountCredentials = JSON.parse(serviceAccountKey);
  const jwt = await createSignedJWT(credentials);
  
  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`);
  }
  
  const tokenData = await response.json() as { access_token: string; expires_in: number };
  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in * 1000)
  };
  
  return tokenData.access_token;
}

export interface SpeechToTextResult {
  transcript: string;
  confidence: number;
  words?: Array<{ word: string; startTime: number; endTime: number }>;
  languageCode: string;
  durationMinutes: number;
}

export interface TextToSpeechResult {
  audioContent: string; // base64 encoded audio
  audioFormat: string;
  characterCount: number;
}

const SPEECH_TO_TEXT_ENDPOINT = "https://speech.googleapis.com/v1/speech:recognize";
const TEXT_TO_SPEECH_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";

export async function transcribeAudio(
  userId: string,
  audioBase64: string,
  options: {
    languageCode?: string;
    enableWordTimeOffsets?: boolean;
    model?: 'default' | 'video' | 'phone_call' | 'command_and_search';
    sampleRateHertz?: number;
    encoding?: 'LINEAR16' | 'FLAC' | 'MP3' | 'OGG_OPUS' | 'WEBM_OPUS';
  } = {}
): Promise<{ success: boolean; result?: SpeechToTextResult; error?: string; creditsUsed?: number }> {
  try {
    const accessToken = await getAccessToken();
    
    const requestBody = {
      config: {
        encoding: options.encoding || 'WEBM_OPUS',
        sampleRateHertz: options.sampleRateHertz || 48000,
        languageCode: options.languageCode || 'en-US',
        enableWordTimeOffsets: options.enableWordTimeOffsets !== false,
        model: options.model || 'default',
        enableAutomaticPunctuation: true,
      },
      audio: {
        content: audioBase64
      }
    };

    const response = await fetch(SPEECH_TO_TEXT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Speech API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    
    if (!data.results || data.results.length === 0) {
      return { success: true, result: { transcript: '', confidence: 0, languageCode: options.languageCode || 'en-US', durationMinutes: 0 } };
    }

    const result = data.results[0];
    const alternative = result.alternatives?.[0];
    
    // Estimate duration from word timestamps or audio size
    let durationMinutes = 1; // minimum charge
    if (alternative?.words && alternative.words.length > 0) {
      const lastWord = alternative.words[alternative.words.length - 1];
      const durationSeconds = parseFloat(lastWord.endTime?.replace('s', '') || '60');
      durationMinutes = Math.ceil(durationSeconds / 60);
    }

    // Charge credits
    const chargeResult = await chargeForAPIUsage(userId, 'speech_to_text', durationMinutes, {
      languageCode: options.languageCode,
      wordCount: alternative?.words?.length || 0
    });

    if (!chargeResult.success) {
      return { success: false, error: chargeResult.error };
    }

    return {
      success: true,
      result: {
        transcript: alternative?.transcript || '',
        confidence: alternative?.confidence || 0,
        words: alternative?.words?.map((w: any) => ({
          word: w.word,
          startTime: parseFloat(w.startTime?.replace('s', '') || '0'),
          endTime: parseFloat(w.endTime?.replace('s', '') || '0')
        })),
        languageCode: data.results[0]?.languageCode || options.languageCode || 'en-US',
        durationMinutes
      },
      creditsUsed: chargeResult.creditsDeducted
    };
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function synthesizeSpeech(
  userId: string,
  text: string,
  options: {
    languageCode?: string;
    voiceName?: string;
    ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
    speakingRate?: number;
    pitch?: number;
    audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
  } = {}
): Promise<{ success: boolean; result?: TextToSpeechResult; error?: string; creditsUsed?: number }> {
  try {
    // Calculate credits based on character count
    const charCount = text.length;
    const units = Math.ceil(charCount / 1000);

    // Pre-check credits
    const chargeResult = await chargeForAPIUsage(userId, 'text_to_speech', units, {
      characterCount: charCount,
      languageCode: options.languageCode
    });

    if (!chargeResult.success) {
      return { success: false, error: chargeResult.error };
    }

    const accessToken = await getAccessToken();
    
    const requestBody = {
      input: { text },
      voice: {
        languageCode: options.languageCode || 'en-US',
        name: options.voiceName,
        ssmlGender: options.ssmlGender || 'NEUTRAL'
      },
      audioConfig: {
        audioEncoding: options.audioEncoding || 'MP3',
        speakingRate: options.speakingRate || 1.0,
        pitch: options.pitch || 0
      }
    };

    const response = await fetch(TEXT_TO_SPEECH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Text-to-speech API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { audioContent: string };

    return {
      success: true,
      result: {
        audioContent: data.audioContent,
        audioFormat: options.audioEncoding || 'MP3',
        characterCount: charCount
      },
      creditsUsed: chargeResult.creditsDeducted
    };
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getAvailableVoices(languageCode?: string): Promise<any[]> {
  try {
    const accessToken = await getAccessToken();
    
    let url = 'https://texttospeech.googleapis.com/v1/voices';
    if (languageCode) {
      url += `?languageCode=${languageCode}`;
    }

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to get voices: ${response.status}`);
    }

    const data = await response.json() as { voices: any[] };
    return data.voices || [];
  } catch (error) {
    console.error('Get voices error:', error);
    return [];
  }
}
