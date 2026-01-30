/**
 * Lyria Music Generation Service
 * Production-grade AI music generation using Google's Lyria model
 * 
 * Uses Google Cloud Service Account for OAuth 2.0 authentication
 * Generates 30-second high-fidelity instrumental tracks at 48kHz stereo
 * Cost: ~$0.06 per 30-second generation
 */

// Vertex AI configuration constants
const VERTEX_AI_LOCATION = "us-central1";
const LYRIA_MODEL = "lyria-002";

interface LyriaResponse {
  predictions: Array<{
    audioContent: string;
    mimeType?: string;
  }>;
}

interface LyriaRequest {
  prompt: string;
  negativePrompt?: string;
  seed?: number;
  sampleCount?: number;
}

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Cache for access token
let cachedToken: { token: string; expiresAt: number } | null = null;

// Genre-specific prompt templates for production quality (25+ professional genres)
const genrePrompts: Record<string, { style: string; instruments: string; negative: string }> = {
  // Hip-Hop & Rap
  rap: {
    style: "hard-hitting hip-hop beat with punchy 808 bass, crisp snares, and trap hi-hats, professional mix",
    instruments: "808 bass, punchy kick drums, crisp snares, trap hi-hats, dark synth pads, vocal chops",
    negative: "acoustic instruments, soft, gentle, classical, lo-fi"
  },
  trap: {
    style: "aggressive modern trap with rolling hi-hats, heavy 808s, dark melodies, and crisp production",
    instruments: "heavy 808 sub bass, fast hi-hat rolls, snappy snares, dark synth leads, brass stabs",
    negative: "acoustic, organic, soft, gentle, classical"
  },
  lofi: {
    style: "chill lo-fi hip hop with dusty vinyl texture, mellow chords, and laid-back drums",
    instruments: "muted piano, vinyl crackle, boom bap drums, warm bass, jazz guitar samples",
    negative: "heavy bass, aggressive, loud, distorted, fast"
  },
  boom_bap: {
    style: "classic 90s hip-hop with hard-hitting drums, soul samples, and boom bap groove",
    instruments: "punchy kick, snappy snare, chopped soul samples, upright bass, vinyl texture",
    negative: "trap, electronic, modern synths, 808s"
  },
  
  // Rock & Metal
  rock: {
    style: "powerful rock with driving guitars, thundering drums, and anthemic energy",
    instruments: "electric guitars with overdrive, powerful drums, bass guitar, rock organ",
    negative: "electronic, EDM, hip-hop, soft, ambient"
  },
  metal: {
    style: "heavy metal with crushing guitars, double bass drums, and intense aggression",
    instruments: "heavily distorted guitars, double bass drums, growling bass, powerful toms",
    negative: "soft, gentle, acoustic, peaceful, ambient, pop"
  },
  punk: {
    style: "raw punk rock with fast tempo, aggressive guitars, and rebellious energy",
    instruments: "distorted power chords, fast drums, punk bass, driving rhythm",
    negative: "polished, overproduced, soft, electronic, slow"
  },
  hardcore: {
    style: "intense hardcore punk with breakdowns, aggressive riffs, and relentless energy",
    instruments: "down-tuned guitars, blast beats, heavy breakdowns, pounding bass",
    negative: "soft, melodic, slow, ambient, electronic"
  },
  alternative: {
    style: "modern alternative rock with dynamic shifts, emotional depth, and atmospheric guitars",
    instruments: "clean and distorted guitars, dynamic drums, melodic bass, ambient textures",
    negative: "pop, electronic, classical, country"
  },
  
  // Electronic & Dance
  edm: {
    style: "high-energy electronic dance music with massive drops, soaring synths, and festival energy",
    instruments: "supersaw synths, powerful kicks, sidechain compression, build-ups, white noise risers",
    negative: "acoustic, organic, unplugged, classical, slow"
  },
  house: {
    style: "groovy house music with four-on-the-floor beats, funky basslines, and uplifting energy",
    instruments: "punchy house kick, offbeat hi-hats, funky bass, piano stabs, vocal chops",
    negative: "heavy metal, aggressive, slow, ambient"
  },
  techno: {
    style: "driving techno with hypnotic rhythms, industrial textures, and dark atmosphere",
    instruments: "powerful kick drums, industrial synths, acid basslines, mechanical percussion",
    negative: "acoustic, organic, soft, melodic, pop"
  },
  dubstep: {
    style: "heavy dubstep with aggressive wobble bass, metallic growls, and intense drops",
    instruments: "wobble bass, growling synths, heavy sub, snappy snares, rhythmic glitches",
    negative: "acoustic, soft, peaceful, classical, gentle"
  },
  drum_and_bass: {
    style: "fast-paced drum and bass with rolling breaks, deep bass, and energetic atmosphere",
    instruments: "fast breakbeats, rolling drums, deep sub bass, reese bass, atmospheric pads",
    negative: "slow, acoustic, classical, soft, gentle"
  },
  synthwave: {
    style: "retro synthwave with nostalgic 80s synths, driving arpeggios, and neon atmosphere",
    instruments: "analog synths, arpeggiated leads, gated drums, lush pads, retro bass",
    negative: "acoustic, organic, modern, lo-fi, natural"
  },
  
  // Pop & R&B
  pop: {
    style: "polished modern pop with catchy hooks, driving rhythm, and radio-ready production",
    instruments: "synth bass, electronic drums, layered synths, bright leads, rhythmic pads",
    negative: "distortion, heavy metal, aggressive, dark, lo-fi"
  },
  rnb: {
    style: "smooth contemporary R&B with lush chords, groovy drums, and soulful atmosphere",
    instruments: "rhodes piano, smooth bass, tight drums, lush pads, subtle guitar",
    negative: "aggressive, distorted, heavy, punk, metal"
  },
  soul: {
    style: "classic soul with warm horns, groovy bass, and heartfelt emotion",
    instruments: "brass section, organ, warm bass, live drums, rhythm guitar",
    negative: "electronic, synthesizers, aggressive, heavy"
  },
  funk: {
    style: "groovy funk with slap bass, tight drums, and infectious rhythm",
    instruments: "slap bass, funky guitar, tight drums, brass stabs, clavinet",
    negative: "ambient, slow, heavy metal, classical"
  },
  
  // Country & Folk
  country: {
    style: "authentic country with twangy guitars, driving rhythm, and heartland feel",
    instruments: "telecaster guitar, acoustic guitar, bass, drums, pedal steel, fiddle",
    negative: "electronic, synth, EDM, dubstep, heavy"
  },
  bluegrass: {
    style: "energetic bluegrass with fast picking, driving rhythm, and mountain spirit",
    instruments: "banjo, mandolin, fiddle, acoustic guitar, upright bass",
    negative: "electronic, drums, synthesizers, distortion"
  },
  folk: {
    style: "warm acoustic folk with fingerpicked guitar, natural tones, and storytelling feel",
    instruments: "acoustic guitar, harmonica, upright bass, gentle percussion, violin",
    negative: "electronic, heavy, aggressive, synthesizers"
  },
  
  // Jazz & Blues
  jazz: {
    style: "sophisticated jazz with complex harmonies, improvisational feel, and swing rhythm",
    instruments: "jazz drums, upright bass, piano, saxophone, trumpet",
    negative: "electronic, heavy, aggressive, distortion, pop"
  },
  blues: {
    style: "soulful blues with expressive guitar, shuffling rhythm, and deep emotion",
    instruments: "blues guitar, harmonica, organ, drums, bass",
    negative: "electronic, pop, fast, aggressive, synthesizers"
  },
  
  // World & Specialty
  reggae: {
    style: "laid-back reggae with offbeat rhythm, deep bass, and island vibes",
    instruments: "offbeat guitar skanks, deep bass, one drop drums, organ bubbles",
    negative: "aggressive, fast, heavy, electronic, distortion"
  },
  latin: {
    style: "vibrant Latin music with infectious rhythms, brass, and dance energy",
    instruments: "congas, timbales, brass section, piano, bass, guiro",
    negative: "ambient, slow, heavy, electronic"
  },
  
  // Atmospheric & Healing
  ambient: {
    style: "peaceful therapeutic ambient soundscape for healing and meditation",
    instruments: "soft pads, gentle piano, atmospheric textures, nature sounds, warm drones",
    negative: "drums, aggressive, fast, heavy, distortion, beats"
  },
  cinematic: {
    style: "epic cinematic score with orchestral power, emotional depth, and dramatic tension",
    instruments: "full orchestra, strings, brass, timpani, choir, piano",
    negative: "electronic, pop, hip-hop, lo-fi"
  },
  orchestral: {
    style: "classical orchestral arrangement with rich strings, expressive brass, and dynamic range",
    instruments: "strings ensemble, woodwinds, brass section, percussion, harp",
    negative: "electronic, drums, guitars, synthesizers, hip-hop"
  },
  
  // Recovery & Motivation (special for Stroke Recovery Academy)
  recovery: {
    style: "uplifting therapeutic music for stroke recovery with gentle progression and hopeful energy",
    instruments: "warm piano, soft strings, gentle percussion, healing pads, nature sounds",
    negative: "aggressive, fast, heavy, distortion, harsh, loud"
  },
  motivation: {
    style: "powerful motivational anthem with triumphant energy, driving rhythm, and inspiring progression",
    instruments: "epic drums, soaring synths, powerful bass, brass stabs, piano chords",
    negative: "sad, slow, ambient, quiet, gentle"
  },
  warrior: {
    style: "intense warrior anthem for overcoming challenges with relentless drive and unstoppable energy",
    instruments: "pounding drums, aggressive synths, epic brass, powerful bass, battle percussion",
    negative: "soft, quiet, ambient, peaceful, slow"
  }
};

