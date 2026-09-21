#!/bin/bash
sed -i '/import { generateSentences } from/c\
import { generateSentences } from "@/lib/quotes";\
import { applyScrewedEffects } from "@/lib/words";\
' frontend/src/components/RankedSandbox.tsx

sed -i '/useEffect(() => {/!b;n;n;/generateSentences/!b;n;n;/}, \[\]);/c\
  }, []);\
\
  const [baseTargetText, setBaseTargetText] = useState("");\
  useEffect(() => {\
    generateSentences("", ["top", "home", "bottom"], 3, 12, 30, "").then(words => {\
      const t = words.join(" ") + " ";\
      setBaseTargetText(t);\
      setTargetText(t);\
    });\
  }, []);\
\
  useEffect(() => {\
    if (baseTargetText) {\
      if (oppScrewedActive) {\
        setTargetText(applyScrewedEffects(baseTargetText, 3, "e"));\
      } else {\
        setTargetText(baseTargetText);\
      }\
    }\
  }, [oppScrewedActive, baseTargetText]);\
' frontend/src/components/RankedSandbox.tsx
