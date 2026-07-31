import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

// Collect errors
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push(err.message));

await page.goto('http://localhost:8080/');
// Wait for Three.js to fully load and render
await page.waitForTimeout(5000);
await page.screenshot({ path: '/home/qg/workspace/apex-karts-64/screenshot-menu.png', fullPage: false });
console.log('Menu screenshot taken');

// Wait for canvas to have content
await page.waitForFunction(() => {
  const c = document.querySelector('canvas');
  return c && c.width > 100;
}, { timeout: 10000 });

// Now press Enter to start
await page.keyboard.press('Enter');
console.log('Pressed Enter');

// Wait for countdown to finish (3 seconds) + extra
await page.waitForTimeout(5000);
await page.screenshot({ path: '/home/qg/workspace/apex-karts-64/screenshot-racing.png', fullPage: false });
console.log('Racing screenshot taken');

// Press up arrow to accelerate
await page.keyboard.down('ArrowUp');
await page.waitForTimeout(3000);
await page.screenshot({ path: '/home/qg/workspace/apex-karts-64/screenshot-accel.png', fullPage: false });
console.log('Acceleration screenshot taken');

// Turn right a bit
await page.keyboard.up('ArrowUp');
await page.waitForTimeout(200);
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(1000);
await page.keyboard.down('ArrowUp');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/qg/workspace/apex-karts-64/screenshot-turn.png', fullPage: false });
console.log('Turn screenshot taken');

// Wait for lap completion
await page.waitForTimeout(30000);
await page.screenshot({ path: '/home/qg/workspace/apex-karts-64/screenshot-finish.png', fullPage: false });
console.log('Finish screenshot taken');

if (errors.length) {
  console.log('Console errors:', errors.join('\n'));
} else {
  console.log('No console errors');
}

await browser.close();