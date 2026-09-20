const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove ability state variables
code = code.replace(/  \/\/ Ability states\n  const \[abilityChoices, setAbilityChoices\] = useState<any\[\]>\(\[\]\);\n  const \[mySelectedAbility, setMySelectedAbility\] = useState<any>\(null\);\n  const \[myActiveAbility, setMyActiveAbility\] = useState<any>\(null\);\n/g, '');

code = code.replace(/  \/\/ Ability active states\n  const \[isScreenFlashed, setIsScreenFlashed\] = useState\(false\);\n  const \[isTimeStopped, setIsTimeStopped\] = useState\(false\);\n  const \[oppMistakes, setOppMistakes\] = useState<string\[\]>\(\[\]\);\n/g, '');

// 2. Remove applyAbilitiesToText function entirely
code = code.replace(/  const applyAbilitiesToText = \([\s\S]*?return words\.join\(' '\);\n  };\n/g, '');

// 3. In onRoundStart, replace applyAbilitiesToText with direct sentence
code = code.replace(/const newTargetText = applyAbilitiesToText\(sentences\[data\.round\], myActiveAbility, oppMistakes\);/g, 'const newTargetText = sentences[data.round];');

// 4. Remove opponent mistake tracking in onOpponentProgress
const oppMistakeRegex = /\/\/ Track opponent mistakes[\s\S]*?\}\n        \}/g;
code = code.replace(oppMistakeRegex, '');

// 5. In onRoundEnd, remove setIsScreenFlashed and setIsTimeStopped resets
code = code.replace(/      setIsScreenFlashed\(false\);\n      setIsTimeStopped\(false\);\n/g, '');

// 6. Remove onAbilitySelectionStart, onAbilityConfirmed, onAbilitySelectionComplete
const abilityListenersRegex = /    const onAbilitySelectionStart = \([\s\S]*?const onNextRound/g;
code = code.replace(abilityListenersRegex, '    const onNextRound');

// 7. Remove onTimeStop, onScreenFlash
const timeStopRegex = /    const onTimeStop = \([\s\S]*?socket\.on\('rankedQueueJoined/g;
code = code.replace(timeStopRegex, '    socket.on(\'rankedQueueJoined');

// 8. Remove socket.on and socket.off for abilities
code = code.replace(/    socket\.on\('rankedAbilitySelectionStart', onAbilitySelectionStart\);\n/g, '');
code = code.replace(/    socket\.on\('rankedAbilityConfirmed', onAbilityConfirmed\);\n/g, '');
code = code.replace(/    socket\.on\('rankedAbilitySelectionComplete', onAbilitySelectionComplete\);\n/g, '');
code = code.replace(/    socket\.on\('rankedTimeStop', onTimeStop\);\n/g, '');
code = code.replace(/    socket\.on\('rankedScreenFlash', onScreenFlash\);\n/g, '');

code = code.replace(/      socket\.off\('rankedAbilitySelectionStart', onAbilitySelectionStart\);\n/g, '');
code = code.replace(/      socket\.off\('rankedAbilityConfirmed', onAbilityConfirmed\);\n/g, '');
code = code.replace(/      socket\.off\('rankedAbilitySelectionComplete', onAbilitySelectionComplete\);\n/g, '');
code = code.replace(/      socket\.off\('rankedTimeStop', onTimeStop\);\n/g, '');
code = code.replace(/      socket\.off\('rankedScreenFlash', onScreenFlash\);\n/g, '');

fs.writeFileSync(path, code);
