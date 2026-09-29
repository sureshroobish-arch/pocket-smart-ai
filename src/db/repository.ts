import { db } from './index.ts';
import { users, plans, contactMessages, PlanResultData } from './schema.ts';
import { eq, desc, and } from 'drizzle-orm';
import { hashPassword } from '../middleware/auth.ts';
import { getSampleDemoPlans } from '../server/ai-engine.ts';

export async function upsertFirebaseUser(uid: string, email: string, name: string) {
  try {
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingByEmail.length > 0 && existingByEmail[0].uid !== uid) {
      // Return existing user record matched by email
      return existingByEmail[0];
    }

    const result = await db
      .insert(users)
      .values({
        uid,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email.toLowerCase(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database error in upsertFirebaseUser:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export async function getUserByEmail(email: string) {
  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database error in getUserByEmail:', error);
    throw new Error('Database error while looking up account.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database error in getUserByUid:', error);
    throw new Error('Database error while fetching user profile.', { cause: error });
  }
}

export async function createUserWithPassword(
  uid: string,
  name: string,
  email: string,
  passwordHash: string
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database error in createUserWithPassword:', error);
    throw new Error('Could not create user account. Email may already be registered.', {
      cause: error,
    });
  }
}

export async function updateUserName(uid: string, name: string) {
  try {
    const result = await db
      .update(users)
      .set({ name: name.trim() })
      .where(eq(users.uid, uid))
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error('Database error in updateUserName:', error);
    throw new Error('Failed to update profile name.', { cause: error });
  }
}

export async function getUserPlans(uid: string) {
  try {
    return await db
      .select()
      .from(plans)
      .where(eq(plans.userId, uid))
      .orderBy(desc(plans.createdAt));
  } catch (error) {
    console.error('Database error in getUserPlans:', error);
    throw new Error('Failed to load your saved plans.', { cause: error });
  }
}

export async function getPlanByIdForUser(planId: number, uid: string) {
  try {
    const rows = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.userId, uid)))
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database error in getPlanByIdForUser:', error);
    throw new Error('Failed to retrieve the requested plan.', { cause: error });
  }
}

export async function createPlan(data: {
  userId: string;
  planType: string;
  title: string;
  budget: number;
  budgetUsed: number;
  budgetRemaining: number;
  requestData: Record<string, any>;
  resultData: PlanResultData;
}) {
  try {
    const result = await db
      .insert(plans)
      .values({
        userId: data.userId,
        planType: data.planType,
        title: data.title,
        budget: data.budget,
        budgetUsed: data.budgetUsed,
        budgetRemaining: data.budgetRemaining,
        requestData: data.requestData,
        resultData: data.resultData,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database error in createPlan:', error);
    throw new Error('Failed to save your generated plan to the database.', { cause: error });
  }
}

export async function deletePlanForUser(planId: number, uid: string) {
  try {
    const result = await db
      .delete(plans)
      .where(and(eq(plans.id, planId), eq(plans.userId, uid)))
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error('Database error in deletePlanForUser:', error);
    throw new Error('Failed to delete plan.', { cause: error });
  }
}

export async function createContactMessage(name: string, email: string, message: string) {
  try {
    const result = await db
      .insert(contactMessages)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database error in createContactMessage:', error);
    throw new Error('Failed to submit your message. Please try again.', { cause: error });
  }
}

export async function seedSamplePlansForUser(uid: string) {
  try {
    const existing = await getUserPlans(uid);
    if (existing.length > 0) {
      return existing;
    }
    const samples = getSampleDemoPlans();
    for (const sample of samples) {
      await createPlan({
        userId: uid,
        ...sample,
      });
    }
    return await getUserPlans(uid);
  } catch (error) {
    console.error('Database error in seedSamplePlansForUser:', error);
    throw new Error('Failed to load sample plans.', { cause: error });
  }
}

export async function ensureDemoUserAndPlans() {
  try {
    const demoEmail = 'demo@example.com';
    const demoUid = 'demo-user-pocketsmart-2026';
    let demoUser = await getUserByEmail(demoEmail);

    if (!demoUser) {
      const result = await db
        .insert(users)
        .values({
          uid: demoUid,
          name: 'Demo User',
          email: demoEmail,
          passwordHash: hashPassword('demo1234'),
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: { email: demoEmail },
        })
        .returning();
      demoUser = result[0];
    }

    await seedSamplePlansForUser(demoUser.uid);
    return demoUser;
  } catch (error) {
    console.error('Database error in ensureDemoUserAndPlans:', error);
    throw new Error('Failed to initialize demo account.', { cause: error });
  }
}
