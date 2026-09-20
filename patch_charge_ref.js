const fs = require('fs');
const path = 'frontend/src/components/RankedMode.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const [myCharge, setMyCharge] = useState(0);",
  "const [myCharge, setMyCharge] = useState(0);\n  const myChargeRef = useRef(0);"
);

code = code.replace(
  "setMyCharge(0);\n      setOppCharge(0);",
  "setMyCharge(0);\n      myChargeRef.current = 0;\n      setOppCharge(0);"
);

code = code.replace(
  "let newCharge = myCharge;\n    if (correctDelta > 0) {\n      newCharge = Math.min(100, myCharge + correctDelta);\n      setMyCharge(newCharge);\n    }",
  "if (correctDelta > 0) {\n      myChargeRef.current = Math.min(100, myChargeRef.current + correctDelta);\n      setMyCharge(myChargeRef.current);\n    }\n    let newCharge = myChargeRef.current;"
);

fs.writeFileSync(path, code);
