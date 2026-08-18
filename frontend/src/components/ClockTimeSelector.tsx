import React, { useRef } from 'react';
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

interface Props {
  durationVal: number;
  durationRawInput?: string;
  setDurationInput: (val: string) => void;
  mode?: 'time' | 'words';
  limitToggle?: React.ReactNode;
}

export const HOURS = [
  { label: '12', val: 30 },
  { label: '1', val: 40 },
  { label: '2', val: 50 },
  { label: '3', val: 60 },
  { label: '4', val: 120 },
  { label: '5', val: 180 },
  { label: '6', val: 240 },
  { label: '7', val: 300 },
  { label: '8', val: 360 },
  { label: '9', val: 420 },
  { label: '10', val: 480 },
  { label: '11', val: 600 },
];

export function getAngleFromDuration(dur: number) {
  if (dur <= HOURS[0].val) return 0;
  if (dur >= HOURS[HOURS.length - 1].val) return (HOURS.length - 1) * 30;
  
  for (let i = 0; i < HOURS.length - 1; i++) {
    if (dur >= HOURS[i].val && dur <= HOURS[i + 1].val) {
      const range = HOURS[i + 1].val - HOURS[i].val;
      const pct = (dur - HOURS[i].val) / range;
      return (i * 30) + (pct * 30);
    }
  }
  return 0;
}

export default function ClockTimeSelector({ durationVal, durationRawInput, setDurationInput, mode = 'time', limitToggle }: Props) {
  const spinnerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spinnerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive value for the input field: use raw input if available (to allow free typing), otherwise use fallback computed val
  const displayVal = durationRawInput !== undefined ? durationRawInput : durationVal.toString();
  
  const displayValRef = useRef(displayVal);
  React.useEffect(() => {
    displayValRef.current = displayVal;
  }, [displayVal]);

  const startSpin = (fn: () => void) => {
    fn();
    spinnerTimeoutRef.current = setTimeout(() => {
      spinnerTimerRef.current = setInterval(fn, 80);
    }, 400);
  };

  const stopSpin = () => {
    if (spinnerTimeoutRef.current) clearTimeout(spinnerTimeoutRef.current);
    if (spinnerTimerRef.current) clearInterval(spinnerTimerRef.current);
  };

  const handleInc = () => {
    let v = parseInt((displayValRef.current || '0').toString(), 10) + 1;
    if (mode === 'words' && v > 1000) v = 1000;
    if (mode === 'time' && v > 3600) v = 3600;
    setDurationInput(v.toString());
  };

  const handleDec = () => {
    let v = parseInt((displayValRef.current || '0').toString(), 10) - 1;
    if (mode === 'words' && v < 5) v = 5;
    if (mode === 'time' && v < 10) v = 10;
    setDurationInput(v.toString());
  };

  return (
    <div className={`flex flex-row items-center pt-4 pb-4 gap-12 ${mode === 'words' ? 'justify-center' : ''}`}>
      <style>{`
        .hg-scene {
          position: relative;
          width: 220px;
          height: 220px;
        }

        .hg-clock {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 190px;
          height: 190px;
          transform: translate(-50%,-50%);
        }

        .hg-face-content {
          position: absolute;
          inset: 0;
          border-radius: 50%;
        }

        .hg-ticks-container {
          position: absolute;
          inset: 0;
        }

        .hg-face {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #ffffff;
          border: 4px solid var(--hot);
          box-shadow: 0 0 40px 10px rgba(255, 255, 255, 0.15), 0 8px 20px rgba(0,0,0,.35);
        }

        .hg-tick-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hg-tick-line {
          width: 2px;
          height: 6px;
          background-color: #111;
          margin-top: 6px;
          border-radius: 2px;
        }

        .hg-tick {
          margin-top: 2px;
          font-family: monospace;
          font-weight: bold;
          font-size: 13px;
          color: #111;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hg-pivot {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--hot);
          transform: translate(-50%,-50%);
          z-index: 5;
        }

        .hg-minute-hand {
          position: absolute;
          left: 50%;
          top: 50%;
          transform-origin: 50% 100%;
          background: var(--hot);
          border-radius: 4px;
          z-index: 4;
          width: 5px;
          height: 68px;
          transform: translate(-50%,-100%) rotate(0deg);
        }
      `}</style>

      <div className="flex-shrink-0 hg-scene" style={{ viewTransitionName: 'hourglass-clock' }}>
        <div className="hg-clock">
          <div className="hg-face-content">
            <div className="hg-face"></div>
            <div className="hg-ticks-container">
              {HOURS.map((_h, i) => (
                <div key={i} className="hg-tick-wrap" style={{ transform: `rotate(${i * 30}deg)` }}>
                  <div className="hg-tick-line"></div>
                </div>
              ))}
            </div>
            <div
              className="hg-minute-hand"
            ></div>
            <div className="hg-pivot"></div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 relative">
        {limitToggle && (
          <div className="mb-2">
            {limitToggle}
          </div>
        )}
        <label className="text-sm text-slate-300 uppercase tracking-widest">
          {mode === 'words' ? 'Number of Words' : 'Time Limit (seconds)'}
        </label>
        <div className="relative flex items-center justify-center w-48 h-16 bg-transparent border-2 border-[var(--hot)] rounded-2xl focus-within:ring-4 focus-within:ring-[var(--hot)]/20 transition-all overflow-hidden pr-12">
          <div className="flex-1 flex items-center justify-center h-full pl-5 pr-1">
            <input 
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={displayVal}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setDurationInput(val);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              onBlur={() => {
                let val = parseInt(displayVal, 10);
                if (isNaN(val)) val = mode === 'words' ? 5 : 10;
                if (mode === 'words' && val < 5) val = 5;
                if (mode === 'time' && val < 10) val = 10;
                if (mode === 'words' && val > 1000) val = 1000;
                if (mode === 'time' && val > 3600) val = 3600;
                setDurationInput(val.toString());
              }}
              className="bg-transparent text-white caret-white text-4xl font-bold focus:outline-none text-right w-20"
            />
            <span className="w-8 text-left text-[var(--hot)]/60 text-3xl font-bold pointer-events-none ml-1">
              {mode === 'words' ? 'w' : 's'}
            </span>
          </div>

          {/* Custom Arrows */}
          <div className="absolute right-0 top-0 bottom-0 w-12 flex flex-col">
            <button 
              onMouseDown={() => startSpin(handleInc)} onMouseUp={stopSpin} onMouseLeave={stopSpin} onTouchStart={(e) => { e.preventDefault(); startSpin(handleInc); }} onTouchEnd={stopSpin}
              className="flex-1 flex items-end justify-center text-[var(--hot)] hover:opacity-80 transition-opacity pb-0"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><polygon points="12,8 20,20 4,20"/></svg>
            </button>
            <button 
              onMouseDown={() => startSpin(handleDec)} onMouseUp={stopSpin} onMouseLeave={stopSpin} onTouchStart={(e) => { e.preventDefault(); startSpin(handleDec); }} onTouchEnd={stopSpin}
              className="flex-1 flex items-start justify-center text-[var(--hot)] hover:opacity-80 transition-opacity pt-0"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><polygon points="12,16 20,4 4,4"/></svg>
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2 max-w-[12rem] text-center">
          {mode === 'words' ? 'Type the number of words to type.' : 'Type a custom time limit in seconds.'}
        </p>
      </div>
    </div>
  );
}
