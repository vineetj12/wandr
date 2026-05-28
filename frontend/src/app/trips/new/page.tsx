'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Check, ChevronRight, ChevronLeft, MapPin, Minus, Plus, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/Toaster';

const DESTINATIONS = [
  { name: 'Tokyo', flag: '🇯🇵' }, { name: 'Paris', flag: '🇫🇷' }, { name: 'Bali', flag: '🇮🇩' },
  { name: 'New York', flag: '🇺🇸' }, { name: 'Dubai', flag: '🇦🇪' }, { name: 'Rome', flag: '🇮🇹' },
  { name: 'Bangkok', flag: '🇹🇭' }, { name: 'London', flag: '🇬🇧' },
];

const BUDGETS = [
  { id: 'Budget', icon: '🎒', label: 'Budget', sub: 'Hostels · Street food · Public transit' },
  { id: 'Mid-range', icon: '🧳', label: 'Mid-range', sub: '3-star hotels · Casual dining · Rideshare' },
  { id: 'Luxury', icon: '👑', label: 'Luxury', sub: '5-star hotels · Fine dining · Private transfers' },
];

const INTERESTS = [
  '🍜 Food', '🏛 Culture', '🧗 Adventure', '🛍 Shopping', '🌿 Nature',
  '🎵 Nightlife', '📜 History', '🎨 Art', '🏖 Beaches', '🧘 Wellness',
];

const CHECKLIST = [
  'Researching your destination...',
  'Crafting your day-by-day plan...',
  'Estimating your budget...',
  'Finding hotel recommendations...',
  'Finalizing your itinerary...',
];

function Stepper({ step }: { step: number }) {
  const steps = ['Destination', 'Preferences', 'Generate'];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => {
        const idx = i + 1;
        const isActive = step === idx;
        const isDone = step > idx;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${isDone ? 'bg-indigo-600 border-indigo-600 text-white' : isActive ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-slate-400 bg-white'}`}>
                {isDone ? <Check size={16} /> : idx}
              </div>
              <span className={`text-xs font-medium ${isActive || isDone ? 'text-indigo-600' : 'text-slate-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 mb-5 transition-all ${step > idx ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function NewTripPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(5);
  const [budget, setBudget] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [checklistIdx, setChecklistIdx] = useState(0);
  const [tripId, setTripId] = useState('');

  const toggleInterest = (i: string) =>
    setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  const handleGenerate = async () => {
    if (!destination) return showToast('Please enter a destination', 'error');
    if (!budget) return showToast('Please choose a budget', 'error');

    setStep(3);

    try {
      // Step 1: Create trip
      const createRes = await fetch(`${API}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ destination, days, budget, interests: interests.map((i) => i.split(' ').slice(1).join(' ')) }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error);
      const newTripId = createData.trip._id;
      setTripId(newTripId);

      // Animate checklist
      const interval = setInterval(() => {
        setChecklistIdx((prev) => {
          if (prev >= CHECKLIST.length - 1) { clearInterval(interval); return prev; }
          return prev + 1;
        });
      }, 2200);

      // Step 2: Generate AI itinerary
      const genRes = await fetch(`${API}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tripId: newTripId }),
      });
      const genData = await genRes.json();
      clearInterval(interval);
      setChecklistIdx(CHECKLIST.length);

      if (!genRes.ok) throw new Error(genData.error);

      setTimeout(() => router.push(`/trips/${newTripId}`), 1000);
    } catch (err: any) {
      showToast(err.message || 'Generation failed', 'error');
      setStep(2);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8FAFC] py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors">
            <ChevronLeft size={16} /> Back to dashboard
          </button>

          <Stepper step={step} />

          {/* STEP 1 */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 fade-in">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Where do you want to go?</h2>

              <div className="relative mb-5">
                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="e.g. Tokyo, Paris, Bali"
                  value={destination} onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition-all" />
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {DESTINATIONS.map((d) => (
                  <button key={d.name} onClick={() => setDestination(d.name)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all
                      ${destination === d.name ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                    {d.flag} {d.name}
                  </button>
                ))}
              </div>

              <div className="mb-8">
                <h3 className="text-base font-semibold text-slate-700 mb-4">How many days?</h3>
                <div className="flex items-center justify-center gap-6">
                  <button onClick={() => setDays(Math.max(1, days - 1))}
                    className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all">
                    <Minus size={18} />
                  </button>
                  <span className="text-5xl font-bold text-indigo-600 w-16 text-center">{days}</span>
                  <button onClick={() => setDays(Math.min(30, days + 1))}
                    className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all">
                    <Plus size={18} />
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400 mt-2">Min 1 · Max 30</p>
              </div>

              <div className="flex justify-end">
                <button onClick={() => { if (!destination.trim()) return showToast('Enter a destination', 'error'); setStep(2); }}
                  className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors">
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 fade-in">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Set your preferences</h2>

              <h3 className="text-base font-semibold text-slate-700 mb-3">Choose your budget</h3>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {BUDGETS.map((b) => (
                  <button key={b.id} onClick={() => setBudget(b.id)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all
                      ${budget === b.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}>
                    {budget === b.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                    <span className="text-2xl mb-2 block">{b.icon}</span>
                    <p className="font-semibold text-slate-800 text-sm">{b.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">{b.sub}</p>
                  </button>
                ))}
              </div>

              <h3 className="text-base font-semibold text-slate-700 mb-3">What are your interests?</h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {INTERESTS.map((interest) => (
                  <button key={interest} onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all
                      ${interests.includes(interest) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                    {interest}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-600 border border-slate-200 font-medium py-3 px-6 rounded-xl hover:bg-slate-50 transition-colors">
                  <ChevronLeft size={18} /> Back
                </button>
                <button onClick={handleGenerate}
                  className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors">
                  <Sparkles size={18} /> Generate Itinerary
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Generating */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center fade-in">
              <div className="sparkle-pulse text-6xl mb-6">✦</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Building your perfect trip...</h2>
              <p className="text-slate-500 text-sm mb-8">Usually takes 10–15 seconds</p>

              <div className="text-left max-w-xs mx-auto space-y-3">
                {CHECKLIST.map((item, i) => {
                  const done = checklistIdx > i;
                  const active = checklistIdx === i;
                  return (
                    <div key={item} className={`flex items-center gap-3 check-in`}
                      style={{ animationDelay: `${i * 0.3}s`, opacity: checklistIdx >= i ? 1 : 0 }}>
                      {done ? (
                        <Check size={18} className="text-green-500 flex-shrink-0" />
                      ) : active ? (
                        <Loader2 size={18} className="text-indigo-500 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${done ? 'text-green-700 font-medium' : active ? 'text-indigo-700' : 'text-slate-400'}`}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => setStep(2)} className="mt-8 text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
