#!/bin/bash
sed -i '/const \[oppUpgrades, setOppUpgrades\] = useState(0);/a\
  const oppUpgradesRef = useRef(0);\
  useEffect(() => { oppUpgradesRef.current = oppUpgrades; }, [oppUpgrades]);\
  const myWorstLetterRef = useRef<string | null>(null);\
  useEffect(() => { myWorstLetterRef.current = myWorstLetter; }, [myWorstLetter]);\
' frontend/src/components/RankedMode.tsx

sed -i '/import { loadDictionary, DICTIONARY } from/c\
import { loadDictionary, DICTIONARY, applyScrewedEffects } from "@/lib/words";\
' frontend/src/components/RankedMode.tsx

sed -i '/const newTargetText = sentencesRef.current\[data.round\] || sentencesRef.current\[0\] || .Hello world..;/c\
      let newTargetText = sentencesRef.current[data.round] || sentencesRef.current[0] || "Hello world.";\
      if (matchDataRef.current?.opponent.characters?.includes("screwed") && oppUpgradesRef.current >= 1) {\
        newTargetText = applyScrewedEffects(newTargetText, oppUpgradesRef.current, myWorstLetterRef.current);\
      }\
' frontend/src/components/RankedMode.tsx

sed -i '/const timeElapsed = (Date.now() - (startTime || Date.now())) \/ 60000;/i\
    let maxI = -1, worstChar = null, maxC = -1, bestChar = null;\
    for (const char in myLetterStatsRef.current) {\
      if (myLetterStatsRef.current[char].i > maxI) { maxI = myLetterStatsRef.current[char].i; worstChar = char; }\
      if (myLetterStatsRef.current[char].c > maxC) { maxC = myLetterStatsRef.current[char].c; bestChar = char; }\
    }\
    setMyBestLetter(bestChar);\
    setMyWorstLetter(worstChar);\
' frontend/src/components/RankedMode.tsx

sed -i '/cia: newCia,/a\
      bestLetter: bestChar,\
      worstLetter: worstChar,\
' frontend/src/components/RankedMode.tsx

