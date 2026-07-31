// Quick test script to verify the game loads and renders
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to game...');
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(3000);
  
  // Check for errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });
  
  // Take screenshot of menu
  await page.screenshot({ path: '/home/qg/workspace/apex-karts-64/screenshots/menu.png' });
  console.log('Menu screenshot saved.');
  
  // Check for canvas
  const canvasExists = await page.evaluate(() => 
    document.querySelector('#game-canvas') !== null
  );
  console.log('Canvas exists:', canvasExists);
  
  // Click start
  await page.click('#btn-start');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/home/qg/workspace/apex-karts-64/screenshots/after-start.png' });
  console.log('After start screenshot saved.');
  
  // Check errors
  if (consoleErrors.length > 0) {
    console.log('ERRORS:', consoleErrors);
  } else {
    console.log('No console errors.');
  }
  
  await browser.close();
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});