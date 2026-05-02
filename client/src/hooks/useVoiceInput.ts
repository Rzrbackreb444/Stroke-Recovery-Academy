import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API is browser-native, free, and good enough for short
// dictation. We use it for survivor intake + journaling so we don't
// burn ElevenLabs/Whisper quota on inbound speech.

type SpeechRecognition = any;

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function isVoiceInputSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function useVoiceInput(opts?: {
  onResult?: (text: string, isFinal: boolean) => void;
  language?: string;
  continuous?: boolean;
}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<SpeechRecognition | null>(null);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {}
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!isVoiceInputSupported()) {
      setError("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    setError(null);
    setTranscript("");

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec: SpeechRecognition = new Ctor();
    rec.lang = opts?.language ?? "en-US";
    rec.continuous = opts?.continuous ?? false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onerror = (e: any) => {
      setError(e?.error || "Voice input error");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    rec.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      const text = (finalText || interimText).trim();
      setTranscript(text);
      if (opts?.onResult) opts.onResult(text, !!finalText);
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch (e: any) {
      setError(e?.message || "Couldn't start microphone");
      setListening(false);
    }
  }, [opts]);

  useEffect(() => () => stop(), [stop]);

  return {
    listening,
    error,
    transcript,
    start,
    stop,
    supported: isVoiceInputSupported(),
  };
}
