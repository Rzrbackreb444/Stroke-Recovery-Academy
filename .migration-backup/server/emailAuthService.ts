import { db } from "./db";
import { users, magicLinks, passwordResetTokens, sessions } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";

const MAGIC_LINK_EXPIRY_MINUTES = 15;
const PASSWORD_RESET_EXPIRY_MINUTES = 60;

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
  token?: string;
}

export async function registerUser(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<AuthResult> {
  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    
    if (existingUser.length > 0) {
      return { success: false, error: "An account with this email already exists" };
    }
    
    const passwordHash = await hashPassword(password);
    
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      authProvider: "email",
      role: "member",
    }).returning();
    
    return { 
      success: true, 
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      }
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { success: false, error: error.message || "Registration failed" };
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    
    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }
    
    if (!user.passwordHash) {
      return { success: false, error: "Please use magic link or reset your password" };
    }
    
    const isValid = await verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      return { success: false, error: "Invalid email or password" };
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
      }
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: error.message || "Login failed" };
  }
}

export async function createMagicLink(email: string): Promise<AuthResult> {
  try {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);
    
    await db.insert(magicLinks).values({
      email: email.toLowerCase(),
      token,
      expiresAt,
    });
    
    return { success: true, token };
  } catch (error: any) {
    console.error("Magic link creation error:", error);
    return { success: false, error: error.message || "Failed to create magic link" };
  }
}

export async function verifyMagicLink(token: string): Promise<AuthResult> {
  try {
    const [link] = await db.select()
      .from(magicLinks)
      .where(
        and(
          eq(magicLinks.token, token),
          gt(magicLinks.expiresAt, new Date())
        )
      )
      .limit(1);
    
    if (!link) {
      return { success: false, error: "Invalid or expired magic link" };
    }
    
    if (link.usedAt) {
      return { success: false, error: "This magic link has already been used" };
    }
    
    await db.update(magicLinks)
      .set({ usedAt: new Date() })
      .where(eq(magicLinks.id, link.id));
    
    let [user] = await db.select().from(users).where(eq(users.email, link.email)).limit(1);
    
    if (!user) {
      const [newUser] = await db.insert(users).values({
        email: link.email,
        authProvider: "magic_link",
        role: "member",
      }).returning();
      user = newUser;
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
      }
    };
  } catch (error: any) {
    console.error("Magic link verification error:", error);
    return { success: false, error: error.message || "Verification failed" };
  }
}

export async function createPasswordResetToken(email: string): Promise<AuthResult> {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    
    if (!user) {
      return { success: true };
    }
    
    const token = generateToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);
    
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });
    
    return { success: true, token };
  } catch (error: any) {
    console.error("Password reset token error:", error);
    return { success: false, error: error.message || "Failed to create reset token" };
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<AuthResult> {
  try {
    const [resetToken] = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);
    
    if (!resetToken) {
      return { success: false, error: "Invalid or expired reset link" };
    }
    
    if (resetToken.usedAt) {
      return { success: false, error: "This reset link has already been used" };
    }
    
    const passwordHash = await hashPassword(newPassword);
    
    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetToken.userId));
    
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));
    
    return { success: true };
  } catch (error: any) {
    console.error("Password reset error:", error);
    return { success: false, error: error.message || "Password reset failed" };
  }
}

export async function getUserById(userId: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
    };
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}
