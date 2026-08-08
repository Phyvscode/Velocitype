import { useEffect, useRef, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';

type Props = {
  onOpenAuth: () => void;
};

export function ProfileOrb({ onOpenAuth }: Props) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLButtonElement>(null);

  const name = user?.username || "Guest";
  const signedIn = !!user;

  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalAvatar(localStorage.getItem('velocitype_local_avatar'));
    }
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (typeof window !== 'undefined') {
          localStorage.setItem('velocitype_local_avatar', base64);
        }
        setLocalAvatar(base64);
        setOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const onMove = (e: React.PointerEvent) => {
    const el = orbRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateX(${(-py * 22).toFixed(2)}deg) rotateY(${(px * 26).toFixed(2)}deg) translateZ(14px) scale(1.06)`;
  };
  const onLeave = () => {
    if (orbRef.current) orbRef.current.style.removeProperty("transform");
  };

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={wrapRef} className="scene relative flex flex-col items-end">
      <button
        ref={orbRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={signedIn ? `Account menu for ${name}` : "Sign in"}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onClick={() => setOpen((o) => !o)}
        className="liquid-orb relative grid h-14 w-14 place-items-center"
      >
        <span className="liquid-orb-ring" aria-hidden />
        <span className="liquid-orb-core grid h-full w-full place-items-center overflow-hidden">
          {user?.avatarUrl || localAvatar ? (
            <img src={user?.avatarUrl || localAvatar || ''} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-sm tracking-[0.08em] text-white">
              {initials}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="animate-rise relative z-50 w-44 mt-3 overflow-hidden rounded-[5px] border border-slate-800 bg-slate-900/95 p-1 backdrop-blur-md shadow-2xl"
        >
          <div className="px-3 py-2">
            <p className="font-display text-xs tracking-[0.06em] text-white">{name}</p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-slate-400">
              {signedIn ? "signed in" : "guest"}
            </p>
          </div>
          <div className="my-1 h-px bg-slate-800/70" />
          {["Profile", "Statistics", "Settings"].map((item) => (
            <button
              key={item}
              role="menuitem"
              type="button"
              className="block w-full rounded-[3px] px-3 py-1.5 text-left text-[10px] uppercase tracking-[0.18em] text-slate-400 transition-colors hover:bg-slate-800 hover:text-[var(--hot)]"
            >
              {item}
            </button>
          ))}
          <div className="my-1 h-px bg-slate-800/70" />
          <button
            role="menuitem"
            type="button"
            onClick={() => document.getElementById('avatar-upload')?.click()}
            className="block w-full rounded-[3px] px-3 py-1.5 text-left text-[10px] uppercase tracking-[0.18em] text-emerald-400 transition-colors hover:bg-emerald-400/15"
          >
            Upload Picture
          </button>
          <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              if (signedIn) {
                logout();
              } else {
                onOpenAuth();
              }
              setOpen(false);
            }}
            className="block w-full rounded-[3px] px-3 py-1.5 text-left text-[10px] uppercase tracking-[0.18em] text-[var(--hot)] transition-colors hover:bg-[var(--hot)]/15"
          >
            {signedIn ? "Log out" : "Sign in"}
          </button>
        </div>
      )}
    </div>
  );
}
