const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/SetupScreen.tsx', 'utf8');

// We'll write a small utility to read/write prefs.
// We can insert it inside the SetupScreen component, right after `const { user, stats, logout } = useAuth();`

const prefsLogic = `
  const PREFS_KEY = 'velocitype_setup_prefs';
  const getPrefs = () => {
    try {
      if (typeof window !== 'undefined') {
        const p = localStorage.getItem(PREFS_KEY);
        if (p) return JSON.parse(p);
      }
    } catch {}
    return {};
  };
  const savePrefs = (updates: any) => {
    try {
      if (typeof window !== 'undefined') {
        const p = getPrefs();
        localStorage.setItem(PREFS_KEY, JSON.stringify({ ...p, ...updates }));
      }
    } catch {}
  };
  const prefs = getPrefs();
`;

content = content.replace(
  /  const \{ user, stats, logout \} = useAuth\(\);/,
  `  const { user, stats, logout } = useAuth();\n${prefsLogic}`
);

const replacements = [
  { match: /const \[rows, setRows\] = useState<RowKey\[\]>\(\['top', 'home', 'bottom'\]\);/, replace: `const [rows, setRows] = useState<RowKey[]>(prefs.rows ?? ['top', 'home', 'bottom']);` },
  { match: /const \[customLetters, setCustomLetters\] = useState\(''\);/, replace: `const [customLetters, setCustomLetters] = useState(prefs.customLetters ?? '');` },
  { match: /const \[extraInitial, setExtraInitial\] = useState\(''\);/, replace: `const [extraInitial, setExtraInitial] = useState(prefs.extraInitial ?? '');` },
  { match: /const \[extraMiddle, setExtraMiddle\] = useState\(''\);/, replace: `const [extraMiddle, setExtraMiddle] = useState(prefs.extraMiddle ?? '');` },
  { match: /const \[extraFinal, setExtraFinal\] = useState\(''\);/, replace: `const [extraFinal, setExtraFinal] = useState(prefs.extraFinal ?? '');` },
  { match: /const \[enableCustom, setEnableCustom\] = useState\(false\);/, replace: `const [enableCustom, setEnableCustom] = useState(prefs.enableCustom ?? false);` },
  { match: /const \[enableExtra, setEnableExtra\] = useState\(false\);/, replace: `const [enableExtra, setEnableExtra] = useState(prefs.enableExtra ?? false);` },
  { match: /const \[durationWords, setDurationWords\] = useState<string>\('30'\);/, replace: `const [durationWords, setDurationWords] = useState<string>(prefs.durationWords ?? '30');` },
  { match: /const \[limitModeWords, setLimitModeWords\] = useState\<'time' \| 'words'\>\('time'\);/, replace: `const [limitModeWords, setLimitModeWords] = useState<'time' | 'words'>(prefs.limitModeWords ?? 'time');` },
  { match: /const \[wordLimitWords, setWordLimitWords\] = useState<string>\('20'\);/, replace: `const [wordLimitWords, setWordLimitWords] = useState<string>(prefs.wordLimitWords ?? '20');` },
  { match: /const \[durationFile, setDurationFile\] = useState<string>\('30'\);/, replace: `const [durationFile, setDurationFile] = useState<string>(prefs.durationFile ?? '30');` },
  { match: /const \[fileSequential, setFileSequential\] = useState<boolean>\(false\);/, replace: `const [fileSequential, setFileSequential] = useState<boolean>(prefs.fileSequential ?? false);` },
  { match: /const \[durationSentences, setDurationSentences\] = useState<string>\('30'\);/, replace: `const [durationSentences, setDurationSentences] = useState<string>(prefs.durationSentences ?? '30');` },
  { match: /const \[limitModeSentences, setLimitModeSentences\] = useState\<'time' \| 'words'\>\('time'\);/, replace: `const [limitModeSentences, setLimitModeSentences] = useState<'time' | 'words'>(prefs.limitModeSentences ?? 'time');` },
  { match: /const \[wordLimitSentences, setWordLimitSentences\] = useState<string>\('10'\);/, replace: `const [wordLimitSentences, setWordLimitSentences] = useState<string>(prefs.wordLimitSentences ?? '10');` },
  { match: /const \[minLen, setMinLen\] = useState<number \| string>\(2\);/, replace: `const [minLen, setMinLen] = useState<number | string>(prefs.minLen ?? 2);` },
  { match: /const \[maxLen, setMaxLen\] = useState<number \| string>\(8\);/, replace: `const [maxLen, setMaxLen] = useState<number | string>(prefs.maxLen ?? 8);` },
  { match: /const \[sentenceTheme, setSentenceTheme\] = useState<string>\(''\);/, replace: `const [sentenceTheme, setSentenceTheme] = useState<string>(prefs.sentenceTheme ?? '');` }
];

replacements.forEach(r => {
  content = content.replace(r.match, r.replace);
});

// We need a useEffect to auto-save these whenever they change.
const effectInjection = `
  useEffect(() => {
    savePrefs({
      rows, customLetters, extraInitial, extraMiddle, extraFinal, enableCustom, enableExtra,
      durationWords, limitModeWords, wordLimitWords,
      durationFile, fileSequential,
      durationSentences, limitModeSentences, wordLimitSentences, sentenceTheme,
      minLen, maxLen
    });
  }, [rows, customLetters, extraInitial, extraMiddle, extraFinal, enableCustom, enableExtra, durationWords, limitModeWords, wordLimitWords, durationFile, fileSequential, durationSentences, limitModeSentences, wordLimitSentences, sentenceTheme, minLen, maxLen]);
`;

// Insert the useEffect before handleStartFile
content = content.replace(
  /  const handleStartFile = async \(\) => \{/,
  `${effectInjection}\n  const handleStartFile = async () => {`
);

fs.writeFileSync('frontend/src/components/SetupScreen.tsx', content);
