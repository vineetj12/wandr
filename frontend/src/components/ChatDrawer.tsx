'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

const QUICK_QUESTIONS = [
  'Best ramen near Shinjuku?',
  'Is Day 3 walkable?',
  'Vegan options near Asakusa?',
  'What to pack for 5 days?',
  'Cheapest way from airport?',
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <Sparkles size={13} className="text-indigo-600" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot`}
              style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^• /gm, '&bull; ')
    .replace(/\n/g, '<br/>');
}

export default function ChatDrawer({ trip, onClose }: { trip: any; onClose: () => void }) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [firstSent, setFirstSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const send = async (message: string) => {
    if (!message.trim() || loading) return;
    setFirstSent(true);
    const userMsg: Message = { role: 'user', content: message, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, tripId: trip._id }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        role: 'ai',
        content: res.ok ? data.reply : 'Sorry, I could not get a response. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Connection error. Please try again.', timestamp: '' }]);
    } finally {
      setLoading(false);
    }
  };

  const remaining = 500 - input.length;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-[380px] h-full bg-white shadow-2xl flex flex-col drawer-enter">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm">Travel Buddy</h3>
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Gemini</span>
            </div>
            <p className="text-xs text-slate-500 truncate">Ask anything about your {trip.destination} trip</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Welcome state */}
          {messages.length === 0 && (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✦</div>
              <p className="text-sm text-slate-500 font-medium">Hi! I know all about your {trip.destination} trip.</p>
              <p className="text-xs text-slate-400 mt-1">Ask me anything!</p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}>
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={13} className="text-indigo-600" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? '' : ''}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'}`}
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                />
                {msg.timestamp && (
                  <p className={`text-[10px] text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </p>
                )}
              </div>
            </div>
          ))}

          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick questions */}
        {!firstSent && (
          <div className="px-4 pb-3">
            <p className="text-xs text-slate-400 font-medium mb-2">Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} onClick={() => send(q)}
                  className="text-xs px-3 py-1.5 border border-slate-200 rounded-full text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-slate-200 bg-white">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                maxLength={500}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Ask about your trip..."
                className="w-full px-4 py-2.5 pr-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
              {input.length > 400 && (
                <p className={`absolute -top-5 right-0 text-[10px] ${remaining < 50 ? 'text-red-500' : 'text-slate-400'}`}>
                  {remaining} chars left
                </p>
              )}
            </div>
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center
                hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
