const fs = require('fs');

// 1. backend
let socketTs = fs.readFileSync('backend/src/services/socketService.ts', 'utf8');
socketTs = socketTs.replace(
  /colorTheme\?: any; fontFamily\?: string; bgTheme\?: any; characters\?: string\[\] \}\)/,
  `colorTheme?: any; fontFamily?: string; bgTheme?: any; characters?: string[]; fullTheme?: any })`
);
socketTs = socketTs.replace(
  /colorTheme: data\.colorTheme,\n        fontFamily: data\.fontFamily,\n        bgTheme: data\.bgTheme,\n        characters: data\.characters/,
  `colorTheme: data.colorTheme,
        fontFamily: data.fontFamily,
        bgTheme: data.bgTheme,
        characters: data.characters,
        fullTheme: data.fullTheme`
);
fs.writeFileSync('backend/src/services/socketService.ts', socketTs);

// 2. frontend
let modeTs = fs.readFileSync('frontend/src/components/RankedMode.tsx', 'utf8');

// A. RankedMatchData interface
modeTs = modeTs.replace(
  /characters\?: string\[\];\n  \};/,
  `characters?: string[];\n    fullTheme?: any;\n  };`
);

// B. Join Queue Emit
modeTs = modeTs.replace(
  /characters: selectedCharacters\n    \}\);/,
  `characters: selectedCharacters,
      fullTheme: localStorage.getItem('velocitype_full_theme')
    });`
);

// C. RankedPlayerArea props
modeTs = modeTs.replace(
  /characters\?: string\[\];/,
  `characters?: string[];\n  fullTheme?: string | null;`
);

modeTs = modeTs.replace(
  /joker3Active, characters = \[\] \}: RankedPlayerAreaProps\) \{/,
  `joker3Active, characters = [], fullTheme }: RankedPlayerAreaProps) {`
);

// D. Apply opponent's full theme to untyped text
// We can inject a CSS rule for the opponent area that overrides .text-slate-500 to their fullTheme.subColor
// We need to lookup the theme! We can import THEMES from lib/themes and find it.
// Or we can just use the name! Wait, we don't have the colors if we just have the name string.
// Let's import THEMES:
if (!modeTs.includes("import { THEMES } from '@/lib/themes';")) {
  modeTs = modeTs.replace(
    /import \{\s*loadDictionary/,
    `import { THEMES } from '@/lib/themes';\nimport { loadDictionary`
  );
}

// Update oppStyle CSS injection
const oldOppStyle = `const cssRules = colorTheme.isGradient ? \`
      #opponent-area span.text-slate-500 {
        /* Un-typed letters stay slate */
      }
      #opponent-area span:not(.text-slate-500):not(.exclude-theme) {
        background-image: \${colorTheme.value} !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        color: transparent !important;
      }
    \` : \`
      #opponent-area span:not(.text-slate-500):not(.exclude-theme) {
        color: \${colorTheme.value} !important;
      }
    \`;`;

const newOppStyle = `
    const oppThemeObj = fullTheme ? THEMES.find(t => t.name === fullTheme) : null;
    const oppSubColor = oppThemeObj ? oppThemeObj.subColor : 'var(--sub, #64748b)';
    
    const cssRules = (colorTheme && colorTheme.isGradient) ? \`
      #opponent-area span.text-slate-500 {
        color: \${oppSubColor} !important;
      }
      #opponent-area span:not(.text-slate-500):not(.exclude-theme) {
        background-image: \${colorTheme.value} !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        color: transparent !important;
      }
    \` : (colorTheme ? \`
      #opponent-area span.text-slate-500 {
        color: \${oppSubColor} !important;
      }
      #opponent-area span:not(.text-slate-500):not(.exclude-theme) {
        color: \${colorTheme.value} !important;
      }
    \` : \`
      #opponent-area span.text-slate-500 {
        color: \${oppSubColor} !important;
      }
    \`);`;

modeTs = modeTs.replace(oldOppStyle, newOppStyle);

// E. Pass fullTheme to opponent
modeTs = modeTs.replace(
  /characters=\{matchData\.opponent\.characters\}\n        \/>/,
  `characters={matchData.opponent.characters}
          fullTheme={matchData.opponent.fullTheme}
        />`
);

// F. Clean up my earlier patch_colors.js which was wrong:
// I had: styleObj.color = colorTheme?.subColor || '#64748b';
modeTs = modeTs.replace(
  /if \(isUnTyped\) \{\n                           styleObj\.color = colorTheme\?\.subColor \|\| '#64748b'; \/\/ user's theme for untyped text\n                        \}/,
  ``
);

fs.writeFileSync('frontend/src/components/RankedMode.tsx', modeTs);
