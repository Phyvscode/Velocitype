import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RankedPlayerArea, computeConsistency } from './RankedMode';
import { generateSentences } from "@/lib/quotes";
import { applyScrewedEffects } from "@/lib/words";
import { AnimatedCharacter } from './AnimatedCharacter';
import { useAuth } from '../contexts/AuthContext';

interface RankedSandboxProps {
  onBack: () => void;
}

interface KeystrokeAction {
  type: 'char' | 'backspace';
  char?: string;
}

export const ALL_SANDBOX_ABILITIES = [
  { id: 'shrooms', name: 'Shrooms', cost: 30, char: 'mushgirl', desc: 'Warp & trippy visual distortion' },
  { id: 'dyslexia', name: 'Dyslexia', cost: 60, char: 'mushgirl', desc: 'Letter swaps and visual dyslexia' },
  { id: 'blinking', name: 'Blinking', cost: 100, char: 'mushgirl', desc: 'Screen periodic blackout blink' },
  { id: 'scramble', name: 'Scramble', cost: 30, char: 'screwed', desc: 'Shuffles letters within words' },
  { id: 'sabotage', name: 'Sabotage', cost: 60, char: 'screwed', desc: 'Inserts worst letter every 3rd word' },
  { id: 'spam', name: 'Spam', cost: 100, char: 'screwed', desc: 'Inserts random 5-letter word every 10th word' },
  { id: 'joker1', name: 'Delusion', cost: 30, char: 'joker', desc: 'All mistakes appear correct/green' },
  { id: 'joker2', name: 'Blindness', cost: 60, char: 'joker', desc: 'Masks WPM and raw stats as ???' },
  { id: 'joker3', name: 'Amnesia', cost: 100, char: 'joker', desc: 'Only reveals every 5th letter, timer as ???' },
  { id: 'gravity1', name: 'Time Warp', cost: 40, char: 'gravity', desc: 'Black Hole Sabotage popup (Ctrl+X to escape)' },
  { id: 'gravity2', name: 'Black Hole', cost: 70, char: 'gravity', desc: 'Crushes opponent speed & progress' },
  { id: 'gravity3', name: 'Event Horizon', cost: 110, char: 'gravity', desc: 'Sucks time and forces early round end' },
  { id: 'moneyguy1', name: 'Bribe I', cost: 30, char: 'moneyguy', desc: 'Golden letters spawn in text (+5 coins)' },
  { id: 'moneyguy2', name: 'Bribe II', cost: 60, char: 'moneyguy', desc: 'Typing mistakes grant +3 hearts' },
  { id: 'moneyguy3', name: 'Invest', cost: 100, char: 'moneyguy', desc: 'Buffs all character abilities' },
];

/**
 * Builds word keystrokes with:
 * - 60% chance to type correctly
 * - 20% chance to type incorrectly (leaves error without fixing)
 * - 20% chance to rewrite the correct word (makes typo, backspaces, types correct letters)
 */
function buildWordActions(word: string, isLastWord: boolean): KeystrokeAction[] {
  const actions: KeystrokeAction[] = [];
  if (!word) {
    if (!isLastWord) actions.push({ type: 'char', char: ' ' });
    return actions;
  }

  const fullTarget = isLastWord ? word : word + ' ';
  const roll = Math.random();

  if (roll < 0.60) {
    // 60% chance: Type correctly
    for (let i = 0; i < fullTarget.length; i++) {
      actions.push({ type: 'char', char: fullTarget[i] });
    }
  } else if (roll < 0.80) {
    // 20% chance: Type incorrectly (leave typo without fixing)
    const typoIdx = Math.min(Math.floor(Math.random() * Math.max(1, word.length)), word.length - 1);
    for (let i = 0; i < fullTarget.length; i++) {
      if (i === typoIdx && fullTarget[i] !== ' ') {
        let wrong = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        if (wrong === fullTarget[i]) wrong = wrong === 'x' ? 'z' : 'x';
        actions.push({ type: 'char', char: wrong });
      } else {
        actions.push({ type: 'char', char: fullTarget[i] });
      }
    }
  } else {
    // 20% chance: Rewrite the correct word
    // Type up to typoIdx, make an error, backspace it, then type the correct characters!
    const typoIdx = Math.min(Math.floor(Math.random() * Math.max(1, word.length - 1)), word.length - 1);
    
    // Type correct up to typoIdx
    for (let i = 0; i < typoIdx; i++) {
      actions.push({ type: 'char', char: word[i] });
    }

    // Type typo
    let wrong = String.fromCharCode(97 + Math.floor(Math.random() * 26));
    if (wrong === word[typoIdx]) wrong = wrong === 'x' ? 'z' : 'x';
    actions.push({ type: 'char', char: wrong });

    // Maybe type 1 additional letter before realizing
    const extra = (typoIdx + 1 < word.length && Math.random() < 0.5) ? 1 : 0;
    if (extra === 1) {
      actions.push({ type: 'char', char: word[typoIdx + 1] });
    }

    // Backspace to erase extra + typo
    for (let b = 0; b <= extra; b++) {
      actions.push({ type: 'backspace' });
    }

    // Now type the correct letter at typoIdx and all remaining characters
    for (let i = typoIdx; i < fullTarget.length; i++) {
      actions.push({ type: 'char', char: fullTarget[i] });
    }
  }

  return actions;
}

function buildFullActionQueue(text: string): KeystrokeAction[] {
  const words = text.trim().split(/\s+/);
  const queue: KeystrokeAction[] = [];
  for (let i = 0; i < words.length; i++) {
    queue.push(...buildWordActions(words[i], i === words.length - 1));
  }
  return queue;
}

