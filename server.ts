import express from 'express';
import path from 'path';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  requireAuth,
  AuthRequest,
  hashPassword,
  verifyPassword,
  createSessionToken,
} from './src/middleware/auth.ts';
import {
  upsertFirebaseUser,
  getUserByEmail,
  getUserByUid,
  createUserWithPassword,
  updateUserName,
  getUserPlans,
  getPlanByIdForUser,
  createPlan,
  deletePlanForUser,
  createContactMessage,
  ensureDemoUserAndPlans,
  seedSamplePlansForUser,
} from './src/db/repository.ts';
import { generateSmartPlan } from './src/server/ai-engine.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // 1. Register with Full Name, Email, Password, Confirm Password
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, confirmPassword } = req.body || {};
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match. Please confirm your password.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await getUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({
          error: 'An account with this email already exists. Please log in instead.',
        });
      }

      const uid = `ps_user_${crypto.randomUUID()}`;
      const passwordHash = hashPassword(password);
      const newUser = await createUserWithPassword(uid, name.trim(), normalizedEmail, passwordHash);

      const token = createSessionToken({
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.name,
      });

      return res.status(201).json({
        token,
        user: {
          id: newUser.id,
          uid: newUser.uid,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Register error:', error);
      return res.status(500).json({
        error: error.message || 'Unable to complete registration right now. Please try again.',
      });
    }
  });

  // 2. Login with Email & Password
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Please enter both your email and password.' });
      }

      const normalizedEmail = String(email).toLowerCase().trim();

      // Ensure demo account exists if logging in as demo@example.com
      if (normalizedEmail === 'demo@example.com') {
        await ensureDemoUserAndPlans();
      }

      const user = await getUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid email or password. Please check your credentials or create an account.',
        });
      }

      if (!user.passwordHash) {
        return res.status(401).json({
          error: 'This account uses Google Sign-In. Please click "Continue with Google" below.',
        });
      }

      const isValid = verifyPassword(String(password), user.passwordHash);
      if (!isValid) {
        return res.status(401).json({
          error: 'Invalid email or password. Please try again.',
        });
      }

      const token = createSessionToken({
        uid: user.uid,
        email: user.email,
        name: user.name,
      });

      return res.json({
        token,
        user: {
          id: user.id,
          uid: user.uid,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({
        error: error.message || 'Unable to sign in right now. Please try again.',
      });
    }
  });

  // 3. One-click Demo Login (demo@example.com with ₹50k Home, ₹30k Party, ₹1L Jewelry plans)
  app.post('/api/auth/demo', async (_req, res) => {
    try {
      const demoUser = await ensureDemoUserAndPlans();
      const token = createSessionToken({
        uid: demoUser.uid,
        email: demoUser.email,
        name: demoUser.name,
      });

      return res.json({
        token,
        user: {
          id: demoUser.id,
          uid: demoUser.uid,
          name: demoUser.name,
          email: demoUser.email,
          createdAt: demoUser.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Demo login error:', error);
      return res.status(500).json({
        error: error.message || 'Unable to load the demo account right now.',
      });
    }
  });

  // 4. Synchronize Google Sign-In (Firebase Auth) user with Cloud SQL
  app.post('/api/auth/google-sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const authUser = req.user!;
      const displayName = req.body?.name || authUser.name || authUser.email.split('@')[0];
      const dbUser = await upsertFirebaseUser(authUser.uid, authUser.email, displayName);
      return res.json({
        user: {
          id: dbUser.id,
          uid: dbUser.uid,
          name: dbUser.name,
          email: dbUser.email,
          createdAt: dbUser.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Google sync error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to synchronize Google account.',
      });
    }
  });

  // 5. Get current user profile
  app.get('/api/user/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const authUser = req.user!;
      let dbUser = await getUserByUid(authUser.uid);
      if (!dbUser) {
        dbUser = await upsertFirebaseUser(
          authUser.uid,
          authUser.email,
          authUser.name || authUser.email.split('@')[0]
        );
      }
      return res.json({
        user: {
          id: dbUser.id,
          uid: dbUser.uid,
          name: dbUser.name,
          email: dbUser.email,
          createdAt: dbUser.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to load profile.',
      });
    }
  });

  // 6. Update user profile name
  app.put('/api/user/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const authUser = req.user!;
      const { name } = req.body || {};
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters long.' });
      }
      let dbUser = await getUserByUid(authUser.uid);
      if (!dbUser) {
        dbUser = await upsertFirebaseUser(authUser.uid, authUser.email, name.trim());
      } else {
        dbUser = (await updateUserName(dbUser.uid, name.trim())) || dbUser;
      }
      return res.json({
        user: {
          id: dbUser.id,
          uid: dbUser.uid,
          name: dbUser.name,
          email: dbUser.email,
          createdAt: dbUser.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to update profile.',
      });
    }
  });

  // 7. Get all plans for the logged-in user
  app.get('/api/plans', requireAuth, async (req: AuthRequest, res) => {
    try {
      const authUser = req.user!;
      let dbUser = await getUserByUid(authUser.uid);
      if (!dbUser) {
        dbUser = await upsertFirebaseUser(
          authUser.uid,
          authUser.email,
          authUser.name || authUser.email.split('@')[0]
        );
      }
      const userPlans = await getUserPlans(dbUser.uid);
      return res.json({ plans: userPlans });
    } catch (error: any) {
      console.error('Get plans error:', error);
      return res.status(500).json({
        error: error.message || 'Could not load your plan history.',
      });
    }
  });

  // 8. Get a specific plan by ID (strictly scoped to logged-in user)
  app.get('/api/plans/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const authUser = req.user!;
      const planId = Number(req.params.id);
      if (!Number.isInteger(planId) || planId <= 0) {
        return res.status(400).json({ error: 'Invalid plan ID.' });
      }
      let dbUser = await getUserByUid(authUser.uid);
      const effectiveUid = dbUser ? dbUser.uid : authUser.uid;

      const plan = await getPlanByIdForUser(planId, effectiveUid);
      if (!plan) {
        return res.status(404).json({
          error: 'Plan not found or you do not have permission to view this plan.',
        });
      }
      return res.json({ plan });
    } catch (error: any) {
      console.error('Get single plan error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to load the selected plan.',
      });
    }
  });

  // 9. Generate a new AI Budget Plan & save to Cloud SQL
  app.post('/api/plans/generate', requireAuth, async (req: AuthRequest, res) => {
    try {
      const authUser = req.user!;
      const { planType, budget, requestData } = req.body || {};

      const validTypes = ['home', 'party', 'jewelry'];
      if (!planType || !validTypes.includes(String(planType).toLowerCase())) {
        return res.status(400).json({ error: 'Please select a valid planner category (Home, Party, or Jewelry).' });
      }

      const numericBudget = Math.round(Number(budget));
      if (!Number.isFinite(numericBudget) || numericBudget < 1000) {
        return res.status(400).json({
          error: 'Please enter a valid budget of at least ₹1,000.',
        });
      }
      if (numericBudget > 100000000) {
        return res.status(400).json({
          error: 'Please enter a budget up to ₹10,00,00,000.',
        });
      }

      let dbUser = await getUserByUid(authUser.uid);
      if (!dbUser) {
        dbUser = await upsertFirebaseUser(
          authUser.uid,
          authUser.email,
          authUser.name || authUser.email.split('@')[0]
        );
      }

      const aiResult = await generateSmartPlan(
        String(planType).toLowerCase(),
        numericBudget,
        requestData || {}
      );

      const savedPlan = await createPlan({
        userId: dbUser.uid,
        planType: String(planType).toLowerCase(),
        title: aiResult.title,
        budget: numericBudget,
        budgetUsed: aiResult.budget_used,
        budgetRemaining: aiResult.budget_remaining,
        requestData: { ...(requestData || {}), budget: numericBudget },
        resultData: aiResult,
      });

      return res.status(201).json({ plan: savedPlan });
    } catch (error: any) {
      console.error('Generate plan error:', error);
      return res.status(500).json({
        error: 'Something went wrong while generating your plan. Please try again.',
      });
    }
  });

  // 10. Seed sample demo plans for current user
  app.post('/api/plans/seed-samples', requireAuth, async (req: AuthRequest, res) => {
    try {
      const authUser = req.user!;
      let dbUser = await getUserByUid(authUser.uid);
      if (!dbUser) {
        dbUser = await upsertFirebaseUser(
          authUser.uid,
          authUser.email,
          authUser.name || authUser.email.split('@')[0]
        );
      }
      const plans = await seedSamplePlansForUser(dbUser.uid);
      return res.json({ plans });
    } catch (error: any) {
      console.error('Seed samples error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to load sample plans.',
      });
    }
  });

  // 11. Delete a plan belonging to the user
  app.delete('/api/plans/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const authUser = req.user!;
      const planId = Number(req.params.id);
      if (!Number.isInteger(planId) || planId <= 0) {
        return res.status(400).json({ error: 'Invalid plan ID.' });
      }
      let dbUser = await getUserByUid(authUser.uid);
      const effectiveUid = dbUser ? dbUser.uid : authUser.uid;
      const deleted = await deletePlanForUser(planId, effectiveUid);
      if (!deleted) {
        return res.status(404).json({ error: 'Plan not found.' });
      }
      return res.json({ success: true });
    } catch (error: any) {
      console.error('Delete plan error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to delete plan.',
      });
    }
  });

  // 12. Submit Contact Form
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, message } = req.body || {};
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Please enter your name.' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      if (!message || typeof message !== 'string' || message.trim().length < 5) {
        return res.status(400).json({ error: 'Please enter a message (at least 5 characters).' });
      }

      const saved = await createContactMessage(name, email, message);
      return res.status(201).json({
        success: true,
        message: 'Thank you for reaching out! Your message has been received by the PocketSmart AI team.',
        id: saved.id,
      });
    } catch (error: any) {
      console.error('Contact submission error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to send message. Please try again.',
      });
    }
  });

  // Vite middleware for development or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PocketSmart AI server running on http://localhost:${PORT}`);
  });
}

startServer();
