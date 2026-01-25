/**
 * Simple PNG icon generator using canvas
 * Creates basic placeholder icons for PWA
 *
 * Run: node scripts/create-png-icons.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG icons that can be used as fallback
sizes.forEach(size => {
  const padding = Math.floor(size * 0.1);
  const fontSize = Math.floor(size * 0.5);
  const radius = Math.floor(size * 0.15);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#007DCA"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white">
    C
  </text>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Created: icon-${size}x${size}.svg`);
});

console.log('\nSVG icons created!');
console.log('\nTo create PNG icons, you can:');
console.log('1. Use an online converter like cloudconvert.com');
console.log('2. Use ImageMagick: convert icon.svg icon.png');
console.log('3. Use sharp npm package');