/**
 * Create a signed JWT for Google OAuth 2.0
 */
async function createSignedJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const crypto = await import('crypto');
  
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
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

/**
 * Get OAuth 2.0 access token from service account
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }
  
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set");
  }
  
  let credentials: ServiceAccountCredentials;
  try {
    credentials = JSON.parse(serviceAccountKey);
  } catch (e) {
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_KEY format - must be valid JSON");
  }
  
  // Create signed JWT
  const jwt = await createSignedJWT(credentials);
  
  // Exchange JWT for access token
  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('OAuth token error:', errorText);
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }
  
  const tokenData = await response.json() as { access_token: string; expires_in: number };
  
  // Cache the token
  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in * 1000)
  };
  
  return tokenData.access_token;
}

/**
 * Build a production-quality prompt for Lyria
 */
export function buildMusicPrompt(
  genre: string,
  bpm: number,
  key: string,
  scale: string,
  customDescription?: string
): { prompt: string; negativePrompt: string } {
  const genreConfig = genrePrompts[genre] || genrePrompts.rock;
  
  let prompt = `Professional ${genre} music production. ${genreConfig.style}. `;
  prompt += `Instrumentation: ${genreConfig.instruments}. `;
  prompt += `Musical key: ${key} ${scale}. Tempo: ${bpm} BPM. `;
  prompt += `High-fidelity studio recording quality, professionally mixed and mastered. `;
  
  if (customDescription) {
    prompt += customDescription;
  }
  
  // Add recovery/motivation theme for Stroke Recovery Academy
  if (genre === 'ambient') {
    prompt += `Healing and restorative atmosphere, perfect for stroke recovery meditation and relaxation.`;
  } else {
    prompt += `Powerful and triumphant energy, suitable for motivation and overcoming challenges.`;
  }
  
  return {
    prompt,
    negativePrompt: genreConfig.negative
  };
}

