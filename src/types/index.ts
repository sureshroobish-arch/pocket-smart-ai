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

export interface SavedPlan {
  id: number;
  userId: string;
  planType: 'home' | 'party' | 'jewelry' | string;
  title: string;
  budget: number;
  budgetUsed: number;
  budgetRemaining: number;
  requestData: Record<string, any>;
  resultData: PlanResultData;
  createdAt: string;
}

export interface UserProfile {
  id?: number;
  uid: string;
  name: string;
  email: string;
  createdAt: string;
}

export type PageView =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'home-planner'
  | 'party-planner'
  | 'jewelry-planner'
  | 'plan-result'
  | 'history'
  | 'profile'
  | 'about'
  | 'contact';

export function formatINR(amount: number): string {
  const num = Number(amount) || 0;
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}
