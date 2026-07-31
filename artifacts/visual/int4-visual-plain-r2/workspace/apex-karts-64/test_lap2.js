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
  
  // Verify initial state
  let init = await page.evaluate(() => ({
    x: KS.x.toFixed(2), z: KS.z.toFixed(2), h: KS.h.toFixed(3),
    spd: KS.spd, gm: GM
  }));
  console.log('Initial:', init);
  
  // Start race
  console.log('\nStarting race...');
  await page.click('button:has-text("START RACE")');
  
  // Monitor countdown
  console.log('Monitoring countdown...');
  for (let i = 1; i <= 8; i++) {
    await sleep(1000);
    let s = await page.evaluate(() => ({gm: GM, cp: cdPhase, ct: cdTimer.toFixed(2)}));
    console.log(`t=${i}s: GM=${s.gm} phase=${s.cp} timer=${s.ct}`);
    if (s.gm === 'racing') break;
  }
  
  // Check we're racing
  let gm = await page.evaluate(() => GM);
  console.log(`\nGame mode: ${gm}`);
  
  if (gm !== 'racing') {
    console.error('ERROR: Not in racing mode!');
    await browser.close();
    process.exit(1);
  }
  
  // Check checkpoint 0 is auto-passed (since kart starts near it)
  let cps = await page.evaluate(() => CPS.map((c,i) => ({i, x: c.x.toFixed(1), z: c.z.toFixed(1), passed: c.passed})));
  console.log('Checkpoints:', JSON.stringify(cps));
  
  // Drive forward - track goes east initially
  console.log('\n=== Driving phase 1: straight ===');
  await page.keyboard.down('ArrowUp');
  await sleep(4000);
  
  let s1 = await page.evaluate(() => ({
    x: KS.x.toFixed(2), z: KS.z.toFixed(2), spd: KS.spd.toFixed(1),
    h: KS.h.toFixed(3), onTrk: KS.onTrk
  }));
  console.log('After 4s forward:', s1);
  
  // Check CP status
  cps = await page.evaluate(() => CPS.map((c,i) => ({i, passed: c.passed})));
  console.log('CPs after forward:', JSON.stringify(cps));
  
  // Track curves right, then goes south, then curves back
  // Need to steer right
  console.log('\n=== Driving phase 2: steer right ===');
  await page.keyboard.down('ArrowRight');
  await sleep(5000);
  
  let s2 = await page.evaluate(() => ({
    x: KS.x.toFixed(2), z: KS.z.toFixed(2), spd: KS.spd.toFixed(1),
    h: KS.h.toFixed(3), onTrk: KS.onTrk
  }));
  console.log('After right turn:', s2);
  
  cps = await page.evaluate(() => CPS.map((c,i) => ({i, passed: c.passed})));
  console.log('CPs after right:', JSON.stringify(cps));
  
  // Let's check lap
  let lap = await page.evaluate(() => lap);
  console.log('Lap:', lap);
  
  // Release and try more driving
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('ArrowUp');
  await sleep(1000);
  
  // Try full loop approach: gas + right for a while, then adjust
  console.log('\n=== Driving phase 3: continue loop ===');
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await sleep(8000);
  
  let s3 = await page.evaluate(() => ({
    x: KS.x.toFixed(2), z: KS.z.toFixed(2), spd: KS.spd.toFixed(1),
    h: KS.h.toFixed(3), onTrk: KS.onTrk
  }));
  console.log('After phase 3:', s3);
  
  cps = await page.evaluate(() => CPS.map((c,i) => ({i, passed: c.passed})));
  console.log('CPs:', JSON.stringify(cps));
  
  lap = await page.evaluate(() => lap);
  gm = await page.evaluate(() => GM);
  console.log(`Lap: ${lap}, GM: ${gm}`);
  
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ArrowRight');
  
  // Final state
  let final = await page.evaluate(() => ({
    x: KS.x.toFixed(2), z: KS.z.toFixed(2), spd: KS.spd.toFixed(1),
    h: KS.h.toFixed(3), onTrk: KS.onTrk,
    lap: lap, gm: GM, finished: finished
  }));
  console.log('\nFinal state:', JSON.stringify(final));
  
  await browser.close();
  console.log('\nDone!');
})().catch(e => { console.error(e); process.exit(1); });
