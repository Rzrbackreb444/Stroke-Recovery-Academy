import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  registerUser,
  loginUser,
  createMagicLink,
  createPasswordResetToken,
  resetPassword,
  getUserById,
} from "./emailAuthService";
import { sendMagicLinkEmail, sendPasswordResetEmail, sendWelcomeEmail } from "./emailService";
import { authActionLimiter } from "./middleware/publicRateLimit";

const router = Router();

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

router.post("/register", authActionLimiter, async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data.email, data.password, data.firstName, data.lastName);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    req.session.userId = result.user.id;
    
    // Send welcome email asynchronously
    sendWelcomeEmail(data.email, data.firstName || "Creator").catch(console.error);
    
    res.json({ success: true, user: result.user });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: error.message || "Registration failed" });
  }
});

router.post("/login", authActionLimiter, async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data.email, data.password);
    
    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }
    
    req.session.userId = result.user.id;
    
    res.json({ success: true, user: result.user });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

router.post("/magic-link", authActionLimiter, async (req: Request, res: Response) => {
  try {
    const data = emailSchema.parse(req.body);
    const result = await createMagicLink(data.email);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    const magicLinkUrl = `${req.protocol}://${req.get('host')}/auth/verify?token=${result.token}`;
    
    // Send magic link email
    await sendMagicLinkEmail(data.email, magicLinkUrl);
    
    res.json({ 
      success: true, 
      message: "Magic link sent! Check your email.",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: error.message || "Failed to create magic link" });
  }
});

// Alias for the canonical magic-link verifier. Old emailAuthService links point
// at /auth/verify?token= (this route); it now delegates to the single shared
// handler so both link shapes terminate in the same verification + session code
// path (passport session via req.login). The shared verifier still checks the
// legacy magicLinks store, so previously-emailed links keep working.
router.get("/verify-magic-link", async (req: Request, res: Response) => {
  const { handleMagicLinkVerify } = await import("./magicLinkService");
  return handleMagicLinkVerify(req, res);
});

router.post("/forgot-password", authActionLimiter, async (req: Request, res: Response) => {
  try {
    const data = emailSchema.parse(req.body);
    const result = await createPasswordResetToken(data.email);
    
    if (result.token) {
      const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password?token=${result.token}`;
      // Send password reset email
      await sendPasswordResetEmail(data.email, resetUrl);
    }
    
    res.json({ 
      success: true, 
      message: "If an account exists with this email, you will receive a reset link" 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: error.message || "Request failed" });
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const data = resetSchema.parse(req.body);
    const result = await resetPassword(data.token, data.password);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ success: true, message: "Password reset successfully" });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: error.message || "Password reset failed" });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

router.get("/me", async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await getUserById(userId);
    
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }
    
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get user" });
  }
});

export default router;
