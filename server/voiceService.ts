/**
 * Production-Grade Voice Cloning & Synthesis Service
 * Uses Google Cloud TTS with Chirp 3 for instant voice cloning
 * 
 * Features:
 * - Voice cloning from 10 seconds of audio
 * - Multi-genre singing styles
 * - Character voice presets for AI movies
 */

const GOOGLE_TTS_BASE = 'https://texttospeech.googleapis.com/v1';

// Voice style presets for different genres
export const voiceStyles = {
  southernRap: {
    speakingRate: 1.1,
    pitch: -2,
    description: "Raspy southern drawl with rhythmic flow"
  },
  opera: {
    speakingRate: 0.85,
    pitch: 4,
    description: "Powerful operatic projection with vibrato"
  },
  deathMetal: {
    speakingRate: 1.2,
    pitch: -6,
    description: "Guttural growls and aggressive delivery"
  },
  punk: {
    speakingRate: 1.3,
    pitch: -1,
    description: "Raw, aggressive, rebellious energy"
  },
  pop: {
    speakingRate: 1.0,
    pitch: 2,
    description: "Polished, smooth, radio-ready"
  },
  classical: {
    speakingRate: 0.9,
    pitch: 0,
    description: "Refined, theatrical, precise articulation"
  },
  threeStooges: {
    speakingRate: 1.4,
    pitch: 6,
    description: "Comedic timing with nyuk nyuk inflections"
  },
  villain: {
    speakingRate: 0.8,
    pitch: -4,
    description: "Menacing, theatrical, dramatic pauses"
  },
  hero: {
    speakingRate: 1.0,
    pitch: 1,
    description: "Confident, inspiring, commanding presence"
  }
};

// Character voice presets for AI movies
export const characterVoices = {
  hero: { name: "The Protagonist", style: "hero", pitchShift: 0 },
  villain: { name: "The Antagonist", style: "villain", pitchShift: -2 },
  sidekick: { name: "The Ally", style: "pop", pitchShift: 2 },
  narrator: { name: "The Narrator", style: "classical", pitchShift: -1 }
};

// Available Google TTS voices
const googleVoices = {
  male: [
    { name: 'en-US-Chirp3-HD-Achird', lang: 'en-US' },
    { name: 'en-US-Chirp3-HD-Autonoe', lang: 'en-US' },
    { name: 'en-US-Chirp3-HD-Charon', lang: 'en-US' },
    { name: 'en-US-Neural2-D', lang: 'en-US' },
    { name: 'en-US-Neural2-J', lang: 'en-US' }
  ],
  female: [
    { name: 'en-US-Chirp3-HD-Aoede', lang: 'en-US' },
    { name: 'en-US-Chirp3-HD-Kore', lang: 'en-US' },
    { name: 'en-US-Chirp3-HD-Leda', lang: 'en-US' },
    { name: 'en-US-Neural2-C', lang: 'en-US' },
    { name: 'en-US-Neural2-F', lang: 'en-US' }
  ]
};

interface SynthesizeRequest {
  text: string;
  voiceName?: string;
  languageCode?: string;
  style?: keyof typeof voiceStyles;
  ssml?: boolean;
}

interface CloneVoiceRequest {
  audioBase64: string;
  name: string;
}

/**
 * Synthesize speech using Google Cloud TTS
 */
export async function synthesizeSpeech(request: SynthesizeRequest): Promise<{
  success: boolean;
  audioBase64?: string;
  error?: string;
}> {
  const apiKey = process.env.CLOUD_TEXT_TO_SPEECH_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "Google TTS API key not configured" };
  }

  const styleSettings = request.style ? voiceStyles[request.style] : voiceStyles.pop;
  const voice = request.voiceName || googleVoices.male[0].name;
  const langCode = request.languageCode || 'en-US';

  try {
    const payload = {
      input: request.ssml 
        ? { ssml: request.text }
        : { text: request.text },
      voice: {
        languageCode: langCode,
        name: voice
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: styleSettings.speakingRate,
        pitch: styleSettings.pitch,
        effectsProfileId: ['headphone-class-device']
      }
    };

    const response = await fetch(`${GOOGLE_TTS_BASE}/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `TTS failed: ${error}` };
    }

    const result = await response.json() as { audioContent: string };
    return { success: true, audioBase64: result.audioContent };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Create instant voice clone using Chirp 3
 * Requires 10+ seconds of clear audio
 */
export async function createVoiceClone(request: CloneVoiceRequest): Promise<{
  success: boolean;
  voiceCloneKey?: string;
  error?: string;
}> {
  const apiKey = process.env.CLOUD_TEXT_TO_SPEECH_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "Google TTS API key not configured" };
  }

  try {
    // Chirp 3 instant voice cloning endpoint
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1beta1/voices:clone?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceAudio: {
            audioContent: request.audioBase64
          },
          voiceName: request.name
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Voice cloning failed: ${error}` };
    }

    const result = await response.json() as { voiceCloningKey: string };
    return { success: true, voiceCloneKey: result.voiceCloningKey };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Synthesize with cloned voice
 */
