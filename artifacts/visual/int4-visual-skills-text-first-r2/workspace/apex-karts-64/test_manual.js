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
  
  // Start race
  console.log('Starting race...');
  await page.click('button:has-text("START RACE")');
  await sleep(3000);
  
  let gm = await page.evaluate(() => GM);
  console.log(`Game mode: ${gm}`);
  
  // Manual driving with better steering
  // Track: goes east first, then curves right (south), then curves left (west), then curves right (north) back
  console.log('\n=== Phase 1: straight east ===');
  await page.keyboard.down('ArrowUp');
  await sleep(1500); // ~42 units, should be around x=30, still straight
  let s = await page.evaluate(() => ({ x: KS.x.toFixed(1), z: KS.z.toFixed(1), spd: KS.spd.toFixed(1), onTrk: KS.onTrk }));
  console.log(`After straight: x=${s.x} z=${s.z} spd=${s.spd} onTrk=${s.onTrk}`);
  
  console.log('\n=== Phase 2: curve right (track bends south) ===');
  await page.keyboard.down('ArrowRight');
  await sleep(3000);
  s = await page.evaluate(() => ({ x: KS.x.toFixed(1), z: KS.z.toFixed(1), spd: KS.spd.toFixed(1), onTrk: KS.onTrk }));
  console.log(`After right: x=${s.x} z=${s.z} spd=${s.spd} onTrk=${s.onTrk}`);
  
  console.log('\n=== Phase 3: curve left (track bends west) ===');
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowLeft');
  await sleep(3000);
  s = await page.evaluate(() => ({ x: KS.x.toFixed(1), z: KS.z.toFixed(1), spd: KS.spd.toFixed(1), onTrk: KS.onTrk }));
  console.log(`After left: x=${s.x} z=${s.z} spd=${s.spd} onTrk=${s.onTrk}`);
  
  console.log('\n=== Phase 4: curve right again (track curves north) ===');
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('ArrowRight');
  await sleep(4000);
  s = await page.evaluate(() => ({ x: KS.x.toFixed(1), z: KS.z.toFixed(1), spd: KS.spd.toFixed(1), onTrk: KS.onTrk }));
  console.log(`After right again: x=${s.x} z=${s.z} spd=${s.spd} onTrk=${s.onTrk}`);
  
  let final = await page.evaluate(() => ({
    x: KS.x.toFixed(2), z: KS.z.toFixed(2), spd: KS.spd.toFixed(1),
    lap: lap, gm: GM, finished: finished
  }));
  console.log(`\nFinal: ${JSON.stringify(final)}`);
  
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ArrowRight');
  
  // Test results screen
  if (final.finished) {
    console.log('\n=== Checking results screen ===');
    let rs = await page.evaluate(() => document.getElementById('rs').style.display);
    let rt = await page.evaluate(() => document.getElementById('rt').textContent);
    let rsp = await page.evaluate(() => document.getElementById('rsp').textContent);
    console.log(`Results screen visible: ${rs !== 'none'}`);
    console.log(`Race time: ${rt}`);
    console.log(`Top speed: ${rsp}`);
    
    // Test menu button
    console.log('\n=== Testing menu button ===');
    await page.click('button:has-text("MAIN MENU")');
    let title = await page.evaluate(() => document.getElementById('title').style.display);
    console.log(`Title screen visible: ${title !== 'none'}`);
  }
  
  await browser.close();
  console.log('\nDone!');
})().catch(e => { console.error(e); process.exit(1); });
