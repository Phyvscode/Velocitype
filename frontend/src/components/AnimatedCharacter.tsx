import React, { useState, useEffect } from 'react';

interface AnimatedCharacterProps {
  id: string;
  className?: string;
  staticMode?: boolean;
  style?: React.CSSProperties;
}

export function AnimatedCharacter({ id, className = "h-48 object-contain", staticMode = false, style }: AnimatedCharacterProps) {
  const [frame, setFrame] = useState(staticMode && id === 'moneyguy' ? 5 : 1);

  const frameCount = id === 'screwed' ? 42 : id === 'joker' ? 6 : id === 'gravity' ? 4 : id === 'moneyguy' ? 15 : 8;
  const fps = id === 'screwed' ? 10 : id === 'gravity' ? 6 : id === 'moneyguy' ? 10 : 7.8;

  useEffect(() => {
    if (staticMode) return;
    
    const int = setInterval(() => {
      setFrame(f => {
        if (id === 'moneyguy') {
          return f >= 15 ? 5 : f + 1;
        }
        return f >= frameCount ? 1 : f + 1;
      });
    }, 1000 / fps);
    return () => clearInterval(int);
  }, [staticMode, frameCount, fps, id]);

  // Map IDs to their paths
  let src = "";
  if (id === 'mushgirl') {
    src = `/characters/Mushgirl/girlwithoutmush_000${frame}.png`;
  } else if (id === 'screwed') {
    const frameStr = String(frame).padStart(4, '0');
    src = `/characters/Screwed/screwed_${frameStr}.png`;
  } else if (id === 'joker') {
    const frameStr = String(frame).padStart(4, '0');
    src = `/characters/joker/joker-new_${frameStr}.png`;
  } else if (id === 'gravity') {
    const frameStr = String(frame).padStart(4, '0');
    src = `/characters/Gravity/gravity-drop-idle_${frameStr}.png`;
  } else if (id === 'moneyguy') {
    const frameStr = String(frame).padStart(4, '0');
    src = `/characters/moneyguy/money-guy_${frameStr}.png`;
  } else if (id === 'helper') {
    const bobY = staticMode ? 0 : Math.sin((frame / 8) * Math.PI * 2) * 4;
    return (
      <div
        className={`flex items-center justify-center select-none ${className}`}
        style={style}
        aria-label="helper"
      >
        <svg
          viewBox="0 0 120 120"
          className="w-28 h-28 drop-shadow-[0_0_14px_rgba(52,211,153,0.55)]"
          style={{ transform: `translateY(${bobY.toFixed(1)}px)` }}
        >
          <defs>
            <radialGradient id="helperCore" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="60%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#065f46" />
            </radialGradient>
          </defs>
          {/* Halo ring */}
          <ellipse cx="60" cy="22" rx="22" ry="6" fill="none" stroke="#34d399" strokeWidth="3" opacity="0.9" />
          {/* Bot head / body */}
          <rect x="30" y="34" width="60" height="52" rx="18" fill="url(#helperCore)" stroke="#a7f3d0" strokeWidth="2.5" />
          {/* Visor */}
          <rect x="38" y="46" width="44" height="20" rx="8" fill="#064e3b" stroke="#6ee7b7" strokeWidth="1.5" />
          {/* Eyes */}
          <circle cx="50" cy="56" r="4" fill="#a7f3d0" />
          <circle cx="70" cy="56" r="4" fill="#a7f3d0" />
          {/* Support Cross badge on chest */}
          <path d="M57 72 H63 V76 H67 V82 H63 V86 H57 V82 H53 V76 H57 Z" fill="#ecfdf5" />
        </svg>
      </div>
    );
  }

  if (!src) return null;

  return (
    <img src={src} className={className} style={style} alt={id} />
  );
}