export async function synthesizeWithClone(
  text: string,
  voiceCloneKey: string,
  style?: keyof typeof voiceStyles
): Promise<{
  success: boolean;
  audioBase64?: string;
  error?: string;
}> {
  const apiKey = process.env.CLOUD_TEXT_TO_SPEECH_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "Google TTS API key not configured" };
  }

  const styleSettings = style ? voiceStyles[style] : voiceStyles.pop;

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            voiceClone: {
              voiceCloningKey: voiceCloneKey
            }
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: styleSettings.speakingRate,
            pitch: styleSettings.pitch
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Synthesis failed: ${error}` };
    }

    const result = await response.json() as { audioContent: string };
    return { success: true, audioBase64: result.audioContent };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * List available voices
 */
export async function listVoices(): Promise<{
  success: boolean;
  voices?: Array<{ name: string; gender: string; languageCodes: string[] }>;
  error?: string;
}> {
  const apiKey = process.env.CLOUD_TEXT_TO_SPEECH_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "Google TTS API key not configured" };
  }

  try {
    const response = await fetch(
      `${GOOGLE_TTS_BASE}/voices?key=${apiKey}&languageCode=en-US`
    );

    if (!response.ok) {
      return { success: false, error: "Failed to fetch voices" };
    }

    const result = await response.json() as { voices: any[] };
    return { 
      success: true, 
      voices: result.voices?.map(v => ({
        name: v.name,
        gender: v.ssmlGender,
        languageCodes: v.languageCodes
      })) || []
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if voice service is configured
 */
export function isVoiceServiceConfigured(): boolean {
  return !!process.env.CLOUD_TEXT_TO_SPEECH_API_KEY || !!process.env.ELEVENLABS_API_KEY;
}

// ============== ELEVENLABS INTEGRATION ==============

/**
 * Synthesize speech using ElevenLabs (premium quality)
 */
export async function synthesizeWithElevenLabs(
  text: string,
  voiceId: string = "21m00Tcm4TlvDq8ikWAM", // Rachel - default voice
  modelId: string = "eleven_multilingual_v2",
  stability: number = 0.5,
  similarityBoost: number = 0.75,
  style: number = 0.5
): Promise<{
  success: boolean;
  audioBase64?: string;
  error?: string;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "ElevenLabs API key not configured" };
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: stability,
            similarity_boost: similarityBoost,
            style: style,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `ElevenLabs TTS failed: ${error}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    
    return { success: true, audioBase64: base64Audio };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get available ElevenLabs voices
 */
export async function getElevenLabsVoices(): Promise<{
  success: boolean;
  voices?: Array<{ voice_id: string; name: string; category: string }>;
  error?: string;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "ElevenLabs API key not configured" };
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey }
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch voices" };
    }

    const data = await response.json() as { voices: Array<{ voice_id: string; name: string; category: string }> };
    return { success: true, voices: data.voices };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Clone voice with ElevenLabs (Instant Voice Cloning)
 */
export async function cloneVoiceWithElevenLabs(
  name: string,
  audioFiles: Buffer[],
  description?: string
): Promise<{
  success: boolean;
  voiceId?: string;
  error?: string;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: "ElevenLabs API key not configured" };
  }

  try {
    const formData = new FormData();
    formData.append('name', name);
    if (description) formData.append('description', description);
    
    // Add audio files
    audioFiles.forEach((buffer, index) => {
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      formData.append('files', blob, `sample_${index}.mp3`);
    });

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Voice cloning failed: ${error}` };
    }

    const data = await response.json() as { voice_id: string };
    return { success: true, voiceId: data.voice_id };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Speech-to-Speech voice transformation with ElevenLabs
 * Transform your voice to sound like any target voice
 */
export async function speechToSpeechWithElevenLabs(
  audioBuffer: Buffer,
  voiceId: string,
  modelId: string = "eleven_english_sts_v2",
  stability: number = 0.5,
  similarityBoost: number = 0.75
): Promise<{
  success: boolean;
  audioBase64?: string;
  error?: string;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return { success: false, error: "ElevenLabs API key not configured" };
  }

  try {
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('audio', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm',
    });
    formData.append('model_id', modelId);
    formData.append('voice_settings', JSON.stringify({
      stability,
      similarity_boost: similarityBoost,
    }));

    const response = await fetch(
      `https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          ...formData.getHeaders(),
        },
        body: formData as any,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Speech-to-speech failed: ${error}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    
    return {
      success: true,
      audioBase64: base64Audio,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Speech-to-speech transformation failed" };
  }
}

/**
 * Get voice categories for DJ Studio
 */
export function getDJVoiceCategories() {
  return [
    { id: 'rap', name: 'Rap / Hip Hop', description: 'Urban flow and rhythmic delivery' },
    { id: 'rnb', name: 'R&B / Soul', description: 'Smooth, soulful vocals' },
    { id: 'pop', name: 'Pop', description: 'Polished commercial sound' },
    { id: 'rock', name: 'Rock', description: 'Powerful, gritty vocals' },
    { id: 'electronic', name: 'Electronic / EDM', description: 'Processed, modern sound' },
    { id: 'jazz', name: 'Jazz / Blues', description: 'Smooth, expressive delivery' },
  ];
}

/**
 * Check if ElevenLabs is configured
 */
export function isElevenLabsConfigured(): boolean {
  return !!process.env.ELEVENLABS_API_KEY;
}

/**
 * Get available voice styles
 */
export function getVoiceStyles() {
  return Object.entries(voiceStyles).map(([key, value]) => ({
    id: key,
    name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
    description: value.description,
    speakingRate: value.speakingRate,
    pitch: value.pitch
  }));
}

/**
 * Get character presets
 */
export function getCharacterPresets() {
  return Object.entries(characterVoices).map(([key, value]) => ({
    id: key,
    name: value.name,
    style: value.style,
    pitchShift: value.pitchShift
  }));
}

/**
 * Get available Google voices
 */
export function getGoogleVoices() {
  return googleVoices;
}
