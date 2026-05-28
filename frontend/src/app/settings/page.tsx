'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
            <p className="text-slate-500 text-sm">Customize how Wandr works for you</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Notifications</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Trip reminders</p>
                  <p className="text-xs text-slate-500">Get notified before upcoming trips</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-indigo-600" />
              </label>
              <label className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">AI tips</p>
                  <p className="text-xs text-slate-500">Receive quick suggestions for your itinerary</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-indigo-600" />
              </label>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Preferences</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Default budget</label>
                <select
                  defaultValue="Mid-range"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option>Budget</option>
                  <option>Mid-range</option>
                  <option>Luxury</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Currency</label>
                <select
                  defaultValue="USD"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option>USD</option>
                  <option>EUR</option>
                  <option>INR</option>
                  <option>JPY</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                type="button"
              >
                Save changes
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
