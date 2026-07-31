const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  // Collect console messages
  const errors = [];
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') errors.push(text);
    else logs.push(text);
  });

  // Navigate
  console.log('Loading game...');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  // Report JS errors
  if (errors.length > 0) {
    console.log('JS ERRORS:', errors.join('\n'));
  }

  // Check title screen visibility
  const titleVisible = await page.$eval('#title', el => el.style.display !== 'none');
  console.log('Title visible:', titleVisible);

  // Click START RACE
  console.log('Clicking START RACE...');
  await page.click('button:has-text("START RACE")');
  await page.waitForTimeout(1000);

  // Check game state
  const state1 = await page.evaluate(() => GM);
  console.log('State after click:', state1);

  // Wait for countdown to finish
  await page.waitForTimeout(5000);
  const state2 = await page.evaluate(() => GM);
  console.log('State after countdown:', state2);

  // Check kart position
  const kartState = await page.evaluate(() => ({
    x: KS.x, z: KS.z, y: KS.y, h: KS.h, spd: KS.spd,
    onTrk: KS.onTrk, drift: KS.drift
  }));
  console.log('Kart state:', kartState);

  // Check track direction at start
  const trackDir = await page.evaluate(() => {
    const dx = TP[1].x - TP[0].x, dz = TP[1].z - TP[0].z;
    return { dx, dz, angle: Math.atan2(dx, dz), TP0: TP[0], TP1: TP[1] };
  });
  console.log('Track direction:', trackDir);

  // Check checkpoints
  const cps = await page.evaluate(() => {
    return CPS.map((c, i) => ({ idx: i, cpIdx: c.idx, x: c.x, z: c.z, passed: c.passed }));
  });
  console.log('Checkpoints:', JSON.stringify(cps));

  // Check NCP value
  const nc = await page.evaluate(() => NCP);
  console.log('NCP:', nc);

  // Check if start race properly hides title
  const titleVisible2 = await page.$eval('#title', el => el.style.display);
  console.log('Title display after start:', titleVisible2);

  // Check countdown display
  const cdText = await page.evaluate(() => document.getElementById('cd').textContent);
  const cdDisplay = await page.evaluate(() => document.getElementById('cd').style.display);
  console.log('Countdown text:', cdText, 'display:', cdDisplay);

  // Check race start time
  const startTimeVal = await page.evaluate(() => startTime);
  const elapsed = await page.evaluate(() => clk.getElapsedTime() - startTime);
  console.log('Start time:', startTimeVal, 'Elapsed:', elapsed);

  // Try driving
  console.log('Driving forward...');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(3000);

  const kartState2 = await page.evaluate(() => ({
    x: KS.x, z: KS.z, y: KS.y, h: KS.h, spd: KS.spd,
    onTrk: KS.onTrk
  }));
  console.log('Kart after driving:', kartState2);

  // Check nearest track point
  const fi = await page.evaluate(() => fnt(KS.x, KS.z));
  console.log('Nearest track point:', fi);

  // Check lap state
  const lapState = await page.evaluate(() => ({ lap, finished, GM }));
  console.log('Lap state:', lapState);

  // Check checkpoint passed status
  const cps2 = await page.evaluate(() => CPS.map((c, i) => ({ i, passed: c.passed })));
  console.log('CP passed after driving:', JSON.stringify(cps2));

  // Check HUD
  const hudEl = await page.evaluate(() => document.getElementById('vl').textContent);
  console.log('HUD lap display:', hudEl);

  // Now steer right and continue
  console.log('Steering right...');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(3000);
  const kartState3 = await page.evaluate(() => ({
    x: KS.x, z: KS.z, h: KS.h, spd: KS.spd, onTrk: KS.onTrk
  }));
  console.log('Kart after turning:', kartState3);

  // Check if we're still on track
  const onTrack = await page.evaluate(() => KS.onTrk);
  console.log('On track:', onTrack);

  // Check speed
  const speed = await page.evaluate(() => Math.abs(KS.spd));
  console.log('Speed:', speed);

  // Check the sr scope bug
  const srBug = await page.evaluate(() => {
    // In the updateKart function, sr2 shadows the sr function
    // Let's check if sr is accessible
    return typeof sr === 'function';
  });
  console.log('sr function accessible:', srBug);

  // Check if all checkpoints can be reached
  const cpDistances = await page.evaluate(() => {
    return CPS.map((c, i) => ({
      i, dist: Math.sqrt((KS.x - c.x) ** 2 + (KS.z - c.z) ** 2)
    }));
  });
  console.log('Distances to checkpoints:', JSON.stringify(cpDistances));

  // Continue driving in a circle - follow the track for ~40 seconds
  console.log('Driving around track for 40 seconds...');
  // The track is mostly right-curving at start, then needs more complex steering

  // Release right, go straight
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(2000);

  // Continue right-curving (the track is mostly a right loop)
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(5000);

  const lapState2 = await page.evaluate(() => ({ lap, finished, GM }));
  console.log('Lap state after 7s driving:', lapState2);

  const cps3 = await page.evaluate(() => CPS.map((c, i) => ({ i, passed: c.passed, idx: c.idx })));
  console.log('CP passed after extended driving:', JSON.stringify(cps3));

  // Keep driving
  await page.waitForTimeout(10000);

  const lapState3 = await page.evaluate(() => ({ lap, finished, GM }));
  console.log('Lap state after 17s:', lapState3);

  const cps4 = await page.evaluate(() => CPS.map((c, i) => ({ i, passed: c.passed })));
  console.log('CP passed after 17s:', JSON.stringify(cps4));

  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(5000);

  const lapState4 = await page.evaluate(() => ({ lap, finished, GM }));
  console.log('Lap state after 22s (no steer):', lapState4);

  // Check if race completed
  const rsVisible = await page.evaluate(() => document.getElementById('rs').style.display);
  console.log('Race screen display:', rsVisible);

  // Check for any new errors
  if (errors.length > 0) {
    console.log('ALL JS ERRORS:', errors.join('\n'));
  }

  // Final state
  const finalState = await page.evaluate(() => ({
    x: KS.x, z: KS.z, h: KS.h, spd: KS.spd, onTrk: KS.onTrk,
    GM, lap, finished, raceTime
  }));
  console.log('Final state:', JSON.stringify(finalState));

  // Check if result screen appeared
  const resultVisible = await page.evaluate(() => document.getElementById('rs').style.display === 'flex');
  console.log('Result screen visible:', resultVisible);

  await browser.close();
  console.log('=== DIAGNOSIS COMPLETE ===');
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});