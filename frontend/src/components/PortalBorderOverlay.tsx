import React, { useEffect, useRef } from 'react';

interface Props {
  borderStyle: string;
}

export default function PortalBorderOverlay({ borderStyle }: Props) {
  if (borderStyle === 'b0') {
    return (
      <>
        <div className="absolute inset-0 rounded-full border-[8px] border-transparent transition-all duration-700 opacity-0 group-hover:opacity-100 group-hover:animate-[portal-spin_8s_linear_infinite] group-hover:border-[var(--hot)] group-hover:border-dashed group-hover:shadow-[0_0_40px_var(--color-hot-soft),inset_0_0_40px_var(--color-hot-soft)]"></div>
        <div className="absolute inset-0 rounded-full border-[8px] border-[var(--hot)] transition-opacity duration-500 opacity-0 group-hover:animate-[portal-beam_2s_infinite_linear]" style={{ animationDelay: '0s' }}></div>
        <div className="absolute inset-0 rounded-full border-[8px] border-[var(--hot)] transition-opacity duration-500 opacity-0 group-hover:animate-[portal-beam_2s_infinite_linear]" style={{ animationDelay: '0.66s' }}></div>
        <div className="absolute inset-0 rounded-full border-[8px] border-[var(--hot)] transition-opacity duration-500 opacity-0 group-hover:animate-[portal-beam_2s_infinite_linear]" style={{ animationDelay: '1.33s' }}></div>
      </>
    );
  }

  // Ensure children don't capture pointer events if they overlap the main button area
  const overlayStyle = "absolute inset-0 pointer-events-none flex items-center justify-center";

  switch (borderStyle) {
    case 'b1':
      return <div className="portal-b1 absolute inset-0 rounded-full pointer-events-none"></div>;
    case 'b3':
      return (
        <div className="portal-b3-wrap absolute inset-0 pointer-events-none">
          <div className="ring r1"></div>
          <div className="ring r2"></div>
        </div>
      );
    case 'b4':
      return (
        <div className="portal-b4 absolute inset-0 pointer-events-none">
          <span className="c1"></span><span className="c2"></span><span className="c3"></span><span className="c4"></span>
        </div>
      );
    case 'b5':
      return <div className="portal-b5 absolute inset-0 pointer-events-none"></div>;
    case 'b7':
      return <div className="portal-b7 absolute inset-0 rounded-full pointer-events-none"></div>;
    case 'b8':
      return (
        <div className="portal-b8-wrap absolute inset-0 pointer-events-none">
          <svg viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="60"></circle>
            <circle className="draw" cx="65" cy="65" r="60"></circle>
          </svg>
        </div>
      );
    case 'b9':
      return (
        <div className="portal-b9 absolute inset-0 pointer-events-none">
          <div className="layer l1"></div>
          <div className="layer l2"></div>
          <div className="layer l3"></div>
        </div>
      );
    case 'b11':
      return (
        <div className="portal-b11 absolute inset-0 rounded-full pointer-events-none" ref={(el) => {
          if (!el) return;
          const handler = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const socketRadius = rect.width / 2;
            const iris = el.querySelector('.iris') as HTMLElement;
            if (!iris) return;
            const irisRadius = iris.offsetWidth / 2 || 60;
            const maxOffset = socketRadius - irisRadius - 1;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.hypot(dx, dy) || 1;
            const unitX = dx / dist;
            const unitY = dy / dist;
            const magnitude = Math.min(dist, maxOffset);
            
            iris.style.setProperty('--eye-x', `${(unitX * magnitude).toFixed(1)}px`);
            iris.style.setProperty('--eye-y', `${(unitY * magnitude).toFixed(1)}px`);
            
            const pupil = iris.querySelector('.pupil') as HTMLElement;
            if (pupil) {
              const pupilMaxX = irisRadius - pupil.offsetWidth / 2 - 2;
              const pupilMaxY = irisRadius - pupil.offsetHeight / 2 - 2;
              const ratio = magnitude / maxOffset;
              pupil.style.setProperty('--pupil-x', `${(unitX * pupilMaxX * ratio).toFixed(1)}px`);
              pupil.style.setProperty('--pupil-y', `${(unitY * pupilMaxY * ratio).toFixed(1)}px`);
            }
            const dot2 = iris.querySelector('.dot-2') as HTMLElement;
            if (dot2) {
              const dot2Max = irisRadius - dot2.offsetWidth / 2 - 20;
              dot2.style.setProperty('--dot2-x', `${(unitX * dot2Max * (magnitude/maxOffset)).toFixed(1)}px`);
              dot2.style.setProperty('--dot2-y', `${(unitY * dot2Max * (magnitude/maxOffset)).toFixed(1)}px`);
            }
            const dot3 = iris.querySelector('.dot-3') as HTMLElement;
            if (dot3) {
              const dot3Max = irisRadius - dot3.offsetWidth / 2 - 16;
              dot3.style.setProperty('--dot3-x', `${(unitX * dot3Max * (magnitude/maxOffset)).toFixed(1)}px`);
              dot3.style.setProperty('--dot3-y', `${(unitY * dot3Max * (magnitude/maxOffset)).toFixed(1)}px`);
            }
          };
          window.addEventListener('mousemove', handler);
          return () => window.removeEventListener('mousemove', handler);
        }}>
          <div className="lid lid-top">
            <span className="lash l1"></span><span className="lash l2"></span><span className="lash l3"></span>
          </div>
          <div className="lid lid-bottom"></div>
          <div className="iris">
            <div className="pupil"></div>
            <span className="dot dot-2"></span>
            <span className="dot dot-3"></span>
          </div>
        </div>
      );
    case 'b12':
      return (
        <div className="portal-b12 absolute inset-0 pointer-events-none stage-tumble">
          <KineticRing className="ring ring-1" driveFactory={makeTumbleDrive} />
          <KineticRing className="ring ring-2" driveFactory={makeTumbleDrive} />
          <KineticRing className="ring ring-3" driveFactory={makeTumbleDrive} />
        </div>
      );
    case 'b13':
      return (
        <div className="portal-b13 absolute inset-0 pointer-events-none stage-trio">
          <KineticRing className="tring tr-1" driveFactory={makeTumbleDrive} />
          <KineticRing className="tring tr-2" driveFactory={makeTumbleDrive} />
          <KineticRing className="tring tr-3" driveFactory={makeTumbleDrive} />
        </div>
      );
    case 'b14':
      return (
        <div className="portal-b14 absolute inset-0 pointer-events-none stage-fliph">
          <KineticRing className="fring" driveFactory={makeFlipHorizontalDrive} />
        </div>
      );
    case 'b15':
      return (
        <div className="portal-b15 absolute inset-0 pointer-events-none stage-spinv">
          <KineticRing className="sring" driveFactory={makeSpinVerticalDrive} />
        </div>
      );
    default:
      return null;
  }
}

