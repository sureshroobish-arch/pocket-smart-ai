import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PageView, SavedPlan, formatINR } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ResilientImage } from './ResilientImage.tsx';

interface DashboardProps {
  plans: SavedPlan[];
  loadingPlans: boolean;
  onNavigate: (page: PageView) => void;
  onSelectPlan: (plan: SavedPlan) => void;
  onLoadSamples: () => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  plans,
  loadingPlans,
  onNavigate,
  onSelectPlan,
  onLoadSamples,
}) => {
  const { user } = useAuth();

  const totalPlansCount = plans.length;
  const recentPlan = plans.length > 0 ? plans[0] : null;
  const totalBudgetPlanned = plans.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
  const recentRemainingBudget = recentPlan ? Number(recentPlan.budgetRemaining) || 0 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-semibold text-blue-700">Personal Budget Workspace</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome, {user?.name || 'Smart Planner'}!
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">
            Let&apos;s plan your spending smarter today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            My Plan History ({totalPlansCount})
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home-planner')}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            + New Budget Plan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <section aria-label="Budget Summary Metrics" className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Total Plans</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 font-mono-num">
            {loadingPlans ? '—' : totalPlansCount}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            Saved in your personal history
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Recent Plan</div>
            <div className="mt-2 text-base font-bold text-slate-900 truncate" title={recentPlan?.title || 'None yet'}>
              {loadingPlans ? 'Loading...' : recentPlan ? recentPlan.title : 'No plans created yet'}
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            {recentPlan ? (
              <>
                <span className="capitalize">{recentPlan.planType} Planner</span>
                <button
                  type="button"
                  onClick={() => onSelectPlan(recentPlan)}
                  className="font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  Open Plan →
                </button>
              </>
            ) : (
              <span>Select a planner below</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs font-medium text-slate-500">Budget Planned</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 font-mono-num">
            {loadingPlans ? '—' : formatINR(totalBudgetPlanned)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 font-mono-num">
            {recentPlan ? `Recent plan cap: ${formatINR(recentPlan.budget)}` : 'Across all created plans'}
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-amber-800">Remaining Budget</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-amber-700 font-mono-num">
            {loadingPlans ? '—' : formatINR(recentRemainingBudget)}
          </div>
          <div className="mt-1.5 text-xs text-slate-600 font-mono-num">
            {recentPlan
              ? `Saved from ${formatINR(recentPlan.budget)} recent plan`
              : 'Buffer from your latest plan'}
          </div>
        </div>
      </section>

      {/* MAIN PLANNER SECTION */}
      <section className="mt-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-blue-700">AI Recommendation Planners</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              What would you like to plan today?
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            All recommendations automatically stay within your entered Indian Rupee (₹) budget.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* A. Home Planner Card */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between">
            <div>
              <ResilientImage
                src="/src/assets/images/planner_home_living_1790660873870.jpg"
                alt="Modern living room furniture, ceiling fan, and warm lighting"
                className="w-full h-48 object-cover"
                fallbackTitle="Home Budget Planner"
              />
              <div className="p-6">
                <div className="text-xs text-slate-500">
                  <span>Home &amp; Interiors</span>
                  <span aria-hidden="true"> · </span>
                  <span>Furniture, Lighting, Fans, Dining</span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  Home Budget Planner
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Plan your home purchases based on your available budget.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={() => onNavigate('home-planner')}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open Home Planner</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* B. Party Planner Card */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between">
            <div>
              <ResilientImage
                src="/src/assets/images/planner_party_event_1790660887731.jpg"
                alt="Celebration party dining setup with string lights and catering"
                className="w-full h-48 object-cover"
                fallbackTitle="Party Budget Planner"
              />
              <div className="p-6">
                <div className="text-xs text-slate-500">
                  <span>Events &amp; Celebrations</span>
                  <span aria-hidden="true"> · </span>
                  <span>Venue, Catering, Decor, Music</span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  Party Budget Planner
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Create a complete party plan without exceeding your budget.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={() => onNavigate('party-planner')}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open Party Planner</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* C. Jewelry Planner Card */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between">
            <div>
              <ResilientImage
                src="/src/assets/images/planner_jewelry_collection_1790660900157.jpg"
                alt="Fine 22k gold necklace and matching earrings set"
                className="w-full h-48 object-cover"
                fallbackTitle="Jewelry Budget Planner"
              />
              <div className="p-6">
                <div className="text-xs text-slate-500">
                  <span>Fine Jewelry</span>
                  <span aria-hidden="true"> · </span>
                  <span>Gold, Silver, Platinum Sets</span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  Jewelry Budget Planner
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Find suitable jewelry combinations within your budget.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={() => onNavigate('jewelry-planner')}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open Jewelry Planner</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Plans or Empty State */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Budget Plans</h2>
          {plans.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              View All History →
            </button>
          )}
        </div>

        {loadingPlans ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-36 bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-5 w-48 bg-slate-200 rounded mt-3" />
                <div className="h-4 w-32 bg-slate-200 rounded mt-6" />
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="mt-4 bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h3 className="text-base font-bold text-slate-900">No plans yet</h3>
            <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
              Create your first smart budget plan and it will appear here.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('home-planner')}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
              >
                Create a Plan
              </button>
              <button
                type="button"
                onClick={onLoadSamples}
                className="px-4 py-2.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
              >
                Load Sample Demo Plans (₹50k Home · ₹30k Party · ₹1L Jewelry)
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.slice(0, 3).map((plan) => (
              <div
                key={plan.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs text-slate-500">
                    <span className="capitalize font-medium text-slate-700">{plan.planType} Plan</span>
                    <span aria-hidden="true"> · </span>
                    <span>{new Date(plan.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <h3 className="mt-1.5 text-base font-bold text-slate-900">{plan.title}</h3>
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 font-mono-num text-xs">
                    <div>
                      <div className="text-slate-500">Budget</div>
                      <div className="font-semibold text-slate-900">{formatINR(plan.budget)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Used</div>
                      <div className="font-semibold text-blue-700">{formatINR(plan.budgetUsed)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Remaining</div>
                      <div className="font-semibold text-amber-700">{formatINR(plan.budgetRemaining)}</div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectPlan(plan)}
                  className="mt-5 w-full py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  View Plan
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
