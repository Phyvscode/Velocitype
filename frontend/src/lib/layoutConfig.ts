export interface LayoutConfig {
  fontSize: number; // in px
  maxChars: number; // in ch
  boxAlign: 'left' | 'center' | 'right';
  textAlign: 'left' | 'center' | 'right';
  numLines: number;
  showBox: boolean;
  keyboardScale: number;
  boxOffsetX: number;
  boxOffsetY: number;
}

const DEFAULT_CONFIG: LayoutConfig = {
  fontSize: 28,
  maxChars: 70,
  boxAlign: 'center',
  textAlign: 'left',
  numLines: 2,
  showBox: true,
  keyboardScale: 0.75,
  boxOffsetX: 0,
  boxOffsetY: 0,
};

const STORAGE_KEY = 'velocitype_layout_config';

export function getLayoutConfig(): LayoutConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (err) {
    // ignore
  }
  return DEFAULT_CONFIG;
}

export function saveLayoutConfig(config: LayoutConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
