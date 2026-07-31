// Quick test script to verify the game loads and renders
const { chromium } = require('/home/qg/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');

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
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.log('PAGE ERROR:', err.message);
  });
  
  // Take screenshot of menu
  const fs = require('fs');
  const screenshotDir = '/home/qg/workspace/apex-karts-64/screenshots';
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  
  await page.screenshot({ path: screenshotDir + '/menu.png' });
  console.log('Menu screenshot saved.');
  
  // Check for canvas
  const canvasExists = await page.evaluate(() => 
    document.querySelector('#game-canvas') !== null
  );
  console.log('Canvas exists:', canvasExists);
  
  // Check for errors before clicking
  if (consoleErrors.length > 0) {
    console.log('Pre-click ERRORS count:', consoleErrors.length);
  } else {
    console.log('No pre-click errors.');
  }
  
  // Click start
  await page.click('#btn-start');
  await page.waitForTimeout(4000);
  
  await page.screenshot({ path: screenshotDir + '/after-start.png' });
  console.log('After start screenshot saved.');
  
  // Final check - race in progress
  await page.waitForTimeout(3000);
  await page.screenshot({ path: screenshotDir + '/racing.png' });
  console.log('Racing screenshot saved.');
  
  // Check for post-race errors
  const postErrors = [];
  page.off('console');
  page.off('pageerror');
  page.on('console', msg => { if (msg.type() === 'error') postErrors.push(msg.text()); });
  page.on('pageerror', err => { postErrors.push(err.message); });
  await page.waitForTimeout(2000);
  
  if (postErrors.length > 0) {
    console.log('Post-race ERRORS:', postErrors);
  } else {
    console.log('No post-race console errors.');
  }
  
  // Check WebGL context
  const webglOk = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return 'no canvas';
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no webgl';
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return 'webgl ok';
  });
  console.log('WebGL:', webglOk);
  
  await browser.close();
  console.log('Test complete.');
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});