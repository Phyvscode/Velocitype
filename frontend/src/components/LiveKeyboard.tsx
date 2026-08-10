import React, { useState } from "react";

export const getKeyLabel = (e: KeyboardEvent | React.KeyboardEvent) => {
  if (e.code === "Space") return "SPACE";
  if (e.key === "Backspace") return "⌫";
  if (e.key === "Tab") return "TAB";
  if (e.key === "CapsLock") return "CAPS";
  if (e.key === "Enter") return "ENTER";
  if (e.code === "ShiftLeft") return "LSHIFT";
  if (e.code === "ShiftRight") return "RSHIFT";
  if (e.code === "ControlLeft") return "LCTRL";
  if (e.code === "ControlRight") return "RCTRL";
  if (e.code === "AltLeft") return "LALT";
  if (e.code === "AltRight") return "RALT";
  if (e.key === "Shift") return "LSHIFT";
  if (e.key === "Control") return "LCTRL";
  if (e.key === "Alt") return "LALT";

  return e.key.toUpperCase();
};

interface LiveKeyboardProps {
  activeKeys: Set<string>;
}

type KeyDef = { key: string; span: number; id?: string };

const rows: KeyDef[][] = [
  [
    { key: "`", span: 4 }, { key: "1", span: 4 }, { key: "2", span: 4 }, { key: "3", span: 4 },
    { key: "4", span: 4 }, { key: "5", span: 4 }, { key: "6", span: 4 }, { key: "7", span: 4 },
    { key: "8", span: 4 }, { key: "9", span: 4 }, { key: "0", span: 4 }, { key: "-", span: 4 },
    { key: "=", span: 4 }, { key: "⌫", span: 8 },
  ],
  [
    { key: "TAB", span: 6 }, { key: "Q", span: 4 }, { key: "W", span: 4 }, { key: "E", span: 4 },
    { key: "R", span: 4 }, { key: "T", span: 4 }, { key: "Y", span: 4 }, { key: "U", span: 4 },
    { key: "I", span: 4 }, { key: "O", span: 4 }, { key: "P", span: 4 }, { key: "[", span: 4 },
    { key: "]", span: 4 }, { key: "\\", span: 6 },
  ],
  [
    { key: "CAPS", span: 7 }, { key: "A", span: 4 }, { key: "S", span: 4 }, { key: "D", span: 4 },
    { key: "F", span: 4 }, { key: "G", span: 4 }, { key: "H", span: 4 }, { key: "J", span: 4 },
    { key: "K", span: 4 }, { key: "L", span: 4 }, { key: ";", span: 4 }, { key: "'", span: 4 },
    { key: "ENTER", span: 9 },
  ],
  [
    { key: "SHIFT", span: 9, id: "LSHIFT" }, { key: "Z", span: 4 }, { key: "X", span: 4 },
    { key: "C", span: 4 }, { key: "V", span: 4 }, { key: "B", span: 4 }, { key: "N", span: 4 },
    { key: "M", span: 4 }, { key: ",", span: 4 }, { key: ".", span: 4 }, { key: "/", span: 4 },
    { key: "SHIFT", span: 11, id: "RSHIFT" },
  ],
  [
    { key: "CTRL", span: 6, id: "LCTRL" }, { key: "ALT", span: 6, id: "LALT" },
    { key: "SPACE", span: 36 }, { key: "ALT", span: 6, id: "RALT" },
    { key: "CTRL", span: 6, id: "RCTRL" },
  ],
];

const flatKeys = rows.flat();

/** Depth of the extruded key sides, in px. */
const DEPTH = 14;

function Key({ def, active }: { def: KeyDef; active: boolean }) {
  return (
    <div
      style={{
        gridColumn: `span ${def.span} / span ${def.span}`,
        transformStyle: "preserve-3d",
        transform: `translateZ(${active ? DEPTH * 0.35 : DEPTH}px)`,
      }}
      className="relative h-full w-full transition-transform duration-100 ease-out select-none"
    >
      {/* Front edge (visible when the board is tilted back) */}
      <div
        aria-hidden
        style={{
          top: "100%",
          height: `${DEPTH}px`,
          transform: "rotateX(-90deg)",
          transformOrigin: "top center",
        }}
        className="absolute inset-x-0 rounded-b-lg bg-key-side"
      />
      {/* Left edge */}
      <div
        aria-hidden
        style={{
          left: `-${DEPTH}px`,
          width: `${DEPTH}px`,
          transform: "rotateY(-90deg)",
          transformOrigin: "right center",
        }}
        className="absolute inset-y-0 bg-key-side/80"
      />
      {/* Right edge */}
      <div
        aria-hidden
        style={{
          right: `-${DEPTH}px`,
          width: `${DEPTH}px`,
          transform: "rotateY(90deg)",
          transformOrigin: "left center",
        }}
        className="absolute inset-y-0 bg-key-side/80"
      />

      {/* Key cap top face */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-lg font-mono text-[clamp(10px,1.2vw,14px)] font-bold uppercase key-gradient text-key-text transition-shadow duration-100 ${
          active
            ? "shadow-[0_0_18px_var(--key-glow)] brightness-110"
            : "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
        }`}
      >
        {def.key === "SPACE" ? "" : def.key}
      </div>
    </div>
  );
}

export default function LiveKeyboard({ activeKeys }: LiveKeyboardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="w-full max-w-7xl mx-auto" style={{ perspective: "1200px" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-full rounded-2xl border border-border bg-card/60 p-6 transition-transform duration-500 ease-out"
        style={{
          transform: hovered
            ? "rotateX(48deg) rotateZ(-4deg)"
            : "rotateX(25deg)",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(60, minmax(0, 1fr))",
            gridTemplateRows: "repeat(5, minmax(0, 1fr))",
            gap: "clamp(2px, 0.6vw, 10px)",
            aspectRatio: "3 / 1",
            transformStyle: "preserve-3d",
          }}
        >
          {flatKeys.map((k, i) => (
            <Key
              key={`${k.id || k.key}-${i}`}
              def={k}
              active={activeKeys.has(k.id || k.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
