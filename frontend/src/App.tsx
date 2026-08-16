import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';

import SetupScreen, { type GameConfig } from '@/components/SetupScreen';
import GameScreen, { type TypedWord } from '@/components/GameScreen';
import ResultsScreen from '@/components/ResultsScreen';
import LibraryScreen from '@/components/LibraryScreen';
import AuthModal from '@/components/AuthModal';
import LeaderboardModal from '@/components/LeaderboardModal';
import FontModal from '@/components/FontModal';
import ColorModal from '@/components/ColorModal';
import BgColorModal from '@/components/BgColorModal';
import BorderModal from '@/components/BorderModal';
import { useAuth } from '@/contexts/AuthContext';
import { initializeActiveFont } from '@/lib/fonts';
import { initializeActiveColor, initializeActiveBgColor } from '@/lib/colors';
import { loadDictionary } from '@/lib/words';
import LobbyScreen from '@/components/LobbyScreen';
import MultiplayerGame from '@/components/MultiplayerGame';
import VirtualKeyboardConnector from '@/components/VirtualKeyboardConnector';

type Screen = 'setup' | 'game' | 'results' | 'library' | 'lobby' | 'multiplayerGame';

function App() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>('setup');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [typed, setTyped] = useState<TypedWord[]>([]);
  const [finalTime, setFinalTime] = useState<number | undefined>(undefined);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState<boolean>(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState<boolean>(false);
  const [isUiColorModalOpen, setIsUiColorModalOpen] = useState<boolean>(false);
  const [isBorderModalOpen, setIsBorderModalOpen] = useState<boolean>(false);
  const [dictReady, setDictReady] = useState<boolean>(false);

  // Load the full word dictionary (thousands of real words) before any
  // round can start. Falls back silently to a small built-in list if the
  // network request fails, so the app never gets stuck.
  useEffect(() => {
    loadDictionary().finally(() => setDictReady(true));
  }, []);

  const [useVirtualKeyboard, setUseVirtualKeyboard] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('velocitype_ai_webcam') === 'true';
    return false;
  });

  useEffect(() => {
    const handleStorage = () => {
      setUseVirtualKeyboard(localStorage.getItem('velocitype_ai_webcam') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('ai_webcam_toggled', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('ai_webcam_toggled', handleStorage);
    };
  }, []);

  // Reapply whatever font (Google or uploaded) and text color the person
  // last chose. This runs once on app load, before the sign-in screen or
  // any game screen renders, so preferences are already active by the
  // time sign-in happens — not reset by it.
  useEffect(() => {
    initializeActiveColor();
    initializeActiveBgColor();
  }, []);



  const openAuth = (mode: 'login' | 'signup' = 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleStart = (cfg: GameConfig) => {
    setConfig(cfg);
    setTyped([]);
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => setScreen('game'));
      });
    } else {
      setScreen('game');
    }
  };

  const handleFinish = (results: TypedWord[], finalTimeElapsed?: number) => {
    setTyped(results);
    setFinalTime(finalTimeElapsed);
    setScreen('results');
  };

  const handlePlayAgain = () => {
    setTyped([]);
    setScreen('game');
  };

  const handleHome = () => {
    setScreen('setup');
  };

  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => {
      setFontLoaded(true);
    });
  }, []);

  if (loading || !dictReady || !fontLoaded) {
    return (
      <div className="font-sans antialiased text-slate-100 bg-background min-h-[100dvh] flex flex-col items-center justify-center gap-4 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.2s_forwards]">
        {/* We keep it blank/invisible for the first 200ms to prevent any FOUC, then softly fade in if it takes longer */}
      </div>
    );
  }

  return (
    <div className="font-sans antialiased text-slate-100 bg-background h-[100dvh] w-full overflow-y-auto overflow-x-hidden relative">
      {screen === 'setup' && (
        <SetupScreen
          onStart={handleStart}
          onOpenLibrary={() => setScreen('library')}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenAuth={() => openAuth('login')}
          onOpenFont={() => setIsFontModalOpen(true)}
          onOpenColor={() => setIsColorModalOpen(true)} 
          onOpenUiColor={() => setIsUiColorModalOpen(true)}
          onOpenBorder={() => setIsBorderModalOpen(true)}
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
        <div className="h-full w-full">
          <GameScreen
            config={config}
            onFinish={(results) => handleFinish(results)}
            onQuit={handleHome}
          />
        </div>
      )}
      {screen === 'results' && config && (
        <div className="h-full w-full">
          <ResultsScreen
          typed={typed}
          duration={finalTime !== undefined ? finalTime : config.duration}
          rows={config.rows}
            onPlayAgain={handlePlayAgain}
            onHome={handleHome}
          />
        </div>
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
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
      <FontModal isOpen={isFontModalOpen} onClose={() => setIsFontModalOpen(false)} />
      <ColorModal isOpen={isColorModalOpen} onClose={() => setIsColorModalOpen(false)} />
      <BgColorModal isOpen={isUiColorModalOpen} onClose={() => setIsUiColorModalOpen(false)} />
      <BorderModal isOpen={isBorderModalOpen} onClose={() => setIsBorderModalOpen(false)} />
      {useVirtualKeyboard && <VirtualKeyboardConnector />}
    </div>
  );
}

export default App;