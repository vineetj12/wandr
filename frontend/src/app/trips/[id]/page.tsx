'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatDrawer from '@/components/ChatDrawer';
import { useToast } from '@/components/ui/Toaster';
import {
  ArrowLeft, RefreshCw, Download, Plus, Trash2, Pencil,
  Sparkles, X, Check, GripVertical, Clock, MapPin, Star
} from 'lucide-react';

interface Activity {
  time: string; name: string; description: string; category: string; duration: string;
}
interface Day { day: number; title: string; activities: Activity[]; }
interface Budget { flights: number; accommodation: number; food: number; activities: number; misc: number; total: number; currency: string; }
interface Hotel { name: string; tier: string; rating: number; description: string; }
interface Trip {
  _id: string; destination: string; days: number; budget: string; tripTitle: string;
  itinerary: Day[]; budgetEstimate: Budget; hotels: Hotel[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Culture: 'bg-purple-100 text-purple-700',
  Food: 'bg-orange-100 text-orange-700',
  Adventure: 'bg-green-100 text-green-700',
  Shopping: 'bg-pink-100 text-pink-700',
  Nature: 'bg-emerald-100 text-emerald-700',
  Nightlife: 'bg-blue-100 text-blue-700',
  History: 'bg-amber-100 text-amber-700',
  Art: 'bg-violet-100 text-violet-700',
  Beaches: 'bg-cyan-100 text-cyan-700',
  Wellness: 'bg-teal-100 text-teal-700',
};

const TIER_STYLES: Record<string, string> = {
  Budget: 'bg-green-100 text-green-700 border-green-200',
  'Mid-range': 'bg-blue-100 text-blue-700 border-blue-200',
  Luxury: 'bg-amber-100 text-amber-700 border-amber-200',
};

function ActivityCard({ activity, onDelete }: { activity: Activity; onDelete: () => void }) {
  const [hovering, setHovering] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`bg-white rounded-xl border transition-all duration-200 p-4 flex items-start gap-3
        ${hovering ? 'border-indigo-300 shadow-md' : 'border-slate-100 shadow-sm'}`}
    >
      {/* Drag handle */}
      <div className={`mt-1 flex-shrink-0 transition-opacity ${hovering ? 'opacity-100' : 'opacity-0'}`}>
        <GripVertical size={16} className="text-slate-300 cursor-grab" />
      </div>

      {/* Time */}
      <div className="flex-shrink-0">
        <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          <Clock size={11} /> {activity.time}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-slate-800 text-sm leading-tight">{activity.name}</h4>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{activity.description}</p>
        <div className="flex gap-2 mt-2">
          {activity.category && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[activity.category] || 'bg-slate-100 text-slate-600'}`}>
              {activity.category}
            </span>
          )}
          {activity.duration && (
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{activity.duration}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={`flex gap-1 flex-shrink-0 transition-opacity ${hovering ? 'opacity-100' : 'opacity-0'}`}>
        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function BudgetPanel({ budget }: { budget: Budget }) {
  const rows = [
    { label: 'Flights', value: budget?.flights },
    { label: 'Accommodation', value: budget?.accommodation },
    { label: 'Food & Dining', value: budget?.food },
    { label: 'Activities', value: budget?.activities },
    { label: 'Misc', value: budget?.misc },
  ];
  const currency = budget?.currency || 'USD';
  const fmt = (v: number) => `$${(v || 0).toLocaleString()}`;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-slate-800">Estimated Budget</h3>
        <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">✦ AI</span>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between group">
            <span className="text-sm text-slate-600">{r.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-700 font-medium">{fmt(r.value)}</span>
              <Pencil size={12} className="text-slate-300 group-hover:text-slate-500 cursor-pointer transition-colors" />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 mt-4 pt-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800">Total Estimated</span>
          <span className="text-lg font-bold text-indigo-600">{fmt(budget?.total)}</span>
        </div>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Estimates based on {currency} spending. Actual costs may vary.
        </p>
      </div>
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 min-w-[220px] flex-shrink-0">
      <h4 className="font-semibold text-slate-800 text-sm mb-1">{hotel.name}</h4>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex text-amber-400">
          {[...Array(Math.round(hotel.rating || 4))].map((_, i) => (
            <Star key={i} size={12} fill="currentColor" />
          ))}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TIER_STYLES[hotel.tier] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {hotel.tier}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{hotel.description}</p>
      <a href={`https://maps.google.com/?q=${encodeURIComponent(hotel.name)}`} target="_blank" rel="noopener noreferrer"
        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
        <MapPin size={11} /> View on Google Maps ↗
      </a>
    </div>
  );
}

