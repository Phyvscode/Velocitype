export interface ThemeColor {
  name: string;
  value: string;
  isGradient: boolean;
}

// --- Lightness helpers -----------------------------------------------
function hexLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function averageGradientLuminance(gradientValue: string): number {
  const hexes = gradientValue.match(/#[0-9a-fA-F]{6}/g);
  if (!hexes || hexes.length === 0) return 0;
  const total = hexes.reduce((sum, hex) => sum + hexLuminance(hex), 0);
  return total / hexes.length;
}

// Generate Solid Colors
const generateSolidColors = (): ThemeColor[] => {
  const actualColors: ThemeColor[] = [];
  const baseHues = [
    ['#fee2e2', '#fca5a5', '#ef4444', '#b91c1c', '#7f1d1d'], // Reds
    ['#ffedd5', '#fdba74', '#f97316', '#c2410c', '#7c2d12'], // Oranges
    ['#fef3c7', '#fcd34d', '#f59e0b', '#b45309', '#78350f'], // Ambers
    ['#fef9c3', '#fde047', '#eab308', '#a16207', '#713f12'], // Yellows
    ['#ecfccb', '#bef264', '#84cc16', '#4d7c0f', '#3f6212'], // Limes
    ['#dcfce7', '#86efac', '#22c55e', '#15803d', '#14532d'], // Greens
    ['#d1fae5', '#6ee7b7', '#10b981', '#047857', '#064e3b'], // Emeralds
    ['#ccfbf1', '#5eead4', '#14b8a6', '#0f766e', '#134e4a'], // Teals
    ['#cffafe', '#67e8f9', '#06b6d4', '#0e7490', '#164e63'], // Cyans
    ['#e0f2fe', '#7dd3fc', '#0ea5e9', '#0369a1', '#0c4a6e'], // Sky
    ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'], // Blues
    ['#e0e7ff', '#a5b4fc', '#6366f1', '#4338ca', '#312e81'], // Indigos
    ['#ede9fe', '#c4b5fd', '#8b5cf6', '#6d28d9', '#4c1d95'], // Violets
    ['#f3e8ff', '#d8b4fe', '#a855f7', '#7e22ce', '#581c87'], // Purples
    ['#fae8ff', '#f0abfc', '#d946ef', '#a21caf', '#701a75'], // Fuchsias
    ['#fce7f3', '#f9a8d4', '#ec4899', '#be185d', '#831843'], // Pinks
    ['#ffe4e6', '#fda4af', '#f43f5e', '#be123c', '#881337'], // Roses
    ['#f1f5f9', '#cbd5e1', '#64748b', '#334155', '#0f172a'], // Slates
    ['#f3f4f6', '#d1d5db', '#6b7280', '#374151', '#111827'], // Grays
    ['#fafafa', '#e5e5e5', '#737373', '#404040', '#171717']  // Neutrals
  ];

  baseHues.forEach((hueGroup, i) => {
    hueGroup.forEach((hex, j) => {
      actualColors.push({
        name: `Color ${i + 1}-${j + 1}`,
        value: hex,
        isGradient: false
      });
    });
  });

  return actualColors;
};

// Generate Gradient Colors
const GRADIENT_COLORS_RAW: ThemeColor[] = [
  { name: 'Sunset Vibe', value: 'linear-gradient(to right, #ff7e5f, #feb47b)', isGradient: true },
  { name: 'Ocean Blue', value: 'linear-gradient(to right, #2E3192, #1BFFFF)', isGradient: true },
  { name: 'Neon Glow', value: 'linear-gradient(to right, #00c6ff, #0072ff)', isGradient: true },
  { name: 'Purple Haze', value: 'linear-gradient(to right, #9D50BB, #6E48AA)', isGradient: true },
  { name: 'Mango Glow', value: 'linear-gradient(to right, #ffaa00, #ff0055)', isGradient: true },
  { name: 'Cyberpunk', value: 'linear-gradient(to right, #f80759, #bc4e9c)', isGradient: true },
  { name: 'Forest Mint', value: 'linear-gradient(to right, #11998e, #38ef7d)', isGradient: true },
  { name: 'Cherry Cola', value: 'linear-gradient(to right, #e52d27, #b31217)', isGradient: true },
  { name: 'Northern Lights', value: 'linear-gradient(to right, #43e97b, #38f9d7)', isGradient: true },
  { name: 'Cosmic Fusion', value: 'linear-gradient(to right, #ff00cc, #333399)', isGradient: true },
  { name: 'Golden Hour', value: 'linear-gradient(to right, #f6d365, #fda085)', isGradient: true },
  { name: 'Deep Space', value: 'linear-gradient(to right, #000000, #434343)', isGradient: true },
  { name: 'Candy Dream', value: 'linear-gradient(to right, #e96443, #904e95)', isGradient: true },
  { name: 'Fire Ice', value: 'linear-gradient(to right, #ff0844, #ffb199)', isGradient: true },
  { name: 'Lush Green', value: 'linear-gradient(to right, #56ab2f, #a8e063)', isGradient: true },
  { name: 'Magic Night', value: 'linear-gradient(to right, #cb2d3e, #ef8e38)', isGradient: true },
  { name: 'Wild Apple', value: 'linear-gradient(to right, #d38312, #a83279)', isGradient: true },
  { name: 'Dark Skies', value: 'linear-gradient(to right, #4b6cb7, #182848)', isGradient: true },
  { name: 'Lavender Rose', value: 'linear-gradient(to right, #f4c4f3, #fc67fa)', isGradient: true },
  { name: 'Aquamarine', value: 'linear-gradient(to right, #1a2a6c, #11998e, #2b5876)', isGradient: true },
  { name: 'Phoenix', value: 'linear-gradient(to right, #f83600, #f9d423)', isGradient: true },
];

export const GRADIENT_COLORS: ThemeColor[] = [...GRADIENT_COLORS_RAW].sort(
  (a, b) => averageGradientLuminance(b.value) - averageGradientLuminance(a.value)
);

export const SOLID_COLORS = generateSolidColors().sort(
  (a, b) => hexLuminance(b.value) - hexLuminance(a.value)
);

// --- Theme Application Logic -------------------------------------------
let currentStyleTag: HTMLStyleElement | null = null;
export const COLOR_STORAGE_KEY = 'velocitype_user_color';

export function getStoredColor(): ThemeColor | null {
  try {
    const raw = localStorage.getItem(COLOR_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ThemeColor;
  } catch {
    return null;
  }
}

function saveStoredColor(color: ThemeColor): void {
  try {
    localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(color));
  } catch {
    // Storage unavailable
  }
}

export const applyTextColor = (color: ThemeColor, persist: boolean = true) => {
  if (typeof document === 'undefined') return;

  if (!currentStyleTag) {
    currentStyleTag = document.getElementById('velocitype-dynamic-text-color') as HTMLStyleElement;
    if (!currentStyleTag) {
      currentStyleTag = document.createElement('style');
      currentStyleTag.id = 'velocitype-dynamic-text-color';
      document.head.appendChild(currentStyleTag);
    }
  }

  const root = document.documentElement;
  if (color.isGradient) {
    root.style.setProperty('--text-color', 'transparent');
    root.style.setProperty('--text-bg', color.value);
    root.style.setProperty('--text-fill', 'transparent');
  } else {
    root.style.setProperty('--text-color', color.value);
    root.style.setProperty('--text-bg', 'initial');
    root.style.setProperty('--text-fill', 'initial');
  }

  // Safely target text elements and interactive elements without breaking structural block backgrounds like div or body
  const textSelectors = `h1, h2, h3, h4, h5, h6, p, span:not(.exclude-theme), a, label, li, code, strong, em, b, i, button:not(.exclude-theme), input:not(.exclude-theme), select:not(.exclude-theme), textarea:not(.exclude-theme), td, th`;

  // Extracted color for SVG icon strokes
  const fallbackHex = color.value.match(/#[0-9a-fA-F]{6}/)?.[0] ?? '#f59e0b';

  if (color.isGradient) {
    currentStyleTag.innerHTML = `
      ${textSelectors} {
        background-image: ${color.value} !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        color: transparent !important;
      }
      svg:not(.color-picker-check) {
        color: ${fallbackHex} !important;
        stroke: ${fallbackHex} !important;
      }
    `;
  } else {
    currentStyleTag.innerHTML = `
      ${textSelectors} {
        color: ${color.value} !important;
      }
      svg:not(.color-picker-check) {
        color: ${color.value} !important;
        stroke: ${color.value} !important;
      }
    `;
  }

  if (persist) {
    saveStoredColor(color);
  }

  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('themeColorChanged', { detail: color }));
};

export function initializeActiveColor(): void {
  const stored = getStoredColor();
  if (stored) {
    applyTextColor(stored, false);
  }
}

// --- FALLBACK STUBS FOR DELETED WHITE TEXT LOGIC ---
export const applyUiTextColor = (color: ThemeColor, persist: boolean = true) => {};
export function initializeActiveUiTextColor(): void {}
export function getStoredUiTextColor(): ThemeColor | null { return null; }