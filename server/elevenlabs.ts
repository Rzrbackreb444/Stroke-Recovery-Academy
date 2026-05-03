import fetch from "node-fetch";
import FormData from "form-data";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// Nick's Sasquatch Coach voice ID - set this after cloning Nick's voice in ElevenLabs
// Default: 'pNInz6obpgDQGcFmaJgB' (Adam - deep motivational male voice)
export const SASQUATCH_VOICE_ID = process.env.SASQUATCH_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

interface VoicesResponse {
  voices: Voice[];
}

// Get API key from Replit connector or environment variable
async function getApiKey(): Promise<string> {
  // Try Replit connector first
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (hostname && xReplitToken) {
    try {
      const response = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=elevenlabs',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      );
      const data = await response.json() as any;
      const connectionSettings = data.items?.[0];
      if (connectionSettings?.settings?.api_key) {
        return connectionSettings.settings.api_key;
      }
    } catch (e) {
      console.log('Replit connector not available, falling back to env var');
    }
  }

  // Fallback to environment variable
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ElevenLabs not connected - please set up the integration");
  }
  return apiKey;
}

export class ElevenLabsService {
  private apiKey: string | null = null;

  private async getApiKey(): Promise<string> {
    if (!this.apiKey) {
      this.apiKey = await getApiKey();
    }
    return this.apiKey;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const apiKey = await this.getApiKey();
    return {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    };
  }

  async getVoices(): Promise<Voice[]> {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const data = (await response.json()) as VoicesResponse;
    return data.voices;
  }

  async getVoicesByCategory(category: string): Promise<Voice[]> {
    const voices = await this.getVoices();
    return voices.filter((v) => v.category === category || v.labels?.["use case"] === category);
  }

  async textToSpeech(
    text: string,
    voiceId: string,
    settings?: Partial<VoiceSettings>
  ): Promise<Buffer> {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: settings?.stability ?? 0.5,
            similarity_boost: settings?.similarity_boost ?? 0.75,
            style: settings?.style ?? 0,
            use_speaker_boost: settings?.use_speaker_boost ?? true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Text-to-speech failed: ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async speechToSpeech(
    audioBuffer: Buffer,
    voiceId: string,
    settings?: Partial<VoiceSettings>
  ): Promise<Buffer> {
    const formData = new FormData();
    formData.append("audio", audioBuffer, {
      filename: "audio.webm",
      contentType: "audio/webm",
    });
    formData.append("model_id", "eleven_english_sts_v2");
    formData.append(
      "voice_settings",
      JSON.stringify({
        stability: settings?.stability ?? 0.5,
        similarity_boost: settings?.similarity_boost ?? 0.75,
      })
    );

    const apiKey = await this.getApiKey();
    const response = await fetch(
      `${ELEVENLABS_API_URL}/speech-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          ...formData.getHeaders(),
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Speech-to-speech failed: ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async cloneVoice(
    name: string,
    description: string,
    audioFiles: Buffer[]
  ): Promise<string> {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);

    audioFiles.forEach((file, index) => {
      formData.append("files", file, {
        filename: `sample_${index}.mp3`,
        contentType: "audio/mpeg",
      });
    });

    const apiKey = await this.getApiKey();
    const response = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voice cloning failed: ${error}`);
    }

    const data = (await response.json()) as { voice_id: string };
    return data.voice_id;
  }

  async deleteVoice(voiceId: string): Promise<void> {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices/${voiceId}`, {
      method: "DELETE",
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete voice: ${response.statusText}`);
    }
  }

  /**
   * ElevenLabs Music — text-to-music with vocals.
   * Endpoint: POST /v1/music
   * Returns audio/mpeg binary directly. Length is capped server-side at 5 min.
   * Cost: per-character charged against the same ElevenLabs subscription.
   */
  async composeMusic(
    prompt: string,
    musicLengthMs: number = 60000,
  ): Promise<Buffer> {
    const apiKey = await this.getApiKey();
    const response = await fetch(`${ELEVENLABS_API_URL}/music`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        prompt,
        music_length_ms: Math.max(10000, Math.min(300000, musicLengthMs)),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Music compose failed: ${response.status} ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async getModels(): Promise<any[]> {
    const response = await fetch(`${ELEVENLABS_API_URL}/models`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    return (await response.json()) as any[];
  }

  async getUserInfo(): Promise<any> {
    const response = await fetch(`${ELEVENLABS_API_URL}/user`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return await response.json();
  }

  async getSubscriptionInfo(): Promise<any> {
    const response = await fetch(`${ELEVENLABS_API_URL}/user/subscription`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subscription: ${response.statusText}`);
    }

    return await response.json();
  }
}

let elevenlabsService: ElevenLabsService | null = null;

export function getElevenLabsService(): ElevenLabsService {
  if (!elevenlabsService) {
    elevenlabsService = new ElevenLabsService();
  }
  return elevenlabsService;
}

export async function isElevenLabsConfigured(): Promise<boolean> {
  try {
    await getApiKey();
    return true;
  } catch {
    return false;
  }
}

// Sasquatch Coach - text to speech with Nick's voice
export async function sasquatchSpeak(text: string): Promise<Buffer> {
  const service = getElevenLabsService();
  return service.textToSpeech(text, SASQUATCH_VOICE_ID, {
    stability: 0.6,
    similarity_boost: 0.85,
    style: 0.4,
    use_speaker_boost: true,
  });
}
