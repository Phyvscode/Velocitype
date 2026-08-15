const fs = require('fs');

const files = [
  'frontend/src/components/AuthModal.tsx',
  'frontend/src/components/BgColorModal.tsx',
  'frontend/src/components/BorderModal.tsx',
  'frontend/src/components/ColorModal.tsx',
  'frontend/src/components/FontModal.tsx',
  'frontend/src/components/LeaderboardModal.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Backdrops
  content = content.replace(/bg-slate-950\/85/g, 'bg-black/60');
  content = content.replace(/bg-slate-950\/80/g, 'bg-black/60');
  
  // Card/Input backgrounds
  content = content.replace(/bg-slate-900\/60/g, 'bg-white/5');
  content = content.replace(/bg-slate-900\/80/g, 'bg-white/5');
  content = content.replace(/bg-slate-900\/50/g, 'bg-white/5');
  content = content.replace(/bg-slate-900\/40/g, 'bg-white/5');
  content = content.replace(/bg-slate-900/g, 'bg-white/5');
  
  content = content.replace(/bg-slate-950/g, 'bg-black/20');
  
  // Borders
  content = content.replace(/border-slate-800/g, 'border-white/10');
  content = content.replace(/border-slate-700\/60/g, 'border-white/10');
  content = content.replace(/border-slate-700\/80/g, 'border-white/10');
  content = content.replace(/border-slate-700\/50/g, 'border-white/10');
  content = content.replace(/border-slate-700/g, 'border-white/10');
  content = content.replace(/border-slate-600/g, 'border-white/20');

  // Small badges
  content = content.replace(/bg-slate-800/g, 'bg-white/10');
  content = content.replace(/hover:bg-slate-800/g, 'hover:bg-white/15');
  content = content.replace(/hover:bg-slate-700/g, 'hover:bg-white/20');
  content = content.replace(/hover:bg-slate-600/g, 'hover:bg-white/20');

  fs.writeFileSync(file, content, 'utf8');
});
console.log("Done replacing.");
