import { useEffect, useState } from 'react';

import { api, type SavedWord } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onBack: () => void;
  onOpenAuth: () => void;
}

export default function LibraryScreen({ onBack, onOpenAuth }: Props) {
  const { user } = useAuth();
  const [words, setWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [query, setQuery] = useState<string>('');

  const load = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.getSavedWords();
      setWords(data);
    } catch (err: any) {
      setError('Could not load your library from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleDelete = async (id: string) => {
    const prev = words;
    setWords((w) => w.filter((x) => x.id !== id));
    try {
      await api.deleteSavedWord(id);
    } catch (err: any) {
      setWords(prev);
      setError('Could not delete that word.');
    }
  };

  const filtered = words.filter((w) =>
    w.word.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-slate-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-end mb-8">
          <div className="flex items-center gap-2 text-slate-300">
            
            <span className="font-semibold">Words Library</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-1">Your saved words</h1>
        <p className="text-slate-400 mb-6">
          Every word you bookmark after a round lands here with its definition.
        </p>

        {!user ? (
          <div className="text-center py-16 bg-slate-800/30 border border-slate-700/50 p-8">
            
            <h3 className="text-xl font-bold mb-2">Sign in to view your library</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              Your saved words are linked to your account on our Express + MongoDB backend. Sign in to view and manage your vocabulary.
            </p>
            <button
              onClick={onOpenAuth}
              className="px-6 py-2.5 bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors"
            >
              Sign In / Create Account
            </button>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-6">
              
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your words"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 focus:border-amber-400 focus:outline-none transition-colors text-slate-100"
              />
            </div>

            {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                
                <p className="font-medium">
                  {words.length === 0 ? 'No saved words yet.' : 'No matches for your search.'}
                </p>
                <p className="text-sm mt-1">
                  {words.length === 0 ? 'Play a round and bookmark a word to start your library.' : ''}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {filtered.map((w) => (
                  <div
                    key={w.id}
                    className="group bg-slate-800/40 p-4 border border-slate-700/50 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-lg font-bold font-mono capitalize">{w.word}</h3>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Delete word"
                      >
                        
                      </button>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{w.meaning}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}