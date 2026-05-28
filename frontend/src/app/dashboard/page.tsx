'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import TripCard from '@/components/TripCard';
import TripCardSkeleton from '@/components/TripCardSkeleton';
import { useToast } from '@/components/ui/Toaster';
import { MapPin, Globe, Calendar, Luggage, Plus } from 'lucide-react';

interface Trip {
  _id: string;
  destination: string;
  days: number;
  budget: string;
  interests: string[];
  tripTitle: string;
  aiSummary: string;
  itinerary: any[];
  createdAt: string;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
        <Luggage size={40} className="text-indigo-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-700 mb-2">No trips planned yet</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-xs">Let Gemini AI build your perfect itinerary in seconds</p>
      <button onClick={onNew} className="max-w-xs w-full py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
        <Plus size={18} /> Plan your first trip
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchTrips = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/trips`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setTrips(data.trips || []);
    } catch { showToast('Failed to load trips', 'error'); }
    finally { setLoading(false); }
  }, [token, API, showToast]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/trips/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setTrips((p) => p.filter((t) => t._id !== id)); showToast('Trip deleted', 'success'); }
    } catch { showToast('Failed to delete trip', 'error'); }
  };

  const filtered = trips.filter((t) =>
    t.destination?.toLowerCase().includes(search.toLowerCase()) || t.tripTitle?.toLowerCase().includes(search.toLowerCase())
  );

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };

  const uniqueCountries = new Set(
    trips
      .map((t) => {
        const parts = t.destination?.split(',').map((p) => p.trim()).filter(Boolean) || [];
        return parts.length > 1 ? parts[parts.length - 1] : parts[0];
      })
      .filter(Boolean)
  ).size;
  const totalDays = trips.reduce((acc, t) => acc + (t.days || 0), 0);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar onSearch={setSearch} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-8 mb-8 overflow-hidden text-white">
            <div className="absolute inset-0 opacity-10">
              <svg viewBox="0 0 1200 400" className="w-full h-full" fill="currentColor">
                <circle cx="200" cy="200" r="150" opacity="0.3"/>
                <circle cx="800" cy="100" r="200" opacity="0.2"/>
                <circle cx="1100" cy="300" r="100" opacity="0.3"/>
              </svg>
            </div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-1">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
              <p className="text-indigo-200 text-lg">Where are you headed next?</p>
              <button onClick={() => router.push('/trips/new')} className="mt-5 inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold py-2.5 px-5 rounded-lg text-sm hover:bg-indigo-50 transition-colors">
                <Plus size={16} /> Plan a new trip
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard icon={<MapPin size={22} />} label="Trips Planned" value={trips.length} />
            <StatCard icon={<Globe size={22} />} label="Countries" value={uniqueCountries} />
            <StatCard icon={<Calendar size={22} />} label="Days Travelled" value={totalDays} />
          </div>

          {/* Trips */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-slate-800">My Trips</h2>
            {trips.length > 0 && <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all</button>}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <TripCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 && !search ? (
            <EmptyState onNew={() => router.push('/trips/new')} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">No trips found for &quot;{search}&quot;</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((trip) => <TripCard key={trip._id} trip={trip} onDelete={handleDelete} />)}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
