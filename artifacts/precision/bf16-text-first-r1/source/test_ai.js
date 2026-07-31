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

  // Wait for countdown to complete
  await page.waitForTimeout(5500);

  const state1 = await page.evaluate(() => GM);
  console.log('State after countdown:', state1);

  if (state1 !== 'racing') {
    console.log('ERROR: Countdown did not complete! State:', state1);
    await browser.close();
    return;
  }

  console.log('Starting AI driver...');

  // AI driver: look ahead on track, steer toward it
  await page.keyboard.down('ArrowUp');

  let lastState = null;
  let stuckCount = 0;
  const maxTime = 60000; // 60 seconds max
  let started = Date.now();

  while (Date.now() - started < maxTime) {
    // Check if race finished
    const isFinished = await page.evaluate(() => GM === 'finished');
    if (isFinished) {
      console.log('LAP COMPLETED!');
      const lapInfo = await page.evaluate(() => ({
        lap, startTime, time: clk.getElapsedTime() - startTime
      }));
      console.log('Lap info:', lapInfo);
      break;
    }

    // Get current state and compute steering
    const result = await page.evaluate(() => {
      // Find nearest track point
      var fi = fnt(KS.x, KS.z);
      // Look ahead
      var aheadDist = 40; // look 40 points ahead (~20% of track)
      var lookAheadIdx = (fi.i + aheadDist) % TP.length;
      var target = TP[lookAheadIdx];
      var dx = target.x - KS.x, dz = target.z - KS.z;
      var targetAngle = Math.atan2(dx, dz);
      var headingDiff = targetAngle - KS.h;
      while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
      while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;

      // Check if we're on track
      var onTrk = fi.d < TW2 / 2;

      // If off track, try to get back
      var nearest = TP[fi.i];
      var backAngle = Math.atan2(nearest.x - KS.x, nearest.z - KS.z);
      var backDiff = backAngle - KS.h;
      while (backDiff > Math.PI) backDiff -= Math.PI * 2;
      while (backDiff < -Math.PI) backDiff += Math.PI * 2;

      var steer = 0;
      if (!onTrk && fi.d > TW2 / 2 + 5) {
        // Off track, steer back toward track
        steer = backDiff > 0 ? -1 : 1;
      } else {
        // On track or close, steer toward target
        steer = Math.abs(headingDiff) > 0.2 ? (headingDiff > 0 ? -1 : 1) : 0;
      }

      return {
        x: KS.x, z: KS.z,
        h: normAngle(KS.h),
        spd: KS.spd,
        onTrk,
        nearestIdx: fi.i,
        nearestDist: fi.d,
        headingDiff: headingDiff,
        steer: steer,
        nextCP: nextCP,
        ncp: NCP,
        lap: lap,
        cps: CPS.map((c, i) => ({ i, passed: c.passed }))
      };
    });

    // Detect stuck (same nearest TP index for too long)
    if (result.nearestIdx === lastState?.nearestIdx && Math.abs(result.spd) > 5) {
      stuckCount++;
      if (stuckCount > 10) {
        console.log('KART STUCK! Resetting...');
        await page.keyboard.up('ArrowUp');
        await page.keyboard.up('ArrowLeft');
        await page.keyboard.up('ArrowRight');
        await page.keyboard.down('KeyR'); // Reset
        await page.waitForTimeout(500);
        await page.keyboard.up('KeyR');
        await page.keyboard.down('ArrowUp');
        stuckCount = 0;
      }
    } else {
      stuckCount = 0;
    }

    // Apply steering
    if (result.steer === 1) {
      if (!page.keyboard._modifiers?.has('ArrowLeft')) {
        await page.keyboard.up('ArrowLeft');
      }
      if (!page.keyboard._modifiers?.has('ArrowRight')) {
        await page.keyboard.down('ArrowRight');
      }
    } else if (result.steer === -1) {
      if (!page.keyboard._modifiers?.has('ArrowRight')) {
        await page.keyboard.up('ArrowRight');
      }
      if (!page.keyboard._modifiers?.has('ArrowLeft')) {
        await page.keyboard.down('ArrowLeft');
      }
    } else {
      await page.keyboard.up('ArrowLeft');
      await page.keyboard.up('ArrowRight');
    }

    lastState = result;

    // Log progress every few iterations
    if (result.nearestIdx % 30 === 0) {
      console.log(`TP=${result.nearestIdx}, CP=${result.nextCP}/${result.ncp}, ` +
        `onTrack=${result.onTrk}, spd=${result.spd.toFixed(1)}, ` +
        `pos=(${result.x.toFixed(1)},${result.z.toFixed(1)})`);
    }

    await page.waitForTimeout(100); // 100ms per steering update
  }

  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('ArrowRight');

  // Final state
  const final = await page.evaluate(() => ({
    GM, lap, finished,
    x: KS.x, z: KS.z,
    h: normAngle(KS.h),
    spd: KS.spd,
    onTrk: KS.onTrk,
    nextCP: nextCP
  }));
  console.log('Final state:', final);

  const resultVisible = await page.evaluate(() => document.getElementById('rs').style.display === 'flex');
  console.log('Result screen visible:', resultVisible);

  if (errors.length > 0) {
    console.log('JS ERRORS:', errors.join('\n'));
  }

  await browser.close();
  console.log('=== TEST COMPLETE ===');
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});