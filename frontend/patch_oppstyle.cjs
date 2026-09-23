const fs = require('fs');

let modeTs = fs.readFileSync('src/components/RankedMode.tsx', 'utf8');

const oldStyleLogic = `  let oppPrimaryHex = '#f59e0b';
  if (isOpponent && colorTheme) {
    const hexes = colorTheme.value.match(/#[0-9a-fA-F]{6}/g) || ['#f59e0b'];
    oppPrimaryHex = hexes[0];
    
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
    \`);
    const bgRules = bgTheme ? (bgTheme.isGradient ? \`background: \${bgTheme.value} !important; background-attachment: fixed !important;\` : \`background: \${bgTheme.value} !important;\`) : '';
    
    oppStyle = \`
      #opponent-area {
        \${bgRules}
      }
      \${cssRules}
    \`;
  }`;

const newStyleLogic = `  let oppPrimaryHex = '#f59e0b';
  
  if (isOpponent) {
    if (colorTheme) {
      const hexes = colorTheme.value.match(/#[0-9a-fA-F]{6}/g) || ['#f59e0b'];
      oppPrimaryHex = hexes[0];
    }
    
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
    \`);
    
    const bgRules = bgTheme ? (bgTheme.isGradient ? \`background: \${bgTheme.value} !important; background-attachment: fixed !important;\` : \`background: \${bgTheme.value} !important;\`) : '';
    
    oppStyle = \`
      #opponent-area {
        \${bgRules}
      }
      \${cssRules}
    \`;
  }`;

modeTs = modeTs.replace(oldStyleLogic, newStyleLogic);

fs.writeFileSync('src/components/RankedMode.tsx', modeTs);
