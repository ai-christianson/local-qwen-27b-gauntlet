const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  // Collect console messages
  const consoleMsgs = [];
  page.on('console', msg => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleMsgs.push(`[ERROR] ${err.message}`));
  
  console.log('Loading game...');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Check for console errors
  const errors = consoleMsgs.filter(m => m.startsWith('[ERROR]') || m.startsWith('[error]'));
  if (errors.length > 0) {
    console.log('Console errors:', errors);
  } else {
    console.log('No console errors');
  }
  
  // Check game loaded properly
  const hasCanvas = await page.evaluate(() => document.querySelector('canvas') !== null);
  console.log('Has canvas:', hasCanvas);
  
  // Check Three.js loaded
  const hasThreeJS = await page.evaluate(() => typeof THREE !== 'undefined');
  console.log('Has Three.js:', hasThreeJS);
  
  // Check game state variables
  const gameState = await page.evaluate(() => ({
    GM, lap, keys, KS_x: KS.x, KS_z: KS.z, KS_y: KS.y, KS_h: KS.h, KS_spd: KS.spd,
    kart_exists: kart !== null && kart !== undefined,
    TP_count: TP.length,
    CPS_count: CPS.length,
    TW_count: TW.length
  }));
  console.log('Game state:', JSON.stringify(gameState));
  
  // Check track points form a proper loop
  const trackInfo = await page.evaluate(() => {
    var first = TP[0];
    var last = TP[TP.length - 1];
    var distFirstLast = Math.sqrt((first.x - last.x) ** 2 + (first.z - last.z) ** 2);
    var checkpoints = CPS.map((c, i) => ({ idx: c.idx, x: c.x, z: c.z }));
    // Check track point spacing
    var minSpacing = Infinity, maxSpacing = 0;
    for (var i = 0; i < TP.length; i++) {
      var j = (i + 1) % TP.length;
      var d = Math.sqrt((TP[i].x - TP[j].x) ** 2 + (TP[i].z - TP[j].z) ** 2);
      if (d < minSpacing) minSpacing = d;
      if (d > maxSpacing) maxSpacing = d;
    }
    // Check if track goes in circle
    var maxX = -Infinity, minX = Infinity, maxZ = -Infinity, minZ = Infinity;
    for (var i = 0; i < TP.length; i++) {
      if (TP[i].x > maxX) maxX = TP[i].x;
      if (TP[i].x < minX) minX = TP[i].x;
      if (TP[i].z > maxZ) maxZ = TP[i].z;
      if (TP[i].z < minZ) minZ = TP[i].z;
    }
    return {
      distFirstLast, checkpoints, minSpacing, maxSpacing,
      trackBounds: { minX, maxX, minZ, maxZ }
    };
  });
  console.log('Track info:', JSON.stringify(trackInfo));
  
  // Check normals
  const normalsInfo = await page.evaluate(() => {
    var issues = [];
    for (var i = 0; i < TN.length; i += 10) {
      var len = Math.sqrt(TN[i].x * TN[i].x + TN[i].z * TN[i].z);
      if (Math.abs(len - 1) > 0.01) {
        issues.push('TP' + i + ' normal length: ' + len);
      }
    }
    return issues;
  });
  console.log('Normal issues:', normalsInfo.length ? normalsInfo : 'None');
  
  // Start the race
  console.log('Starting race...');
  await page.click('button:has-text("START RACE")');
  await page.waitForTimeout(6000); // Wait for countdown
  
  const stateAfterStart = await page.evaluate(() => ({
    GM, lap, KS_x: KS.x, KS_z: KS.z, KS_h: KS.h, KS_spd: KS.spd,
    CPS_passed: CPS.map(c => c.passed)
  }));
  console.log('State after start:', JSON.stringify(stateAfterStart));
  
  // Drive forward
  console.log('Driving forward for 3 seconds...');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(3000);
  
  const stateAfterDrive = await page.evaluate(() => ({
    GM, KS_x: KS.x, KS_z: KS.z, KS_h: KS.h, KS_spd: KS.spd,
    onTrk: KS.onTrk, CPS_passed: CPS.map(c => c.passed)
  }));
  console.log('State after driving:', JSON.stringify(stateAfterDrive));
  
  // Check if kart moved significantly
  const moved = Math.sqrt(
    (stateAfterDrive.KS_x - stateAfterStart.KS_x) ** 2 + 
    (stateAfterDrive.KS_z - stateAfterStart.KS_z) ** 2
  );
  console.log('Distance moved after 3s gas:', moved.toFixed(2));
  
  // Now test the demo mode which should complete the lap
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(1000);
  
  // Go to menu
  console.log('Testing demo mode...');
  await page.evaluate(() => doMenu());
  await page.waitForTimeout(1000);
  
  // Start demo mode
  await page.click('button:has-text("DEMO MODE")');
  await page.waitForTimeout(6000); // Countdown
  
  // Let demo drive for 30 seconds
  console.log('Letting demo drive for 30 seconds...');
  await page.waitForTimeout(30000);
  
  const demoState = await page.evaluate(() => ({
    GM, lap, KS_x: KS.x, KS_z: KS.z, KS_h: KS.h, KS_spd: KS.spd,
    onTrk: KS.onTrk, finished, CPS_passed: CPS.map(c => c.passed)
  }));
  console.log('Demo state after 30s:', JSON.stringify(demoState));
  
  // More demo time
  await page.waitForTimeout(30000);
  const demoState2 = await page.evaluate(() => ({
    GM, lap, KS_x: KS.x, KS_z: KS.z, finished
  }));
  console.log('Demo state after 60s:', JSON.stringify(demoState2));
  
  // Check final errors
  const finalErrors = consoleMsgs.filter(m => m.startsWith('[ERROR]') || m.startsWith('[error]'));
  if (finalErrors.length > 0) {
    console.log('Final errors:', finalErrors.slice(-10));
  }
  
  await browser.close();
  console.log('Test complete!');
})().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});