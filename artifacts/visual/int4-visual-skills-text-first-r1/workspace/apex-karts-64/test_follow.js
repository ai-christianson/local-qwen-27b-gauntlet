const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.error(`[ERR] ${msg.text()}`);
  });

  console.log('Loading game...');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await sleep(3000);
  
  // Get track geometry info
  let trackInfo = await page.evaluate(() => {
    // Sample track at regular intervals
    let pts = [];
    for (let i = 0; i < TP.length; i += 10) {
      pts.push({ i, x: TP[i].x, z: TP[i].z });
    }
    // Get checkpoint positions
    let cps = CPS.map((c, idx) => ({ idx, x: c.x, z: c.z, passed: c.passed }));
    return { points: pts, checkpoints: cps };
  });
  console.log('Track shape (every 10 pts):');
  trackInfo.points.forEach(p => {
    console.log(`  TP[${p.i}]: (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`);
  });
  console.log('Checkpoints:', JSON.stringify(trackInfo.checkpoints));
  
  // Start race
  console.log('\n--- Starting race ---');
  await page.click('button:has-text("START RACE")');
  await sleep(3000); // wait for countdown
  
  let gm = await page.evaluate(() => GM);
  console.log(`Game mode: ${gm}`);
  
  // Follow the track more carefully
  // Phase 1: Drive straight from x=3 to x≈35 (track is still at z≈0)
  console.log('\n=== Phase 1: straight, x=3 to x≈35 ===');
  await page.keyboard.down('ArrowUp');
  await sleep(2000); // ~34 units, should be around x=35, still on track
  
  let s = await page.evaluate(() => ({ x: KS.x.toFixed(1), z: KS.z.toFixed(1), spd: KS.spd.toFixed(1), onTrk: KS.onTrk, h: KS.h.toFixed(2) }));
  console.log('After straight:', s);
  
  // Phase 2: Curve right (track curves toward increasing z)
  console.log('\n=== Phase 2: curve right ===');
  await page.keyboard.down('ArrowRight');
  await sleep(3000);
  
  s = await page.evaluate(() => ({ x: KS.x.toFixed(1), z: KS.z.toFixed(1), spd: KS.spd.toFixed(1), onTrk: KS.onTrk, h: KS.h.toFixed(2) }));
  console.log('After curve right:', s);
  
  let cps = await page.evaluate(() => CPS.map((c,i) => ({i, passed: c.passed})));
  console.log('CPs:', JSON.stringify(cps));
  
  // Phase 3: Continue around - track should be curving more
  console.log('\n=== Phase 3: continue right curve ===');
  await sleep(3000);
  
  s = await page.evaluate(() => ({ x: KS.x.toFixed(1), z: KS.z.toFixed(1), spd: KS.spd.toFixed(1), onTrk: KS.onTrk, h: KS.h.toFixed(2) }));
  console.log('After phase 3:', s);
  cps = await page.evaluate(() => CPS.map((c,i) => ({i, passed: c.passed})));
  console.log('CPs:', JSON.stringify(cps));
  
  // Phase 4: Release right, maybe steer slightly left as track curves back
  console.log('\n=== Phase 4: release right, track goes south then left ===');
  await page.keyboard.up('ArrowRight');
  await sleep(1000);
  // Track from ~x:68,z:28 goes to x:65,z:40 then x:55,z:48 then x:42,z:50
  // Need to steer left here
  await page.keyboard.down('ArrowLeft');
  await sleep(3000);
  
  s = await page.evaluate(() => ({ x: KS.x.toFixed(1), z: KS.z.toFixed(1), spd: KS.spd.toFixed(1), onTrk: KS.onTrk, h: KS.h.toFixed(2) }));
  console.log('After left steer:', s);
  cps = await page.evaluate(() => CPS.map((c,i) => ({i, passed: c.passed})));
  console.log('CPs:', JSON.stringify(cps));
  
  // Phase 5: Continue left
  console.log('\n=== Phase 5: continue left, track curves back ===');
  await sleep(3000);
  
  s = await page.evaluate(() => ({ x: KS.x.toFixed(1), z: KS.z.toFixed(1), spd: KS.spd.toFixed(1), onTrk: KS.onTrk, h: KS.h.toFixed(2) }));
  console.log('After phase 5:', s);
  cps = await page.evaluate(() => CPS.map((c,i) => ({i, passed: c.passed})));
  console.log('CPs:', JSON.stringify(cps));
  
  // Phase 6: Steer right as track curves back toward start
  console.log('\n=== Phase 6: curve back to start ===');
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('ArrowRight');
  await sleep(4000);
  
  s = await page.evaluate(() => ({ x: KS.x.toFixed(1), z: KS.z.toFixed(1), spd: KS.spd.toFixed(1), onTrk: KS.onTrk, h: KS.h.toFixed(2) }));
  console.log('After curve back:', s);
  cps = await page.evaluate(() => CPS.map((c,i) => ({i, passed: c.passed})));
  console.log('CPs:', JSON.stringify(cps));
  
  let lap = await page.evaluate(() => lap);
  let finalGm = await page.evaluate(() => GM);
  console.log(`\nLap: ${lap}, GM: ${finalGm}`);
  
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ArrowRight');
  
  let final = await page.evaluate(() => ({
    x: KS.x.toFixed(2), z: KS.z.toFixed(2), spd: KS.spd.toFixed(1),
    h: KS.h.toFixed(3), onTrk: KS.onTrk,
    lap: lap, gm: GM, finished: finished
  }));
  console.log('\nFinal:', JSON.stringify(final));
  
  await browser.close();
  console.log('\nDone!');
})().catch(e => { console.error(e); process.exit(1); });
