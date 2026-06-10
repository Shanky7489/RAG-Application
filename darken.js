const fs = require('fs');
const path = require('path');
const dirs = ['c:/Users/IT-0649/Downloads/LexAI (1)/LexAI/app', 'c:/Users/IT-0649/Downloads/LexAI (1)/LexAI/components'];
const replacements = {
  '#1A1D24': '#0A0A0A',
  '#2D323C': '#121212',
  '#16181C': '#050505',
  '#3F3F3F': '#222222',
  '#2A2A40': '#0A0A0A',
  '#3D3D5C': '#222222',
  '#2C2C2E': '#0A0A0A',
  '#2F3336': '#1A1A1A',
  '#1E293B': '#0A0A0A',
  '#334155': '#151515',
  '#1C1F26': '#0A0A0A',
  'rgba(99,102,241,0.12)': 'rgba(255,255,255,0.05)'
};

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [oldVal, newVal] of Object.entries(replacements)) {
        if (content.includes(oldVal) || content.includes(oldVal.toLowerCase())) {
          content = content.replace(new RegExp(oldVal, 'gi'), newVal);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + file);
      }
    }
  }
}

for (const dir of dirs) {
  processDir(dir);
}
console.log('Done.');
