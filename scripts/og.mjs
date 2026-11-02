// Renders public/og.png (the link-preview image). Run `npm run og` after changing the name or headline.
import sharp from 'sharp';

const name = 'Abhishek Jha';
const line1 = 'Software engineer: backend systems';
const line2 = 'and LLM-powered products';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#fbfaf7"/>
  <rect x="0" y="0" width="16" height="630" fill="#0d6b57"/>
  <text x="96" y="250" font-family="Georgia, serif" font-size="96" fill="#1d1c1a">${name}</text>
  <text x="96" y="340" font-family="Georgia, serif" font-size="44" fill="#5f5b54">${line1}</text>
  <text x="96" y="400" font-family="Georgia, serif" font-size="44" fill="#5f5b54">${line2}</text>
  <text x="96" y="520" font-family="Consolas, monospace" font-size="28" fill="#0d6b57">Experience · Projects · Library</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log('wrote public/og.png');
