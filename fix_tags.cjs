const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/SetupScreen.tsx', 'utf8');

content = content.replace(/<\/section><\/section>/g, '</section>');

fs.writeFileSync('frontend/src/components/SetupScreen.tsx', content);
