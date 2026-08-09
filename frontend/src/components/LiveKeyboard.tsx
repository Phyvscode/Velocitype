import React from 'react';

export const getKeyLabel = (e: KeyboardEvent | React.KeyboardEvent) => {
  if (e.code === 'Space') return 'SPACE';
  if (e.key === 'Backspace') return '⌫';
  if (e.key === 'Tab') return 'TAB';
  if (e.key === 'CapsLock') return 'CAPS';
  if (e.key === 'Enter') return 'ENTER';
  
  if (e.code === 'ShiftLeft') return 'LSHIFT';
  if (e.code === 'ShiftRight') return 'RSHIFT';
  if (e.code === 'ControlLeft') return 'LCTRL';
  if (e.code === 'ControlRight') return 'RCTRL';
  if (e.code === 'AltLeft') return 'LALT';
  if (e.code === 'AltRight') return 'RALT';
  
  // Fallbacks if e.code isn't available
  if (e.key === 'Shift') return 'LSHIFT';
  if (e.key === 'Control') return 'LCTRL';
  if (e.key === 'Alt') return 'LALT';

  return e.key.toUpperCase();
};

interface LiveKeyboardProps {
  activeKeys: Set<string>;
}

export default function LiveKeyboard({ activeKeys }: LiveKeyboardProps) {
  // A 60-column grid allows us to perfectly align all standard keyboard rows.
  // Standard key = 4 cols
  
  const rows = [
    // Row 1
    { key: '`', span: 4 }, { key: '1', span: 4 }, { key: '2', span: 4 }, { key: '3', span: 4 }, { key: '4', span: 4 }, { key: '5', span: 4 }, { key: '6', span: 4 }, { key: '7', span: 4 }, { key: '8', span: 4 }, { key: '9', span: 4 }, { key: '0', span: 4 }, { key: '-', span: 4 }, { key: '=', span: 4 }, { key: '⌫', span: 8 },
    // Row 2
    { key: 'TAB', span: 6 }, { key: 'Q', span: 4 }, { key: 'W', span: 4 }, { key: 'E', span: 4 }, { key: 'R', span: 4 }, { key: 'T', span: 4 }, { key: 'Y', span: 4 }, { key: 'U', span: 4 }, { key: 'I', span: 4 }, { key: 'O', span: 4 }, { key: 'P', span: 4 }, { key: '[', span: 4 }, { key: ']', span: 4 }, { key: '\\', span: 6 },
    // Row 3
    { key: 'CAPS', span: 7 }, { key: 'A', span: 4 }, { key: 'S', span: 4 }, { key: 'D', span: 4 }, { key: 'F', span: 4 }, { key: 'G', span: 4 }, { key: 'H', span: 4 }, { key: 'J', span: 4 }, { key: 'K', span: 4 }, { key: 'L', span: 4 }, { key: ';', span: 4 }, { key: "'", span: 4 }, { key: 'ENTER', span: 9 },
    // Row 4
    { key: 'SHIFT', span: 9, id: 'LSHIFT' }, { key: 'Z', span: 4 }, { key: 'X', span: 4 }, { key: 'C', span: 4 }, { key: 'V', span: 4 }, { key: 'B', span: 4 }, { key: 'N', span: 4 }, { key: 'M', span: 4 }, { key: ',', span: 4 }, { key: '.', span: 4 }, { key: '/', span: 4 }, { key: 'SHIFT', span: 11, id: 'RSHIFT' },
    // Row 5
    { key: 'CTRL', span: 6, id: 'LCTRL' }, { key: 'ALT', span: 6, id: 'LALT' }, { key: 'SPACE', span: 36 }, { key: 'ALT', span: 6, id: 'RALT' }, { key: 'CTRL', span: 6, id: 'RCTRL' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto" style={{ perspective: '1200px' }}>
      <div 
        className="w-full bg-transparent border border-[var(--hot)]/40 rounded-2xl p-6 transition-all duration-300"
        style={{ transform: 'rotateX(25deg)', transformStyle: 'preserve-3d' }}
      >
        <div 
          style={{ display: 'grid', gridTemplateColumns: 'repeat(60, minmax(0, 1fr))', gridTemplateRows: 'repeat(5, minmax(0, 1fr))', gap: 'clamp(2px, 0.6vw, 10px)', aspectRatio: '3 / 1' }}
        >
          {rows.map((k, i) => {
            const uniqueKey = k.id || k.key;
            const isActive = activeKeys.has(uniqueKey);
            
            return (
              <div 
                key={`${uniqueKey}-${i}`} 
                style={{ gridColumn: `span ${k.span} / span ${k.span}` }}
                className={`h-full w-full rounded-lg flex items-center justify-center font-mono text-[clamp(10px,1.2vw,14px)] font-bold transition-all duration-100 uppercase select-none ${
                  isActive 
                    ? 'bg-[var(--hot)]/20 border border-[var(--hot)] text-[var(--hot)] shadow-[0_0_15px_var(--color-hot-soft)]' 
                    : 'bg-[#161822] border border-slate-700/50 text-slate-500 shadow-sm'
                }`}
              >
                {k.key === 'SPACE' ? '' : k.key}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
