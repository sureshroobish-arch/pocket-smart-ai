import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { PageView, SavedPlan, formatINR } from '../types/index.ts';

interface HistoryPageProps {
  plans: SavedPlan[];
  loading: boolean;
  onSelectPlan: (plan: SavedPlan) => void;
  onDeletePlan: (planId: number) => Promise<void>;
  onNavigate: (page: PageView) => void;
  onLoadSamples: () => Promise<void>;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  plans,
  loading,
  onSelectPlan,
  onDeletePlan,
  onNavigate,
  onLoadSamples,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'home' | 'party' | 'jewelry'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredPlans = plans.filter((plan) => {
    const matchesType =
      filterType === 'all' || plan.planType.toLowerCase() === filterType;
    const matchesSearch =
      !searchQuery.trim() ||
      plan.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      plan.planType.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDeletePlan(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-semibold text-blue-700">Saved Recommendations</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            My Plan History
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review and compare all your saved Home, Party, and Jewelry budget plans.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('home-planner')}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap"
        >
          + Create a Plan
        </button>
      </div>

      {/* Filters & Search */}
      {plans.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
            {(['all', 'home', 'party', 'jewelry'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap ${
                  filterType === type
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'all' ? `All Plans (${plans.length})` : `${type} Planner`}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <label htmlFor="history-search" className="sr-only">
              Search plans
            </label>
            <input
              id="history-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plan title..."
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      )}

      {/* Loading / Empty / List States */}
      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-white border border-slate-200 rounded-xl p-5 animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        /* 26. EMPTY STATE */
        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-10 text-center">
          <h2 className="text-lg font-bold text-slate-900">No plans yet</h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
            Create your first smart budget plan and it will appear here.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
              Load Sample Demo Plans
            </button>
          </div>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-600">No plans match your current filter or search query.</p>
          <button
            type="button"
            onClick={() => {
              setFilterType('all');
              setSearchQuery('');
            }}
            className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <th className="py-3.5 px-5">Plan Title</th>
                  <th className="py-3.5 px-4">Plan Type</th>
                  <th className="py-3.5 px-4 text-right">Budget</th>
                  <th className="py-3.5 px-4 text-right">Budget Used</th>
                  <th className="py-3.5 px-4 text-right">Remaining Budget</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/80">
                    <td className="py-4 px-5 font-semibold text-slate-900">{plan.title}</td>
                    <td className="py-4 px-4 capitalize text-slate-600">{plan.planType}</td>
                    <td className="py-4 px-4 text-right font-mono-num font-semibold text-slate-900">
                      {formatINR(plan.budget)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono-num text-blue-700 font-semibold">
                      {formatINR(plan.budgetUsed)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono-num text-amber-700 font-semibold">
                      {formatINR(plan.budgetRemaining)}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500 font-mono-num">
                      {new Date(plan.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectPlan(plan)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          View Plan
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === plan.id}
                          onClick={() => handleDelete(plan.id)}
                          aria-label={`Delete ${plan.title}`}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cards View */}
          <div className="md:hidden mt-6 space-y-4">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500">
                      <span className="capitalize font-semibold text-blue-700">{plan.planType}</span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        {new Date(plan.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900">{plan.title}</h3>
                  </div>
                  <button
                    type="button"
                    disabled={deletingId === plan.id}
                    onClick={() => handleDelete(plan.id)}
                    aria-label={`Delete ${plan.title}`}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 font-mono-num text-xs">
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
                    <div className="font-semibold text-amber-700">
                      {formatINR(plan.budgetRemaining)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPlan(plan)}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  View Plan
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
