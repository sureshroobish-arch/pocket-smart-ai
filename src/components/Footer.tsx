import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PageView } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface FooterProps {
  onNavigate: (page: PageView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="text-lg font-bold text-white tracking-tight">PocketSmart AI</div>
            <p className="text-sm text-slate-400 mt-1">
              Your Smart Budget &amp; Recommendation Assistant
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Plan smarter. Spend better. Choose confidently.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-6 text-sm" aria-label="Footer Navigation">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onNavigate(user ? 'dashboard' : 'login')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <span>© 2026 PocketSmart AI</span>
          <span>
            Prices and recommendations are estimates in Indian Rupees (₹). Verify final prices before purchasing.
          </span>
        </div>
      </div>

      {privacyOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
        >
          <div className="bg-white text-slate-900 rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 id="privacy-modal-title" className="text-base font-semibold text-slate-900">
                Privacy &amp; Data Protection Policy
              </h3>
              <button
                type="button"
                onClick={() => setPrivacyOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
                aria-label="Close privacy policy"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                <strong>1. User-Scoped Budget Plans:</strong> All plans generated in PocketSmart AI are strictly isolated to your authenticated user account in PostgreSQL. Other users cannot view or access your budget history.
              </p>
              <p>
                <strong>2. Server-Side AI Processing:</strong> Your budget parameters and item preferences are processed securely on our backend server using the Google Gemini API. API keys are never exposed to client browsers.
              </p>
              <p>
                <strong>3. Shopping Links:</strong> Outbound links to Google Shopping, Amazon, and Flipkart are generated dynamically from item names for price comparison convenience.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setPrivacyOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
