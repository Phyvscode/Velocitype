import React from 'react';
import PortalBorderOverlay from '@/components/PortalBorderOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export const BORDER_STYLES = [
  { id: 'b0', name: 'Original Portal' },
  { id: 'b1', name: 'Dashed Orbit' },
  { id: 'b3', name: 'Twin Rings' },
  { id: 'b4', name: 'Viewfinder' },
  { id: 'b5', name: 'Liquid Blob' },
  { id: 'b7', name: 'Pulse Glow' },
  { id: 'b9', name: 'Sketch Layers' },
  { id: 'b11', name: 'Watching Eye' },
  { id: 'b12', name: 'Tumble Spin' },
  { id: 'b13', name: 'Tumble Trio' },
  { id: 'b14', name: 'Flip Horizontal' },
  { id: 'b15', name: 'Spin Vertical' },
  { id: 'b16', name: '3D Key' },
];

interface BorderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BorderModal({ isOpen, onClose }: BorderModalProps) {
  const { user } = useAuth();
  
  const [selected, setSelected] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('velocitype_portal_border') || 'b0';
    }
    return 'b0';
  });

  const handleSelect = async (id: string) => {
    setSelected(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('velocitype_portal_border', id);
      window.dispatchEvent(new Event('storage'));
    }
    
    if (user) {
      try {
        await api.updateSettings({ portalBorder: id });
      } catch (err) {
        console.error('Failed to save portal border to backend:', err);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const stage = e.currentTarget;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    const mx = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
    const my = Math.max(-1, Math.min(1, dy / (rect.height / 2)));
    const dist = Math.min(1, Math.hypot(dx, dy) / (rect.width / 2));
    const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;

    stage.style.setProperty('--mx', mx.toFixed(3));
    stage.style.setProperty('--my', my.toFixed(3));
    stage.style.setProperty('--dist', dist.toFixed(3));
    stage.style.setProperty('--angle', angle.toFixed(1));

    const radar = stage.querySelector('#radar');
    if (radar) {
      const ticks = radar.querySelectorAll('i');
      ticks.forEach(t => {
        const tAngle = parseFloat(t.getAttribute('data-angle') || '0');
        let diff = Math.abs(angle - tAngle) % 360;
        diff = diff > 180 ? 360 - diff : diff;
        t.classList.toggle('lit', diff < 10);
        t.classList.toggle('near', diff >= 10 && diff < 28);
      });
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const stage = e.currentTarget;
    stage.classList.add('leaving');
    stage.style.setProperty('--mx', '0');
    stage.style.setProperty('--my', '0');
    stage.style.setProperty('--dist', '0');
    const radar = stage.querySelector('#radar');
    if (radar) {
      const ticks = radar.querySelectorAll('i');
      ticks.forEach(t => { t.classList.remove('lit'); t.classList.remove('near'); });
    }
    setTimeout(() => stage.classList.remove('leaving'), 650);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-background border border-[var(--hot)] rounded-2xl p-6 md:p-8 shadow-[0_0_40px_var(--color-hot-soft)] flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-[var(--hot)] transition-colors"
        >
          ✕
        </button>
        
        <div className="mb-8 text-center">
          <div className="text-[11px] tracking-[0.35em] text-[var(--hot)] uppercase mb-3">Frame Studies</div>
          <h2 className="text-3xl md:text-4xl font-display tracking-widest text-white uppercase m-0">
            Portal Borders
          </h2>
          <p className="text-slate-400 text-sm mt-3 max-w-md mx-auto">
            Select an animation style for the main menu portals.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-wrap justify-center gap-[clamp(1.5rem,3vw,3rem)]" style={{ perspective: '1500px' }}>
            {BORDER_STYLES.map(style => (
              <div key={style.id} className="flex flex-col items-center gap-4 group">
                <button
                  onClick={() => handleSelect(style.id)}
                  onMouseMove={style.id !== 'b16' ? handleMouseMove : undefined}
                  onMouseLeave={style.id !== 'b16' ? handleMouseLeave : undefined}
                  style={{ transformStyle: 'preserve-3d' }}
                  className={
                    style.id === 'b16'
                      ? `portal-stage relative inline-flex flex-col w-[clamp(5rem,8vw,9rem)] h-[clamp(5rem,8vw,9rem)] items-center justify-center rounded-2xl border-2 border-[var(--hot)] bg-[var(--key-cap)] font-semibold tracking-wide text-[var(--key-text)] key-gradient transform-gpu transition-all duration-150 ease-out z-10 ${selected === style.id ? 'translate-y-3 key-3d-pressed shadow-none' : 'key-3d hover:translate-y-3 hover:key-3d-pressed active:translate-y-4 active:scale-[0.98]'}`
                      : `relative w-[clamp(5rem,8vw,9rem)] h-[clamp(5rem,8vw,9rem)] rounded-full flex flex-col items-center justify-center transition-all duration-700 ease-in-out portal-stage ${style.id === 'b0' ? 'hover:-translate-y-2 hover:[transform:rotateX(75deg)] border' : ''} ${
                          selected === style.id
                            ? `${style.id === 'b0' ? 'border-[var(--hot)] ' : ''}bg-[var(--hot)]/10 text-white shadow-[0_0_20px_var(--color-hot-soft)]`
                            : `${style.id === 'b0' ? 'border-slate-800 ' : ''}bg-slate-900/50 text-slate-400 hover:text-slate-200`
                        }`
                  }
                >
                  <PortalBorderOverlay borderStyle={style.id} />
                </button>
                <div className={`text-xs sm:text-sm font-display tracking-widest uppercase text-center leading-tight transition-colors duration-300 ${selected === style.id ? 'text-[var(--hot)]' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {style.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
