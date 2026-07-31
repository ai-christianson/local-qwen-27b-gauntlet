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
  
  // Start demo mode
  console.log('Starting DEMO mode...');
  await page.click('button:has-text("DEMO MODE")');
  await sleep(3000);
  
  let gm = await page.evaluate(() => GM);
  console.log(`Game mode: ${gm}`);
  
  // Watch AI drive for 30 seconds
  console.log('\n=== Watching AI drive ===');
  for (let i = 1; i <= 10; i++) {
    await sleep(3000);
    let s = await page.evaluate(() => ({
      x: KS.x.toFixed(1), z: KS.z.toFixed(1),
      spd: KS.spd.toFixed(1), onTrk: KS.onTrk,
      h: KS.h.toFixed(2), lap: lap, gm: GM
    }));
    console.log(`t=${(i*3).toString().padStart(2,' ')}s: x=${s.x} z=${s.z} spd=${s.spd} onTrk=${s.onTrk} h=${s.h} lap=${s.lap} gm=${s.gm}`);
    if (s.gm !== 'demo') break;
  }
  
  let final = await page.evaluate(() => ({
    x: KS.x.toFixed(2), z: KS.z.toFixed(2), spd: KS.spd.toFixed(1),
    lap: lap, gm: GM, finished: finished
  }));
  console.log(`\nFinal: ${JSON.stringify(final)}`);
  
  await browser.close();
  console.log('\nDone!');
})().catch(e => { console.error(e); process.exit(1); });
