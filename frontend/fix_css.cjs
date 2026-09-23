const fs = require('fs');

let file = fs.readFileSync('src/components/RankedMode.tsx', 'utf8');

const target = `  let oppPrimaryHex = '#fbbf24';
  let oppStyle = '';
  if (isOpponent && colorTheme) {
    const hexes = colorTheme.value.match(/#[0-9a-fA-F]{6}/g) || ['#fbbf24'];
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
        --hot: \${oppPrimaryHex};
        \${bgRules}
      }
      #opponent-area, #opponent-area * {
        font-family: "\${fontFamily || 'Inter'}", sans-serif !important;
      }
      \${cssRules}
    \`;
  }`;

const replacement = `  let oppPrimaryHex = '#fbbf24';
  let oppStyle = '';
  if (isOpponent) {
    if (colorTheme) {
      const hexes = colorTheme.value.match(/#[0-9a-fA-F]{6}/g) || ['#fbbf24'];
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
        --hot: \${oppPrimaryHex};
        \${bgRules}
      }
      #opponent-area, #opponent-area * {
        font-family: "\${fontFamily || 'Inter'}", sans-serif !important;
      }
      \${cssRules}
    \`;
  }`;

file = file.replace(target, replacement);
fs.writeFileSync('src/components/RankedMode.tsx', file);
