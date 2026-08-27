import { db } from "./db";
import { sql } from "drizzle-orm";

export const AUTHOR_BRAIN_PROJECT_TYPES = ['book', 'music', 'video', 'course'] as const;
export const AUTHOR_BRAIN_CONTENT_TYPES = [
  'character',
  'lore',
  'research',
  'style',
  'note',
  'plot',
  'setting',
] as const;
export const AUTHOR_BRAIN_MAX_RESULT_LIMIT = 50;
export const AUTHOR_BRAIN_MAX_PROJECT_NAME_LENGTH = 200;
export const AUTHOR_BRAIN_MAX_GLOBAL_TONE_LENGTH = 100;
export const AUTHOR_BRAIN_MAX_MEMORY_TEXT_LENGTH = 50_000;
export const AUTHOR_BRAIN_MAX_SEARCH_LENGTH = 500;
export const AUTHOR_BRAIN_MAX_CHAPTER_TITLE_LENGTH = 300;
export const AUTHOR_BRAIN_MAX_CHAPTER_DESCRIPTION_LENGTH = 5_000;
export const AUTHOR_BRAIN_MAX_METADATA_BYTES = 16_384;

export class AuthorBrainValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorBrainValidationError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isAuthorBrainUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function assertUuid(value: string, label: string): void {
  if (!isAuthorBrainUuid(value)) {
    throw new AuthorBrainValidationError(`${label} must be a valid UUID`);
  }
}

function assertBoundedString(
  value: unknown,
  label: string,
  maxLength: number,
  required = true,
): asserts value is string {
  if (typeof value !== "string" || (required && value.trim().length === 0)) {
    throw new AuthorBrainValidationError(`${label} is required`);
  }
  if (value.length > maxLength) {
    throw new AuthorBrainValidationError(`${label} must be ${maxLength} characters or fewer`);
  }
}

function assertProjectId(projectId: string): void {
  assertUuid(projectId, "Project ID");
}

function assertMemoryId(memoryId: string): void {
  assertUuid(memoryId, "Memory ID");
}

function assertContentType(contentType: unknown): asserts contentType is typeof AUTHOR_BRAIN_CONTENT_TYPES[number] {
  if (
    typeof contentType !== "string" ||
    !AUTHOR_BRAIN_CONTENT_TYPES.includes(contentType as typeof AUTHOR_BRAIN_CONTENT_TYPES[number])
  ) {
    throw new AuthorBrainValidationError("Invalid content type");
  }
}

function assertResultLimit(limit: number): void {
  if (!Number.isInteger(limit) || limit < 1 || limit > AUTHOR_BRAIN_MAX_RESULT_LIMIT) {
    throw new AuthorBrainValidationError(
      `Limit must be an integer between 1 and ${AUTHOR_BRAIN_MAX_RESULT_LIMIT}`,
    );
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertJsonValue(value: unknown, depth: number, seen: Set<object>): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (Number.isFinite(value)) return;
    throw new AuthorBrainValidationError("Metadata must contain valid JSON values");
  }
  if (typeof value !== "object" || depth > 5 || seen.has(value)) {
    throw new AuthorBrainValidationError("Metadata must contain a bounded JSON object");
  }

  seen.add(value);
  if (Array.isArray(value)) {
    if (value.length > 100) {
      throw new AuthorBrainValidationError("Metadata arrays are too large");
    }
    for (const item of value) assertJsonValue(item, depth + 1, seen);
  } else {
    if (!isPlainObject(value) || Object.keys(value).length > 100) {
      throw new AuthorBrainValidationError("Metadata must be a bounded JSON object");
    }
    for (const [key, item] of Object.entries(value)) {
      if (key.length > 100) {
        throw new AuthorBrainValidationError("Metadata keys are too long");
      }
      assertJsonValue(item, depth + 1, seen);
    }
  }
  seen.delete(value);
}

