const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  console.log('Loading game...');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('Starting RACE...');
  await page.click('button:has-text("START RACE")');
  await page.waitForTimeout(5500);

  const state1 = await page.evaluate(() => GM);
  console.log('State:', state1);

  // Get track waypoints for reference
  const trackInfo = await page.evaluate(() => {
    var cps = CPS.map(c => ({ i: c.idx, x: c.x.toFixed(1), z: c.z.toFixed(1) }));
    var tps = [];
    for (var i = 0; i < TP.length; i += 50) {
      tps.push({ i, x: TP[i].x.toFixed(1), z: TP[i].z.toFixed(1) });
    }
    return { cps, tps };
  });
  console.log('Track checkpoints:', JSON.stringify(trackInfo.cps));

  // AI driver that steers to follow track
  await page.keyboard.down('ArrowUp');

  let totalElapsed = 0;
  const maxTime = 90000;
  let lastSteerState = 'none';
  let stuckCount = 0;

  while (totalElapsed < maxTime) {
    const isFinished = await page.evaluate(() => GM === 'finished');
    if (isFinished) {
      console.log('LAP COMPLETED!');
      const info = await page.evaluate(() => ({
        lap, time: (clk.getElapsedTime() - startTime).toFixed(2)
      }));
      console.log('Result:', info);
      break;
    }

    const result = await page.evaluate(() => {
      var fi = fnt(KS.x, KS.z);
      var lookAhead = Math.min(60, Math.max(20, Math.floor(KS.spd * 1.5)));
      var ti = (fi.i + lookAhead) % TP.length;
      var tgt = TP[ti];
      var dx = tgt.x - KS.x, dz = tgt.z - KS.z;
      var targetAngle = Math.atan2(dx, dz);
      var heading = KS.h;
      var diff = targetAngle - heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      // Check curvature
      var ti2 = (ti + lookAhead) % TP.length;
      var dx2 = TP[ti2].x - tgt.x, dz2 = TP[ti2].z - tgt.z;
      var nextAngle = Math.atan2(dx2, dz2);
      var curvature = nextAngle - targetAngle;
      while (curvature > Math.PI) curvature -= Math.PI * 2;
      while (curvature < -Math.PI) curvature += Math.PI * 2;

      return {
        x: KS.x, z: KS.z, spd: KS.spd,
        h: normAngle(KS.h),
        diff: diff, curvature: curvature,
        onTrk: fi.d < TW2 / 2,
        nearestDist: fi.d,
        nearestIdx: fi.i,
        nextCP: nextCP,
        lookAhead: lookAhead
      };
    });

    // Determine steering
    var steerAction = 'none';
    var absDiff = Math.abs(result.diff);

    if (!result.onTrk && result.nearestDist > 10) {
      // Far off track - try to recover
      const recover = await page.evaluate(() => {
        var fi = fnt(KS.x, KS.z);
        var near = TP[fi.i];
        var dx = near.x - KS.x, dz = near.z - KS.z;
        var targetAngle = Math.atan2(dx, dz);
        var diff = targetAngle - KS.h;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return diff;
      });
      steerAction = Math.abs(recover) > 0.1 ? (recover > 0 ? 'left' : 'right') : 'none';
    } else if (result.curvature < -0.3) {
      steerAction = 'left';
    } else if (result.curvature > 0.3) {
      steerAction = 'right';
    } else if (absDiff > 0.3) {
      steerAction = result.diff > 0 ? 'left' : 'right';
    }

    // Apply steering
    if (steerAction === 'left') {
      await page.keyboard.up('ArrowRight');
      await page.keyboard.down('ArrowLeft');
    } else if (steerAction === 'right') {
      await page.keyboard.up('ArrowLeft');
      await page.keyboard.down('ArrowRight');
    } else {
      await page.keyboard.up('ArrowLeft');
      await page.keyboard.up('ArrowRight');
    }

    // Detect stuck
    if (result.nearestIdx === lastSteerState && Math.abs(result.spd) > 5) {
      stuckCount++;
      if (stuckCount > 30) {
        console.log('Stuck! Resetting...');
        await page.keyboard.up('ArrowUp');
        await page.keyboard.up('ArrowLeft');
        await page.keyboard.up('ArrowRight');
        await page.keyboard.down('KeyR');
        await page.waitForTimeout(300);
        await page.keyboard.up('KeyR');
        await page.keyboard.down('ArrowUp');
        stuckCount = 0;
      }
    } else {
      stuckCount = 0;
    }
    lastSteerState = result.nearestIdx;

    // Log progress
    if (result.nearestIdx % 50 === 0 || steerAction !== lastSteerState || totalElapsed % 5000 < 200) {
      console.log(`T=${(totalElapsed/1000).toFixed(0)}s: TP=${result.nearestIdx} CP=${result.nextCP} ` +
        `pos=(${result.x.toFixed(1)},${result.z.toFixed(1)}) spd=${result.spd.toFixed(1)} ` +
        `onTrk=${result.onTrk} steer=${steerAction} diff=${result.diff.toFixed(2)} ` +
        `curv=${result.curvature.toFixed(2)}`);
    }

    await page.waitForTimeout(100);
    totalElapsed += 100;
  }

  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('ArrowRight');

  const final = await page.evaluate(() => ({
    GM, lap, finished, nextCP,
    x: KS.x.toFixed(1), z: KS.z.toFixed(1),
    spd: KS.spd.toFixed(1), onTrk: KS.onTrk
  }));
  console.log('Final:', final);

  const rs = await page.evaluate(() => document.getElementById('rs').style.display === 'flex');
  console.log('Result screen:', rs);

  if (errors.length > 0) console.log('Errors:', errors.slice(-5).join('\n'));

  await browser.close();
  console.log('=== TEST COMPLETE ===');
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});