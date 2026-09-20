import { Theme } from './themes';

export const THEME_STORAGE_KEY = 'velocitype_full_theme';

export function getStoredTheme(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(THEME_STORAGE_KEY);
}

export function saveStoredTheme(themeName: string | null): void {
  if (typeof window === 'undefined') return;
  if (themeName) {
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
  } else {
    localStorage.removeItem(THEME_STORAGE_KEY);
  }
}

let currentFullThemeStyleTag: HTMLStyleElement | null = null;

export const applyFullTheme = (theme: Theme | null, persist: boolean = true) => {
  if (typeof document === 'undefined') return;

  if (!currentFullThemeStyleTag) {
    currentFullThemeStyleTag = document.getElementById('velocitype-dynamic-full-theme') as HTMLStyleElement;
    if (!currentFullThemeStyleTag) {
      currentFullThemeStyleTag = document.createElement('style');
      currentFullThemeStyleTag.id = 'velocitype-dynamic-full-theme';
      document.head.appendChild(currentFullThemeStyleTag);
    }
  }

  if (theme) {
    // If a theme is selected, it overrides everything via CSS specificity and variables
    currentFullThemeStyleTag.innerHTML = `
      :root, html, body, #root, .bg-background {
        background: ${theme.bgColor} !important;
        background-color: ${theme.bgColor} !important;
        background-image: none !important;
      }
      
      .text-slate-100, .text-slate-200, .text-slate-300, .text-white, .hover\\:text-white:hover {
        color: ${theme.textColor} !important;
      }

      .text-slate-400, .text-slate-500, .text-slate-600 {
        color: ${theme.subColor} !important;
      }

      .border-slate-800, .border-slate-700 {
        border-color: color-mix(in srgb, ${theme.subColor} 30%, transparent) !important;
      }

      [class*="bg-slate-900"], [class*="bg-slate-950"] {
        background-color: color-mix(in srgb, ${theme.bgColor} 95%, ${theme.textColor} 5%) !important;
      }

      [class*="bg-slate-800"] {
        background-color: color-mix(in srgb, ${theme.bgColor} 85%, ${theme.textColor} 15%) !important;
      }

      [class*="hover:bg-slate-800"]:hover {
        background-color: color-mix(in srgb, ${theme.bgColor} 75%, ${theme.textColor} 25%) !important;
      }
      
      :root {
        --theme-bg: ${theme.bgColor};
        --hot: ${theme.mainColor};
        --ember: ${theme.mainColor};
        --hot-soft: ${theme.mainColor}33;
        --theme-caret: ${theme.caretColor};
        --theme-sub: ${theme.subColor};
        --theme-text: ${theme.mainColor};
        --theme-error: ${theme.errorColor};
      }
    `;
    const root = document.documentElement;
    root.style.removeProperty('--hot');
    root.style.removeProperty('--ember');
    root.style.removeProperty('--hot-soft');
    root.style.removeProperty('--text-color');
    root.style.removeProperty('--text-bg');
    root.style.removeProperty('--text-fill');
  } else {
    // Revert full theme
    currentFullThemeStyleTag.innerHTML = '';
  }

  if (persist) {
    saveStoredTheme(theme ? theme.name : null);
  }

  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('fullThemeChanged', { detail: theme ? theme.name : null }));
};

export function initializeActiveFullTheme(): void {
  const themeName = getStoredTheme();
  if (themeName) {
    import('./themes').then(({ THEMES }) => {
      const t = THEMES.find(x => x.name === themeName);
      if (t) {
        applyFullTheme(t, false);
      }
    });
  }
}