export function serializeAuthorBrainMetadata(metadata: unknown): string {
  if (!isPlainObject(metadata)) {
    throw new AuthorBrainValidationError("Metadata must be a JSON object");
  }
  assertJsonValue(metadata, 0, new Set());
  let serialized: string;
  try {
    serialized = JSON.stringify(metadata);
  } catch {
    throw new AuthorBrainValidationError("Metadata must contain valid JSON values");
  }
  if (Buffer.byteLength(serialized, "utf8") > AUTHOR_BRAIN_MAX_METADATA_BYTES) {
    throw new AuthorBrainValidationError(
      `Metadata must be ${AUTHOR_BRAIN_MAX_METADATA_BYTES} bytes or fewer`,
    );
  }
  return serialized;
}

function assertMemoryText(rawText: unknown, label = "Text"): asserts rawText is string {
  assertBoundedString(rawText, label, AUTHOR_BRAIN_MAX_MEMORY_TEXT_LENGTH);
}

function assertUserId(userId: string): void {
  if (typeof userId !== "string" || userId.length === 0) {
    throw new AuthorBrainValidationError("User ID is required");
  }
}

function assertOwnedProjectInputs(projectId: string, userId: string): void {
  assertProjectId(projectId);
  assertUserId(userId);
}

async function getOwnedProject(projectId: string, userId: string) {
  assertOwnedProjectInputs(projectId, userId);
  const result = await db.execute(sql`
    SELECT id FROM author_brain.project_context
    WHERE id = ${projectId} AND user_id = ${userId}
  `);
  return result.rows[0];
}

async function getOwnedMemory(memoryId: string, userId: string) {
  assertMemoryId(memoryId);
  assertUserId(userId);
  const result = await db.execute(sql`
    SELECT m.*
    FROM author_brain.author_memory m
    INNER JOIN author_brain.project_context p ON p.id = m.project_id
    WHERE m.id = ${memoryId} AND p.user_id = ${userId}
  `);
  return result.rows[0];
}

export interface ProjectContextInput {
  userId: string;
  projectName: string;
  projectType: 'book' | 'music' | 'video' | 'course';
  globalTone?: string;
}

export interface MemoryInput {
  projectId: string;
  contentType: 'character' | 'lore' | 'research' | 'style' | 'note' | 'plot' | 'setting';
  rawText: string;
  metadata?: Record<string, any>;
}

export interface MemorySearchResult {
  id: string;
  contentType: string;
  rawText: string;
  metadata: Record<string, any>;
  relevanceScore: number;
  createdAt: Date;
}

export async function createProjectContext(input: ProjectContextInput) {
  assertUserId(input.userId);
  assertBoundedString(input.projectName, "Project name", AUTHOR_BRAIN_MAX_PROJECT_NAME_LENGTH);
  if (
    typeof input.projectType !== "string" ||
    !AUTHOR_BRAIN_PROJECT_TYPES.includes(input.projectType as typeof AUTHOR_BRAIN_PROJECT_TYPES[number])
  ) {
    throw new AuthorBrainValidationError("Invalid project type");
  }
  if (input.globalTone !== undefined) {
    assertBoundedString(input.globalTone, "Global tone", AUTHOR_BRAIN_MAX_GLOBAL_TONE_LENGTH);
  }
  const result = await db.execute(sql`
    INSERT INTO author_brain.project_context (user_id, project_name, project_type, global_tone)
    VALUES (${input.userId}, ${input.projectName}, ${input.projectType}, ${input.globalTone || 'narrative'})
    RETURNING *
  `);
  return result.rows[0];
}

export async function getProjectContexts(userId: string) {
  assertUserId(userId);
  const result = await db.execute(sql`
    SELECT * FROM author_brain.project_context
    WHERE user_id = ${userId}
    ORDER BY last_updated DESC
  `);
  return result.rows;
}

export async function getProjectContext(projectId: string, userId: string) {
  assertOwnedProjectInputs(projectId, userId);
  const result = await db.execute(sql`
    SELECT * FROM author_brain.project_context
    WHERE id = ${projectId} AND user_id = ${userId}
  `);
  return result.rows[0];
}

