/**
 * PWA Icon Generator Script
 *
 * This script generates placeholder PNG icons for PWA.
 * For production, replace these with proper designed icons.
 *
 * Run: node scripts/generate-icons.js
 *
 * Note: This creates simple colored square icons as placeholders.
 * You should replace these with professionally designed icons.
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG icon
function createSvgIcon(size) {
  const padding = Math.floor(size * 0.15);
  const innerSize = size - padding * 2;
  const fontSize = Math.floor(size * 0.4);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#007DCA"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white">
    C
  </text>
</svg>`;
}

console.log('Generating PWA icons...');
console.log('Icons directory:', iconsDir);

sizes.forEach(size => {
  const svgContent = createSvgIcon(size);
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created: icon-${size}x${size}.svg`);
});

console.log('\nSVG icons created successfully!');
console.log('\nNote: For production, convert these SVGs to PNGs using a tool like:');
console.log('- sharp (npm package)');
console.log('- ImageMagick');
console.log('- Online converter');
console.log('\nOr replace with professionally designed icons.');
