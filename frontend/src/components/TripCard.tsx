'use client';

import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Trash2, Copy } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Trip {
  _id: string;
  destination: string;
  days: number;
  budget: string;
  interests: string[];
  tripTitle: string;
  aiSummary: string;
  itinerary: any[];
}

const BUDGET_COLORS: Record<string, string> = {
  Budget: 'bg-green-100 text-green-700',
  'Mid-range': 'bg-blue-100 text-blue-700',
  Luxury: 'bg-amber-100 text-amber-700',
};

const FLAG_MAP: Record<string, string> = {
  Japan: '🇯🇵', France: '🇫🇷', Indonesia: '🇮🇩', USA: '🇺🇸', Bali: '🇮🇩',
  Dubai: '🇦🇪', UAE: '🇦🇪', Italy: '🇮🇹', Thailand: '🇹🇭', UK: '🇬🇧',
  London: '🇬🇧', Tokyo: '🇯🇵', Paris: '🇫🇷', Rome: '🇮🇹', Bangkok: '🇹🇭',
};

function getFlag(destination: string): string {
  for (const [key, flag] of Object.entries(FLAG_MAP)) {
    if (destination?.toLowerCase().includes(key.toLowerCase())) return flag;
  }
  return '🌍';
}

export default function TripCard({ trip, onDelete }: { trip: Trip; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const tags = [
    `${trip.days} Days`,
    trip.budget,
    ...(trip.interests || []).slice(0, 2),
  ];

  return (
    <div
      className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg
        transition-all duration-200 hover:-translate-y-0.5 cursor-pointer relative overflow-hidden"
      onClick={() => router.push(`/trips/${trip._id}`)}
    >
      {/* AI Badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
          ✦ AI
        </span>
      </div>

      <div className="p-5">
        {/* Destination */}
        <div className="pr-12 mb-3">
          <h3 className="text-lg font-bold text-slate-800 leading-tight">
            {getFlag(trip.destination)} {trip.tripTitle || trip.destination}
          </h3>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <span key={tag}
              className={`text-xs font-medium px-2.5 py-1 rounded-full
                ${tag === trip.budget ? BUDGET_COLORS[tag] || 'bg-slate-100 text-slate-600'
                  : 'bg-slate-100 text-slate-600'}`}>
              {tag}
            </span>
          ))}
        </div>

        {/* AI Summary */}
        {trip.aiSummary && (
          <p className="text-xs text-amber-700 italic bg-amber-50 rounded-lg px-3 py-2 mb-4 border border-amber-100 line-clamp-2">
            ✦ {trip.aiSummary}
          </p>
        )}

        {/* Bottom actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/trips/${trip._id}`); }}
            className="text-sm font-medium text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg
              hover:bg-indigo-50 transition-colors"
          >
            View Itinerary
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/trips/${trip._id}`); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Eye size={14} /> View itinerary
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Copy size={14} /> Duplicate
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(trip._id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
