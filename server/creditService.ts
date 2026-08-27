import { db } from './db';
import { creditWallets, creditLedger, usageEvents } from '@shared/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';

type CreditDb = Pick<typeof db, 'insert' | 'update'>;

export interface CreditBalance {
  balance: number;
  bonusCredits: number;
  total: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

export interface CreditTransaction {
  id: number;
  transactionType: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  featureKey: string | null;
  createdAt: Date;
}

const STARTER_CREDITS = 500;

export async function getBalance(userId: string): Promise<CreditBalance> {
  let wallet = await db.select().from(creditWallets).where(eq(creditWallets.userId, userId)).limit(1);

  if (wallet.length === 0) {
    await initializeWallet(userId);
    wallet = await db.select().from(creditWallets).where(eq(creditWallets.userId, userId)).limit(1);
  }

  const w = wallet[0];
  if (!w) {
    throw new Error('Unable to initialize credit wallet');
  }
  return {
    balance: w.balance,
    bonusCredits: w.bonusCredits,
    total: w.balance + w.bonusCredits,
    lifetimeEarned: w.lifetimeEarned,
    lifetimeSpent: w.lifetimeSpent,
  };
}

export async function hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
  const balance = await getBalance(userId);
  return balance.total >= amount;
}

async function ensureWallet(tx: CreditDb, userId: string): Promise<void> {
  const [created] = await tx.insert(creditWallets).values({
    userId,
    balance: STARTER_CREDITS,
    bonusCredits: 0,
    lifetimeEarned: STARTER_CREDITS,
    lifetimeSpent: 0,
  }).onConflictDoNothing().returning({ userId: creditWallets.userId });

  if (created) {
    await tx.insert(creditLedger).values({
      userId,
      transactionType: 'bonus',
      amount: STARTER_CREDITS,
      balanceAfter: STARTER_CREDITS,
      description: 'Welcome bonus - starter credits',
      featureKey: 'signup_bonus',
    });
  }
}

export async function initializeWallet(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await ensureWallet(tx, userId);
  });
}

