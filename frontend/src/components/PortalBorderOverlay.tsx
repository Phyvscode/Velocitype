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
        <div className="portal-b12 absolute inset-0 pointer-events-none">
          <div className="line top"></div>
          <div className="line bottom"></div>
          <div className="line left"></div>
          <div className="line right"></div>
        </div>
      );
    case 'b13':
      return (
        <div className="portal-b13 absolute inset-[-4px] pointer-events-none">
          <svg viewBox="0 0 130 130" className="w-full h-full overflow-visible">
            <circle cx="65" cy="65" r="60" className="base-ring" />
            <circle cx="65" cy="65" r="60" className="draw-ring" />
          </svg>
        </div>
      );
    default:
      return null;
  }
}