const makeTumbleDrive = () => {
  let targetVx = 0, targetVy = 0, nextRetarget = 0;
  return function drive(state: any, elapsed: number, dt: number){
    const now = performance.now();
    if (now >= nextRetarget){
      targetVx = (Math.random() * 110) - 55;
      targetVy = (Math.random() * 110) - 55;
      nextRetarget = now + (Math.random() * 1400) + 1400;
    }
    const smoothing = 1 - Math.exp(-dt / 0.9);
    state.vx += (targetVx - state.vx) * smoothing;
    state.vy += (targetVy - state.vy) * smoothing;
    state.rx += state.vx * dt;
    state.ry += state.vy * dt;
  };
};

const makeFlipHorizontalDrive = () => {
  return function drive(state: any, elapsed: number, dt: number){
    const t = elapsed / 1000;
    const speed = 130 + 90 * Math.sin(t * 0.7);
    state.ry += speed * dt;
    state.rx = 14 * Math.sin(t * 1.9) + 5 * Math.sin(t * 4.3 + 1);
  };
};

const makeSpinVerticalDrive = () => {
  return function drive(state: any, elapsed: number, dt: number){
    const t = elapsed / 1000;
    const speed = 150 + 100 * Math.sin(t * 0.55 + 1.2);
    state.rx += speed * dt;
    state.ry = 12 * Math.sin(t * 2.3 + 0.6) + 6 * Math.sin(t * 5.1);
  };
};

function KineticRing({ className, driveFactory }: { className: string, driveFactory: () => any }) {
  const ringRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!ringRef.current) return;
    const stage = ringRef.current.closest('.portal-stage');
    if (!stage) return;
    const ring = ringRef.current;
    
    const drive = driveFactory();
    const state = {
      rx: 0, ry: 0, vx: 0, vy: 0,
      active: false, settling: false,
      raf: null as number | null, lastT: 0, startT: 0,
    };

    function settleStep(dt: number){
      const decay = Math.pow(0.02, dt);
      state.vx *= decay;
      state.vy *= decay;

      const targetRx = Math.round(state.rx / 360) * 360;
      const targetRy = Math.round(state.ry / 360) * 360;
      const pull = 1 - Math.exp(-dt / 0.45);

      state.rx += state.vx * dt + (targetRx - state.rx) * pull;
      state.ry += state.vy * dt + (targetRy - state.ry) * pull;

      const settled =
        Math.abs(targetRx - state.rx) < 0.25 &&
        Math.abs(targetRy - state.ry) < 0.25 &&
        Math.abs(state.vx) < 0.3 &&
        Math.abs(state.vy) < 0.3;

      if (settled){
        state.rx = 0; state.ry = 0; state.vx = 0; state.vy = 0;
        ring.style.transform = 'rotateX(0deg) rotateY(0deg)';
        state.raf = null;
        return false;
      }
      return true;
    }

    function tick(now: number){
      if (state.lastT === 0){ state.lastT = now; state.startT = now; }
      const dt = Math.min((now - state.lastT) / 1000, 0.05);
      state.lastT = now;

      if (state.settling){
        if (!settleStep(dt)){ return; }
      } else {
        drive(state, now - state.startT, dt);
      }

      ring.style.transform = `rotateX(${state.rx}deg) rotateY(${state.ry}deg)`;
      state.raf = requestAnimationFrame(tick);
    }

    const start = () => {
      state.active = true;
      state.settling = false;
      state.lastT = 0;
      if (!state.raf) state.raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      state.active = false;
      state.settling = true;
    };

    stage.addEventListener('mouseenter', start);
    stage.addEventListener('mouseleave', stop);

    return () => {
      stage.removeEventListener('mouseenter', start);
      stage.removeEventListener('mouseleave', stop);
      if (state.raf) cancelAnimationFrame(state.raf);
    };
  }, [driveFactory]);

  return <div ref={ringRef} className={className}></div>;
}
