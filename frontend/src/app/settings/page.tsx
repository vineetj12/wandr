'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Settings</h1>
          <p className="text-slate-500 text-sm">App preferences will appear here.</p>
        </main>
      </div>
    </ProtectedRoute>
  );
}
