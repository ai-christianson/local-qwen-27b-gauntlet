const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  let errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Loading game...');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await sleep(3000);
  
  // Test 1: Start race
  console.log('=== Test 1: Start race ===');
  await page.click('button:has-text("START RACE")');
  await sleep(3000);
  let gm = await page.evaluate(() => GM);
  console.log(`Game mode: ${gm} (expected: racing) ${gm==='racing'?'✓':'✗'}`);
  
  // Test 2: Acceleration
  console.log('\n=== Test 2: Acceleration ===');
  await page.keyboard.down('ArrowUp');
  await sleep(2000);
  let s = await page.evaluate(() => ({spd: KS.spd.toFixed(1), onTrk: KS.onTrk}));
  console.log(`Speed: ${s.spd} (should be near max) ${parseFloat(s.spd)>20?'✓':'✗'}`);
  console.log(`On track: ${s.onTrk} ${s.onTrk?'✓':'✗'}`);
  await page.keyboard.up('ArrowUp');
  
  // Test 3: Braking
  console.log('\n=== Test 3: Braking ===');
  await page.keyboard.down('ArrowUp');
  await sleep(1000);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.down('ArrowDown');
  await sleep(1000);
  s = await page.evaluate(() => ({spd: KS.spd.toFixed(1)}));
  console.log(`Speed after brake: ${s.spd} (should be low) ${parseFloat(s.spd)<5?'✓':'✗'}`);
  await page.keyboard.up('ArrowDown');
  
  // Test 4: Reset
  console.log('\n=== Test 4: Reset (R key) ===');
  await page.keyboard.press('KeyR');
  await sleep(500);
  s = await page.evaluate(() => ({x: KS.x.toFixed(2), z: KS.z.toFixed(2), spd: KS.spd.toFixed(1), h: KS.h.toFixed(2)}));
  console.log(`After reset: x=${s.x} z=${s.z} spd=${s.spd} h=${s.h}`);
  // Should be near start with 0 speed
  console.log(`Reset correct: ${parseFloat(s.spd)==0 && parseFloat(s.x)>0?'✓':'✗'}`);
  
  // Test 5: Drift
  console.log('\n=== Test 5: Drift ===');
  await page.keyboard.down('ArrowUp');
  await sleep(2000); // Build speed
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('Space');
  await sleep(1000);
  s = await page.evaluate(() => ({drift: KS.drift, dc: KS.dc.toFixed(2), da: KS.da.toFixed(3)}));
  console.log(`Drift active: ${s.drift} driftCount: ${s.dc} driftAngle: ${s.da} ${s.drift?'✓':'✗'}`);
  await page.keyboard.up('Space');
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('ArrowUp');
  await sleep(500);
  s = await page.evaluate(() => ({drift: KS.drift}));
  console.log(`Drift ended: ${!s.drift?'✓':'✗'}`);
  
  // Test 6: Complete lap
  console.log('\n=== Test 6: Complete lap ===');
  // Reset and drive a full lap with assistance
  await page.keyboard.press('KeyR');
  await sleep(500);
  
  // Gas + right to follow the track
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ArrowRight');
  
  // Wait for lap completion (max 30s)
  let lapDone = false;
  for (let i = 0; i < 15; i++) {
    await sleep(2000);
    let result = await page.evaluate(() => ({lap: lap, gm: GM, finished: finished}));
    if (result.finished) { lapDone = true; break; }
  }
  console.log(`Lap completed: ${lapDone?'✓':'✗'}`);
  
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ArrowRight');
  
  // Test 7: Results screen
  console.log('\n=== Test 7: Results screen ===');
  let rs = await page.evaluate(() => ({
    display: document.getElementById('rs').style.display,
    time: document.getElementById('rt').textContent,
    topSpeed: document.getElementById('rsp').textContent
  }));
  console.log(`Results visible: ${rs.display==='flex'?'✓':'✗'}`);
  console.log(`Time: ${rs.time}, Top Speed: ${rs.topSpeed} km/h`);
  
  // Test 8: Menu
  console.log('\n=== Test 8: Menu button ===');
  await page.click('button:has-text("MAIN MENU")');
  let title = await page.evaluate(() => document.getElementById('title').style.display);
  console.log(`Menu visible: ${title==='flex'?'✓':'✗'}`);
  
  // Test 9: Replay
  console.log('\n=== Test 9: Replay ===');
  await page.click('button:has-text("START RACE")');
  await sleep(3000);
  gm = await page.evaluate(() => GM);
  console.log(`Replay started: ${gm==='racing'?'✓':'✗'} (mode: ${gm})`);
  
  // Check for errors
  console.log('\n=== Error Check ===');
  if (errors.length === 0) {
    console.log('No JavaScript errors ✓');
  } else {
    console.log(`Found ${errors.length} error(s):`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  
  await browser.close();
  console.log('\nAll tests complete!');
})().catch(e => { console.error(e); process.exit(1); });
