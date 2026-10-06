const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/SetupScreen.tsx', 'utf8');

const newStates = `  const [customLetters, setCustomLetters] = useState('');
  const [extraInitial, setExtraInitial] = useState('');
  const [extraMiddle, setExtraMiddle] = useState('');
  const [extraFinal, setExtraFinal] = useState('');
  const [enableCustom, setEnableCustom] = useState(false);
  const [enableExtra, setEnableExtra] = useState(false);`;

content = content.replace(
  /  const \[rows, setRows\] = useState<RowKey\[\]>\(\['top', 'home', 'bottom'\]\);/,
  `  const [rows, setRows] = useState<RowKey[]>(['top', 'home', 'bottom']);\n${newStates}`
);

fs.writeFileSync('frontend/src/components/SetupScreen.tsx', content);
