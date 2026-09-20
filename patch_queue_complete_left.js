const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

const containerRegex = /<div className="w-full max-w-lg mx-auto flex flex-col items-start justify-center gap-12 pt-12">/g;
const newContainer = `<div className="w-full max-w-[1400px] mx-auto flex flex-col items-center justify-center gap-12 pt-12 relative">`;
code = code.replace(containerRegex, newContainer);

// Put queue box in its own center block? Actually, max-w-[1400px] flex-col items-center will center the queue box!
// Then for the Character selection, we want it to be full width but justify-start so it goes to complete left.
const charSelectionRegex = /\{\/\* Character Selection \*\/\}\n        <div className="w-full flex flex-col items-start shrink-0">/g;
const newCharSelection = `{/* Character Selection */}
        <div className="w-full flex flex-col items-start shrink-0 px-8">`;
code = code.replace(charSelectionRegex, newCharSelection);

fs.writeFileSync(path, code);
