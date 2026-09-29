/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { PageView, SavedPlan } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { AuthPages } from './components/AuthPages.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { PlannerForms } from './components/PlannerForms.tsx';
import { PlanResultView } from './components/PlanResultView.tsx';
import { HistoryPage } from './components/HistoryPage.tsx';
import { ProfilePage } from './components/ProfilePage.tsx';
import { AboutSection, ContactSection } from './components/AboutAndContact.tsx';

const ProtectedPages: PageView[] = [
  'dashboard',
  'home-planner',
  'party-planner',
  'jewelry-planner',
  'plan-result',
  'history',
  'profile',
];

const MainApp: React.FC = () => {
  const { user, token, authFetch } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageView>('landing');
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<SavedPlan | null>(null);

  const fetchUserPlans = useCallback(async () => {
    if (!token) {
      setPlans([]);
      return;
    }
    setLoadingPlans(true);
    try {
      const res = await authFetch('/api/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  }, [token, authFetch]);

  useEffect(() => {
    if (user && token) {
      fetchUserPlans();
    } else {
      setPlans([]);
      setSelectedPlan(null);
    }
  }, [user, token, fetchUserPlans]);

  const handleNavigate = (target: PageView) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (ProtectedPages.includes(target) && !user) {
      setCurrentPage('login');
      return;
    }
    setCurrentPage(target);
  };

  const handleSelectPlan = (plan: SavedPlan) => {
    setSelectedPlan(plan);
    setCurrentPage('plan-result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlanGenerated = (newPlan: SavedPlan) => {
    setPlans((prev) => [newPlan, ...prev]);
    setSelectedPlan(newPlan);
    setCurrentPage('plan-result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadSamples = async () => {
    if (!token) return;
    setLoadingPlans(true);
    try {
      const res = await authFetch('/api/plans/seed-samples', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!token) return;
    const res = await authFetch(`/api/plans/${planId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1">
        {currentPage === 'landing' && <LandingPage onNavigate={handleNavigate} />}

        {(currentPage === 'login' || currentPage === 'register') && (
          <AuthPages mode={currentPage} onNavigate={handleNavigate} />
        )}

        {currentPage === 'about' && (
          <AboutSection
            isStandalone
            onNavigate={(p) => handleNavigate(user ? p : 'login')}
          />
        )}

        {currentPage === 'contact' && <ContactSection isStandalone />}

        {currentPage === 'dashboard' && user && (
          <Dashboard
            plans={plans}
            loadingPlans={loadingPlans}
            onNavigate={handleNavigate}
            onSelectPlan={handleSelectPlan}
            onLoadSamples={handleLoadSamples}
          />
        )}

        {(currentPage === 'home-planner' ||
          currentPage === 'party-planner' ||
          currentPage === 'jewelry-planner') &&
          user && (
            <PlannerForms
              activePlanner={
                currentPage === 'home-planner'
                  ? 'home'
                  : currentPage === 'party-planner'
                  ? 'party'
                  : 'jewelry'
              }
              onSwitchPlanner={(type) => handleNavigate(`${type}-planner` as PageView)}
              onPlanGenerated={handlePlanGenerated}
              onNavigate={handleNavigate}
            />
          )}

        {currentPage === 'plan-result' && user && selectedPlan && (
          <PlanResultView plan={selectedPlan} onNavigate={handleNavigate} />
        )}

        {currentPage === 'plan-result' && user && !selectedPlan && (
          <Dashboard
            plans={plans}
            loadingPlans={loadingPlans}
            onNavigate={handleNavigate}
            onSelectPlan={handleSelectPlan}
            onLoadSamples={handleLoadSamples}
          />
        )}

        {currentPage === 'history' && user && (
          <HistoryPage
            plans={plans}
            loading={loadingPlans}
            onSelectPlan={handleSelectPlan}
            onDeletePlan={handleDeletePlan}
            onNavigate={handleNavigate}
            onLoadSamples={handleLoadSamples}
          />
        )}

        {currentPage === 'profile' && user && (
          <ProfilePage plansCount={plans.length} onNavigate={handleNavigate} />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
