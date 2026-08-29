import { useState, useEffect, useRef } from 'react';
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
import ConfigureModal from '@/components/ConfigureModal';
import { useAuth } from '@/contexts/AuthContext';
import { initializeActiveFont } from '@/lib/fonts';
import { initializeActiveColor, initializeActiveBgColor } from '@/lib/colors';
import { loadDictionary } from '@/lib/words';
import LobbyScreen from '@/components/LobbyScreen';
import MultiplayerGame from '@/components/MultiplayerGame';
import VirtualKeyboardConnector from '@/components/VirtualKeyboardConnector';
import RankedMode from '@/components/RankedMode';

type Screen = 'setup' | 'game' | 'results' | 'library' | 'lobby' | 'multiplayerGame' | 'casual' | 'ranked';

function App() {
  const { user, loading } = useAuth();
  const historyIdxRef = useRef<number>(
    typeof window !== 'undefined' && window.history.state?.idx !== undefined
      ? window.history.state.idx
      : 0
  );

  const [screen, setScreenState] = useState<Screen>(() => {
    if (typeof window !== 'undefined' && window.history.state?.screen) {
      return window.history.state.screen as Screen;
    }
    return 'setup';
  });
  const screenRef = useRef<Screen>(screen);
  const setScreen = (newScreen: Screen) => {
    screenRef.current = newScreen;
    setScreenState(newScreen);
  };

  const isQuittingRef = useRef(false);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const stateIdx = e.state?.idx ?? 0;
      if (stateIdx > historyIdxRef.current) {
        // Forward navigation detected! Prevent it.
        window.history.back();
        return;
      }
      
      if (screenRef.current === 'game' && stateIdx < historyIdxRef.current) {
        if (isQuittingRef.current) {
          // Bypassing trap because we are intentionally popping the game state via Quit
          isQuittingRef.current = false;
        } else {
          // Trap them in the game on actual back navigation!
          const nextIdx = historyIdxRef.current + 1;
          window.history.pushState({ ...e.state, screen: 'game', idx: nextIdx }, '');
          historyIdxRef.current = nextIdx;
          return;
        }
      }
      
      historyIdxRef.current = stateIdx;

      if (e.state && e.state.screen) {
        setScreen(e.state.screen);
      } else {
        setScreen('setup');
      }
    };
    window.addEventListener('popstate', handlePopState);
    if (!window.history.state || window.history.state.idx === undefined) {
      window.history.replaceState({ ...window.history.state, screen: 'setup', idx: 0 }, '');
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newScreen: Screen) => {
    if (newScreen !== screen) {
      const nextIdx = historyIdxRef.current + 1;
      window.history.pushState({ ...window.history.state, screen: newScreen, idx: nextIdx }, '');
      historyIdxRef.current = nextIdx;
      
      if (document.startViewTransition && (newScreen === 'game' || screen === 'game')) {
        document.startViewTransition(() => {
          flushSync(() => setScreen(newScreen));
        });
      } else {
        setScreen(newScreen);
      }
    }
  };
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
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState<boolean>(false);
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

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If the user is typing in an input field, let them blur it or escape naturally
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        window.history.back();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);



  const openAuth = (mode: 'login' | 'signup' = 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleStart = (cfg: GameConfig) => {
    setConfig(cfg);
    setTyped([]);
    navigate('game');
  };

  const handleFinish = (results: TypedWord[], finalTimeElapsed?: number) => {
    setTyped(results);
    setFinalTime(finalTimeElapsed);
    navigate('results');
  };

  const handlePlayAgain = () => {
    setTyped([]);
    navigate('game');
  };

  const handleHome = () => {
    if (screen === 'game') {
      isQuittingRef.current = true;
      window.history.back();
    } else {
      navigate('setup');
    }
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
      {screen === 'casual' && (
        <div className="min-h-screen bg-transparent text-slate-100 flex flex-col items-center p-8">
          <header className="w-full flex flex-col items-center justify-center mb-12">
            <h1 className="text-7xl font-display tracking-widest text-white uppercase cursor-pointer" onClick={() => navigate('setup')}>Veloci<span className="text-[var(--hot)]">type</span></h1>
            <h2 className="text-xl font-mono text-[var(--hot)] uppercase tracking-widest mt-4">Casual Multiplayer</h2>
          </header>
          <div className="w-full max-w-2xl relative">
            <button 
              onClick={() => navigate('setup')} 
              className="absolute -top-12 left-0 text-[var(--hot)] hover:text-white font-mono text-sm tracking-widest uppercase transition-colors"
            >
              &larr; Back
            </button>
            <VersusModeSetup onLobbyJoined={(code) => {
              setLobbyCode(code);
              navigate('lobby');
            }} />
          </div>
        </div>
      )}

      {screen === 'ranked' && (
        <RankedMode onBack={() => navigate('setup')} />
      )}

      {screen === 'setup' && (
        <SetupScreen
          onStart={handleStart}
          onOpenLibrary={() => navigate('library')}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenAuth={() => openAuth('login')}
          onOpenFont={() => setIsFontModalOpen(true)}
          onOpenColor={() => setIsColorModalOpen(true)} 
          onOpenUiColor={() => setIsUiColorModalOpen(true)}
          onOpenBorder={() => setIsBorderModalOpen(true)}
          onOpenConfigure={() => setIsConfigureModalOpen(true)}
          onOpenCasual={() => navigate('casual')}
          onOpenRanked={() => navigate('ranked')}
          onLobbyJoined={(code) => {
            setLobbyCode(code);
            navigate('lobby');
          }}
        />
      )}

      {screen === 'lobby' && lobbyCode && (
        <LobbyScreen 
          lobbyCode={lobbyCode}
          onLeave={() => { setLobbyCode(null); navigate('setup'); }}
          onGameStart={(cfg) => { setConfig(cfg); navigate('multiplayerGame'); }}
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
      {isConfigureModalOpen && <ConfigureModal onClose={() => setIsConfigureModalOpen(false)} />}
      {useVirtualKeyboard && <VirtualKeyboardConnector />}
    </div>
  );
}

export default App;