import { eq, sql } from "drizzle-orm";
import { db as defaultDb } from "./db";
import { survivorGoals } from "@shared/schema";

type TransactionalDb = typeof defaultDb;

export type RoutineFeedbackInput = {
  userId: string;
  date: string;
  taskId: string;
  level: number;
  reaction: string;
};

export type SurvivorGoalInput = {
  horizon: string;
  domain: string;
  goal: string;
};

/**
 * Save feedback and the corresponding routine completion as one logical action.
 * A failed completion write must roll the feedback row back as well.
 */
export async function saveRoutineFeedback(
  input: RoutineFeedbackInput,
  database: TransactionalDb = defaultDb,
): Promise<void> {
  await database.transaction(async (tx: any) => {
    await tx.execute(
      sql`INSERT INTO routine_feedback (user_id, date, task_id, level, reaction, created_at)
          VALUES (${input.userId}, ${input.date}, ${input.taskId}, ${input.level}, ${input.reaction}, NOW())
          ON CONFLICT (user_id, date, task_id)
          DO UPDATE SET reaction = ${input.reaction}, level = ${input.level}, created_at = NOW()`,
    );

    if (input.reaction !== "skipped" && input.taskId !== "walk_cooldown") {
      await tx.execute(
        sql`INSERT INTO routine_completions (user_id, date, level, completed_tasks, updated_at)
            VALUES (${input.userId}, ${input.date}, ${input.level}, ARRAY[${input.taskId}]::text[], NOW())
            ON CONFLICT (user_id, date)
            DO UPDATE SET
              level = ${input.level},
              completed_tasks = (
                SELECT ARRAY(SELECT DISTINCT unnest(routine_completions.completed_tasks || ARRAY[${input.taskId}]::text[]))
                FROM routine_completions
                WHERE routine_completions.user_id = ${input.userId}
                  AND routine_completions.date = ${input.date}
              ),
              updated_at = NOW()`,
      );
    }
  });
}

/**
 * Replace a survivor's goal set atomically. An insert failure must leave the
 * previous set intact rather than leaving the survivor with no goals.
 */
export async function replaceSurvivorGoals(
  userId: string,
  goals: SurvivorGoalInput[],
  database: TransactionalDb = defaultDb,
): Promise<any[]> {
  return database.transaction(async (tx: any) => {
    await tx.delete(survivorGoals).where(eq(survivorGoals.userId, userId));
    if (goals.length === 0) return [];

    return tx.insert(survivorGoals).values(
      goals.map((goal) => ({
        userId,
        horizon: goal.horizon,
        domain: goal.domain,
        goal: String(goal.goal).trim().slice(0, 240),
      })),
    ).returning();
  });
}