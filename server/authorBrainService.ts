import { db } from "./db";
import { sql, eq, and, desc, ilike, or } from "drizzle-orm";

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
  const result = await db.execute(sql`
    INSERT INTO author_brain.project_context (user_id, project_name, project_type, global_tone)
    VALUES (${input.userId}, ${input.projectName}, ${input.projectType}, ${input.globalTone || 'narrative'})
    RETURNING *
  `);
  return result.rows[0];
}

export async function getProjectContexts(userId: string) {
  const result = await db.execute(sql`
    SELECT * FROM author_brain.project_context
    WHERE user_id = ${userId}
    ORDER BY last_updated DESC
  `);
  return result.rows;
}

export async function getProjectContext(projectId: string, userId: string) {
  const result = await db.execute(sql`
    SELECT * FROM author_brain.project_context
    WHERE id = ${projectId} AND user_id = ${userId}
  `);
  return result.rows[0];
}

export async function updateProjectContext(projectId: string, userId: string, updates: Partial<ProjectContextInput>) {
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

export async function deleteProjectContext(projectId: string, userId: string) {
  await db.execute(sql`
    DELETE FROM author_brain.project_context
    WHERE id = ${projectId} AND user_id = ${userId}
  `);
}

export async function addMemory(input: MemoryInput) {
  const metadata = input.metadata ? JSON.stringify(input.metadata) : '{}';
  const result = await db.execute(sql`
    INSERT INTO author_brain.author_memory (project_id, content_type, raw_text, metadata)
    VALUES (${input.projectId}, ${input.contentType}, ${input.rawText}, ${metadata}::jsonb)
    RETURNING *
  `);
  return result.rows[0];
}

export async function getMemories(projectId: string, contentType?: string) {
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

export async function getMemory(memoryId: string) {
  const result = await db.execute(sql`
    SELECT * FROM author_brain.author_memory
    WHERE id = ${memoryId}
  `);
  return result.rows[0];
}

export async function updateMemory(memoryId: string, updates: { rawText?: string; metadata?: Record<string, any> }) {
  const metadata = updates.metadata ? JSON.stringify(updates.metadata) : null;
  
  const result = await db.execute(sql`
    UPDATE author_brain.author_memory
    SET 
      raw_text = COALESCE(${updates.rawText}, raw_text),
      metadata = COALESCE(${metadata}::jsonb, metadata)
    WHERE id = ${memoryId}
    RETURNING *
  `);
  return result.rows[0];
}

export async function deleteMemory(memoryId: string) {
  await db.execute(sql`
    DELETE FROM author_brain.author_memory
    WHERE id = ${memoryId}
  `);
}

export async function searchMemories(
  projectId: string, 
  query: string, 
  contentTypes?: string[],
  limit: number = 10
): Promise<MemorySearchResult[]> {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  if (searchTerms.length === 0) {
    return [];
  }
  
  const likePattern = `%${searchTerms.join('%')}%`;
  
  let typeFilter = '';
  if (contentTypes && contentTypes.length > 0) {
    const types = contentTypes.map(t => `'${t}'`).join(',');
    typeFilter = `AND content_type IN (${types})`;
  }
  
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
  chapterTitle: string,
  chapterDescription: string,
  limit: number = 5
): Promise<MemorySearchResult[]> {
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

export async function getMemoryStats(projectId: string) {
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
