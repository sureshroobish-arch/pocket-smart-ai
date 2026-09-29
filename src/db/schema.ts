import { relations } from 'drizzle-orm';
import { integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export interface ShoppingLink {
  store: string;
  url: string;
}

export interface RecommendedItem {
  name: string;
  category: string;
  estimated_price: number;
  quantity: number;
  reason: string;
  shopping_links?: ShoppingLink[];
}

export interface BudgetCategoryBreakdown {
  category: string;
  allocated_budget: number;
  percentage_of_budget: number;
  items: RecommendedItem[];
}

export interface PlanResultData {
  title: string;
  summary: string;
  budget_used: number;
  budget_remaining: number;
  budget_breakdown: BudgetCategoryBreakdown[];
  tips: string[];
  is_fallback?: boolean;
  budget_adjusted?: boolean;
}

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  planType: text('plan_type').notNull(), // 'home' | 'party' | 'jewelry'
  title: text('title').notNull(),
  budget: integer('budget').notNull(),
  budgetUsed: integer('budget_used').notNull(),
  budgetRemaining: integer('budget_remaining').notNull(),
  requestData: jsonb('request_data').$type<Record<string, any>>().notNull(),
  resultData: jsonb('result_data').$type<PlanResultData>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  plans: many(plans),
}));

export const plansRelations = relations(plans, ({ one }) => ({
  user: one(users, {
    fields: [plans.userId],
    references: [users.uid],
  }),
}));