/**
 * Generate music using Vertex AI Lyria
 * Uses service account OAuth 2.0 authentication
 */
export async function generateMusic(request: LyriaRequest): Promise<{
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  error?: string;
}> {
  // Get project ID from service account or env
  let projectId = process.env.GOOGLE_CLOUD_PROJECT;
  
  if (!projectId) {
    // Try to get from service account key
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      try {
        const credentials = JSON.parse(serviceAccountKey);
        projectId = credentials.project_id;
      } catch (e) {
        // Ignore
      }
    }
  }
  
  if (!projectId) {
    return {
      success: false,
      error: "GOOGLE_CLOUD_PROJECT environment variable not set and not found in service account"
    };
  }
  
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get access token'
    };
  }
  
  const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${LYRIA_MODEL}:predict`;
  
  const payload = {
    instances: [{
      prompt: request.prompt,
      ...(request.negativePrompt && { negative_prompt: request.negativePrompt }),
      ...(request.seed && { seed: request.seed })
    }],
    parameters: {
      ...(request.sampleCount && { sample_count: request.sampleCount })
    }
  };
  
  try {
    console.log('Calling Lyria API with OAuth token...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lyria API error:', errorText);
      return {
        success: false,
        error: `Lyria API error: ${response.status} - ${errorText}`
      };
    }
    
    const result = await response.json() as LyriaResponse;
    
    if (result.predictions && result.predictions.length > 0) {
      return {
        success: true,
        audioBase64: result.predictions[0].audioContent,
        mimeType: result.predictions[0].mimeType || 'audio/wav'
      };
    }
    
    return {
      success: false,
      error: "No audio generated in response"
    };
  } catch (error) {
    console.error('Error calling Lyria API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate a complete instrumental track for a specific genre
 */
export async function generateInstrumental(
  genre: string,
  bpm: number,
  key: string,
  scale: string,
  customDescription?: string,
  seed?: number
): Promise<{
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  prompt?: string;
  error?: string;
}> {
  const { prompt, negativePrompt } = buildMusicPrompt(genre, bpm, key, scale, customDescription);
  
  console.log('Generating instrumental with prompt:', prompt);
  
  const result = await generateMusic({
    prompt,
    negativePrompt,
    seed
  });
  
  return {
    ...result,
    prompt
  };
}

/**
 * Check if Lyria service is properly configured
 */
export function isLyriaConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
}

/**
 * Get estimated cost for music generation
 * Lyria costs approximately $0.06 per 30-second clip
 */
export function estimateCost(clips: number): number {
  return clips * 0.06;
}