export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  featureKey: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  return db.transaction(async (tx) => {
    await ensureWallet(tx, userId);

    // The WHERE clause and the arithmetic are evaluated while the wallet row
    // is locked by PostgreSQL. No caller can spend the same credits twice.
    const [wallet] = await tx.update(creditWallets)
      .set({
        balance: sql`${creditWallets.balance} - GREATEST(${amount} - ${creditWallets.bonusCredits}, 0)`,
        bonusCredits: sql`${creditWallets.bonusCredits} - LEAST(${creditWallets.bonusCredits}, ${amount})`,
        lifetimeSpent: sql`${creditWallets.lifetimeSpent} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(creditWallets.userId, userId),
        sql`${creditWallets.balance} + ${creditWallets.bonusCredits} >= ${amount}`,
      ))
      .returning({
        balance: creditWallets.balance,
        bonusCredits: creditWallets.bonusCredits,
      });

    if (!wallet) {
      const [current] = await tx.select({
        balance: creditWallets.balance,
        bonusCredits: creditWallets.bonusCredits,
      }).from(creditWallets).where(eq(creditWallets.userId, userId)).limit(1);
      const currentTotal = current ? current.balance + current.bonusCredits : 0;
      return { success: false, newBalance: currentTotal, error: 'Insufficient credits' };
    }

    const newTotal = wallet.balance + wallet.bonusCredits;
    await tx.insert(creditLedger).values({
      userId,
      transactionType: 'deduction',
      amount: -amount,
      balanceAfter: newTotal,
      description,
      featureKey,
      metadata: metadata || null,
    });

    return { success: true, newBalance: newTotal };
  });
}

export type CreditTransactionType = 'purchase' | 'refund' | 'bonus' | 'earning' | 'subscription' | 'admin' | 'slot_spin' | 'slot_win' | 'daily_spin' | 'staring_contest' | 'staring_win' | 'game_bet' | 'game_win' | 'roulette_spin' | 'roulette_win' | 'blackjack_deal' | 'blackjack_double' | 'blackjack_win' | 'holdem_buyin' | 'holdem_win' | 'bingo_card' | 'survival_entry' | 'survival_win';

export async function addCredits(
  userId: string,
  amount: number,
  transactionType: CreditTransactionType,
  description: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number }> {
  return db.transaction((tx) => addCreditsInTransaction(tx, userId, amount, transactionType, description, metadata));
}

export async function addCreditsInTransaction(
  tx: CreditDb,
  userId: string,
  amount: number,
  transactionType: CreditTransactionType,
  description: string,
  metadata?: Record<string, any>,
  referenceType?: string,
  referenceId?: string,
): Promise<{ success: boolean; newBalance: number }> {
  await ensureWallet(tx, userId);

  const isBonus = transactionType === 'bonus';

  // Returning the post-update values makes the ledger snapshot correspond to
  // this mutation, rather than to a balance read that may already be stale.
  // (The update itself serializes concurrent mutations on this wallet row.)
  const [updatedWallet] = await tx.update(creditWallets)
    .set({
      balance: sql`${creditWallets.balance} + ${isBonus ? 0 : amount}`,
      bonusCredits: sql`${creditWallets.bonusCredits} + ${isBonus ? amount : 0}`,
      lifetimeEarned: sql`${creditWallets.lifetimeEarned} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(creditWallets.userId, userId))
    .returning({
      balance: creditWallets.balance,
      bonusCredits: creditWallets.bonusCredits,
    });

  if (!updatedWallet) {
    throw new Error('Unable to update credit wallet');
  }
  const newTotal = updatedWallet.balance + updatedWallet.bonusCredits;
  await tx.insert(creditLedger).values({
    userId,
    transactionType,
    amount,
    balanceAfter: newTotal,
    description,
    featureKey: transactionType, // Persist for auditability
    referenceType: referenceType || null,
    referenceId: referenceId || null,
    metadata: metadata || null,
  });

  return { success: true, newBalance: newTotal };
}

export async function getTransactionHistory(
  userId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  const transactions = await db.select()
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId))
    .orderBy(desc(creditLedger.createdAt))
    .limit(limit);
  
  return transactions.map(t => ({
    id: t.id,
    transactionType: t.transactionType,
    amount: t.amount,
    balanceAfter: t.balanceAfter,
    description: t.description,
    featureKey: t.featureKey,
    createdAt: t.createdAt,
  }));
}

export async function recordUsageEvent(
  userId: string,
  featureKey: string,
  studioType: string,
  creditsCost: number,
  inputTokens?: number,
  outputTokens?: number,
  durationMs?: number,
  metadata?: Record<string, any>
): Promise<void> {
  await db.insert(usageEvents).values({
    userId,
    featureKey,
    studioType,
    creditsCost,
    inputTokens: inputTokens || null,
    outputTokens: outputTokens || null,
    durationMs: durationMs || null,
    metadata: metadata || null,
  });
}

export async function getDailyUsageStats(userId: string): Promise<{
  creditsUsedToday: number;
  generationsToday: number;
  tokensUsedToday: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = await db.select({
    creditsUsed: sql<number>`COALESCE(SUM(${usageEvents.creditsCost}), 0)`,
    generations: sql<number>`COUNT(*)`,
    tokens: sql<number>`COALESCE(SUM(COALESCE(${usageEvents.inputTokens}, 0) + COALESCE(${usageEvents.outputTokens}, 0)), 0)`,
  })
  .from(usageEvents)
  .where(
    and(
      eq(usageEvents.userId, userId),
      gte(usageEvents.createdAt, today)
    )
  );
  
  return {
    creditsUsedToday: stats[0]?.creditsUsed || 0,
    generationsToday: stats[0]?.generations || 0,
    tokensUsedToday: stats[0]?.tokens || 0,
  };
}
