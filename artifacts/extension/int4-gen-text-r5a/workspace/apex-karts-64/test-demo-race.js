// Demo race test - drives a full race in demo mode
const { chromium } = require('/home/qg/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const ss = '/home/qg/workspace/apex-karts-64/screenshots';
  if (!fs.existsSync(ss)) fs.mkdirSync(ss, { recursive: true });

  console.log('=== Apex Karts 64 Demo Test ===');
  console.log('Navigating to game...');
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(3000);

  // Menu screenshot
  await page.screenshot({ path: ss + '/demo-00-menu.png' });
  console.log('[1] Menu screenshot taken.');

  // Check for errors
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => { errors.push(err.message); });

  // Click demo mode
  console.log('[2] Starting demo mode...');
  await page.click('#btn-demo');
  
  // Countdown
  await page.waitForTimeout(4000);
  await page.screenshot({ path: ss + '/demo-01-countdown.png' });
  console.log('[3] Countdown screenshot taken.');

  // Racing - check at intervals
  await page.waitForTimeout(5000);
  await page.screenshot({ path: ss + '/demo-02-racing.png' });
  console.log('[4] Racing screenshot taken.');

  await page.waitForTimeout(8000);
  await page.screenshot({ path: ss + '/demo-03-lap1.png' });
  console.log('[5] Mid-race screenshot taken.');

  // Check race state via JS
  const raceState = await page.evaluate(() => {
    const g = window.game;
    if (!g) return { error: 'no game' };
    return {
      state: g.state,
      kartLap: g.kart ? g.kart.lap : 'no kart',
      kartSpeed: g.kart ? g.kart.speed.toFixed(1) : 0,
      kartX: g.kart ? g.kart.position.x.toFixed(1) : 0,
      kartZ: g.kart ? g.kart.position.z.toFixed(1) : 0,
      finished: g.kart ? g.kart.finished : false,
      elapsedTime: g.elapsedTime.toFixed(1)
    };
  });
  console.log('[6] Race state:', JSON.stringify(raceState));

  // Wait for more laps
  await page.waitForTimeout(15000);
  await page.screenshot({ path: ss + '/demo-04-lap2.png' });
  console.log('[7] Lap 2 screenshot taken.');

  const raceState2 = await page.evaluate(() => {
    const g = window.game;
    if (!g) return { error: 'no game' };
    return {
      state: g.state,
      kartLap: g.kart ? g.kart.lap : 'no kart',
      finished: g.kart ? g.kart.finished : false,
      totalTime: g.kart && g.kart.finished ? g.kart.totalTime.toFixed(1) : 'racing',
      bestLap: g.kart && g.kart.bestLap < Infinity ? g.kart.bestLap.toFixed(2) : 'none'
    };
  });
  console.log('[8] Updated state:', JSON.stringify(raceState2));

  // Wait for race finish if still racing
  if (!raceState2.finished) {
    await page.waitForTimeout(30000);
  }

  await page.screenshot({ path: ss + '/demo-05-final.png' });
  console.log('[9] Final screenshot taken.');

  const raceState3 = await page.evaluate(() => {
    const g = window.game;
    if (!g) return { error: 'no game' };
    return {
      state: g.state,
      finished: g.kart ? g.kart.finished : false,
      totalTime: g.kart && g.kart.finished ? g.kart.totalTime.toFixed(1) : 'N/A',
      bestLap: g.kart && g.kart.bestLap < Infinity ? g.kart.bestLap.toFixed(2) : 'N/A',
      lap: g.kart ? g.kart.lap : 'N/A'
    };
  });
  console.log('[10] Final state:', JSON.stringify(raceState3));

  // Check for errors
  if (errors.length > 0) {
    console.log('CONSOLE ERRORS:', errors);
  } else {
    console.log('No console errors.');
  }

  // Test restart
  console.log('[11] Testing restart...');
  await page.click('#btn-restart');
  await page.waitForTimeout(5000);
  const restartState = await page.evaluate(() => {
    return { state: window.game ? window.game.state : 'no game' };
  });
  console.log('[12] After restart state:', JSON.stringify(restartState));

  await browser.close();
  console.log('\n=== Demo Test Complete ===');
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});