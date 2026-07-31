import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));
  
  await page.goto('http://localhost:8080/', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  console.log('=== CONSOLE ERRORS ===');
  errors.forEach(e => console.log(e));
  console.log('=== JS ERRORS ===');
  jsErrors.forEach(e => console.log(e));
  console.log('=== CANVAS CHECK ===');
  const hasCanvas = await page.evaluate(() => document.querySelectorAll('canvas').length);
  console.log('Canvas count:', hasCanvas);
  
  await browser.close();
})().catch(e => console.error(e));
