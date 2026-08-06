import { useEffect, useState } from 'react';

import { api, type LeaderboardEntry } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeaderboardModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'leaderboard' | 'history'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'leaderboard') {
        const data = await api.getLeaderboard();
        setLeaderboard(data);
      } else if (user) {
        const data = await api.getHistory();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load leaderboard/history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, tab, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#161922] border border-slate-700/60 p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-slate-200 transition-colors p-2 text-xl font-bold exclude-theme"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Speed Rankings & Stats</h2>
            <p className="text-xs text-slate-400">Powered by Node.js & MongoDB backend</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900/60 p-1 mb-4 border border-slate-800 shrink-0">
          <button
            onClick={() => setTab('leaderboard')}
            className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              tab === 'leaderboard'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
             Global Top 10
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              tab === 'history'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
             My Test History
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              
            </div>
          ) : tab === 'leaderboard' ? (
            leaderboard.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                
                <p>No high scores recorded yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-3.5 bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 font-bold text-xs flex items-center justify-center ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-slate-100'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx === 0 ? "1st" : `#${idx + 1}`}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100">{item.username}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-lg font-bold text-amber-400">{item.wpm} WPM</div>
                        <div className="text-xs text-slate-400">{item.accuracy}% acc</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : !user ? (
            <div className="text-center py-12 text-slate-400">
              <p className="mb-2">Sign in to track your typing test history.</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>You haven't completed any typing tests yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="flex items-center justify-between p-3.5 bg-slate-900/50 border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 text-slate-400">
                      
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">
                        {item.duration}s Round
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-amber-400 font-bold text-base">{item.wpm} WPM</span>
                    </div>
                    <div className="text-slate-400 text-xs flex items-center gap-1">
                       {item.accuracy}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}