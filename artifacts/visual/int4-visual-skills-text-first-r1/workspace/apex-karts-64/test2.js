const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  console.log('Loading game...');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  
  // Click START RACE
  console.log('Starting race...');
  await page.click('button:has-text("START RACE")');
  
  // Wait for countdown to complete (3+2+1+GO = ~4.8s)
  await page.waitForTimeout(6000);
  
  // Now drive
  console.log('Driving forward...');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'screenshot_race1.png', fullPage: false });
  console.log('Race 1 captured');
  
  // Steer right
  console.log('Steering right...');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshot_race2.png', fullPage: false });
  console.log('Race 2 captured');
  
  // Continue driving and turning
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot_race3.png', fullPage: false });
  console.log('Race 3 captured');
  
  // Drift
  console.log('Drifting...');
  await page.keyboard.down('Space');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshot_drift.png', fullPage: false });
  console.log('Drift captured');
  
  await page.keyboard.up('Space');
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('ArrowUp');
  
  await browser.close();
  console.log('All screenshots captured!');
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});