const fs = require('fs');
const gsPath = 'frontend/src/components/GameScreen.tsx';
let gsCode = fs.readFileSync(gsPath, 'utf8');

gsCode = gsCode.replace(
`              {/* Extra typed letters (incorrect) */}
              {extra.split('').map((ch, ci) => (
                <span key={\`ex-\${ci}\`} className="text-red-500 underline decoration-red-500/50 exclude-theme">`,
`              {/* Extra typed letters (incorrect) */}
              {extra.split('').map((ch, ci) => (
                <span key={\`ex-\${ci}\`} className="underline exclude-theme" style={{ color: 'var(--theme-error, #ef4444)', textDecorationColor: 'color-mix(in srgb, var(--theme-error, #ef4444) 50%, transparent)' }}>`
);

fs.writeFileSync(gsPath, gsCode);
