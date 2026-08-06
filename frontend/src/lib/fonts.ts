export interface FontOption {
  name: string;
  category: 'Sans-Serif' | 'Monospace' | 'Serif' | 'Display';
  googleFont: string;
}

export const PRESET_FONTS: FontOption[] = [
  { name: 'Inter', category: 'Sans-Serif', googleFont: 'Inter' },
  { name: 'Roboto', category: 'Sans-Serif', googleFont: 'Roboto' },
  { name: 'Outfit', category: 'Sans-Serif', googleFont: 'Outfit' },
  { name: 'Poppins', category: 'Sans-Serif', googleFont: 'Poppins' },
  { name: 'Plus Jakarta Sans', category: 'Sans-Serif', googleFont: 'Plus+Jakarta+Sans' },
  { name: 'Lexend', category: 'Sans-Serif', googleFont: 'Lexend' },

  { name: 'JetBrains Mono', category: 'Monospace', googleFont: 'JetBrains+Mono' },
  { name: 'Fira Code', category: 'Monospace', googleFont: 'Fira+Code' },
  { name: 'Space Mono', category: 'Monospace', googleFont: 'Space+Mono' },
  { name: 'Inconsolata', category: 'Monospace', googleFont: 'Inconsolata' },
  { name: 'Share Tech Mono', category: 'Monospace', googleFont: 'Share+Tech+Mono' },

  { name: 'Playfair Display', category: 'Serif', googleFont: 'Playfair+Display' },
  { name: 'Cinzel', category: 'Serif', googleFont: 'Cinzel' },
  { name: 'Lora', category: 'Serif', googleFont: 'Lora' },

  { name: 'Bebas Neue', category: 'Display', googleFont: 'Bebas+Neue' },
  { name: 'Press Start 2P', category: 'Display', googleFont: 'Press+Start+2P' },
  { name: 'Caveat', category: 'Display', googleFont: 'Caveat' },
  { name: 'Syne', category: 'Display', googleFont: 'Syne' },
];

const FONT_STORAGE_KEY = 'velocitype_user_font';
const UPLOADED_FONT_KEY = 'velocitype_uploaded_font_data';
const FONT_TYPE_KEY = 'velocitype_font_type'; // 'google' | 'uploaded'

export function getStoredFont(): string {
  return localStorage.getItem(FONT_STORAGE_KEY) || 'Inter';
}

export function getFontType(): 'google' | 'uploaded' {
  return (localStorage.getItem(FONT_TYPE_KEY) as 'google' | 'uploaded') || 'google';
}

export function saveStoredFont(fontName: string): void {
  localStorage.setItem(FONT_STORAGE_KEY, fontName);
  localStorage.setItem(FONT_TYPE_KEY, 'google');
}

export function applyGoogleFont(fontName: string): void {
  if (!fontName) return;

  saveStoredFont(fontName);
  const formattedName = fontName.trim();
  const apiFontName = formattedName.replace(/\s+/g, '+');
  const linkId = 'dynamic-google-font-stylesheet';

  let linkEl = document.getElementById(linkId) as HTMLLinkElement | null;
  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.id = linkId;
    linkEl.rel = 'stylesheet';
    document.head.appendChild(linkEl);
  }

  linkEl.href = `https://fonts.googleapis.com/css2?family=${apiFontName}:wght@400;500;600;700;800&display=swap`;

  const styleId = 'dynamic-custom-font-override';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    * {
      font-family: '${formattedName}', system-ui, sans-serif !important;
    }
  `;
}

export function applyUploadedFontFile(fileName: string, dataUrl: string): void {
  const cleanName = fileName.replace(/\.[^/.]+$/, '');
  const format = fileName.endsWith('.woff2')
    ? 'woff2'
    : fileName.endsWith('.woff')
    ? 'woff'
    : fileName.endsWith('.otf')
    ? 'opentype'
    : 'truetype';

  const fontData = { fileName: cleanName, dataUrl, format };
  try {
    localStorage.setItem(UPLOADED_FONT_KEY, JSON.stringify(fontData));
    localStorage.setItem(FONT_TYPE_KEY, 'uploaded');
    localStorage.setItem(FONT_STORAGE_KEY, cleanName);
  } catch (err) {
    console.warn('Font file exceeds localStorage size limit, active for current session.');
  }

  const styleId = 'dynamic-custom-font-override';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    @font-face {
      font-family: 'VelocitypeUploadedFont';
      src: url('${dataUrl}') format('${format}');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
    * {
      font-family: 'VelocitypeUploadedFont', system-ui, sans-serif !important;
    }
  `;
}

export function getUploadedFontInfo(): { fileName: string; dataUrl: string; format: string } | null {
  const raw = localStorage.getItem(UPLOADED_FONT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function initializeActiveFont(): void {
  const fontType = getFontType();
  if (fontType === 'uploaded') {
    const uploaded = getUploadedFontInfo();
    if (uploaded && uploaded.dataUrl) {
      applyUploadedFontFile(uploaded.fileName, uploaded.dataUrl);
      return;
    }
  }
  const googleFont = getStoredFont();
  applyGoogleFont(googleFont);
}
