import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq, or } from "drizzle-orm";
import crypto from "crypto";

// Types for OAuth profiles
interface OAuthProfile {
  id: string;
  displayName?: string;
  emails?: { value: string }[];
  photos?: { value: string }[];
  provider: string;
}

// Secure password hashing
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

// Generate secure tokens
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateMagicLinkToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

// OAuth provider configurations
export const oauthProviders = {
  google: {
    name: "Google",
    icon: "google",
    color: "#4285F4",
    scopes: ["profile", "email"],
  },
  facebook: {
    name: "Facebook",
    icon: "facebook",
    color: "#1877F2",
    scopes: ["email", "public_profile"],
  },
  github: {
    name: "GitHub",
    icon: "github",
    color: "#333333",
    scopes: ["user:email"],
  },
  apple: {
    name: "Apple",
    icon: "apple",
    color: "#000000",
    scopes: ["name", "email"],
  },
  twitter: {
    name: "X (Twitter)",
    icon: "twitter",
    color: "#1DA1F2",
    scopes: ["users.read", "tweet.read"],
  },
};

// Find or create user from OAuth
export async function findOrCreateOAuthUser(profile: OAuthProfile) {
  const email = profile.emails?.[0]?.value;
  const providerId = `${profile.provider}:${profile.id}`;
  
  // Try to find existing user by OAuth ID or email
  let existingUser = null;
  
  if (email) {
    const [found] = await db.select().from(users).where(
      or(
        eq(users.id, providerId),
        eq(users.email, email)
      )
    ).limit(1);
    existingUser = found;
  } else {
    const [found] = await db.select().from(users).where(
      eq(users.id, providerId)
    ).limit(1);
    existingUser = found;
  }
  
  if (existingUser) {
    // Update OAuth info if needed
    const updates: any = {};
    if (!existingUser.profileImageUrl && profile.photos?.[0]?.value) {
      updates.profileImageUrl = profile.photos[0].value;
    }
    
    if (Object.keys(updates).length > 0) {
      const [updated] = await db.update(users)
        .set(updates)
        .where(eq(users.id, existingUser.id))
        .returning();
      return updated;
    }
    return existingUser;
  }
  
  // Create new user
  const [newUser] = await db.insert(users).values({
    id: providerId,
    email: email || null,
    firstName: profile.displayName?.split(" ")[0] || null,
    lastName: profile.displayName?.split(" ").slice(1).join(" ") || null,
    profileImageUrl: profile.photos?.[0]?.value || null,
    role: "creator",
  }).returning();
  
  return newUser;
}

// Email/Password authentication
export async function authenticateLocal(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (!user || !user.passwordHash) {
    return null;
  }
  
  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }
  
  return user;
}

// Register with email/password
export async function registerLocalUser(email: string, password: string, firstName?: string, lastName?: string) {
  // Check if user exists
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (existing) {
    throw new Error("User with this email already exists");
  }
  
  const pwHash = hashPassword(password);
  const userId = `local:${crypto.randomUUID()}`;
  
  const [newUser] = await db.insert(users).values({
    id: userId,
    email,
    passwordHash: pwHash,
    authProvider: "local",
    firstName: firstName || null,
    lastName: lastName || null,
    role: "creator",
  }).returning();
  
  return newUser;
}

// Magic link authentication
const magicLinks = new Map<string, { email: string; expires: Date }>();

export async function createMagicLink(email: string): Promise<string> {
  const token = generateMagicLinkToken();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  
  magicLinks.set(token, { email, expires });
  
  return token;
}

export async function verifyMagicLink(token: string) {
  const link = magicLinks.get(token);
  
  if (!link) {
    return null;
  }
  
  if (new Date() > link.expires) {
    magicLinks.delete(token);
    return null;
  }
  
  magicLinks.delete(token);
  
  // Find or create user
  let [user] = await db.select().from(users).where(eq(users.email, link.email)).limit(1);
  
  if (!user) {
    const userId = `magic:${crypto.randomUUID()}`;
    [user] = await db.insert(users).values({
      id: userId,
      email: link.email,
      role: "creator",
    }).returning();
  }
  
  return user;
}

// Passport serialization
export function configurePassport() {
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      done(null, user || null);
    } catch (error) {
      done(error, null);
    }
  });
  
  // Local strategy.
  // The `passwordField` value below is a passport-local CONFIGURATION FIELD
  // NAME (tells the strategy which req.body field to read), not a credential.
  // Verified false positive of `gitleaks.hashicorp-tf-password`; the
  // `nosemgrep` directive immediately preceding the matched line silences it.
  passport.use(new LocalStrategy(
    // nosemgrep: generic.secrets.gitleaks.hashicorp-tf-password
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await authenticateLocal(email, password);
        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));
  
  // Google strategy (if credentials available)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const user = await findOrCreateOAuthUser({
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails as { value: string }[],
          photos: profile.photos as { value: string }[],
          provider: "google",
        });
        done(null, user);
      } catch (error) {
        done(error as Error);
      }
    }));
  }
}

// Available auth providers based on configuration
export function getAvailableProviders() {
  const providers: string[] = ["local", "magic_link"];
  
  if (process.env.GOOGLE_CLIENT_ID) providers.push("google");
  if (process.env.FACEBOOK_APP_ID) providers.push("facebook");
  if (process.env.GITHUB_CLIENT_ID) providers.push("github");
  if (process.env.APPLE_CLIENT_ID) providers.push("apple");
  if (process.env.TWITTER_CLIENT_ID) providers.push("twitter");
  
  return providers;
}
