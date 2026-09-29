import React, { useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { PageView, SavedPlan, formatINR } from '../types/index.ts';

interface PlanResultViewProps {
  plan: SavedPlan;
  onNavigate: (page: PageView) => void;
}

export const PlanResultView: React.FC<PlanResultViewProps> = ({ plan, onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const result = plan.resultData;
  const totalBudget = Number(plan.budget) || 1;
  const budgetUsed = Number(plan.budgetUsed ?? result.budget_used) || 0;
  const budgetRemaining = Math.max(0, Number(plan.budgetRemaining ?? result.budget_remaining) || 0);
  const usedPercent = Math.min(100, Math.round((budgetUsed / totalBudget) * 100));

  const categories = result.budget_breakdown || [];
  const allItems = categories.flatMap((cat) =>
    (cat.items || []).map((item) => ({
      ...item,
      category: item.category || cat.category,
    }))
  );

  const visibleItems =
    selectedCategory === 'ALL'
      ? allItems
      : allItems.filter((i) => i.category.toLowerCase() === selectedCategory.toLowerCase());

  const getShoppingUrl = (itemName: string, store: 'Google Shopping' | 'Amazon' | 'Flipkart') => {
    const q = encodeURIComponent(itemName.trim());
    if (store === 'Google Shopping') return `https://www.google.com/search?tbm=shop&q=${q}`;
    if (store === 'Amazon') return `https://www.amazon.in/s?k=${q}`;
    return `https://www.flipkart.com/search?q=${q}`;
  };

  const plannerPageMap: Record<string, PageView> = {
    home: 'home-planner',
    party: 'party-planner',
    jewelry: 'jewelry-planner',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
          >
            My Plan History
          </button>
          <button
            type="button"
            onClick={() => onNavigate(plannerPageMap[plan.planType] || 'home-planner')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 cursor-pointer whitespace-nowrap"
          >
            + Create Another {plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)} Plan
          </button>
        </div>
      </div>

      {/* Plan Title & Summary */}
      <div className="mt-6">
        <div className="text-xs text-slate-500">
          <span className="capitalize font-semibold text-blue-700">{plan.planType} Budget Plan</span>
          <span aria-hidden="true"> · </span>
          <span>
            Created on{' '}
            {new Date(plan.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          {result.budget_adjusted && (
            <>
              <span aria-hidden="true"> · </span>
              <span className="text-amber-700 font-medium">
                Auto-calibrated to stay within {formatINR(totalBudget)}
              </span>
            </>
          )}
        </div>

        <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {result.title || plan.title}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          {result.summary}
        </p>
      </div>

      {/* 11. BUDGET OVERVIEW */}
      <section aria-label="Budget Overview" className="mt-8 bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">Budget Overview</h2>
          <span className="text-xs font-mono-num text-slate-500">
            {usedPercent}% of total budget utilized · {100 - usedPercent}% buffer remaining
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-xs font-medium text-slate-500">Total Budget</div>
            <div className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 font-mono-num">
              {formatINR(totalBudget)}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200/80">
            <div className="text-xs font-medium text-blue-800">Budget Used</div>
            <div className="mt-1 text-xl sm:text-2xl font-bold text-blue-700 font-mono-num">
              {formatINR(budgetUsed)}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200">
            <div className="text-xs font-semibold text-amber-900">Remaining</div>
            <div className="mt-1 text-xl sm:text-2xl font-bold text-amber-700 font-mono-num">
              {formatINR(budgetRemaining)}
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-5">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-mono-num text-slate-500">
            <span>₹0</span>
            <span className="text-blue-700 font-medium">
              Used: {formatINR(budgetUsed)} ({usedPercent}%)
            </span>
            <span className="text-amber-700 font-medium">
              Cap: {formatINR(totalBudget)}
            </span>
          </div>
        </div>
      </section>

      {/* 12. BUDGET BREAKDOWN */}
      <section aria-label="Budget Breakdown" className="mt-8 bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Budget Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Category-wise budget allocation and share of total budget
            </p>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block mt-5 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 px-4 text-right">Allocated Budget</th>
                <th className="py-3 px-4 text-right">Percentage</th>
                <th className="py-3 pl-4 w-1/3">Allocation Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {categories.map((cat, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="py-3.5 pr-4 font-semibold text-slate-900">
                    {cat.category}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-slate-900">
                    {formatINR(cat.allocated_budget)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-num text-amber-700 font-semibold">
                    {cat.percentage_of_budget}%
                  </td>
                  <td className="py-3.5 pl-4">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full"
                        style={{ width: `${Math.min(100, cat.percentage_of_budget)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards View */}
        <div className="sm:hidden mt-4 space-y-3">
          {categories.map((cat, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">{cat.category}</span>
                <span className="text-xs font-mono-num font-semibold text-amber-700">
                  {cat.percentage_of_budget}%
                </span>
              </div>
              <div className="mt-1 text-base font-mono-num font-bold text-slate-900">
                {formatINR(cat.allocated_budget)}
              </div>
              <div className="mt-2.5 w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-900 rounded-full"
                  style={{ width: `${Math.min(100, cat.percentage_of_budget)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 13. RECOMMENDED ITEMS */}
      <section aria-label="Recommended Items" className="mt-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Recommended Items ({visibleItems.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Each item is selected to stay within its category allocation. Click any store below to compare live prices.
            </p>
          </div>

          {/* Interactive Category Filter Controls */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({allItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category}
                type="button"
                onClick={() => setSelectedCategory(cat.category)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.category
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleItems.map((item, idx) => {
            const lineTotal = item.estimated_price * item.quantity;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs text-slate-500">
                    <span>Category: {item.category}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono-num">Quantity: {item.quantity}</span>
                  </div>

                  <h3 className="mt-1.5 text-lg font-bold text-slate-900">{item.name}</h3>

                  <div className="mt-3 flex flex-wrap items-baseline gap-4 font-mono-num">
                    <div>
                      <span className="text-xs text-slate-500">Estimated Price: </span>
                      <span className="text-base font-bold text-slate-900">
                        {formatINR(item.estimated_price)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-slate-500"> / unit</span>
                      )}
                    </div>
                    {item.quantity > 1 && (
                      <div>
                        <span className="text-xs text-slate-500">Subtotal ({item.quantity}x): </span>
                        <span className="text-sm font-semibold text-amber-700">
                          {formatINR(lineTotal)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-700">Reason:</div>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                      &ldquo;{item.reason}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Dynamically Generated Shopping Links */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="text-xs font-medium text-slate-500 mb-2">
                    Compare live prices:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <a
                      href={getShoppingUrl(item.name, 'Google Shopping')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <span>Google Shopping</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={getShoppingUrl(item.name, 'Amazon')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <span>Amazon</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={getShoppingUrl(item.name, 'Flipkart')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <span>Flipkart</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 14. AI SMART TIPS */}
      <section aria-label="Smart Tips" className="mt-10 bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-base font-bold text-slate-900">Smart Tips</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
          {(result.tips || []).map((tip, index) => (
            <li key={index} className="leading-relaxed">
              {tip}
            </li>
          ))}
        </ul>
      </section>

      {/* 15. DISCLAIMER */}
      <div className="mt-6 p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 leading-relaxed">
        <strong>Disclaimer:</strong> &ldquo;Prices and recommendations are estimates and may change based on availability, location, seller, and market conditions. Verify final prices before purchasing.&rdquo;
      </div>
    </div>
  );
};
