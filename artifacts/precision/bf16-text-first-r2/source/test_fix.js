const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const consoleMsgs = [];
  page.on('console', msg => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleMsgs.push(`[ERROR] ${err.message}`));
  
  console.log('=== Loading game ===');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Check for console errors
  const errors = consoleMsgs.filter(m => m.startsWith('[ERROR]') || m.startsWith('[error]'));
  console.log('Console errors:', errors.length ? errors : 'None');
  
  // Check track normals are now unit length
  console.log('\n=== Checking track normals ===');
  const normalCheck = await page.evaluate(() => {
    var badCount = 0;
    var badExamples = [];
    for (var i = 0; i < TN.length; i++) {
      var len = Math.sqrt(TN[i].x * TN[i].x + TN[i].z * TN[i].z);
      if (Math.abs(len - 1) > 0.01) {
        badCount++;
        if (badCount <= 5) badExamples.push('TP' + i + ': len=' + len.toFixed(4));
      }
    }
    return { badCount, badExamples, total: TN.length };
  });
  console.log('Track normals:', JSON.stringify(normalCheck));
  
  // Check track closure
  const trackClosure = await page.evaluate(() => {
    var first = TP[0], last = TP[TP.length - 1];
    var dist = Math.sqrt((first.x - last.x) ** 2 + (first.z - last.z) ** 2);
    return { distFirstLast: dist.toFixed(4), first: { x: first.x.toFixed(2), z: first.z.toFixed(2) }, last: { x: last.x.toFixed(2), z: last.z.toFixed(2) } };
  });
  console.log('Track closure:', JSON.stringify(trackClosure));
  
  // Check checkpoints
  const checkpointInfo = await page.evaluate(() => {
    return CPS.map((c, i) => ({ idx: c.idx, x: c.x.toFixed(2), z: c.z.toFixed(2) }));
  });
  console.log('Checkpoints:', JSON.stringify(checkpointInfo));
  
  // Test 1: Demo mode should work now
  console.log('\n=== Test 1: Demo mode ===');
  await page.click('button:has-text("DEMO MODE")');
  
  // Wait for countdown to complete (should be ~4s)
  await page.waitForTimeout(5000);
  
  const demoState1 = await page.evaluate(() => ({
    GM, KS_x: KS.x.toFixed(2), KS_z: KS.z.toFixed(2), KS_h: KS.h.toFixed(4),
    KS_spd: KS.spd.toFixed(2), CPS_passed: CPS.map(c => c.passed)
  }));
  console.log('Demo after countdown:', JSON.stringify(demoState1));
  
  // Verify GM is 'demo' (not 'racing')
  if (demoState1.GM !== 'demo') {
    console.log('BUG: GM should be demo, got:', demoState1.GM);
  }
  
  // Let demo drive for 15 seconds
  console.log('Letting demo drive for 15 seconds...');
  await page.waitForTimeout(15000);
  
  const demoState2 = await page.evaluate(() => ({
    GM, lap, KS_x: KS.x.toFixed(2), KS_z: KS.z.toFixed(2),
    KS_spd: KS.spd.toFixed(2), onTrk: KS.onTrk,
    CPS_passed: CPS.map(c => c.passed), finished
  }));
  console.log('Demo after 15s:', JSON.stringify(demoState2));
  
  // Verify kart moved
  if (parseFloat(demoState2.KS_x) === 0 && parseFloat(demoState2.KS_z) === 0) {
    console.log('BUG: Kart did not move!');
  } else {
    console.log('PASS: Kart is moving');
  }
  
  // Let it drive more to complete the lap
  await page.waitForTimeout(30000);
  
  const demoState3 = await page.evaluate(() => ({
    GM, lap, KS_x: KS.x.toFixed(2), KS_z: KS.z.toFixed(2),
    KS_spd: KS.spd.toFixed(2), finished,
    CPS_passed: CPS.map(c => c.passed)
  }));
  console.log('Demo after 45s total:', JSON.stringify(demoState3));
  
  // Let it finish if it hasn't yet
  if (!demoState3.finished) {
    console.log('Demo still racing, waiting more...');
    await page.waitForTimeout(30000);
    
    const demoState4 = await page.evaluate(() => ({
      GM, lap, finished, KS_spd: KS.spd.toFixed(2)
    }));
    console.log('Demo after 75s total:', JSON.stringify(demoState4));
    
    if (!demoState4.finished) {
      console.log('WARNING: Demo did not complete lap in 75s');
      // Show checkpoint status
      const cpStatus = await page.evaluate(() => {
        var fi = fnt(KS.x, KS.z);
        return { nearestTP: fi.i, nearestDist: fi.d.toFixed(2), 
          CPS_passed: CPS.map(c => c.passed), onTrk: KS.onTrk,
          KS_x: KS.x.toFixed(2), KS_z: KS.z.toFixed(2) };
      });
      console.log('Kart debug:', JSON.stringify(cpStatus));
    }
  }
  
  // Check if race completion screen appeared
  const raceComplete = await page.evaluate(() => document.getElementById('rs').style.display);
  console.log('Race complete screen visible:', raceComplete !== 'none');
  
  // Test 2: Manual control
  console.log('\n=== Test 2: Manual control ===');
  await page.evaluate(() => doMenu());
  await page.waitForTimeout(1000);
  
  await page.click('button:has-text("START RACE")');
  await page.waitForTimeout(5000); // Countdown
  
  const manualState1 = await page.evaluate(() => ({
    GM, KS_spd: KS.spd.toFixed(2)
  }));
  console.log('Manual after countdown:', JSON.stringify(manualState1));
  
  // Press gas
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(3000);
  
  const manualState2 = await page.evaluate(() => ({
    GM, KS_x: KS.x.toFixed(2), KS_z: KS.z.toFixed(2),
    KS_spd: KS.spd.toFixed(2), onTrk: KS.onTrk
  }));
  console.log('Manual after 3s gas:', JSON.stringify(manualState2));
  
  if (parseFloat(manualState2.KS_spd) > 5) {
    console.log('PASS: Kart accelerated');
  } else {
    console.log('BUG: Kart did not accelerate');
  }
  
  // Final check
  console.log('\n=== Summary ===');
  const finalErrors = consoleMsgs.filter(m => m.startsWith('[ERROR]') || m.startsWith('[error]'));
  console.log('Final errors:', finalErrors.length ? finalErrors.slice(-5) : 'None');
  console.log('Total console messages:', consoleMsgs.length);
  
  await browser.close();
  console.log('\nTest complete!');
})().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});