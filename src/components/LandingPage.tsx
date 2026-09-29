import React from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { PageView } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ResilientImage } from './ResilientImage.tsx';
import { AboutSection, ContactSection } from './AboutAndContact.tsx';

interface LandingPageProps {
  onNavigate: (page: PageView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user, loginAsDemoUser, loading } = useAuth();

  const handleDemoStart = async () => {
    const ok = await loginAsDemoUser();
    if (ok) {
      onNavigate('dashboard');
    }
  };

  const features = [
    {
      number: '01',
      title: 'Smart Budget Planning',
      description:
        'Allocate funds across essential categories with strict mathematical guardrails that keep total spending within your entered limit.',
    },
    {
      number: '02',
      title: 'AI Recommendations',
      description:
        'Powered by Google Gemini AI to analyze your budget, room or event size, style preferences, and priorities in seconds.',
    },
    {
      number: '03',
      title: 'Multiple Planning Categories',
      description:
        'Dedicated planners for Home purchases, Party & Event organization, and Gold/Silver/Platinum Jewelry combinations.',
    },
    {
      number: '04',
      title: 'Budget Tracking',
      description:
        'Visual progress bars and category-wise percentage breakdowns clearly show Budget Used versus Remaining Buffer in ₹.',
    },
    {
      number: '05',
      title: 'Recommendation History',
      description:
        'Every generated plan is automatically saved to your personal PostgreSQL history so you can revisit and compare anytime.',
    },
    {
      number: '06',
      title: 'Personalized Suggestions',
      description:
        'Item-level price estimates, quantities, selection rationale, and instant shopping links for Google Shopping, Amazon, and Flipkart.',
    },
  ];

  const steps = [
    {
      step: '1',
      title: 'Enter Budget',
      detail: 'Set your total spending limit in Indian Rupees (₹) — from ₹5,000 up to ₹10,00,000+.',
    },
    {
      step: '2',
      title: 'Tell PocketSmart AI What You Need',
      detail: 'Select Home, Party, or Jewelry Planner and specify your items, guest count, style, and priority.',
    },
    {
      step: '3',
      title: 'AI Creates a Budget Plan',
      detail: 'PocketSmart AI calculates category percentages and verifies that total cost never exceeds your budget.',
    },
    {
      step: '4',
      title: 'Get Recommendations That Fit Your Budget',
      detail: 'Review item cards with estimated prices, quantities, reasons, and direct comparison links.',
    },
  ];

  return (
    <div>
      {/* HERO SECTION */}
      <section className="bg-white border-b border-slate-200 pt-10 pb-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="text-xs font-semibold text-blue-700 tracking-wide">
                PocketSmart AI · Plan smarter. Spend better. Choose confidently.
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                Your Smart Budget &amp; Recommendation Assistant
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Set your budget, tell us what you need, and get smart recommendations that fit your spending limit.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate(user ? 'dashboard' : 'register')}
                  className="px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>{user ? 'Go to Dashboard' : 'Get Started'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {!user && (
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="px-6 py-3 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Login
                  </button>
                )}

                {!user && (
                  <button
                    type="button"
                    onClick={handleDemoStart}
                    disabled={loading}
                    className="px-4 py-3 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {loading ? 'Loading Demo...' : 'Try Demo User (₹50k / ₹30k / ₹1L Plans)'}
                  </button>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 max-w-lg">
                <div>
                  <div className="text-xs text-slate-500">Budget Cap Guarantee</div>
                  <div className="mt-0.5 text-base font-bold text-slate-900 font-mono-num">
                    100% Within Limit
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Core Planners</div>
                  <div className="mt-0.5 text-base font-bold text-slate-900 font-mono-num">
                    Home · Party · Jewelry
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Currency &amp; Stores</div>
                  <div className="mt-0.5 text-base font-bold text-amber-700 font-mono-num">
                    ₹ INR Live Links
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Visual Illustration */}
            <div className="lg:col-span-6">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm">
                <ResilientImage
                  src="/src/assets/images/hero_budget_planning_1790660856523.jpg"
                  alt="Visual illustration of smart budget planning, shopping comparison, AI recommendations, and Indian Rupee money management"
                  className="w-full h-72 sm:h-96 object-cover"
                  fallbackTitle="PocketSmart AI Budget & Recommendation Engine"
                />
                <div className="bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-5 sm:p-6 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-amber-400 font-medium">
                        Sample AI Allocation · Smart Home Plan
                      </div>
                      <div className="text-base font-semibold mt-0.5">
                        Living Room Setup within ₹50,000 Cap
                      </div>
                    </div>
                    <div className="text-left sm:text-right font-mono-num">
                      <div className="text-xs text-slate-300">Used: ₹45,500</div>
                      <div className="text-sm font-semibold text-amber-400">
                        Remaining: ₹4,500
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-white/15 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '91%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE SECTION */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-blue-700">Platform Capabilities</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Everything you need to plan purchases without overspending
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div
                key={feat.number}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-mono-num font-semibold text-blue-700">
                    {feat.number}. Feature
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{feat.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (4-STEP SECTION) */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold text-blue-700">How It Works</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              From budget limit to shopping links in 4 simple steps
            </h2>
          </div>

          <div className="mt-10 flex flex-col items-center">
            {steps.map((item, idx) => (
              <React.Fragment key={item.step}>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-white font-mono-num text-sm font-bold flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {item.step}. {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="py-2 text-slate-400 flex flex-col items-center" aria-hidden="true">
                    <ArrowDown className="w-5 h-5 text-blue-600" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => onNavigate(user ? 'dashboard' : 'register')}
              className="px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
            >
              {user ? 'Create a Budget Plan Now' : 'Start Planning Your Budget'}
            </button>
          </div>
        </div>
      </section>

      {/* ABOUT & THREE PLANNERS SECTION */}
      <AboutSection onNavigate={(p) => onNavigate(user ? p : 'login')} />

      {/* CONTACT SECTION */}
      <ContactSection />
    </div>
  );
};
