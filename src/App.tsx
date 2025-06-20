/// <reference types="vite/client" />

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient, User } from '@supabase/supabase-js';

// Fix for Vite env type errors
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const LANES = [
  { name: 'Café Ops', emoji: '🧑\u200d🍳' },
  { name: 'NestMap', emoji: '⚙️' },
  { name: 'Financial', emoji: '💸' },
  { name: 'Creative', emoji: '🎭' },
  { name: 'Life', emoji: '🧍' },
  { name: 'Partner Tasks', emoji: '🧠' },
  { name: 'Recovery', emoji: '🛑' }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedLane, setSelectedLane] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [lastWin, setLastWin] = useState('');
  const [brainDump, setBrainDump] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      supabase.from('focus_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const { lane, next_action, last_win, brain_dump } = data[0];
            setSelectedLane(lane);
            setNextAction(next_action);
            setLastWin(last_win);
            setBrainDump(brain_dump);
          }
        });
    }
  }, [user]);

  const saveEntry = async () => {
    if (!user) return;
    await supabase.from('focus_entries').insert({
      user_id: user.id,
      lane: selectedLane,
      next_action: nextAction,
      last_win: lastWin,
      brain_dump: brainDump
    });
  };

  const askFocusBot = async () => {
    const prompt = `You're FocusBot, a calm assistant for someone with executive dysfunction. The user is currently in the lane '${selectedLane}'. Their next action is: '${nextAction}'. Their last win was: '${lastWin}'. Their brain junk is: '${brainDump}'. Offer one gentle suggestion or break the task into a smaller piece.`;
    const res = await fetch('/api/focusbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    setAiResponse(data.reply);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">🧭 Today Lane Dashboard</h1>
      {!user ? (
        <button
          onClick={() => supabase.auth.signInWithOtp({ email: prompt('Enter your email for a magic link') || '' })}
          className="bg-violet-600 px-4 py-2 rounded-xl"
        >
          Sign In
        </button>
      ) : (
        <>
          <div className="flex overflow-x-auto gap-2 pb-2">
            {LANES.map((lane) => (
              <motion.button
                key={lane.name}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedLane(lane.name)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl transition-all text-lg font-medium shadow-md whitespace-nowrap ${selectedLane === lane.name ? 'bg-violet-600' : 'bg-gray-700'}`}
              >
                {lane.emoji} {lane.name}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {selectedLane && (
              <motion.div
                key={selectedLane}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-gray-800 p-4 rounded-xl shadow-xl flex flex-col gap-3"
              >
                <h2 className="text-xl font-semibold">🎯 Lane: {selectedLane}</h2>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">➡️ Next Action</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">✅ Last Win</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
                    value={lastWin}
                    onChange={(e) => setLastWin(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">🧠 Brain Junk</label>
                  <textarea
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none h-24"
                    value={brainDump}
                    onChange={(e) => setBrainDump(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <button onClick={saveEntry} className="bg-green-600 px-4 py-2 rounded-xl">Save</button>
                  <button onClick={askFocusBot} className="bg-blue-600 px-4 py-2 rounded-xl">Ask FocusBot</button>
                </div>

                {aiResponse && (
                  <div className="mt-4 bg-gray-700 p-3 rounded text-sm">
                    🤖 <strong>FocusBot:</strong> {aiResponse}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