export default function RankedSandbox({ onBack }: RankedSandboxProps) {
  const { user } = useAuth();
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('velocitype_sandbox_characters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 1 && parsed.length <= 3) return parsed;
      }
    } catch {}
    return ['mushgirl', 'screwed', 'joker'];
  });

  const [isSandboxReady, setIsSandboxReady] = useState(false);
  const [gameState, setGameState] = useState<'playing' | 'round_finished' | 'match_finished'>('playing');
  const [currentRound, setCurrentRound] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [roundWinner, setRoundWinner] = useState<'You' | 'Opponent' | 'Tie' | null>(null);
  const [matchWinner, setMatchWinner] = useState<'You' | 'Opponent' | null>(null);

  const [autoPlay, setAutoPlay] = useState(true);
  const autoPlayRef = useRef(true);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);

  // Abilities
  const [myAbilities, setMyAbilities] = useState<string[]>([]);
  const [oppAbilities, setOppAbilities] = useState<string[]>([]);
  const myAbilitiesRef = useRef<string[]>([]);
  const oppAbilitiesRef = useRef<string[]>([]);
  useEffect(() => { myAbilitiesRef.current = myAbilities; }, [myAbilities]);
  useEffect(() => { oppAbilitiesRef.current = oppAbilities; }, [oppAbilities]);

  // Ensure active abilities always match currently selected characters
  useEffect(() => {
    setMyAbilities(prev => prev.filter(id => {
      const ab = ALL_SANDBOX_ABILITIES.find(a => a.id === id);
      return ab ? selectedCharacters.includes(ab.char) : true;
    }));
    setOppAbilities(prev => prev.filter(id => {
      const ab = ALL_SANDBOX_ABILITIES.find(a => a.id === id);
      return ab ? selectedCharacters.includes(ab.char) : true;
    }));
  }, [selectedCharacters]);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(60);
  const [startTime, setStartTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const gameStateRef = useRef<'playing' | 'round_finished' | 'match_finished'>('playing');
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // Target texts
  const [baseTargetText, setBaseTargetText] = useState('generating text please wait... ');
  const [myTargetText, setMyTargetText] = useState('generating text please wait... ');
  const [oppTargetText, setOppTargetText] = useState('generating text please wait... ');
  const myTargetTextRef = useRef('');
  const oppTargetTextRef = useRef('');
  useEffect(() => { myTargetTextRef.current = myTargetText; }, [myTargetText]);
  useEffect(() => { oppTargetTextRef.current = oppTargetText; }, [oppTargetText]);

  // Typing and Stats for You
  const [typedText, setTypedText] = useState('');
  const typedTextRef = useRef('');
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [myWpm, setMyWpm] = useState(0);
  const [myRawWpm, setMyRawWpm] = useState(0);
  const [myAccuracy, setMyAccuracy] = useState(100);
  const [myConsistency, setMyConsistency] = useState(100);
  const [myCia, setMyCia] = useState<{ c: number; i: number; a: number }>({ c: 0, i: 0, a: 0 });
  const [myCharge, setMyCharge] = useState(0);
  const [myCoins, setMyCoins] = useState(0);
  const [myHearts, setMyHearts] = useState(0);
  const myLetterStatesRef = useRef<number[]>([]);
  const mySpeedSamplesRef = useRef<number[]>([]);
  const myLastCharsRef = useRef<number>(0);
  const goldenLettersRef = useRef<Set<number>>(new Set());
  const claimedGoldenRef = useRef<Set<number>>(new Set());
  const myWorstLetterRef = useRef<string | null>('e');

  // Typing and Stats for Opponent
  const [oppTypedText, setOppTypedText] = useState('');
  const oppTypedTextRef = useRef('');
  const [oppActiveKeys, setOppActiveKeys] = useState<Set<string>>(new Set());
  const [oppWpm, setOppWpm] = useState(0);
  const [oppRawWpm, setOppRawWpm] = useState(0);
  const [oppAccuracy, setOppAccuracy] = useState(100);
  const [oppConsistency, setOppConsistency] = useState(100);
  const [oppCia, setOppCia] = useState<{ c: number; i: number; a: number }>({ c: 0, i: 0, a: 0 });
  const [oppCharge, setOppCharge] = useState(0);
  const oppLetterStatesRef = useRef<number[]>([]);
  const oppSpeedSamplesRef = useRef<number[]>([]);
  const oppLastCharsRef = useRef<number>(0);
  const oppWorstLetterRef = useRef<string | null>('a');
  const oppGoldenLettersRef = useRef<Set<number>>(new Set());

  // Active POV: 'you' or 'opp'
  const [activePov, setActivePov] = useState<'you' | 'opp'>('you');

  // Gravity Sabotage Popup
  const [showGravityPopup, setShowGravityPopup] = useState(false);
  const showGravityPopupRef = useRef(false);
  useEffect(() => { showGravityPopupRef.current = showGravityPopup; }, [showGravityPopup]);
  const gravityEscapingRef = useRef(false);

  // Auto-typer queues
  const myActionQueueRef = useRef<KeystrokeAction[]>([]);
  const myActionIndexRef = useRef(0);
  const oppActionQueueRef = useRef<KeystrokeAction[]>([]);
  const oppActionIndexRef = useRef(0);
  const myTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const oppTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate target text on start
  const generateNewRoundText = useCallback(async () => {
    const words = await generateSentences('', ['top', 'home', 'bottom'], 3, 12, 30, '');
    const text = words.join(' ') + ' ';
    setBaseTargetText(text);

    // Apply screwed effects:
    // If Opponent has screwed abilities, apply to myTargetText
    const myText = applyScrewedEffects(text, oppAbilitiesRef.current, myWorstLetterRef.current);
    // If You have screwed abilities, apply to oppTargetText
    const oppText = applyScrewedEffects(text, myAbilitiesRef.current, oppWorstLetterRef.current);

    setMyTargetText(myText);
    setOppTargetText(oppText);
    myTargetTextRef.current = myText;
    oppTargetTextRef.current = oppText;

    // Golden letters for Money Guy (cast in raised gold)
    if (selectedCharacters.includes('moneyguy')) {
      const gold = new Set<number>();
      for (let i = 0; i < myText.length; i++) {
        if (myText[i] !== ' ' && Math.random() < 0.30) gold.add(i);
      }
      goldenLettersRef.current = gold;
      claimedGoldenRef.current = new Set();

      const oppGold = new Set<number>();
      for (let i = 0; i < oppText.length; i++) {
        if (oppText[i] !== ' ' && Math.random() < 0.30) oppGold.add(i);
      }
      oppGoldenLettersRef.current = oppGold;
    } else {
      goldenLettersRef.current = new Set();
      claimedGoldenRef.current = new Set();
      oppGoldenLettersRef.current = new Set();
    }

    // Build queues for both auto-typers with 60% / 20% / 20% logic
    myActionQueueRef.current = buildFullActionQueue(myText);
    myActionIndexRef.current = 0;
    oppActionQueueRef.current = buildFullActionQueue(oppText);
    oppActionIndexRef.current = 0;
  }, [selectedCharacters]);

  // Start new round
  const startNewRound = useCallback(async (roundNum: number) => {
    setCurrentRound(roundNum);
    setTimeLeft(60);
    setTypedText('');
    setOppTypedText('');
    typedTextRef.current = '';
    oppTypedTextRef.current = '';
    myLetterStatesRef.current = [];
    oppLetterStatesRef.current = [];
    mySpeedSamplesRef.current = [];
    oppSpeedSamplesRef.current = [];
    myLastCharsRef.current = 0;
    oppLastCharsRef.current = 0;
    setMyWpm(0);
    setMyRawWpm(0);
    setMyAccuracy(100);
    setMyConsistency(100);
    setOppWpm(0);
    setOppRawWpm(0);
    setOppAccuracy(100);
    setOppConsistency(100);
    setMyCia({ c: 0, i: 0, a: 0 });
    setOppCia({ c: 0, i: 0, a: 0 });
    setShowGravityPopup(false);
    showGravityPopupRef.current = false;
    gravityEscapingRef.current = false;

    const now = Date.now();
    setStartTime(now);
    startTimeRef.current = now;

    await generateNewRoundText();
    setGameState('playing');
    gameStateRef.current = 'playing';
  }, [generateNewRoundText]);

  // Enter sandbox
  const handleEnterSandbox = () => {
    if (selectedCharacters.length >= 1 && selectedCharacters.length <= 3) {
      try {
        localStorage.setItem('velocitype_sandbox_characters', JSON.stringify(selectedCharacters));
      } catch {}
      setMyScore(0);
      setOppScore(0);
      setMyAbilities([]);
      setOppAbilities([]);
      setIsSandboxReady(true);
      startNewRound(0);
    }
  };

  // End Round logic
  const handleEndRound = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    if (myTimeoutRef.current) clearTimeout(myTimeoutRef.current);
    if (oppTimeoutRef.current) clearTimeout(oppTimeoutRef.current);

    // Determine round winner by correct characters
    const myCorrect = myLetterStatesRef.current.filter(x => x === 1 || x === 3).length;
    const oppCorrect = oppLetterStatesRef.current.filter(x => x === 1 || x === 3).length;

    let winner: 'You' | 'Opponent' | 'Tie' = 'Tie';
    let nextMyScore = myScore;
    let nextOppScore = oppScore;

    if (myCorrect > oppCorrect) {
      winner = 'You';
      nextMyScore = myScore + 1;
      setMyScore(nextMyScore);
    } else if (oppCorrect > myCorrect) {
      winner = 'Opponent';
      nextOppScore = oppScore + 1;
      setOppScore(nextOppScore);
    } else {
      winner = 'Tie';
    }
    setRoundWinner(winner);

    // Check if either player reached 5 round wins
    if (nextMyScore >= 5 || nextOppScore >= 5) {
      setMatchWinner(nextMyScore >= 5 ? 'You' : 'Opponent');
      setGameState('match_finished');
      gameStateRef.current = 'match_finished';
    } else {
      setGameState('round_finished');
      gameStateRef.current = 'round_finished';
    }
  }, [myScore, oppScore]);

  // Round countdown timer and speed sampler (Runs like Ranked)
  useEffect(() => {
    if (gameState !== 'playing' || !startTime) return;

    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleEndRound();
          return 0;
        }

        // Trigger Gravity Sabotage popup if Opponent has gravity1/gravity2
        if ((oppAbilitiesRef.current.includes('gravity1') || oppAbilitiesRef.current.includes('gravity2')) && (t === 40 || t === 20)) {
          setShowGravityPopup(true);
          showGravityPopupRef.current = true;
        }

        return t - 1;
      });

      // Sample speed deltas for consistency
      const timeElapsed = (Date.now() - startTime) / 60000;
      if (timeElapsed > 0) {
        // Player consistency sample
        const myCharsThisSec = Math.max(0, typedTextRef.current.length - myLastCharsRef.current);
        myLastCharsRef.current = typedTextRef.current.length;
        const myInstantRaw = Math.round((myCharsThisSec / 5) * 60);
        mySpeedSamplesRef.current.push(myInstantRaw);
        setMyConsistency(computeConsistency(mySpeedSamplesRef.current));

        // Opponent consistency sample
        const oppCharsThisSec = Math.max(0, oppTypedTextRef.current.length - oppLastCharsRef.current);
        oppLastCharsRef.current = oppTypedTextRef.current.length;
        const oppInstantRaw = Math.round((oppCharsThisSec / 5) * 60);
        oppSpeedSamplesRef.current.push(oppInstantRaw);
        setOppConsistency(computeConsistency(oppSpeedSamplesRef.current));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, startTime, handleEndRound]);

  // --- AUTO-TYPER FOR YOU ---
  const scheduleMyNextStep = useCallback((delay: number) => {
    if (myTimeoutRef.current) clearTimeout(myTimeoutRef.current);
    myTimeoutRef.current = setTimeout(() => {
      if (!autoPlayRef.current || gameStateRef.current !== 'playing') return;

      // Handle Gravity Sabotage pause
      if (showGravityPopupRef.current) {
        if (!gravityEscapingRef.current) {
          gravityEscapingRef.current = true;
          setTimeout(() => {
            setShowGravityPopup(false);
            showGravityPopupRef.current = false;
            gravityEscapingRef.current = false;
            scheduleMyNextStep(100);
          }, 1200);
        }
        return;
      }

      const queue = myActionQueueRef.current;
      const idx = myActionIndexRef.current;
      if (idx >= queue.length) return;

      const action = queue[idx];
      myActionIndexRef.current++;

      let nextDelay = 80;
      if (action.type === 'char') {
        const ch = action.char!;
        const prev = typedTextRef.current;
        const target = myTargetTextRef.current;

        if (prev.length < target.length) {
          const next = prev + ch;
          typedTextRef.current = next;
          setTypedText(next);

          const charIdx = prev.length;
          const isMatch = ch === target[charIdx];
          const currState = myLetterStatesRef.current[charIdx] || 0;
          if (isMatch) {
            if (currState === 0) {
              myLetterStatesRef.current[charIdx] = 1; // Correct
              if (goldenLettersRef.current.has(charIdx) && !claimedGoldenRef.current.has(charIdx)) {
                claimedGoldenRef.current.add(charIdx);
                setMyCoins(c => c + 5);
              }
            } else if (currState === 2) {
              myLetterStatesRef.current[charIdx] = 3; // Amended!
            }
          } else {
            if ((currState === 0 || currState === 1) && myAbilitiesRef.current.includes('moneyguy2')) {
              setMyHearts(h => h + 3);
            }
            myLetterStatesRef.current[charIdx] = 2; // Incorrect
          }

          let tempC = 0, tempI = 0, tempA = 0;
          for (let k = 0; k < next.length; k++) {
            const s = myLetterStatesRef.current[k] || 0;
            if (s === 1) tempC++;
            else if (s === 3) tempA++;
            else tempI++;
          }
          setMyCia({ c: tempC, i: tempI, a: tempA });
          setMyCharge(c => Math.min(100, c + 1));

          const timeElapsed = (Date.now() - (startTimeRef.current || Date.now())) / 60000;
          if (timeElapsed > 0) {
            setMyWpm(Math.round((tempC / 5) / timeElapsed));
            setMyRawWpm(Math.round((next.length / 5) / timeElapsed));
            setMyAccuracy(Math.round((tempC / next.length) * 100));
          }

          setActiveKeys(new Set([ch.toUpperCase()]));
          setTimeout(() => setActiveKeys(new Set()), 40);
        }
        nextDelay = ch === ' ' ? 115 + Math.random() * 40 : 75 + Math.random() * 30;
      } else if (action.type === 'backspace') {
        const prev = typedTextRef.current;
        if (prev.length > 0) {
          const next = prev.slice(0, -1);
          typedTextRef.current = next;
          setTypedText(next);

          let tempC = 0, tempI = 0, tempA = 0;
          for (let k = 0; k < next.length; k++) {
            const s = myLetterStatesRef.current[k] || 0;
            if (s === 1) tempC++;
            else if (s === 3) tempA++;
            else tempI++;
          }
          setMyCia({ c: tempC, i: tempI, a: tempA });
          setActiveKeys(new Set(['BACKSPACE']));
          setTimeout(() => setActiveKeys(new Set()), 40);
        }
        nextDelay = 60 + Math.random() * 25;
      }

      scheduleMyNextStep(nextDelay);
    }, delay);
  }, []);

  // --- AUTO-TYPER FOR OPPONENT ---
  const scheduleOppNextStep = useCallback((delay: number) => {
    if (oppTimeoutRef.current) clearTimeout(oppTimeoutRef.current);
    oppTimeoutRef.current = setTimeout(() => {
      if (gameStateRef.current !== 'playing') return;

      const queue = oppActionQueueRef.current;
      const idx = oppActionIndexRef.current;
      if (idx >= queue.length) return;

      const action = queue[idx];
      oppActionIndexRef.current++;

      let nextDelay = 80;
      if (action.type === 'char') {
        const ch = action.char!;
        const prev = oppTypedTextRef.current;
        const target = oppTargetTextRef.current;

        if (prev.length < target.length) {
          const next = prev + ch;
          oppTypedTextRef.current = next;
          setOppTypedText(next);

          const charIdx = prev.length;
          const isMatch = ch === target[charIdx];
          const currState = oppLetterStatesRef.current[charIdx] || 0;
          if (isMatch) {
            if (currState === 0) oppLetterStatesRef.current[charIdx] = 1;
            else if (currState === 2) oppLetterStatesRef.current[charIdx] = 3;
          } else {
            oppLetterStatesRef.current[charIdx] = 2;
          }

          let bC = 0, bI = 0, bA = 0;
          for (let k = 0; k < next.length; k++) {
            const s = oppLetterStatesRef.current[k] || 0;
            if (s === 1) bC++;
            else if (s === 3) bA++;
            else bI++;
          }
          setOppCia({ c: bC, i: bI, a: bA });
          setOppCharge(c => Math.min(100, c + 1));

          const timeElapsed = (Date.now() - (startTimeRef.current || Date.now())) / 60000;
          if (timeElapsed > 0) {
            setOppWpm(Math.round((bC / 5) / timeElapsed));
            setOppRawWpm(Math.round((next.length / 5) / timeElapsed));
            setOppAccuracy(Math.round((bC / next.length) * 100));
          }
          setOppActiveKeys(new Set([ch.toUpperCase()]));
          setTimeout(() => setOppActiveKeys(new Set()), 40);
        }
        nextDelay = ch === ' ' ? 115 + Math.random() * 40 : 75 + Math.random() * 30;
      } else if (action.type === 'backspace') {
        const prev = oppTypedTextRef.current;
        if (prev.length > 0) {
          const next = prev.slice(0, -1);
          oppTypedTextRef.current = next;
          setOppTypedText(next);

          let bC = 0, bI = 0, bA = 0;
          for (let k = 0; k < next.length; k++) {
            const s = oppLetterStatesRef.current[k] || 0;
            if (s === 1) bC++;
            else if (s === 3) bA++;
            else bI++;
          }
          setOppCia({ c: bC, i: bI, a: bA });
          setOppActiveKeys(new Set(['BACKSPACE']));
          setTimeout(() => setOppActiveKeys(new Set()), 40);
        }
        nextDelay = 60 + Math.random() * 25;
      }

      scheduleOppNextStep(nextDelay);
    }, delay);
  }, []);

  // Launch auto-typers when playing
  useEffect(() => {
    if (gameState === 'playing' && isSandboxReady && myTargetText.length > 30) {
      scheduleMyNextStep(300);
      scheduleOppNextStep(350);
    }
    return () => {
      if (myTimeoutRef.current) clearTimeout(myTimeoutRef.current);
      if (oppTimeoutRef.current) clearTimeout(oppTimeoutRef.current);
    };
  }, [gameState, isSandboxReady, myTargetText, scheduleMyNextStep, scheduleOppNextStep]);

  // Optional manual keyboard listener for You
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showGravityPopup) {
        if (e.ctrlKey && e.key.toLowerCase() === 'x') {
          e.preventDefault();
          setShowGravityPopup(false);
          showGravityPopupRef.current = false;
        }
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        setActivePov(p => p === 'you' ? 'opp' : 'you');
        return;
      }
      if (gameState !== 'playing') return;
      if (e.key === 'Escape' || e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key.length === 1) {
        e.preventDefault();
        setTypedText(prev => {
          let next = prev + e.key;
          if (next.length > myTargetText.length) next = next.slice(0, myTargetText.length);
          typedTextRef.current = next;

          let tempC = 0, tempI = 0, tempA = 0;
          for (let i = 0; i < next.length; i++) {
            const isMatch = next[i] === myTargetText[i];
            const currState = myLetterStatesRef.current[i] || 0;
            if (isMatch) {
              if (currState === 0) myLetterStatesRef.current[i] = 1;
              else if (currState === 2) myLetterStatesRef.current[i] = 3;
            } else {
              myLetterStatesRef.current[i] = 2;
            }
          }
          for (let i = 0; i < next.length; i++) {
            const s = myLetterStatesRef.current[i] || 0;
            if (s === 1) tempC++;
            else if (s === 3) tempA++;
            else tempI++;
          }
          setMyCia({ c: tempC, i: tempI, a: tempA });
          return next;
        });
        setActiveKeys(new Set([e.key.toUpperCase()]));
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setTypedText(prev => {
          const next = prev.slice(0, -1);
          typedTextRef.current = next;
          return next;
        });
      }
    };

    const handleKeyUp = () => {
      setActiveKeys(new Set());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, myTargetText, showGravityPopup]);

  const toggleMyAbility = (abilityId: string) => {
    setMyAbilities(prev =>
      prev.includes(abilityId) ? prev.filter(a => a !== abilityId) : [...prev, abilityId]
    );
  };

  const toggleOppAbility = (abilityId: string) => {
    setOppAbilities(prev =>
      prev.includes(abilityId) ? prev.filter(a => a !== abilityId) : [...prev, abilityId]
    );
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `0${m}:${ss < 10 ? '0' : ''}${ss}`;
  };

  // 1. Initial Character Selection Screen
  if (!isSandboxReady) {
    return (
      <div className="w-screen h-[100dvh] flex flex-col bg-background overflow-hidden relative">
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950/50 z-50">
          <button 
            onClick={onBack}
            className="text-slate-400 hover:text-white uppercase tracking-widest text-sm font-mono transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>&larr;</span> Back to Menu
          </button>
          <div className="font-mono text-xs text-[var(--hot)] uppercase tracking-widest">
            Sandbox Setup
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full text-center">
          <h2 className="font-display text-4xl tracking-widest text-white uppercase mb-2">
            Select Characters
          </h2>
          <p className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-10">
            Choose 1 to 3 characters for the automated Sandbox showdown ({selectedCharacters.length}/3 selected)
          </p>

          <div className="flex flex-wrap gap-8 items-center justify-center mb-12">
            {[
              { id: 'mushgirl', name: 'Mushgirl', role: 'Psych / Trippy' },
              { id: 'screwed', name: 'Screwed', role: 'Text Disruptor' },
              { id: 'joker', name: 'Joker', role: 'Mental Illusion' },
              { id: 'gravity', name: 'Gravity', role: 'Physics Well' },
              { id: 'moneyguy', name: 'Money Guy', role: 'Economy & Buffs' },
            ].map(char => {
              const isSelected = selectedCharacters.includes(char.id);
              const selectionIndex = selectedCharacters.indexOf(char.id);
              return (
                <div 
                  key={char.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedCharacters(prev => prev.filter(c => c !== char.id));
                    } else if (selectedCharacters.length < 3) {
                      setSelectedCharacters(prev => [...prev, char.id]);
                    }
                  }}
                  className="flex flex-col items-center gap-3 cursor-pointer group"
                >
                  <div className={`w-36 h-36 rounded-2xl border-2 flex items-center justify-center relative transition-all duration-300 overflow-hidden ${
                    isSelected 
                      ? 'border-[var(--hot)] bg-[var(--hot)]/10 shadow-[0_0_20px_var(--color-hot-soft)] scale-105' 
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}>
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--hot)] text-black text-xs font-mono font-bold flex items-center justify-center z-10">
                        {selectionIndex + 1}
                      </span>
                    )}
                    <AnimatedCharacter 
                      id={char.id} 
                      className="h-44 object-contain scale-[1.2] transform-gpu" 
                      style={char.id === 'screwed' ? { transform: 'scale(-1.2, 1.2)' } : undefined}
                      staticMode 
                    />
                  </div>
                  <div className="text-center">
                    <span className={`font-display text-sm tracking-widest uppercase block ${isSelected ? 'text-[var(--hot)]' : 'text-slate-300'}`}>
                      {char.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest block">
                      {char.role}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleEnterSandbox}
            disabled={selectedCharacters.length === 0}
            className={`py-4 px-12 rounded-lg font-mono text-sm uppercase tracking-widest transition-all ${
              selectedCharacters.length >= 1
                ? 'border border-[var(--hot)] text-black bg-[var(--hot)] hover:bg-white shadow-[0_0_25px_var(--color-hot-soft)] cursor-pointer scale-100 hover:scale-105 font-bold'
                : 'border border-slate-800 text-slate-600 bg-slate-900/40 cursor-not-allowed'
            }`}
          >
            {selectedCharacters.length >= 1 ? `Enter Sandbox (${selectedCharacters.length}) →` : 'Select at least 1 Character (0/3)'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      {/* Top Header */}
      <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950/50 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="text-slate-400 hover:text-white uppercase tracking-widest text-sm font-mono transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>&larr;</span> Exit Sandbox
          </button>
          <button 
            onClick={() => setIsSandboxReady(false)}
            className="text-slate-500 hover:text-[var(--hot)] uppercase tracking-widest text-xs font-mono transition-colors border border-slate-800 hover:border-[var(--hot)] px-3 py-1.5 rounded cursor-pointer"
          >
            Change Characters
          </button>
        </div>

        {/* Series Score Banner */}
        <div className="flex items-center gap-6 font-mono text-sm">
          <span className="text-slate-400 uppercase tracking-widest text-xs">
            Round {currentRound + 1} &bull; First to 5 Wins
          </span>
          <div className="bg-slate-900 px-4 py-1.5 rounded border border-slate-800 flex items-center gap-3">
            <span className="text-[var(--hot)] font-bold">YOU: {myScore}</span>
            <span className="text-slate-600">—</span>
            <span className="text-red-500 font-bold">OPPONENT: {oppScore}</span>
          </div>
        </div>

        {/* Right Controls: POV Toggle & Auto-Play Toggle */}
        <div className="flex items-center gap-4">
          {/* POV Switcher */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-full p-1 shadow-inner">
            <button
              onClick={() => setActivePov('you')}
              className={`flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                activePov === 'you'
                  ? 'bg-[var(--hot)] text-black font-bold shadow-[0_0_15px_var(--color-hot-soft)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activePov === 'you' ? 'bg-black' : 'bg-emerald-400'} inline-block`} />
              Your POV
            </button>
            <button
              onClick={() => setActivePov('opp')}
              className={`flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                activePov === 'opp'
                  ? 'bg-red-500 text-white font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activePov === 'opp' ? 'bg-white' : 'bg-red-400'} inline-block`} />
              Opponent POV
            </button>
          </div>

          {/* Auto-Play Toggle */}
          <button
            onClick={() => setAutoPlay(p => !p)}
            className={`font-mono text-xs uppercase tracking-widest px-3 py-1.5 rounded border transition-colors cursor-pointer ${
              autoPlay
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
          >
            🤖 Auto-Play: {autoPlay ? 'ON (60/20/20)' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Playing Area */}
      <div className="flex-1 w-full flex h-full relative">
        {/* Opponent POV Floating Indicator */}
        {activePov === 'opp' && gameState === 'playing' && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 font-mono text-[11px] uppercase tracking-widest flex items-center gap-2 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.2)] pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
            Spectating Opponent POV (Press Tab to Switch)
          </div>
        )}

        {/* Center Round Timer (identical to Ranked Mode, click to finish round in Sandbox) */}
        <div className="absolute left-1/2 top-4 -translate-x-1/2 z-30 pointer-events-none flex flex-col justify-start">
          {gameState === 'playing' && (
            <div 
              onClick={handleEndRound}
              title="Click to finish round (Sandbox shortcut)"
              className="bg-background border-2 border-white rounded-full w-24 h-24 flex flex-col items-center justify-center font-display text-3xl text-slate-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] z-30 pointer-events-auto relative cursor-pointer hover:border-[var(--hot)] transition-colors"
            >
              {(activePov === 'you' ? oppAbilities : myAbilities).includes('joker3') ? (
                <div className="text-4xl text-slate-600 mt-2">???</div>
              ) : (
                <>
                  {timeLeft}
                  <span className={`text-xs ${activePov === 'you' ? 'text-[var(--hot)]' : 'text-red-500'} font-mono mt-1`}>SEC</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Target Text Area & Centered Keyboard */}
        <div className="flex-1 w-full flex flex-col min-h-0 justify-center items-center relative">
          <RankedPlayerArea
            label={activePov === 'you' ? "Your Area" : "Opponent's Area"}
            wpm={activePov === 'you' ? myWpm : oppWpm}
            fontFamily={user?.fontFamily}
            progress={
              activePov === 'you'
                ? (typedText.length / Math.max(1, myTargetText.length)) * 100
                : (oppTypedText.length / Math.max(1, oppTargetText.length)) * 100
            }
            targetText={activePov === 'you' ? myTargetText : oppTargetText}
            typedText={activePov === 'you' ? typedText : oppTypedText}
            activeKeys={activePov === 'you' ? activeKeys : oppActiveKeys}
            gameState={gameState}
            isOpponent={activePov === 'opp'}
            charge={activePov === 'you' ? myCharge : oppCharge}
            cia={activePov === 'you' ? myCia : oppCia}
            dyslexiaActive={activePov === 'you' ? oppAbilities.includes('dyslexia') : myAbilities.includes('dyslexia')}
            tripActive={activePov === 'you' ? oppAbilities.includes('shrooms') : myAbilities.includes('shrooms')}
            blinkActive={activePov === 'you' ? oppAbilities.includes('blinking') : myAbilities.includes('blinking')}
            joker1Active={activePov === 'you' ? oppAbilities.includes('joker1') : myAbilities.includes('joker1')}
            joker2Active={activePov === 'you' ? oppAbilities.includes('joker2') : myAbilities.includes('joker2')}
            joker3Active={activePov === 'you' ? oppAbilities.includes('joker3') : myAbilities.includes('joker3')}
            characters={selectedCharacters}
            goldenLetters={activePov === 'you' ? goldenLettersRef.current : oppGoldenLettersRef.current}
            buffedAbilities={
              activePov === 'you'
                ? oppAbilities.filter(a => a.endsWith('_buffed')).map(a => a.replace('_buffed', ''))
                : myAbilities.filter(a => a.endsWith('_buffed')).map(a => a.replace('_buffed', ''))
            }
          />
        </div>

        {/* Bottom Bar: Full Real-Time Stats for Both Players */}
        {gameState === 'playing' && (
          <>
            <div className="fixed bottom-0 left-0 w-full px-12 py-6 flex justify-between items-end pointer-events-none z-30 bg-gradient-to-t from-background via-background/80 to-transparent">
              {/* You Stats */}
              {(() => {
                const isMyBlind = oppAbilities.includes('joker2');
                const isOppBlind = myAbilities.includes('joker2');

                return (
                  <>
                    <div 
                      onClick={() => setActivePov('you')}
                      className={`flex flex-col gap-2 pointer-events-auto p-4 rounded-xl transition-all cursor-pointer ${
                        activePov === 'you'
                          ? 'bg-slate-900/80 border border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/40 border border-slate-800/40 opacity-70 hover:opacity-100 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-xl text-[var(--hot)] tracking-widest uppercase">You</h3>
                        {activePov === 'you' && (
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold tracking-wider">
                            Watching POV
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-3xl text-white tracking-widest">
                        {isMyBlind ? '???' : myWpm} <span className="text-sm text-slate-500">WPM</span>
                      </div>
                      {myCia && (
                        <div className="font-mono text-sm text-slate-400 tracking-widest">
                          {isMyBlind ? (
                            <span className="text-slate-500">??? / ??? / ???</span>
                          ) : (
                            <>
                              <span className="text-emerald-400">{myCia.c}</span>/
                              <span className="text-red-500">{myCia.i}</span>/
                              <span className="text-amber-400">{myCia.a}</span>
                            </>
                          )}
                        </div>
                      )}
                      {selectedCharacters.includes('moneyguy') ? (
                        <div className="font-mono text-xs text-slate-300 flex gap-3">
                          <span className="text-yellow-400 font-bold">{isMyBlind ? '???' : myCoins} Coins</span>
                          <span className="text-red-400 font-bold">{isMyBlind ? '???' : myHearts} Hearts</span>
                        </div>
                      ) : (
                        <div className="font-mono text-xs text-slate-500">{isMyBlind ? '???' : `${myCharge}%`} Charge</div>
                      )}

                      <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
                        <div>
                          <div className="font-mono text-sm text-white tracking-widest">
                            {isMyBlind ? '???' : myRawWpm} <span className="text-[10px] text-slate-400">RAW WPM</span>
                          </div>
                          <div className="font-mono text-[9px] text-slate-500 tracking-tight">Speed before error penalties</div>
                        </div>
                        <div>
                          <div className="font-mono text-sm text-white tracking-widest">
                            {isMyBlind ? '???' : `${myAccuracy}%`} <span className="text-[10px] text-slate-400">ACC</span>
                          </div>
                          <div className="font-mono text-[9px] text-slate-500 tracking-tight">Typing correctness</div>
                        </div>
                        <div>
                          <div className="font-mono text-sm text-white tracking-widest">
                            {isMyBlind ? '???' : `${myConsistency}%`} <span className="text-[10px] text-slate-400">CONSISTENCY</span>
                          </div>
                          <div className="font-mono text-[9px] text-slate-500 tracking-tight">How stable speed was</div>
                        </div>
                      </div>
                    </div>

                    {/* Opponent Stats */}
                    <div 
                      onClick={() => setActivePov('opp')}
                      className={`flex flex-col gap-2 text-right pointer-events-auto items-end p-4 rounded-xl transition-all cursor-pointer ${
                        activePov === 'opp'
                          ? 'bg-slate-900/80 border border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)] ring-1 ring-red-500/30'
                          : 'bg-slate-950/40 border border-slate-800/40 opacity-70 hover:opacity-100 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {activePov === 'opp' && (
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold tracking-wider">
                            Watching POV
                          </span>
                        )}
                        <h3 className="font-display text-xl text-red-500 tracking-widest uppercase">Opponent</h3>
                      </div>
                      <div className="font-mono text-3xl text-white tracking-widest">
                        {isOppBlind ? '???' : oppWpm} <span className="text-sm text-slate-500">WPM</span>
                      </div>
                      {oppCia && (
                        <div className="font-mono text-sm text-slate-400 tracking-widest">
                          {isOppBlind ? (
                            <span className="text-slate-500">??? / ??? / ???</span>
                          ) : (
                            <>
                              <span className="text-emerald-400">{oppCia.c}</span>/
                              <span className="text-red-500">{oppCia.i}</span>/
                              <span className="text-amber-400">{oppCia.a}</span>
                            </>
                          )}
                        </div>
                      )}
                      <div className="font-mono text-xs text-slate-500">{isOppBlind ? '???' : `${oppCharge}%`} Charge</div>

                      <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80 items-end">
                        <div>
                          <div className="font-mono text-sm text-white tracking-widest">
                            {isOppBlind ? '???' : oppRawWpm} <span className="text-[10px] text-slate-400">RAW WPM</span>
                          </div>
                          <div className="font-mono text-[9px] text-slate-500 tracking-tight">Speed before error penalties</div>
                        </div>
                        <div>
                          <div className="font-mono text-sm text-white tracking-widest">
                            {isOppBlind ? '???' : `${oppAccuracy}%`} <span className="text-[10px] text-slate-400">ACC</span>
                          </div>
                          <div className="font-mono text-[9px] text-slate-500 tracking-tight">Typing correctness</div>
                        </div>
                        <div>
                          <div className="font-mono text-sm text-white tracking-widest">
                            {isOppBlind ? '???' : `${oppConsistency}%`} <span className="text-[10px] text-slate-400">CONSISTENCY</span>
                          </div>
                          <div className="font-mono text-[9px] text-slate-500 tracking-tight">How stable speed was</div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Right Side 3 Circles */}
            <div className="fixed right-4 top-[84px] bottom-[260px] flex flex-col justify-between items-end z-40 pointer-events-none">
              {selectedCharacters.map((charId, idx) => {
                const charStyle: React.CSSProperties | undefined =
                  charId === 'screwed'
                    ? { transform: 'scale(-2, 2)' }
                    : charId === 'mushgirl'
                      ? { transform: 'scale(2)' }
                      : charId === 'joker'
                        ? { transform: 'scale(1.65)' }
                        : charId === 'moneyguy'
                          ? { transform: 'scale(1.3)' }
                          : undefined;

                return (
                  <div
                    key={'my-' + idx}
                    className={`w-[calc((100dvh-380px)/3)] h-[calc((100dvh-380px)/3)] shrink-0 rounded-full border-4 overflow-hidden flex items-center justify-center transition-all ${
                      activePov === 'you'
                        ? 'border-[var(--hot)]/50 bg-[var(--hot)]/10 shadow-[0_0_25px_var(--color-hot-soft)]'
                        : 'border-red-500/50 bg-red-500/10 shadow-[0_0_25px_rgba(239,68,68,0.3)]'
                    }`}
                  >
                    <AnimatedCharacter
                      id={charId}
                      className="h-[82%] object-cover mt-2 transform-gpu"
                      style={charStyle}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Gravity Sabotage Popup */}
      {showGravityPopup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="bg-red-950 border border-red-500 p-8 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center animate-bounce">
            <h2 className="text-3xl text-red-500 font-display uppercase tracking-widest mb-4">Black Hole Sabotage!</h2>
            <p className="text-red-200 font-mono text-sm tracking-widest mb-4">You have been sucked into a gravity well!</p>
            <p className="text-white font-mono font-bold tracking-widest bg-red-900/50 p-4 rounded">Press CTRL + X to escape</p>
          </div>
        </div>
      )}

      {/* ROUND FINISHED: Ability Selection Shop */}
      {gameState === 'round_finished' && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-xl max-w-4xl w-full flex flex-col gap-6 shadow-2xl my-auto">
            {/* Round Summary Header */}
            <div className="text-center space-y-2 border-b border-slate-800 pb-4">
              <span className="font-mono text-xs uppercase tracking-widest text-slate-500">Round {currentRound + 1} Result</span>
              <h3 className="font-display text-4xl text-white uppercase tracking-widest">
                {roundWinner === 'Tie' ? 'Round Tied!' : `${roundWinner} Won Round ${currentRound + 1}!`}
              </h3>
              <div className="font-mono text-base text-[var(--hot)] font-bold tracking-widest">
                SERIES SCORE: YOU {myScore} — {oppScore} OPPONENT <span className="text-xs text-slate-400 font-normal">(First to 5 Wins)</span>
              </div>
            </div>

            {/* Choose Abilities for BOTH Players */}
            {(() => {
              const availableAbilities = ALL_SANDBOX_ABILITIES.filter(ab => selectedCharacters.includes(ab.char));

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Your Abilities */}
                  <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-lg flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="font-display text-lg text-[var(--hot)] uppercase tracking-wider">Your Abilities</h4>
                      <span className="font-mono text-[10px] text-slate-500 uppercase">Affects Opponent</span>
                    </div>
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {availableAbilities.length === 0 ? (
                        <p className="text-slate-500 font-mono text-xs">No abilities available for selected characters.</p>
                      ) : (
                        availableAbilities.map(ab => {
                          const active = myAbilities.includes(ab.id);
                          return (
                            <div
                              key={'my-ab-' + ab.id}
                              onClick={() => toggleMyAbility(ab.id)}
                              className={`p-3 rounded border text-left cursor-pointer transition-all flex items-center justify-between ${
                                active
                                  ? 'border-emerald-500/80 bg-emerald-500/10'
                                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-white uppercase">{ab.name}</span>
                                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{ab.char}</span>
                                </div>
                                <p className="font-mono text-[10px] text-slate-400 mt-1">{ab.desc}</p>
                              </div>
                              <span className={`font-mono text-xs uppercase px-2 py-1 rounded font-bold ${
                                active ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-500'
                              }`}>
                                {active ? 'ACTIVE' : 'OFF'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right Column: Opponent Abilities */}
                  <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-lg flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="font-display text-lg text-red-500 uppercase tracking-wider">Opponent's Abilities</h4>
                      <span className="font-mono text-[10px] text-slate-500 uppercase">Affects You</span>
                    </div>
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {availableAbilities.length === 0 ? (
                        <p className="text-slate-500 font-mono text-xs">No abilities available for selected characters.</p>
                      ) : (
                        availableAbilities.map(ab => {
                          const active = oppAbilities.includes(ab.id);
                          return (
                            <div
                              key={'opp-ab-' + ab.id}
                              onClick={() => toggleOppAbility(ab.id)}
                              className={`p-3 rounded border text-left cursor-pointer transition-all flex items-center justify-between ${
                                active
                                  ? 'border-red-500/80 bg-red-500/10'
                                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-white uppercase">{ab.name}</span>
                                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{ab.char}</span>
                                </div>
                                <p className="font-mono text-[10px] text-slate-400 mt-1">{ab.desc}</p>
                              </div>
                              <span className={`font-mono text-xs uppercase px-2 py-1 rounded font-bold ${
                                active ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-500'
                              }`}>
                                {active ? 'ACTIVE' : 'OFF'}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Next Round CTA Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => startNewRound(currentRound + 1)}
                className="py-4 px-12 border-2 border-[var(--hot)] bg-[var(--hot)] hover:bg-white text-black font-mono text-sm uppercase tracking-widest font-bold rounded-lg shadow-[0_0_25px_var(--color-hot-soft)] hover:scale-105 transition-all cursor-pointer"
              >
                Start Round {currentRound + 2} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MATCH FINISHED: First to 5 Wins Screen */}
      {gameState === 'match_finished' && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-lg flex flex-col items-center justify-center z-50 p-8 gap-8">
          <div className="text-center space-y-2">
            <h2 className={`font-display text-7xl uppercase tracking-widest ${
              matchWinner === 'You' ? 'text-emerald-400' : 'text-red-500'
            }`}>
              {matchWinner === 'You' ? 'VICTORY' : 'DEFEAT'}
            </h2>
            <p className="font-mono text-xs text-slate-400 uppercase tracking-widest">
              First to 5 Rounds Series Complete
            </p>
          </div>

          <div className="font-mono text-3xl font-bold tracking-widest text-white">
            <span className="text-[var(--hot)]">YOU {myScore}</span>
            <span className="text-slate-600 mx-4">—</span>
            <span className="text-red-500">{oppScore} OPPONENT</span>
          </div>

          {/* Stats Comparison Cards */}
          <div className="flex gap-12 w-full max-w-2xl font-mono text-center">
            {/* You Card */}
            <div className="flex-1 bg-slate-900/60 border border-emerald-500/50 p-6 rounded-xl space-y-3">
              <h4 className="font-display text-xl text-[var(--hot)] uppercase tracking-wider">You</h4>
              <div className="text-2xl text-white font-bold">{myWpm} <span className="text-xs text-slate-500 font-normal">WPM</span></div>
              <div className="text-xs text-slate-400">{myRawWpm} RAW WPM</div>
              <div className="text-xs text-slate-400">{myAccuracy}% ACC &bull; {myConsistency}% CON</div>
              <div className="text-xs text-slate-300 pt-2 border-t border-slate-800">
                CIA: <span className="text-emerald-400">{myCia.c}</span>/<span className="text-red-500">{myCia.i}</span>/<span className="text-amber-400">{myCia.a}</span>
              </div>
            </div>

            {/* Opponent Card */}
            <div className="flex-1 bg-slate-900/60 border border-red-500/50 p-6 rounded-xl space-y-3">
              <h4 className="font-display text-xl text-red-500 uppercase tracking-wider">Opponent</h4>
              <div className="text-2xl text-white font-bold">{oppWpm} <span className="text-xs text-slate-500 font-normal">WPM</span></div>
              <div className="text-xs text-slate-400">{oppRawWpm} RAW WPM</div>
              <div className="text-xs text-slate-400">{oppAccuracy}% ACC &bull; {oppConsistency}% CON</div>
              <div className="text-xs text-slate-300 pt-2 border-t border-slate-800">
                CIA: <span className="text-emerald-400">{oppCia.c}</span>/<span className="text-red-500">{oppCia.i}</span>/<span className="text-amber-400">{oppCia.a}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-6 mt-4">
            <button
              onClick={() => {
                setMyScore(0);
                setOppScore(0);
                setMyAbilities([]);
                setOppAbilities([]);
                startNewRound(0);
              }}
              className="py-4 px-10 border border-[var(--hot)] text-black bg-[var(--hot)] hover:bg-white font-mono text-xs uppercase tracking-widest font-bold rounded shadow-[0_0_20px_var(--color-hot-soft)] transition-all cursor-pointer"
            >
              Play Again (New Series)
            </button>
            <button
              onClick={() => setIsSandboxReady(false)}
              className="py-4 px-8 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-mono text-xs uppercase tracking-widest rounded transition-all cursor-pointer"
            >
              Change Characters
            </button>
            <button
              onClick={onBack}
              className="py-4 px-8 border border-slate-800 text-slate-500 hover:text-white font-mono text-xs uppercase tracking-widest rounded transition-all cursor-pointer"
            >
              Exit Sandbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
