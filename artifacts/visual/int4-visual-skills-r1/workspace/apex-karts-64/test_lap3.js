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
  
  // Simple lap attempt: just hold gas+right
  // The track is mostly a right-curving loop
  console.log('\n=== Holding gas+right for full lap ===');
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ArrowRight');
  
  // Check every 3 seconds for 45 seconds
  for (let i = 1; i <= 15; i++) {
    await sleep(3000);
    let s = await page.evaluate(() => ({
      x: KS.x.toFixed(1), z: KS.z.toFixed(1),
      spd: KS.spd.toFixed(1), onTrk: KS.onTrk,
      h: KS.h.toFixed(2), lap: lap, gm: GM,
      cps: CPS.map((c,idx) => ({idx, passed: c.passed}))
    }));
    console.log(`t=${(i*3).toString().padStart(2,' ')}s: x=${s.x} z=${s.z} spd=${s.spd} onTrk=${s.onTrk} h=${s.h} lap=${s.lap} gm=${s.gm} cps=[${s.cps.map(c=>c.passed?'✓':' ').join('')}]]`);
    if (s.gm === 'finished') break;
  }
  
  let final = await page.evaluate(() => ({
    x: KS.x.toFixed(2), z: KS.z.toFixed(2), spd: KS.spd.toFixed(1),
    h: KS.h.toFixed(3), onTrk: KS.onTrk,
    lap: lap, gm: GM, finished: finished
  }));
  console.log('\nFinal:', JSON.stringify(final));
  
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ArrowRight');
  
  await browser.close();
  console.log('\nDone!');
})().catch(e => { console.error(e); process.exit(1); });