export async function updateProjectContext(projectId: string, userId: string, updates: Partial<ProjectContextInput>) {
  assertOwnedProjectInputs(projectId, userId);
  if (updates.projectName !== undefined) {
    assertBoundedString(updates.projectName, "Project name", AUTHOR_BRAIN_MAX_PROJECT_NAME_LENGTH);
  }
  if (updates.globalTone !== undefined) {
    assertBoundedString(updates.globalTone, "Global tone", AUTHOR_BRAIN_MAX_GLOBAL_TONE_LENGTH);
  }
  const result = await db.execute(sql`
    UPDATE author_brain.project_context
    SET 
      project_name = COALESCE(${updates.projectName}, project_name),
      global_tone = COALESCE(${updates.globalTone}, global_tone),
      last_updated = CURRENT_TIMESTAMP
    WHERE id = ${projectId} AND user_id = ${userId}
    RETURNING *
  `);
  return result.rows[0];
}

export async function deleteProjectContext(projectId: string, userId: string): Promise<boolean> {
  assertOwnedProjectInputs(projectId, userId);
  const result = await db.execute(sql`
    DELETE FROM author_brain.project_context
    WHERE id = ${projectId} AND user_id = ${userId}
    RETURNING id
  `);
  return result.rows.length > 0;
}

export async function addMemory(input: MemoryInput & { userId: string }) {
  assertOwnedProjectInputs(input.projectId, input.userId);
  assertContentType(input.contentType);
  assertMemoryText(input.rawText);
  const metadata = input.metadata === undefined ? '{}' : serializeAuthorBrainMetadata(input.metadata);
  await getOwnedProject(input.projectId, input.userId);
  const result = await db.execute(sql`
    INSERT INTO author_brain.author_memory (project_id, content_type, raw_text, metadata)
    SELECT p.id, ${input.contentType}, ${input.rawText}, ${metadata}::jsonb
    FROM author_brain.project_context p
    WHERE p.id = ${input.projectId} AND p.user_id = ${input.userId}
    RETURNING *
  `);
  return result.rows[0];
}

export async function getMemories(projectId: string, userId: string, contentType?: string) {
  assertOwnedProjectInputs(projectId, userId);
  if (contentType !== undefined) assertContentType(contentType);
  if (!(await getOwnedProject(projectId, userId))) return undefined;
  if (contentType) {
    const result = await db.execute(sql`
      SELECT * FROM author_brain.author_memory
      WHERE project_id = ${projectId} AND content_type = ${contentType}
      ORDER BY created_at DESC
    `);
    return result.rows;
  }
  
  const result = await db.execute(sql`
    SELECT * FROM author_brain.author_memory
    WHERE project_id = ${projectId}
    ORDER BY created_at DESC
  `);
  return result.rows;
}

export async function getMemory(memoryId: string, userId: string) {
  return getOwnedMemory(memoryId, userId);
}

export async function updateMemory(
  memoryId: string,
  userId: string,
  updates: { rawText?: string; metadata?: Record<string, any> },
) {
  assertMemoryId(memoryId);
  assertUserId(userId);
  if (updates.rawText !== undefined) assertMemoryText(updates.rawText);
  const metadata = updates.metadata === undefined ? null : serializeAuthorBrainMetadata(updates.metadata);
  
  const result = await db.execute(sql`
    UPDATE author_brain.author_memory AS m
    SET 
      raw_text = COALESCE(${updates.rawText}, raw_text),
      metadata = COALESCE(${metadata}::jsonb, metadata)
    WHERE m.id = ${memoryId}
      AND EXISTS (
        SELECT 1 FROM author_brain.project_context p
        WHERE p.id = m.project_id AND p.user_id = ${userId}
      )
    RETURNING *
  `);
  return result.rows[0];
}

export async function deleteMemory(memoryId: string, userId: string): Promise<boolean> {
  assertMemoryId(memoryId);
  assertUserId(userId);
  const result = await db.execute(sql`
    DELETE FROM author_brain.author_memory AS m
    USING author_brain.project_context AS p
    WHERE m.id = ${memoryId}
      AND p.id = m.project_id
      AND p.user_id = ${userId}
    RETURNING m.id
  `);
  return result.rows.length > 0;
}

