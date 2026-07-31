const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log('Loading game...');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Click START RACE
  console.log('Clicking START RACE...');
  await page.click('button:has-text("START RACE")');

  // Wait for countdown (now should be ~4.8s real time)
  await page.waitForTimeout(5500);

  const state1 = await page.evaluate(() => GM);
  console.log('State after countdown:', state1);

  if (state1 !== 'racing') {
    console.log('ERROR: Countdown did not complete! State:', state1);
  }

  // Auto-drive the kart around the track
  // The track goes: start(0,0) -> right(curve) -> up -> left -> down -> back to start
  // We need to follow the track waypoints
  const trackPath = await page.evaluate(() => {
    // Sample track points with their angles
    var path = [];
    for(var i=0; i<TP.length; i+=20) {
      var p=TP[i], n=TP[(i+1)%TP.length];
      path.push({
        idx: i,
        x: p.x, z: p.z,
        angle: Math.atan2(n.x-p.x, n.z-p.z)
      });
    }
    return path;
  });

  // Drive function - steer to follow track
  console.log('Auto-driving around track...');
  await page.keyboard.down('ArrowUp');

  // Phase 1: Drive straight forward (start is along +X)
  await page.waitForTimeout(2000);

  const state1b = await page.evaluate(() => ({
    x: KS.x, z: KS.z, h: KS.h, spd: KS.spd,
    onTrk: KS.onTrk, nextCP: nextCP, GM
  }));
  console.log('Phase 1:', state1b);

  // Phase 2: Start curving right (track curves toward +Z)
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(3000);

  const state2 = await page.evaluate(() => ({
    x: KS.x, z: KS.z, h: normAngle(KS.h), spd: KS.spd,
    onTrk: KS.onTrk, nextCP: nextCP
  }));
  console.log('Phase 2 (right curve):', state2);

  // Phase 3: Continue right - track continues curving
  await page.waitForTimeout(4000);

  const state3 = await page.evaluate(() => ({
    x: KS.x, z: KS.z, h: normAngle(KS.h), spd: KS.spd,
    onTrk: KS.onTrk, nextCP: nextCP
  }));
  console.log('Phase 3 (more right):', state3);

  // Phase 4: Track starts going straight-ish, then curves left
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(2000);

  // Phase 5: Curve left
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(4000);

  const state4 = await page.evaluate(() => ({
    x: KS.x, z: KS.z, h: normAngle(KS.h), spd: KS.spd,
    onTrk: KS.onTrk, nextCP: nextCP
  }));
  console.log('Phase 5 (left curve):', state4);

  // Phase 6: Straight and more left to come back
  await page.waitForTimeout(3000);

  // Phase 7: The track should come back toward start
  await page.waitForTimeout(4000);

  const state5 = await page.evaluate(() => ({
    x: KS.x, z: KS.z, h: normAngle(KS.h), spd: KS.spd,
    onTrk: KS.onTrk, nextCP: nextCP, lap: lap, finished: finished, GM: GM
  }));
  console.log('Phase 7 (approaching finish):', state5);

  // Phase 8: Final approach - may need slight steering
  await page.waitForTimeout(3000);

  const state6 = await page.evaluate(() => ({
    x: KS.x, z: KS.z, h: normAngle(KS.h), spd: KS.spd,
    onTrk: KS.onTrk, nextCP: nextCP, lap: lap, finished: finished, GM: GM
  }));
  console.log('Phase 8 (finish?):', state6);

  // Check result screen
  const resultVisible = await page.evaluate(() => document.getElementById('rs').style.display === 'flex');
  console.log('Result screen visible:', resultVisible);

  // Get checkpoint status
  const cps = await page.evaluate(() => ({
    nextCP: nextCP,
    cps: CPS.map((c, i) => ({ i, passed: c.passed, idx: c.idx }))
  }));
  console.log('Checkpoints:', JSON.stringify(cps));

  // Check heading normalization
  const heading = await page.evaluate(() => normAngle(KS.h));
  console.log('Normalized heading:', heading);

  // If lap not complete, try driving more
  if (!resultVisible) {
    console.log('LAP NOT COMPLETE. Continuing to drive...');
    // Try to follow track with AI-like steering
    // Release left, try different steering combinations

    await page.keyboard.up('ArrowLeft');
    await page.keyboard.up('ArrowRight');

    // Try going straight a bit
    await page.waitForTimeout(2000);

    // Check where we are relative to checkpoints
    const pos = await page.evaluate(() => {
      var fi = fnt(KS.x, KS.z);
      var cpDists = CPS.map((c, i) => ({
        i, dist: Math.sqrt((KS.x-c.x)**2 + (KS.z-c.z)**2),
        x: c.x, z: c.z
      }));
      return {
        kart: { x: KS.x, z: KS.z },
        nearestTP: fi,
        cpDists,
        nextCP: nextCP,
        onTrk: KS.onTrk
      };
    });
    console.log('Position analysis:', JSON.stringify(pos));

    // Drive more - try full loop with more time
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(8000);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(6000);

    const state7 = await page.evaluate(() => ({
      x: KS.x, z: KS.z, h: normAngle(KS.h), spd: KS.spd,
      onTrk: KS.onTrk, nextCP: nextCP, lap: lap, finished: finished, GM: GM
    }));
    console.log('Final drive state:', state7);

    const resultVisible2 = await page.evaluate(() => document.getElementById('rs').style.display === 'flex');
    console.log('Result screen (2nd check):', resultVisible2);
  }

  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('ArrowRight');

  if (errors.length > 0) {
    console.log('JS ERRORS:', errors.join('\n'));
  }

  await browser.close();
  console.log('=== TEST COMPLETE ===');
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});