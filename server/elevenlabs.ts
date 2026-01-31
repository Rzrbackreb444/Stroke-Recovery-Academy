import fetch from "node-fetch";
import FormData from "form-data";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

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

export class ElevenLabsService {
  private apiKey: string;

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    return {
      "xi-api-key": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  async getVoices(): Promise<Voice[]> {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: this.getHeaders(),
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
        headers: this.getHeaders(),
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

    const response = await fetch(
      `${ELEVENLABS_API_URL}/speech-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
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

    const response = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
      method: "POST",
      headers: {
        "xi-api-key": this.apiKey,
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
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete voice: ${response.statusText}`);
    }
  }

  async getModels(): Promise<any[]> {
    const response = await fetch(`${ELEVENLABS_API_URL}/models`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    return (await response.json()) as any[];
  }

  async getUserInfo(): Promise<any> {
    const response = await fetch(`${ELEVENLABS_API_URL}/user`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return await response.json();
  }

  async getSubscriptionInfo(): Promise<any> {
    const response = await fetch(`${ELEVENLABS_API_URL}/user/subscription`, {
      headers: this.getHeaders(),
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

export function isElevenLabsConfigured(): boolean {
  return !!process.env.ELEVENLABS_API_KEY;
}
