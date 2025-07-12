// Simple icon generator for PWA
// This script creates simple colored icons for the PWA
// For production, replace with actual designed icons

const fs = require('fs');
const path = require('path');

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

function generateSVGIcon(size) {
    const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad1)" rx="20"/>
    <text x="50%" y="50%" text-anchor="middle" dy="0.35em" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white">💰</text>
</svg>`;
    return svg;
}

function createIconsDirectory() {
    const iconsDir = path.join(__dirname, 'icons');
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }
    return iconsDir;
}

function generateIcons() {
    const iconsDir = createIconsDirectory();
    
    iconSizes.forEach(size => {
        const svgContent = generateSVGIcon(size);
        const filename = `icon-${size}x${size}.svg`;
        const filepath = path.join(iconsDir, filename);
        
        fs.writeFileSync(filepath, svgContent);
        console.log(`Generated ${filename}`);
    });
    
    // Create a basic favicon.ico placeholder
    const faviconSVG = generateSVGIcon(32);
    fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSVG);
    console.log('Generated favicon.svg');
    
    // Create apple-touch-icon
    const appleTouchIcon = generateSVGIcon(180);
    fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleTouchIcon);
    console.log('Generated apple-touch-icon.svg');
}

// Run the generator
generateIcons();
console.log('✅ Icons generated successfully!');
console.log('📝 Note: These are placeholder SVG icons. For production, consider using PNG icons with proper design.');
console.log('🎨 You can use tools like https://realfavicongenerator.net/ to create professional icons.');

module.exports = { generateIcons }; 