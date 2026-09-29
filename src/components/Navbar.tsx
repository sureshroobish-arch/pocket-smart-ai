import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PageView } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (page: PageView) => {
    setMobileMenuOpen(false);
    onNavigate(page);
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    onNavigate('landing');
  };

  const navLinkClass = (page: PageView) =>
    `text-sm font-medium transition-colors whitespace-nowrap py-1 border-b-2 ${
      currentPage === page
        ? 'text-slate-900 border-blue-600'
        : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Brand Title (Single text element wordmark) */}
        <button
          type="button"
          onClick={() => handleNav(user ? 'dashboard' : 'landing')}
          className="text-lg font-bold tracking-tight text-slate-900 hover:text-blue-700 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-600 cursor-pointer"
        >
          PocketSmart AI
        </button>

        {/* Zone 2: Primary Navigation Links */}
        {user ? (
          <nav className="hidden lg:flex items-center gap-6" aria-label="Main Navigation">
            <button type="button" onClick={() => handleNav('landing')} className={navLinkClass('landing')}>
              Home
            </button>
            <button type="button" onClick={() => handleNav('dashboard')} className={navLinkClass('dashboard')}>
              Dashboard
            </button>
            <button type="button" onClick={() => handleNav('home-planner')} className={navLinkClass('home-planner')}>
              Home Planner
            </button>
            <button type="button" onClick={() => handleNav('party-planner')} className={navLinkClass('party-planner')}>
              Party Planner
            </button>
            <button type="button" onClick={() => handleNav('jewelry-planner')} className={navLinkClass('jewelry-planner')}>
              Jewelry Planner
            </button>
            <button type="button" onClick={() => handleNav('history')} className={navLinkClass('history')}>
              History
            </button>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-6" aria-label="Public Navigation">
            <button type="button" onClick={() => handleNav('landing')} className={navLinkClass('landing')}>
              Home
            </button>
            <button type="button" onClick={() => handleNav('about')} className={navLinkClass('about')}>
              About
            </button>
            <button type="button" onClick={() => handleNav('contact')} className={navLinkClass('contact')}>
              Contact
            </button>
          </nav>
        )}

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => handleNav('profile')}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  currentPage === 'profile'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                Profile ({user.name.split(' ')[0]})
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleNav('login')}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleNav('register')}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex lg:hidden items-center gap-2">
          {!user && (
            <button
              type="button"
              onClick={() => handleNav('login')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg whitespace-nowrap"
            >
              Login
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1 shadow-lg">
          <button
            type="button"
            onClick={() => handleNav('landing')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
              currentPage === 'landing' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            Home
          </button>

          {user ? (
            <>
              <button
                type="button"
                onClick={() => handleNav('dashboard')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentPage === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => handleNav('home-planner')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentPage === 'home-planner' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Home Planner
              </button>
              <button
                type="button"
                onClick={() => handleNav('party-planner')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentPage === 'party-planner' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Party Planner
              </button>
              <button
                type="button"
                onClick={() => handleNav('jewelry-planner')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentPage === 'jewelry-planner' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Jewelry Planner
              </button>
              <button
                type="button"
                onClick={() => handleNav('history')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentPage === 'history' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                History
              </button>
              <button
                type="button"
                onClick={() => handleNav('profile')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentPage === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Profile ({user.name})
              </button>
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 text-center text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleNav('about')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentPage === 'about' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                About
              </button>
              <button
                type="button"
                onClick={() => handleNav('contact')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentPage === 'contact' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Contact
              </button>
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleNav('login')}
                  className="py-2.5 px-4 text-center text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('register')}
                  className="py-2.5 px-4 text-center text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800"
                >
                  Get Started
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};
