const fs = require('fs');
const path = require('path');

const sampleFiles = ['Match the columns.mht', 'Fill in the blanks.mht', 'Generate Paper - PTS (12).mht', 'Generate Paper - PTS (15).mht'];
const downloadsDir = 'C:\\Users\\HP\\Downloads';

for (const name of sampleFiles) {
  const filePath = path.join(downloadsDir, name);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Find MIME images
  const boundaryMatch = content.match(/boundary="?([^"\r\n]+)"?/i);
  const boundary = boundaryMatch ? boundaryMatch[1] : null;
  
  console.log(`\n================= ${name} =================`);
  console.log('Boundary:', boundary);

  // Print first 500 characters of html body
  const htmlStart = content.indexOf('<html');
  if (htmlStart !== -1) {
    console.log('HTML preview:\n', content.substring(htmlStart, htmlStart + 400));
  }

  // Look for SVGs or img tags
  const imgMatches = content.match(/<img[^>]+>/gi) || [];
  console.log(`Total <img> tags: ${imgMatches.length}`);
  imgMatches.slice(0, 3).forEach((img, i) => console.log(`  Img ${i+1}: ${img.substring(0, 120)}`));

  const svgMatches = content.match(/<svg[\s\S]*?<\/svg>/gi) || [];
  console.log(`Total inline <svg> tags: ${svgMatches.length}`);
  svgMatches.slice(0, 2).forEach((svg, i) => console.log(`  Svg ${i+1}: ${svg.substring(0, 120)}...`));
}
