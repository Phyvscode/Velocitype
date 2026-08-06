import { useState, useEffect } from 'react';

import SetupScreen, { type GameConfig } from '@/components/SetupScreen';
import GameScreen, { type TypedWord } from '@/components/GameScreen';
import ResultsScreen from '@/components/ResultsScreen';
import LibraryScreen from '@/components/LibraryScreen';
import AuthModal from '@/components/AuthModal';
import LeaderboardModal from '@/components/LeaderboardModal';
import FontModal from '@/components/FontModal';
import ColorModal from '@/components/ColorModal'; // <-- Added Import
import { useAuth } from '@/contexts/AuthContext';
import { initializeActiveFont } from '@/lib/fonts';
import { initializeActiveColor, initializeActiveUiTextColor } from '@/lib/colors';
import { loadDictionary } from '@/lib/words';
import LobbyScreen from '@/components/LobbyScreen';
import MultiplayerGame from '@/components/MultiplayerGame';

type Screen = 'setup' | 'game' | 'results' | 'library' | 'lobby' | 'multiplayerGame';

function App() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>('setup');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [typed, setTyped] = useState<TypedWord[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState<boolean>(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState<boolean>(false); // <-- Added State
  const [isUiColorModalOpen, setIsUiColorModalOpen] = useState<boolean>(false);
  const [dictReady, setDictReady] = useState<boolean>(false);

  // Load the full word dictionary (thousands of real words) before any
  // round can start. Falls back silently to a small built-in list if the
  // network request fails, so the app never gets stuck.
  useEffect(() => {
    loadDictionary().finally(() => setDictReady(true));
  }, []);

  // Reapply whatever font (Google or uploaded) and text color the person
  // last chose. This runs once on app load, before the sign-in screen or
  // any game screen renders, so preferences are already active by the
  // time sign-in happens — not reset by it.
  useEffect(() => {
    // initializeActiveFont();
    // initializeActiveColor();
    // initializeActiveUiTextColor();
  }, []);



  const openAuth = (mode: 'login' | 'signup' = 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleStart = (cfg: GameConfig) => {
    setConfig(cfg);
    setTyped([]);
    setScreen('game');
  };

  const handleFinish = (results: TypedWord[]) => {
    setTyped(results);
    setScreen('results');
  };

  const handlePlayAgain = () => {
    setTyped([]);
    setScreen('game');
  };

  const handleHome = () => {
    setScreen('setup');
  };

  if (!dictReady) {
    return (
      <div className="font-sans antialiased text-slate-100 bg-[#0f1117] min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
          
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          
          Loading the word dictionary.
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased text-slate-100 bg-[#0f1117] min-h-screen">
      {screen === 'setup' && (
        <SetupScreen
          onStart={handleStart}
          onOpenLibrary={() => setScreen('library')}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenAuth={() => openAuth('login')}
          onOpenFont={() => setIsFontModalOpen(true)}
          onOpenColor={() => setIsColorModalOpen(true)} 
          onOpenUiColor={() => setIsUiColorModalOpen(true)}
          onLobbyJoined={(code) => {
            setLobbyCode(code);
            setScreen('lobby');
          }}
        />
      )}

      {screen === 'lobby' && lobbyCode && (
        <LobbyScreen 
          lobbyCode={lobbyCode}
          onLeave={() => { setLobbyCode(null); setScreen('setup'); }}
          onGameStart={(cfg) => { setConfig(cfg); setScreen('multiplayerGame'); }}
        />
      )}

      {screen === 'multiplayerGame' && lobbyCode && config && (
        <MultiplayerGame 
          lobbyCode={lobbyCode}
          config={config}
          onLeave={() => { setLobbyCode(null); setScreen('setup'); }}
        />
      )}
      {screen === 'game' && config && (
        <GameScreen
          config={config}
          onFinish={(results) => handleFinish(results)}
          onQuit={handleHome}
        />
      )}
      {screen === 'results' && config && (
        <ResultsScreen
          typed={typed}
          duration={config.duration}
          rows={config.rows}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      )}
      {screen === 'library' && (
        <LibraryScreen onBack={handleHome} onOpenAuth={() => openAuth('signup')} />
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
      />
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
      <FontModal
        isOpen={isFontModalOpen}
        onClose={() => setIsFontModalOpen(false)}
      />
      <ColorModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
      /> {/* <-- Added Component */}
    </div>
  );
}

export default App;