// Avatar system — Generate (Imagen), Upload (+ optional remove.bg), Gallery.
import type { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { users, userPersonas } from '@shared/schema';
import { getArchetype } from '@shared/personaArchetypes';
import { eq } from 'drizzle-orm';
import { generateImageWithImagen, isImagenConfigured } from '../imagenService';
import { getUserId } from "../lib/authUtils";

// Curated gallery — seeded DiceBear avatars (free, no key). Keys become the
// displayed option labels and seeds.
const GALLERY_SEEDS = [
  { key: 'sasquatch', label: 'Sasquatch' },
  { key: 'phoenix', label: 'Phoenix' },
  { key: 'wolf', label: 'Wolf' },
  { key: 'bear', label: 'Bear' },
  { key: 'anvil', label: 'Anvil' },
  { key: 'lighthouse', label: 'Lighthouse' },
  { key: 'mountain', label: 'Mountain' },
  { key: 'oak', label: 'Oak' },
];
function galleryUrl(seed: string) {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0D0D0D&primaryColor=C9941A`;
}

function buildAvatarPrompt(archetypeKey: string | null, accentColor: string | null, extra?: string) {
  const archetype = archetypeKey ? getArchetype(archetypeKey) : undefined;
  const base = archetype
    ? `A stylized symbolic portrait avatar representing the "${archetype.name}" archetype — ${archetype.tagline}. Traits: ${archetype.traits.join(', ')}.`
    : `A stylized symbolic portrait avatar for a stroke-recovery survivor.`;
  const color = accentColor || archetype?.accentColor || '#C9941A';
  return [
    base,
    `Bold, heroic, silhouette-forward composition on a near-black background.`,
    `Single accent color: ${color} (antique gold-like). High contrast, dramatic rim lighting.`,
    `Graphic-novel illustration style, clean vector feel, no text, no logos, centered, square.`,
    extra || '',
  ].filter(Boolean).join(' ');
}

export function registerAvatarRoutes(app: Express, isAuthenticated: any, uploadsDir: string) {
  const storage = multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, uploadsDir),
    filename: (_r, file, cb) => cb(null, 'avatar-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
  });
  const upload = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_r, file, cb) => {
      const ok = /jpeg|jpg|png|webp|gif/i.test(path.extname(file.originalname)) || file.mimetype.startsWith('image/');
      cb(ok ? null : new Error('Only image files allowed') as any, ok);
    },
  });

  async function saveUserAvatar(userId: string, url: string, style: 'generated' | 'uploaded' | 'gallery', prompt?: string | null) {
    await db.update(users).set({
      avatarUrl: url,
      avatarStyle: style,
      avatarGeneratedPrompt: prompt ?? null,
      updatedAt: new Date(),
    } as any).where(eq(users.id, userId));
  }

  // GET /api/avatar/gallery
  app.get('/api/avatar/gallery', (_req, res) => {
    res.json({ items: GALLERY_SEEDS.map(s => ({ ...s, url: galleryUrl(s.key) })) });
  });

  // POST /api/avatar/generate  { extraPrompt? }
  app.post('/api/avatar/generate', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      if (!isImagenConfigured()) return res.status(503).json({ error: 'Image generation not configured (missing GOOGLE_SERVICE_ACCOUNT_KEY)' });

      // Seed prompt from user's persona if available
      const [persona] = await db.select().from(userPersonas).where(eq(userPersonas.userId, userId)).limit(1);
      const archetypeKey = persona?.archetypeKey || null;
      const accentColor = persona?.accentColor || null;
      const prompt = buildAvatarPrompt(archetypeKey, accentColor, req.body?.extraPrompt);

      const result = await generateImageWithImagen(prompt, '1:1');
      if (!result.success || !result.imageBase64) {
        return res.status(502).json({ error: result.error || 'Image generation failed' });
      }
      const buf = Buffer.from(result.imageBase64, 'base64');
      // Server-generated filename, confined to uploadsDir by construction.
      const filename = `avatar-gen-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
      // nosemgrep: javascript.lang.security.audit.detect-non-literal-fs-filename, javascript.lang.security.audit.path-traversal.path-join-resolve-traversal
      await fs.promises.writeFile(path.join(uploadsDir, filename), buf);
      const url = `/uploads/${filename}`;
      await saveUserAvatar(userId, url, 'generated', prompt);
      res.json({ url, style: 'generated', prompt });
    } catch (err: any) {
      console.error('[avatar/generate] error', err);
      res.status(500).json({ error: err?.message || 'Generate failed' });
    }
  });

  // POST /api/avatar/upload  (multipart: file, optional removeBackground=true)
  app.post('/api/avatar/upload', isAuthenticated, upload.single('file'), async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      let url = `/uploads/${req.file.filename}`;

      if (req.body?.removeBackground === 'true' && process.env.REMOVE_BG_API_KEY) {
        try {
          // `req.file.path` is set by multer to a path inside `uploadsDir`
          // using a server-generated filename (see `audioStorage` config).
          // nosemgrep: javascript.lang.security.audit.detect-non-literal-fs-filename
          const fileBuf = await fs.promises.readFile(req.file.path);
          const fd = new FormData();
          fd.append('image_file', new Blob([fileBuf]), req.file.originalname);
          fd.append('size', 'auto');
          const r = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': process.env.REMOVE_BG_API_KEY! },
            body: fd as any,
          });
          if (r.ok) {
            const outBuf = Buffer.from(await r.arrayBuffer());
            // Server-generated filename, confined to uploadsDir.
            const outName = `avatar-nobg-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
            // nosemgrep: javascript.lang.security.audit.detect-non-literal-fs-filename, javascript.lang.security.audit.path-traversal.path-join-resolve-traversal
            await fs.promises.writeFile(path.join(uploadsDir, outName), outBuf);
            url = `/uploads/${outName}`;
          } else {
            console.warn('[avatar/upload] remove.bg failed', r.status);
          }
        } catch (e) {
          console.warn('[avatar/upload] remove.bg error', e);
        }
      }

      await saveUserAvatar(userId, url, 'uploaded', null);
      res.json({ url, style: 'uploaded' });
    } catch (err: any) {
      console.error('[avatar/upload] error', err);
      res.status(500).json({ error: err?.message || 'Upload failed' });
    }
  });

  // POST /api/avatar/gallery  { key }
  app.post('/api/avatar/gallery', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const key = String(req.body?.key || '');
      const item = GALLERY_SEEDS.find(g => g.key === key);
      if (!item) return res.status(400).json({ error: 'Unknown gallery key' });
      const url = galleryUrl(item.key);
      await saveUserAvatar(userId, url, 'gallery', null);
      res.json({ url, style: 'gallery' });
    } catch (err: any) {
      console.error('[avatar/gallery-pick] error', err);
      res.status(500).json({ error: err?.message || 'Pick failed' });
    }
  });
}
