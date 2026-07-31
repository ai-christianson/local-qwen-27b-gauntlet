const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  console.log('Loading game...');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  
  await page.click('button:has-text("START RACE")');
  await page.waitForTimeout(6000); // Wait for countdown
  
  // Hold gas - kart should now face the correct direction
  console.log('Driving straight...');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 's2_race1.png', fullPage: false });
  console.log('Race 1 done');
  
  // Follow the track - it curves right
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 's2_race2.png', fullPage: false });
  console.log('Race 2 done');
  
  // Continue around
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 's2_race3.png', fullPage: false });
  console.log('Race 3 done');
  
  // More driving - track continues right then goes into curves
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 's2_race4.png', fullPage: false });
  console.log('Race 4 done');
  
  // Let it drive more
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 's2_race5.png', fullPage: false });
  console.log('Race 5 done');
  
  // Try drift
  await page.keyboard.down('Space');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 's2_drift.png', fullPage: false });
  console.log('Drift done');
  
  await page.keyboard.up('Space');
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('ArrowUp');
  
  await browser.close();
  console.log('All done!');
})().catch(err => { console.error('Error:', err.message); process.exit(1); });