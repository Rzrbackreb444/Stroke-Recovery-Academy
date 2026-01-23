/**
 * Google Cloud Translation Service
 * Multi-language translation with credit billing
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

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }
  
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
  
  const credentials: ServiceAccountCredentials = JSON.parse(serviceAccountKey);
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
  const jwt = `${signatureInput}.${sign.sign(credentials.private_key, 'base64url')}`;
  
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

const TRANSLATE_ENDPOINT = "https://translation.googleapis.com/v3";

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
  characterCount: number;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName?: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
];

export async function translateText(
  userId: string,
  text: string | string[],
  targetLanguage: string,
  sourceLanguage?: string
): Promise<{ success: boolean; results?: TranslationResult[]; error?: string; creditsUsed?: number }> {
  try {
    const texts = Array.isArray(text) ? text : [text];
    const totalChars = texts.reduce((sum, t) => sum + t.length, 0);
    const units = Math.ceil(totalChars / 1000);

    // Charge credits
    const chargeResult = await chargeForAPIUsage(userId, 'translation', units, {
      characterCount: totalChars,
      targetLanguage,
      sourceLanguage,
      textCount: texts.length
    });

    if (!chargeResult.success) {
      return { success: false, error: chargeResult.error };
    }

    const accessToken = await getAccessToken();
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const credentials = JSON.parse(serviceAccountKey!);
    const projectId = credentials.project_id;

    const requestBody: any = {
      contents: texts,
      targetLanguageCode: targetLanguage,
      mimeType: 'text/plain'
    };

    if (sourceLanguage) {
      requestBody.sourceLanguageCode = sourceLanguage;
    }

    const response = await fetch(`${TRANSLATE_ENDPOINT}/projects/${projectId}:translateText`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Translation API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { translations: Array<{ translatedText: string; detectedLanguageCode?: string }> };

    const results: TranslationResult[] = data.translations.map((t, i) => ({
      translatedText: t.translatedText,
      detectedSourceLanguage: t.detectedLanguageCode,
      characterCount: texts[i].length
    }));

    return {
      success: true,
      results,
      creditsUsed: chargeResult.creditsDeducted
    };
  } catch (error) {
    console.error('Translation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function detectLanguage(
  userId: string,
  text: string
): Promise<{ success: boolean; languageCode?: string; confidence?: number; error?: string }> {
  try {
    const accessToken = await getAccessToken();
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const credentials = JSON.parse(serviceAccountKey!);
    const projectId = credentials.project_id;

    const response = await fetch(`${TRANSLATE_ENDPOINT}/projects/${projectId}:detectLanguage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: text, mimeType: 'text/plain' })
    });

    if (!response.ok) {
      throw new Error(`Detection error: ${response.status}`);
    }

    const data = await response.json() as { languages: Array<{ languageCode: string; confidence: number }> };
    const detected = data.languages?.[0];

    return {
      success: true,
      languageCode: detected?.languageCode,
      confidence: detected?.confidence
    };
  } catch (error) {
    console.error('Language detection error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function getSupportedLanguages(): SupportedLanguage[] {
  return SUPPORTED_LANGUAGES;
}