export async function searchMemories(
  projectId: string, 
  userId: string,
  query: string, 
  contentTypes?: string[],
  limit: number = 10
): Promise<MemorySearchResult[] | undefined> {
  assertOwnedProjectInputs(projectId, userId);
  assertBoundedString(query, "Search query", AUTHOR_BRAIN_MAX_SEARCH_LENGTH);
  if (contentTypes !== undefined) {
    if (!Array.isArray(contentTypes) || contentTypes.length > AUTHOR_BRAIN_CONTENT_TYPES.length) {
      throw new AuthorBrainValidationError("Invalid content types");
    }
    for (const contentType of contentTypes) assertContentType(contentType);
  }
  assertResultLimit(limit);
  if (!(await getOwnedProject(projectId, userId))) return undefined;
  const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  if (searchTerms.length === 0) {
    return [];
  }
  
  const likePattern = `%${searchTerms.join('%')}%`;
  
  const typeFilter = contentTypes && contentTypes.length > 0
    ? sql`AND content_type IN (${sql.join(contentTypes.map(type => sql`${type}`), sql`, `)})`
    : sql``;
  
  const result = await db.execute(sql`
    SELECT 
      id,
      content_type,
      raw_text,
      metadata,
      created_at,
      (
        CASE 
          WHEN LOWER(raw_text) LIKE ${likePattern} THEN 1.0
          WHEN LOWER(raw_text) LIKE ${'%' + searchTerms[0] + '%'} THEN 0.7
          ELSE 0.3
        END
      ) as relevance_score
    FROM author_brain.author_memory
    WHERE project_id = ${projectId}
      AND LOWER(raw_text) LIKE ${'%' + searchTerms[0] + '%'}
      ${typeFilter}
    ORDER BY relevance_score DESC, created_at DESC
    LIMIT ${limit}
  `);
  
  return result.rows.map((row: any) => ({
    id: row.id,
    contentType: row.content_type,
    rawText: row.raw_text,
    metadata: row.metadata || {},
    relevanceScore: parseFloat(row.relevance_score) || 0,
    createdAt: row.created_at,
  }));
}

export async function getRelevantContext(
  projectId: string,
  userId: string,
  chapterTitle: string,
  chapterDescription: string,
  limit: number = 5
): Promise<MemorySearchResult[] | undefined> {
  assertOwnedProjectInputs(projectId, userId);
  assertBoundedString(chapterTitle, "Chapter title", AUTHOR_BRAIN_MAX_CHAPTER_TITLE_LENGTH, false);
  assertBoundedString(
    chapterDescription,
    "Chapter description",
    AUTHOR_BRAIN_MAX_CHAPTER_DESCRIPTION_LENGTH,
    false,
  );
  assertResultLimit(limit);
  if (!(await getOwnedProject(projectId, userId))) return undefined;
  const keywords = `${chapterTitle} ${chapterDescription}`
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  if (keywords.length === 0) {
    return [];
  }
  
  const topKeywords = keywords.slice(0, 5);
  const searchPattern = `%${topKeywords[0]}%`;
  
  const result = await db.execute(sql`
    SELECT 
      id,
      content_type,
      raw_text,
      metadata,
      created_at,
      0.5 as relevance_score
    FROM author_brain.author_memory
    WHERE project_id = ${projectId}
      AND (
        LOWER(raw_text) LIKE ${searchPattern}
        OR content_type IN ('character', 'lore', 'style')
      )
    ORDER BY 
      CASE content_type
        WHEN 'character' THEN 1
        WHEN 'lore' THEN 2
        WHEN 'style' THEN 3
        ELSE 4
      END,
      created_at DESC
    LIMIT ${limit}
  `);
  
  return result.rows.map((row: any) => ({
    id: row.id,
    contentType: row.content_type,
    rawText: row.raw_text,
    metadata: row.metadata || {},
    relevanceScore: 0.5,
    createdAt: row.created_at,
  }));
}

export async function getMemoryStats(projectId: string, userId: string) {
  assertOwnedProjectInputs(projectId, userId);
  if (!(await getOwnedProject(projectId, userId))) return undefined;
  const result = await db.execute(sql`
    SELECT 
      content_type,
      COUNT(*) as count
    FROM author_brain.author_memory
    WHERE project_id = ${projectId}
    GROUP BY content_type
    ORDER BY count DESC
  `);
  
  const total = result.rows.reduce((sum: number, row: any) => sum + parseInt(row.count), 0);
  
  return {
    total,
    byType: result.rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.content_type] = parseInt(row.count);
      return acc;
    }, {}),
  };
}
