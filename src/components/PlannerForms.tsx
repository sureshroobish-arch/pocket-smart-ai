import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PageView, SavedPlan, formatINR } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface PlannerFormsProps {
  activePlanner: 'home' | 'party' | 'jewelry';
  onSwitchPlanner: (planner: 'home' | 'party' | 'jewelry') => void;
  onPlanGenerated: (plan: SavedPlan) => void;
  onNavigate: (page: PageView) => void;
}

export const PlannerForms: React.FC<PlannerFormsProps> = ({
  activePlanner,
  onSwitchPlanner,
  onPlanGenerated,
}) => {
  const { authFetch } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Home Planner State
  const [homeBudget, setHomeBudget] = useState<string>('50000');
  const [room, setRoom] = useState<string>('Living Room');
  const [homeType, setHomeType] = useState<string>('2BHK Apartment');
  const [requiredItems, setRequiredItems] = useState<string>(
    '3-Seater Sofa, LED Ceiling Lights, BLDC Ceiling Fans, 4-Seater Dining Table, Cotton Area Rug'
  );
  const [homeStyle, setHomeStyle] = useState<string>('Modern');
  const [homePriority, setHomePriority] = useState<string>('Balanced');
  const [homeAdditional, setHomeAdditional] = useState<string>(
    'Energy-efficient 5-star appliances and easy-to-clean upholstery.'
  );

  // Party Planner State
  const [partyBudget, setPartyBudget] = useState<string>('30000');
  const [partyType, setPartyType] = useState<string>('Birthday');
  const [guests, setGuests] = useState<string>('35');
  const [location, setLocation] = useState<string>('Indoor Banquet Lounge / Terrace');
  const [foodPreference, setFoodPreference] = useState<string>('Vegetarian Buffet & Welcome Mocktails');
  const [decorationPreference, setDecorationPreference] = useState<string>(
    'Warm Fairy String Lights & Pastel Floral Backdrop'
  );
  const [entertainmentPreference, setEntertainmentPreference] = useState<string>(
    'Bluetooth Party PA System & Interactive Games'
  );
  const [partyDate, setPartyDate] = useState<string>('2026-10-25');
  const [partyAdditional, setPartyAdditional] = useState<string>(
    'Include a 2kg Belgian chocolate celebration cake and eco-friendly tableware.'
  );

  // Jewelry Planner State
  const [jewelryBudget, setJewelryBudget] = useState<string>('100000');
  const [jewelryType, setJewelryType] = useState<string>('Set');
  const [occasion, setOccasion] = useState<string>('Wedding & Festive Reception');
  const [metal, setMetal] = useState<string>('Gold');
  const [jewelryStyle, setJewelryStyle] = useState<string>('Traditional');
  const [mainPiece, setMainPiece] = useState<string>('22K BIS Hallmarked Filigree Choker Necklace');
  const [matchingRequirements, setMatchingRequirements] = useState<string>(
    'Matching Jhumka Drop Earrings'
  );
  const [jewelryAdditional, setJewelryAdditional] = useState<string>(
    'Prefer 916 BIS HUID hallmarked gold with reasonable making charges.'
  );

  useEffect(() => {
    setError(null);
  }, [activePlanner]);

  const handleQuickItemToggle = (itemLabel: string) => {
    const currentList = requiredItems
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (currentList.includes(itemLabel)) {
      setRequiredItems(currentList.filter((i) => i !== itemLabel).join(', '));
    } else {
      setRequiredItems([...currentList, itemLabel].join(', '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let rawBudget = 0;
    let payload: Record<string, any> = {};

    if (activePlanner === 'home') {
      rawBudget = Number(homeBudget);
      if (!Number.isFinite(rawBudget) || rawBudget < 1000) {
        setError('Please enter a valid Total Budget of at least ₹1,000 for your Home Plan.');
        return;
      }
      if (!requiredItems.trim()) {
        setError('Please specify at least one Required Item for your Home Plan.');
        return;
      }
      payload = {
        room,
        homeType,
        requiredItems: requiredItems.trim(),
        style: homeStyle,
        priority: homePriority,
        additionalRequirements: homeAdditional.trim(),
      };
    } else if (activePlanner === 'party') {
      rawBudget = Number(partyBudget);
      const guestCount = Number(guests);
      if (!Number.isFinite(rawBudget) || rawBudget < 1000) {
        setError('Please enter a valid Total Budget of at least ₹1,000 for your Party Plan.');
        return;
      }
      if (!Number.isFinite(guestCount) || guestCount < 2) {
        setError('Please enter a valid Number of Guests (at least 2).');
        return;
      }
      if (!location.trim()) {
        setError('Please enter the party Location.');
        return;
      }
      payload = {
        partyType,
        guests: guestCount,
        location: location.trim(),
        foodPreference: foodPreference.trim(),
        decorationPreference: decorationPreference.trim(),
        entertainmentPreference: entertainmentPreference.trim(),
        date: partyDate,
        additionalRequirements: partyAdditional.trim(),
      };
    } else {
      rawBudget = Number(jewelryBudget);
      if (!Number.isFinite(rawBudget) || rawBudget < 1000) {
        setError('Please enter a valid Total Budget of at least ₹1,000 for your Jewelry Plan.');
        return;
      }
      if (!mainPiece.trim()) {
        setError('Please enter your preferred Main Piece.');
        return;
      }
      payload = {
        jewelryType,
        occasion: occasion.trim(),
        metal,
        style: jewelryStyle,
        mainPiece: mainPiece.trim(),
        matchingRequirements: matchingRequirements.trim(),
        additionalRequirements: jewelryAdditional.trim(),
      };
    }

    setGenerating(true);
    try {
      const res = await authFetch('/api/plans/generate', {
        method: 'POST',
        body: JSON.stringify({
          planType: activePlanner,
          budget: Math.round(rawBudget),
          requestData: payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error || 'Something went wrong while generating your plan. Please try again.'
        );
        return;
      }
      onPlanGenerated(data.plan);
    } catch {
      setError('Something went wrong while generating your plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const currentBudgetVal =
    activePlanner === 'home'
      ? Number(homeBudget) || 0
      : activePlanner === 'party'
      ? Number(partyBudget) || 0
      : Number(jewelryBudget) || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Segmented Planner Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-semibold text-blue-700">PocketSmart AI Recommendation Engine</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {activePlanner === 'home' && 'Home Budget Planner'}
            {activePlanner === 'party' && 'Party Budget Planner'}
            {activePlanner === 'jewelry' && 'Jewelry Budget Planner'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {activePlanner === 'home' && 'Plan your home purchases based on your available budget.'}
            {activePlanner === 'party' && 'Create a complete party plan without exceeding your budget.'}
            {activePlanner === 'jewelry' && 'Find suitable jewelry combinations within your budget.'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg self-start">
          <button
            type="button"
            disabled={generating}
            onClick={() => onSwitchPlanner('home')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activePlanner === 'home'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Home Planner
          </button>
          <button
            type="button"
            disabled={generating}
            onClick={() => onSwitchPlanner('party')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activePlanner === 'party'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Party Planner
          </button>
          <button
            type="button"
            disabled={generating}
            onClick={() => onSwitchPlanner('jewelry')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activePlanner === 'jewelry'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Jewelry Planner
          </button>
        </div>
      </div>

      {/* AI Loading State Overlay */}
      {generating && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 bg-slate-900 text-white rounded-xl p-6 sm:p-8 border border-slate-800 shadow-md"
        >
          <div className="flex items-center gap-4">
            <Loader2 className="w-7 h-7 text-amber-400 animate-spin shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                PocketSmart AI is creating your smart plan...
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Analyzing your {formatINR(currentBudgetVal)} budget cap, allocating category percentages, and verifying Indian market prices so total spend never exceeds your limit.
              </p>
            </div>
          </div>
          <div className="mt-5 w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full w-2/3 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}

      {/* FORM CARD */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
        noValidate
      >
        {/* A. HOME PLANNER FIELDS */}
        {activePlanner === 'home' && (
          <>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label htmlFor="home-budget" className="text-xs font-semibold text-slate-700">
                  Total Budget (in ₹) *
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[25000, 50000, 100000, 200000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setHomeBudget(String(preset))}
                      className={`px-2.5 py-1 text-xs font-mono-num rounded border transition-colors cursor-pointer ${
                        Number(homeBudget) === preset
                          ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {formatINR(preset)}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="home-budget"
                type="number"
                min={1000}
                step={500}
                value={homeBudget}
                onChange={(e) => setHomeBudget(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-base font-mono-num font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="home-room" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Room / Area *
                </label>
                <select
                  id="home-room"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Living Room">Living Room</option>
                  <option value="Bedroom">Bedroom</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Dining Room">Dining Room</option>
                  <option value="Full Home">Full Home</option>
                </select>
              </div>

              <div>
                <label htmlFor="home-type" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Home Type *
                </label>
                <select
                  id="home-type"
                  value={homeType}
                  onChange={(e) => setHomeType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="1BHK Apartment">1BHK Apartment</option>
                  <option value="2BHK Apartment">2BHK Apartment</option>
                  <option value="3BHK Apartment">3BHK Apartment</option>
                  <option value="Independent House / Villa">Independent House / Villa</option>
                  <option value="Studio / Rental Flat">Studio / Rental Flat</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="home-items" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Required Items *
              </label>
              <input
                id="home-items"
                type="text"
                value={requiredItems}
                onChange={(e) => setRequiredItems(e.target.value)}
                placeholder="e.g., Sofa, LED Ceiling Lights, BLDC Fans, Dining Table, Rug"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500 mr-1">Quick toggle:</span>
                {[
                  '3-Seater Sofa',
                  'LED Ceiling Lights',
                  'BLDC Ceiling Fans',
                  '4-Seater Dining Table',
                  'Cotton Area Rug',
                  'Study Desk & Chair',
                  'Blackout Curtains',
                ].map((item) => {
                  const active = requiredItems.toLowerCase().includes(item.toLowerCase());
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleQuickItemToggle(item)}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
                        active
                          ? 'bg-blue-50 border-blue-300 text-blue-800 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {active ? `✓ ${item}` : `+ ${item}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="home-style" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Style Preference *
                </label>
                <select
                  id="home-style"
                  value={homeStyle}
                  onChange={(e) => setHomeStyle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Modern">Modern</option>
                  <option value="Minimal">Minimal</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Budget Friendly">Budget Friendly</option>
                </select>
              </div>

              <div>
                <label htmlFor="home-priority" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Priority *
                </label>
                <select
                  id="home-priority"
                  value={homePriority}
                  onChange={(e) => setHomePriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Essential">Essential</option>
                  <option value="Balanced">Balanced</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="home-additional" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Additional Requirements
              </label>
              <textarea
                id="home-additional"
                rows={3}
                value={homeAdditional}
                onChange={(e) => setHomeAdditional(e.target.value)}
                placeholder="Any specific colors, dimensions, or brand preferences?"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 px-6 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {generating ? 'Generating Home Plan...' : 'Generate Home Plan'}
            </button>
          </>
        )}

        {/* B. PARTY PLANNER FIELDS */}
        {activePlanner === 'party' && (
          <>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label htmlFor="party-budget" className="text-xs font-semibold text-slate-700">
                  Total Budget (in ₹) *
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[15000, 30000, 50000, 100000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPartyBudget(String(preset))}
                      className={`px-2.5 py-1 text-xs font-mono-num rounded border transition-colors cursor-pointer ${
                        Number(partyBudget) === preset
                          ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {formatINR(preset)}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="party-budget"
                type="number"
                min={1000}
                step={500}
                value={partyBudget}
                onChange={(e) => setPartyBudget(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-base font-mono-num font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="party-type" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Party Type *
                </label>
                <select
                  id="party-type"
                  value={partyType}
                  onChange={(e) => setPartyType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Birthday">Birthday</option>
                  <option value="College Event">College Event</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Family Function">Family Function</option>
                  <option value="Celebration">Celebration</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="party-guests" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Number of Guests *
                </label>
                <input
                  id="party-guests"
                  type="number"
                  min={2}
                  max={2000}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="party-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date *
                </label>
                <input
                  id="party-date"
                  type="date"
                  value={partyDate}
                  onChange={(e) => setPartyDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="party-location" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Location *
                </label>
                <input
                  id="party-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Community Hall, Rooftop Cafe, Home Lawn"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="party-food" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Food Preference *
                </label>
                <input
                  id="party-food"
                  type="text"
                  value={foodPreference}
                  onChange={(e) => setFoodPreference(e.target.value)}
                  placeholder="e.g., Pure Veg Buffet, Starters & Mocktails"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="party-decor" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Decoration Preference
                </label>
                <input
                  id="party-decor"
                  type="text"
                  value={decorationPreference}
                  onChange={(e) => setDecorationPreference(e.target.value)}
                  placeholder="e.g., Balloon Arch, Warm Fairy Lights, Floral Stage"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="party-entertainment" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Entertainment Preference
                </label>
                <input
                  id="party-entertainment"
                  type="text"
                  value={entertainmentPreference}
                  onChange={(e) => setEntertainmentPreference(e.target.value)}
                  placeholder="e.g., DJ Sound System, Live Acoustic Guitar, Party Games"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="party-additional" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Additional Requirements
              </label>
              <textarea
                id="party-additional"
                rows={3}
                value={partyAdditional}
                onChange={(e) => setPartyAdditional(e.target.value)}
                placeholder="Any custom cake flavor, return gifts, or photography requirements?"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 px-6 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {generating ? 'Generating Party Plan...' : 'Generate Party Plan'}
            </button>
          </>
        )}

        {/* C. JEWELRY PLANNER FIELDS */}
        {activePlanner === 'jewelry' && (
          <>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label htmlFor="jewelry-budget" className="text-xs font-semibold text-slate-700">
                  Total Budget (in ₹) *
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[25000, 50000, 100000, 250000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setJewelryBudget(String(preset))}
                      className={`px-2.5 py-1 text-xs font-mono-num rounded border transition-colors cursor-pointer ${
                        Number(jewelryBudget) === preset
                          ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {formatINR(preset)}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="jewelry-budget"
                type="number"
                min={1000}
                step={1000}
                value={jewelryBudget}
                onChange={(e) => setJewelryBudget(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-base font-mono-num font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="jewelry-type" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jewelry Type *
                </label>
                <select
                  id="jewelry-type"
                  value={jewelryType}
                  onChange={(e) => setJewelryType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Necklace">Necklace</option>
                  <option value="Earrings">Earrings</option>
                  <option value="Bracelet">Bracelet</option>
                  <option value="Ring">Ring</option>
                  <option value="Set">Set</option>
                </select>
              </div>

              <div>
                <label htmlFor="jewelry-metal" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preferred Metal *
                </label>
                <select
                  id="jewelry-metal"
                  value={metal}
                  onChange={(e) => setMetal(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="jewelry-style" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Style *
                </label>
                <select
                  id="jewelry-style"
                  value={jewelryStyle}
                  onChange={(e) => setJewelryStyle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Traditional">Traditional</option>
                  <option value="Modern">Modern</option>
                  <option value="Minimal">Minimal</option>
                  <option value="Elegant">Elegant</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="jewelry-occasion" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Occasion *
                </label>
                <input
                  id="jewelry-occasion"
                  type="text"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder="e.g., Wedding Reception, Anniversary, Diwali Gift"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label htmlFor="jewelry-main-piece" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Main Piece *
                </label>
                <input
                  id="jewelry-main-piece"
                  type="text"
                  value={mainPiece}
                  onChange={(e) => setMainPiece(e.target.value)}
                  placeholder="e.g., 22K Gold Choker Necklace, Solitaire Ring"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="jewelry-matching" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Matching Requirements
              </label>
              <input
                id="jewelry-matching"
                type="text"
                value={matchingRequirements}
                onChange={(e) => setMatchingRequirements(e.target.value)}
                placeholder="e.g., Matching Jhumka Drop Earrings or Thin Bangle"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="jewelry-additional" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Additional Requirements
              </label>
              <textarea
                id="jewelry-additional"
                rows={3}
                value={jewelryAdditional}
                onChange={(e) => setJewelryAdditional(e.target.value)}
                placeholder="Hallmark certification, stone preferences, or weight target?"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 px-6 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {generating ? 'Generating Jewelry Plan...' : 'Generate Jewelry Plan'}
            </button>
          </>
        )}
      </form>
    </div>
  );
};
