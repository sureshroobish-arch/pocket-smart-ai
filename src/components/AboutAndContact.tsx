import React, { useState } from 'react';
import { PageView } from '../types/index.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface AboutSectionProps {
  onNavigate?: (page: PageView) => void;
  isStandalone?: boolean;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onNavigate, isStandalone = false }) => {
  return (
    <section className={`${isStandalone ? 'py-12' : 'py-16 border-t border-slate-200'} bg-white`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold text-blue-700 tracking-wide">
            About PocketSmart AI
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Designed for disciplined spending and confident purchasing decisions
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            PocketSmart AI is a smart budgeting and recommendation platform designed to help users make better spending decisions based on their available budget and personal requirements. Every recommendation is calibrated in Indian Rupees (₹) so that total spending never exceeds your entered budget cap.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 flex flex-col">
            <ResilientImage
              src="/src/assets/images/planner_home_living_1790660873870.jpg"
              alt="Modern Indian apartment living room with warm teak furniture and ambient lighting"
              className="w-full h-44 object-cover"
              fallbackTitle="Home Budget Planning"
            />
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-xs text-slate-500">
                  <span>01. Home Planning</span>
                  <span aria-hidden="true"> · </span>
                  <span>5 Core Allocations</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  Home Budget Planner
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Allocates your budget across Furniture, Lighting, BLDC Fans, Dining, and Decor &amp; Essentials tailored to your room, home type, and style preference.
                </p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('home-planner')}
                  className="mt-5 text-xs font-semibold text-blue-700 hover:text-blue-900 text-left cursor-pointer"
                >
                  Open Home Planner →
                </button>
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 flex flex-col">
            <ResilientImage
              src="/src/assets/images/planner_party_event_1790660887731.jpg"
              alt="Celebration dining and event setup with warm string lights and floral centerpiece"
              className="w-full h-44 object-cover"
              fallbackTitle="Party Budget Planning"
            />
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-xs text-slate-500">
                  <span>02. Party Planning</span>
                  <span aria-hidden="true"> · </span>
                  <span>Per-Guest Calibration</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  Party Budget Planner
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Balances Venue, Food &amp; Drinks, Decorations, Entertainment, and a 10% Contingency reserve for birthdays, college events, anniversaries, and family functions.
                </p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('party-planner')}
                  className="mt-5 text-xs font-semibold text-blue-700 hover:text-blue-900 text-left cursor-pointer"
                >
                  Open Party Planner →
                </button>
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 flex flex-col">
            <ResilientImage
              src="/src/assets/images/planner_jewelry_collection_1790660900157.jpg"
              alt="Crafted 22k gold necklace and matching earrings on dark velvet pedestal"
              className="w-full h-44 object-cover"
              fallbackTitle="Jewelry Budget Planning"
            />
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-xs text-slate-500">
                  <span>03. Jewelry Planning</span>
                  <span aria-hidden="true"> · </span>
                  <span>Metal &amp; Making Reserve</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  Jewelry Budget Planner
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Structures spending across Main Piece, Matching Piece, Care &amp; Packaging, and Hallmarking/GST Buffer for Gold, Silver, and Platinum purchases.
                </p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('jewelry-planner')}
                  className="mt-5 text-xs font-semibold text-blue-700 hover:text-blue-900 text-left cursor-pointer"
                >
                  Open Jewelry Planner →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const ContactSection: React.FC<{ isStandalone?: boolean }> = ({ isStandalone = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (message.trim().length < 5) {
      setError('Please enter a message of at least 5 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not send message. Please try again.');
      } else {
        setSuccessMsg(
          data.message || 'Thank you! Your message has been saved and our team will get back to you.'
        );
        setName('');
        setEmail('');
        setMessage('');
      }
    } catch {
      setError('Network error while sending message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={`${isStandalone ? 'py-12' : 'py-16 border-t border-slate-200'} bg-slate-50`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
          <p className="text-xs font-semibold text-blue-700">Contact Us</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Have questions or feedback about PocketSmart AI?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Send us a message below and we will store your inquiry in our database and respond promptly.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800"
            >
              {error}
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800"
            >
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help you plan your budget better?"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? 'Sending Message...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
