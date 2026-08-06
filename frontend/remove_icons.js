import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find the lucide-react import
  const importMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/);
  if (importMatch) {
    // Extract icon names
    const icons = importMatch[1].split(',').map(s => {
      const parts = s.trim().split(/\s+as\s+/);
      return parts.length > 1 ? parts[1].trim() : parts[0].trim();
    }).filter(s => s);
    
    // Remove the import line
    content = content.replace(importMatch[0], '');
    
    // Remove icon usages: <IconName ... /> or <IconName>...</IconName>
    icons.forEach(icon => {
      // Regex to match <IconName ... />
      const selfClosing = new RegExp(`<${icon}\\s*[^>]*/>`, 'g');
      content = content.replace(selfClosing, '');
      
      // Regex to match <IconName ...>...</IconName>
      const pair = new RegExp(`<${icon}[^>]*>.*?</${icon}>`, 'gs');
      content = content.replace(pair, '');
    });
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Processed ${file}`);
  }
});
