import React, { useState, forwardRef, useImperativeHandle, useCallback } from 'react';

export interface FlyingResourceRef {
  spawnCoin: (startX: number, startY: number, targetX: number, targetY: number, onArrival?: () => void) => void;
  spawnHeart: (startX: number, startY: number, targetX: number, targetY: number, onArrival?: () => void) => void;
}

interface Particle {
  id: number;
  type: 'coin' | 'heart';
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  midX: number;
  midY: number;
  onArrival?: () => void;
}

export function CoinIcon({ className = "w-4 h-4", glow = true }: { className?: string; glow?: boolean }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={`${className} ${glow ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]' : ''}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" fill="url(#coinGradOuter)" stroke="#f59e0b" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="7.5" fill="url(#coinGradInner)" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 1" />
      <path 
        d="M12 6.5v11M8.8 9.2h4.8a1.5 1.5 0 0 1 0 3H9.4a1.5 1.5 0 0 0 0 3h5" 
        stroke="#78350f" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <defs>
        <linearGradient id="coinGradOuter" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="0.45" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="coinGradInner" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fffbeb" />
          <stop offset="0.6" stopColor="#fde047" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function HeartIcon({ className = "w-4 h-4", glow = true }: { className?: string; glow?: boolean }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={`${className} ${glow ? 'drop-shadow-[0_0_6px_rgba(239,68,68,0.85)]' : ''}`}
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
        fill="url(#heartGrad)"
        stroke="#991b1b"
        strokeWidth="0.8"
      />
      <path
        d="M7 6c-1.5 0-2.5 1-2.5 2.2 0 1 .5 2 1.5 3"
        stroke="#fca5a5"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      <defs>
        <linearGradient id="heartGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f87171" />
          <stop offset="0.5" stopColor="#ef4444" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

let particleCounter = 0;

export const FlyingResourceOverlay = forwardRef<FlyingResourceRef, {}>((_, ref) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const spawn = useCallback((type: 'coin' | 'heart', startX: number, startY: number, targetX: number, targetY: number, onArrival?: () => void) => {
    const id = ++particleCounter;
    const dx = targetX - startX;
    const dy = targetY - startY;
    // Compute a curved upward arc
    const midX = dx * 0.18 + (Math.random() * 50 - 25);
    const midY = dy * 0.18 - (35 + Math.random() * 30);

    let arrivalFired = false;
    const triggerArrival = () => {
      if (!arrivalFired) {
        arrivalFired = true;
        if (onArrival) {
          onArrival();
        }
      }
    };

    const newParticle: Particle = {
      id,
      type,
      startX,
      startY,
      dx,
      dy,
      midX,
      midY,
      onArrival: triggerArrival,
    };

    setParticles(prev => [...prev.slice(-30), newParticle]); // keep max 30 items

    // Fallback cleanup in case onAnimationEnd doesn't fire
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
      triggerArrival();
    }, 650);
  }, []);

  useImperativeHandle(ref, () => ({
    spawnCoin: (startX, startY, targetX, targetY, onArrival) => {
      spawn('coin', startX, startY, targetX, targetY, onArrival);
    },
    spawnHeart: (startX, startY, targetX, targetY, onArrival) => {
      spawn('heart', startX, startY, targetX, targetY, onArrival);
    },
  }), [spawn]);

  const handleAnimationEnd = (p: Particle) => {
    setParticles(prev => prev.filter(item => item.id !== p.id));
    if (p.onArrival) {
      p.onArrival();
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="flying-resource-item"
          style={{
            left: `${p.startX}px`,
            top: `${p.startY}px`,
            ['--dx' as any]: `${p.dx}px`,
            ['--dy' as any]: `${p.dy}px`,
            ['--mid-x' as any]: `${p.midX}px`,
            ['--mid-y' as any]: `${p.midY}px`,
          }}
          onAnimationEnd={() => handleAnimationEnd(p)}
        >
          {p.type === 'coin' ? (
            <div className="scale-125">
              <CoinIcon className="w-5 h-5" glow />
            </div>
          ) : (
            <div className="scale-125">
              <HeartIcon className="w-5 h-5" glow />
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

FlyingResourceOverlay.displayName = 'FlyingResourceOverlay';
