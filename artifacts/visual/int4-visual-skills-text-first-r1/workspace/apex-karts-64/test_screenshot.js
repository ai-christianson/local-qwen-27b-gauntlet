const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Title screen
  await page.goto('http://127.0.0.1:8080');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot_title.png' });
  
  // Start the race
  await page.click('button:has-text("START RACE")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot_race.png' });
  
  // Wait for countdown, then drive
  await page.waitForTimeout(5000);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot_driving.png' });
  
  // Turn and drift
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ArrowLeft');
  await page.keyboard.down('Space');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot_drift.png' });
  
  // Clean up
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('Space');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot_turning.png' });
  
  await page.waitForTimeout(500);
  
  // Console logs
  const logs = await page.evaluate(() => {
    // Check for any errors
    return window.__console_logs__ || 'no capture';
  });
  console.log('Console:', logs);
  
  await browser.close();
  console.log('Screenshots captured.');
})().catch(e => { console.error(e); process.exit(1); });