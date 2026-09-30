const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function main() {
  const inputPng = path.join(__dirname, '..', 'public', 'logo.png');
  const outWebp = path.join(__dirname, '..', 'public', 'logo.webp');
  const outPng = path.join(__dirname, '..', 'public', 'logo-opt.png');

  // Generate ultra-compressed WebP (width 320 for mobile/retina hero & navbar)
  await sharp(inputPng)
    .resize(360, null, { withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(outWebp);

  console.log('Generated logo.webp size:', fs.statSync(outWebp).size, 'bytes');

  // Also optimize logo.png
  await sharp(inputPng)
    .resize(360, null, { withoutEnlargement: true })
    .png({ compressionLevel: 9, quality: 80 })
    .toFile(outPng);

  fs.copyFileSync(outPng, inputPng);
  fs.unlinkSync(outPng);
  console.log('Optimized logo.png size:', fs.statSync(inputPng).size, 'bytes');
}

main().catch(console.error);