export default function ItineraryPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [regeneratingDay, setRegeneratingDay] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [showInstructionInput, setShowInstructionInput] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tripTitle, setTripTitle] = useState('');

  const fetchTrip = useCallback(async () => {
    if (!token || !id) return;
    try {
      const res = await fetch(`${API}/api/trips/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { setTrip(data.trip); setTripTitle(data.trip.tripTitle || data.trip.destination); }
      else router.push('/dashboard');
    } catch { router.push('/dashboard'); }
    finally { setLoading(false); }
  }, [token, id, API, router]);

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  const currentDay = trip?.itinerary?.find((d) => d.day === activeDay);

  const handleRegenerateDay = async () => {
    setRegeneratingDay(true);
    try {
      const res = await fetch(`${API}/api/ai/regenerate-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tripId: id, dayNumber: activeDay, userInstruction: instruction }),
      });
      const data = await res.json();
      if (res.ok) { setTrip(data.trip); showToast('Day regenerated!', 'success'); setInstruction(''); setShowInstructionInput(false); }
      else showToast(data.error || 'Regeneration failed', 'error');
    } catch { showToast('Regeneration failed', 'error'); }
    finally { setRegeneratingDay(false); }
  };

  const handleDeleteActivity = async (dayNum: number, actIndex: number) => {
    if (!trip) return;
    const updatedItinerary = trip.itinerary.map((d) =>
      d.day === dayNum ? { ...d, activities: d.activities.filter((_, i) => i !== actIndex) } : d
    );
    try {
      const res = await fetch(`${API}/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itinerary: updatedItinerary }),
      });
      const data = await res.json();
      if (res.ok) setTrip(data.trip);
    } catch { showToast('Failed to delete activity', 'error'); }
  };

  const handleSaveTitle = async () => {
    setEditingTitle(false);
    try {
      await fetch(`${API}/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tripTitle }),
      });
    } catch {}
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!trip) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8FAFC] flex">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-200 fixed left-0 top-0 h-screen py-6 px-4 z-30">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
            <ArrowLeft size={15} /> Dashboard
          </button>

          {/* Trip title */}
          <div className="mb-6">
            {editingTitle ? (
              <div className="flex items-center gap-1">
                <input value={tripTitle} onChange={(e) => setTripTitle(e.target.value)}
                  className="flex-1 text-sm font-bold border-b-2 border-indigo-400 outline-none bg-transparent" autoFocus />
                <button onClick={handleSaveTitle} className="text-green-500"><Check size={14} /></button>
                <button onClick={() => setEditingTitle(false)} className="text-slate-400"><X size={14} /></button>
              </div>
            ) : (
              <button onClick={() => setEditingTitle(true)} className="flex items-center gap-2 text-left group w-full">
                <span className="font-bold text-slate-800 text-sm leading-tight flex-1">{tripTitle}</span>
                <Pencil size={13} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
              </button>
            )}
          </div>

          {/* Day nav */}
          <div className="space-y-1.5 flex-1">
            {trip.itinerary?.map((d) => (
              <button key={d.day} onClick={() => setActiveDay(d.day)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeDay === d.day ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200'}`}>
                Day {d.day}
                {d.title && <span className={`block text-xs truncate mt-0.5 ${activeDay === d.day ? 'text-indigo-200' : 'text-slate-400'}`}>{d.title}</span>}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-2 mt-4">
            <button className="w-full flex items-center gap-2 text-xs text-slate-600 hover:text-red-600 py-2 px-3 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 transition-all">
              <RefreshCw size={13} /> Regenerate full trip
            </button>
            <button className="w-full flex items-center gap-2 text-xs text-slate-600 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all">
              <Download size={13} /> Export as PDF
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 lg:ml-60">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Mobile day tabs */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
              {trip.itinerary?.map((d) => (
                <button key={d.day} onClick={() => setActiveDay(d.day)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${activeDay === d.day ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  Day {d.day}
                </button>
              ))}
            </div>

            {/* Day header */}
            {currentDay && (
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">Day {currentDay.day}</h1>
                  <p className="text-slate-500 mt-0.5 text-base">{currentDay.title}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => setShowInstructionInput(!showInstructionInput)}
                    disabled={regeneratingDay}
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-50">
                    {regeneratingDay ? <><div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> Regenerating...</>
                      : <><Sparkles size={15} /> Regenerate day</>}
                  </button>
                  {showInstructionInput && !regeneratingDay && (
                    <div className="flex gap-2 w-full">
                      <input value={instruction} onChange={(e) => setInstruction(e.target.value)}
                        placeholder="e.g. more outdoor, avoid museums"
                        className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-0" />
                      <button onClick={handleRegenerateDay}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex-shrink-0">
                        Go
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Activities */}
              <div className="xl:col-span-2 space-y-3">
                {currentDay?.activities?.map((act, i) => (
                  <ActivityCard key={i} activity={act}
                    onDelete={() => handleDeleteActivity(activeDay, i)} />
                ))}

                {/* Add activity */}
                <button className="w-full py-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2">
                  <Plus size={16} /> Add activity to Day {activeDay}
                </button>
              </div>

              {/* Budget */}
              <div className="xl:col-span-1">
                {trip.budgetEstimate && <BudgetPanel budget={trip.budgetEstimate} />}
              </div>
            </div>

            {/* Hotels */}
            {trip.hotels && trip.hotels.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">Recommended Hotels</h2>
                  <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                    ✦ Powered by Gemini
                  </span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {trip.hotels.map((h, i) => <HotelCard key={i} hotel={h} />)}
                </div>
                <button className="mt-3 text-xs text-slate-500 hover:text-indigo-600 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                  <RefreshCw size={12} /> Regenerate suggestions
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat FAB */}
        <div className="fixed bottom-6 right-6 z-50">
          {!chatOpen && (
            <div className="relative group">
              <button onClick={() => setChatOpen(true)}
                className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700
                  transition-all active:scale-95 flex items-center justify-center hover:shadow-xl">
                <Sparkles size={22} />
              </button>
              <div className="absolute bottom-full right-0 mb-2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap
                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Ask your Travel Buddy
              </div>
            </div>
          )}
        </div>

        {/* Chat Drawer */}
        {chatOpen && (
          <ChatDrawer trip={trip} onClose={() => setChatOpen(false)} />
        )}
      </div>
    </ProtectedRoute>
  );
}
