'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, LogOut, ChevronDown, User, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface NavbarProps { onSearch?: (q: string) => void; }

export default function Navbar({ onSearch }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropOpen, setDropOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!onSearch) return undefined;
    const timeout = setTimeout(() => onSearch(searchValue), 300);
    return () => clearTimeout(timeout);
  }, [onSearch, searchValue]);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'W';

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button onClick={() => router.push('/dashboard')} className="text-xl font-bold text-indigo-600 flex-shrink-0 hover:text-indigo-700 transition-colors">
            Wandr ✈
          </button>

          {/* Search */}
          {onSearch && (
            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search your trips..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/trips/new')}
              className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors active:scale-95">
              <Plus size={16} /> New Trip
            </button>

            {/* Avatar dropdown */}
            <div className="relative" ref={dropRef}>
              <button onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 hover:bg-slate-50 rounded-lg p-1.5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {initials}
                </div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setDropOpen(false); router.push('/profile'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User size={15} className="text-slate-400" /> Profile
                  </button>
                  <button
                    onClick={() => { setDropOpen(false); router.push('/settings'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings size={15} className="text-slate-400" /> Settings
                  </button>
                  <div className="border-t border-slate-100 mt-1" />
                  <button onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
