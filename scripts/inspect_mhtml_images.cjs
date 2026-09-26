const fs = require('fs');
const path = require('path');

const downloadsDir = 'C:\\Users\\HP\\Downloads';
const files = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.mht') || f.endsWith('.mhtml'));

console.log('MHTML files found in Downloads:', files);

for (const file of files) {
  const filePath = path.join(downloadsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const hasSvg = content.includes('<svg') || content.includes('image/svg+xml');
  const hasImg = content.includes('<img') || content.includes('image/png') || content.includes('image/jpeg');
  const imgCount = (content.match(/<img/gi) || []).length;
  const svgCount = (content.match(/<svg/gi) || []).length;
  const mimeParts = (content.match(/Content-Type:\s*image\/[a-zA-Z0-9+-]+/gi) || []).length;

  console.log(`- ${file}: Size ${(content.length / 1024).toFixed(1)} KB | <img tags: ${imgCount} | <svg tags: ${svgCount} | MIME image parts: ${mimeParts}`);
}
