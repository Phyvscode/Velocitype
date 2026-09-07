import React from 'react';
import { RankedAbility } from '../../../backend/src/services/socketService'; // We'll just define it locally

export type Ability = 'longer_words' | 'scribberish' | 'no_color_change' | 'word_shuffle' | 'opponent_mistakes' | 'time_stop' | 'screen_flash' | 'none';

export const ABILITY_INFO: Record<Ability, { name: string; description: string }> = {
  'longer_words': { name: 'Longer Words', description: 'Every 10th word will contain 5+ letters.' },
  'scribberish': { name: 'Scribberish', description: 'Replace your words with random letter combinations.' },
  'no_color_change': { name: 'No Color Change', description: 'Correct and incorrect letters will no longer change color.' },
  'word_shuffle': { name: 'Word Shuffle', description: 'After EVERY Spacebar, the upcoming words are randomly rearranged.' },
  'opponent_mistakes': { name: 'Opponent Mistakes', description: 'Generate upcoming words containing letters the opponent mistypes.' },
  'time_stop': { name: 'Time Stop', description: 'Chance to temporarily stop the opponent\'s timer for 1 second.' },
  'screen_flash': { name: 'Screen Flash', description: '30% chance every 3s to flash opponent\'s screen black.' },
  'none': { name: 'None', description: '' }
};

interface Props {
  choices: Ability[];
  selected?: Ability;
  onSelect: (ability: Ability) => void;
}

export function AbilitySelection({ choices, selected, onSelect }: Props) {
  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center z-40 p-4">
      <h2 className="font-display text-4xl text-[var(--hot)] uppercase tracking-widest mb-8 text-center">Choose Your Ability</h2>
      {selected ? (
        <div className="text-center">
          <div className="font-mono text-xl text-white mb-4">Selected: {ABILITY_INFO[selected].name}</div>
          <div className="font-mono text-sm text-slate-400 uppercase tracking-widest animate-pulse">Waiting for opponent...</div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
          {choices.map(ability => (
            <button
              key={ability}
              onClick={() => onSelect(ability)}
              className="bg-slate-900 border-2 border-slate-700 hover:border-[var(--hot)] rounded-xl p-6 flex flex-col items-center text-center transition-all w-64 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <h3 className="font-mono text-lg text-[var(--hot)] uppercase tracking-widest mb-4">{ABILITY_INFO[ability].name}</h3>
              <p className="font-sans text-sm text-slate-300">{ABILITY_INFO[ability].description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
