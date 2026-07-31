const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  // Navigate to the game
  console.log('Loading game...');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000); // Let Three.js load
  
  // Screenshot title screen
  await page.screenshot({ path: 'screenshot_title.png', fullPage: false });
  console.log('Title screen captured');
  
  // Click START RACE
  console.log('Clicking START RACE...');
  await page.click('button:has-text("START RACE")');
  await page.waitForTimeout(5000); // Countdown + race start
  
  await page.screenshot({ path: 'screenshot_race.png', fullPage: false });
  console.log('Race screenshot captured');
  
  // Drive the kart a bit
  console.log('Driving...');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot_driving.png', fullPage: false });
  console.log('Driving screenshot captured');
  
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot_turning.png', fullPage: false });
  console.log('Turning screenshot captured');
  await page.keyboard.up('ArrowRight');
  
  // Try demo mode - go back to menu first
  console.log('Testing demo mode...');
  await page.click('button:has-text("START RACE")'); // This is already racing, so try demo
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot_later.png', fullPage: false });
  console.log('Later screenshot captured');
  
  await browser.close();
  console.log('All done!');
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});