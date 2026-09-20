const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add sentencesRef right after sentences state
code = code.replace(
  "const [sentences, setSentences] = useState<string[]>([]);",
  "const [sentences, setSentences] = useState<string[]>([]);\n  const sentencesRef = useRef<string[]>([]);"
);

// Update sentencesRef in onMatchReady
code = code.replace(
  "setSentences(data.sentences);",
  "setSentences(data.sentences);\n      sentencesRef.current = data.sentences;"
);

// Use sentencesRef in onRoundStart
code = code.replace(
  "const newTargetText = sentences[data.round];",
  "const newTargetText = sentencesRef.current[data.round] || sentencesRef.current[0] || 'Hello world.';"
);

// We should also check for onNextRound, it might use sentences as well.
code = code.replace(
  "const newTargetText = sentences[data.round];",
  "const newTargetText = sentencesRef.current[data.round] || sentencesRef.current[0] || 'Hello world.';"
);

fs.writeFileSync(path, code);
