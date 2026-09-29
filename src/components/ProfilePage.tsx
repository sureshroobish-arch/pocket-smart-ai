import React, { useState } from 'react';
import { PageView } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ProfilePageProps {
  plansCount: number;
  onNavigate: (page: PageView) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ plansCount, onNavigate }) => {
  const { user, updateProfileName, logout, loading, error } = useAuth();
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);
    setLocalError(null);

    if (nameInput.trim().length < 2) {
      setLocalError('Please enter a valid name (at least 2 characters).');
      return;
    }

    const ok = await updateProfileName(nameInput.trim());
    if (ok) {
      setSavedSuccess(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('landing');
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'September 2026';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="pb-6 border-b border-slate-200">
        <p className="text-xs font-semibold text-blue-700">Account Settings</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          View your account details and update your display name.
        </p>
      </div>

      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="text-xs font-medium text-slate-500">Name</div>
            <div className="mt-1 text-base font-bold text-slate-900">{user?.name}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Email</div>
            <div className="mt-1 text-sm font-medium text-slate-800 break-all">{user?.email}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Account Creation Date</div>
            <div className="mt-1 text-sm font-mono-num text-slate-800">{formattedDate}</div>
          </div>
        </div>

        {(localError || error) && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800"
          >
            {localError || error}
          </div>
        )}

        {savedSuccess && (
          <div
            role="status"
            className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800"
          >
            Your profile name has been updated successfully.
          </div>
        )}

        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label htmlFor="profile-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Update Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
              className="w-full sm:max-w-md px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? 'Saving...' : 'Update Name'}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Saved Plans ({plansCount})
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-900">Sign Out</div>
            <div className="text-xs text-slate-500">
              End your current session on this device.
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="px-5 py-2.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
