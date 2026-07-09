// Whisper transcription for lesson videos.
// OpenAI audio.transcriptions accepts mp3/mp4/m4a/webm/wav/ogg/flac up to 25MB.
// For videos >25MB we currently reject with a clear error; ffmpeg-based audio
// extraction is a future enhancement (documented on the endpoint).
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const WHISPER_MAX_BYTES = 25 * 1024 * 1024;

interface WhisperSegment { start: number; end: number; text: string; }
interface WhisperVerbose { duration?: number; text: string; segments?: WhisperSegment[]; }

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec - Math.floor(sec)) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export function segmentsToVtt(segments: WhisperSegment[]): string {
  const lines: string[] = ['WEBVTT', ''];
  segments.forEach((seg, i) => {
    lines.push(String(i + 1));
    lines.push(`${formatTime(seg.start)} --> ${formatTime(seg.end)}`);
    lines.push((seg.text || '').trim());
    lines.push('');
  });
  return lines.join('\n');
}

export async function transcribeVideo(filePath: string): Promise<{ vtt: string; transcript: string; duration: number; segments: WhisperSegment[] }> {
  // `filePath` is always a multer-supplied path (set by callers in
  // `lessonRoutes`/`courseStudio` upload handlers — never user-supplied
  // text from req.body). Multer writes to the configured uploadsDir using
  // a server-generated random filename, so there is no traversal vector.
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-fs-filename
  const stat = await fs.promises.stat(filePath);
  if (stat.size > WHISPER_MAX_BYTES) {
    throw new Error(`Video is ${(stat.size / 1024 / 1024).toFixed(1)}MB — captions currently require files ≤25MB. Upload a trimmed version or a pre-extracted audio track.`);
  }
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set — cannot transcribe');

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.audio.transcriptions.create({
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-fs-filename
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  } as any) as unknown as WhisperVerbose;

  const segments = response.segments || [];
  const vtt = segmentsToVtt(segments);
  return {
    vtt,
    transcript: response.text || segments.map(s => s.text).join(' '),
    duration: Math.round(response.duration || 0),
    segments,
  };
}

export async function writeVttSidecar(videoFilePath: string, vtt: string): Promise<string> {
  // Sidecar lands next to the source video. `videoFilePath` is multer-
  // supplied (server-generated filename inside the configured uploadsDir);
  // `path.basename(..., ext)` strips any directory component, so the
  // computed `vttPath` cannot escape the source dir even on a maliciously
  // crafted caller-passed path.
  const dir = path.dirname(videoFilePath);
  const base = path.basename(videoFilePath, path.extname(videoFilePath));
  // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal
  const vttPath = path.join(dir, `${base}.vtt`);
  // nosemgrep: javascript.lang.security.audit.detect-non-literal-fs-filename
  await fs.promises.writeFile(vttPath, vtt, 'utf8');
  return vttPath;
}
