#!/bin/bash
# Patch RankedMode.tsx to add applyScrewedEffects and letter tracking

sed -i '/const \[myCharge, setMyCharge\] = useState(0);/a\
  const [myBestLetter, setMyBestLetter] = useState<string | null>(null);\
  const [myWorstLetter, setMyWorstLetter] = useState<string | null>(null);\
  const [oppBestLetter, setOppBestLetter] = useState<string | null>(null);\
  const [oppWorstLetter, setOppWorstLetter] = useState<string | null>(null);\
  const myLetterStatsRef = useRef<Record<string, {c: number, i: number}>>({});\
' frontend/src/components/RankedMode.tsx

sed -i '/if (data.charge !== undefined) setOppCharge(data.charge);/a\
      if (data.bestLetter !== undefined) setOppBestLetter(data.bestLetter);\
      if (data.worstLetter !== undefined) setOppWorstLetter(data.worstLetter);\
' frontend/src/components/RankedMode.tsx

