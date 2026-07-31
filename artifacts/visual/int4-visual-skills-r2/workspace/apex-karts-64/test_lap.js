const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runLapTest() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  // Capture console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.error(`[BROWSER ERROR] ${err.message}`);
  });

  console.log('Loading game...');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await sleep(4000);
  
  console.log('Clicking START RACE...');
  await page.click('button:has-text("START RACE")');
  await sleep(6000); // countdown
  
  // Check game state
  let state = await page.evaluate(() => GM);
  console.log(`Game state after countdown: ${state}`);
  
  // Check kart position
  let kartInfo = await page.evaluate(() => ({
    x: KS.x, z: KS.z, y: KS.y, h: KS.h, spd: KS.spd,
    onTrk: KS.onTrk
  }));
  console.log(`Initial kart: x=${kartInfo.x.toFixed(2)} z=${kartInfo.z.toFixed(2)} h=${kartInfo.h.toFixed(2)} spd=${kartInfo.spd.toFixed(2)} onTrk=${kartInfo.onTrk}`);
  
  // Check track direction at start
  let trackDir = await page.evaluate(() => {
    var dx = TP[1].x - TP[0].x, dz = TP[1].z - TP[0].z;
    return { dx, dz, dir: Math.atan2(dx, dz) };
  });
  console.log(`Track direction at start: dx=${trackDir.dx} dz=${trackDir.dz} dir=${trackDir.dir.toFixed(2)}`);
  
  // Drive forward for a bit
  console.log('Driving forward...');
  await page.keyboard.down('ArrowUp');
  await sleep(3000);
  
  kartInfo = await page.evaluate(() => ({
    x: KS.x, z: KS.z, spd: KS.spd, h: KS.h, onTrk: KS.onTrk
  }));
  console.log(`After 3s forward: x=${kartInfo.x.toFixed(2)} z=${kartInfo.z.toFixed(2)} spd=${kartInfo.spd.toFixed(2)} h=${kartInfo.h.toFixed(2)} onTrk=${kartInfo.onTrk}`);
  
  // Check track waypoints to understand the route
  let trackInfo = await page.evaluate(() => {
    let result = [];
    for (let i = 0; i < TP.length; i += 100) {
      result.push({ idx: i, x: TP[i].x, z: TP[i].z });
    }
    // Check checkpoint positions
    let cps = CPS.map((c, i) => ({ idx: i, x: c.x, z: c.z, passed: c.passed }));
    return { waypoints: result, checkpoints: cps };
  });
  console.log('Track waypoints:', JSON.stringify(trackInfo.waypoints));
  console.log('Checkpoints:', JSON.stringify(trackInfo.checkpoints));
  
  // Try to follow the track
  await page.keyboard.up('ArrowUp');
  
  // The track starts going east (positive X), then curves right (toward positive Z)
  // Let's try: gas + right turn
  console.log('Steering right + gas...');
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ArrowRight');
  await sleep(4000);
  
  kartInfo = await page.evaluate(() => ({
    x: KS.x, z: KS.z, spd: KS.spd, h: KS.h, onTrk: KS.onTrk
  }));
  console.log(`After right turn: x=${kartInfo.x.toFixed(2)} z=${KS.z.toFixed ? KS.z.toFixed(2) : kartInfo.z.toFixed(2)} spd=${kartInfo.spd.toFixed(2)} h=${kartInfo.h.toFixed(2)} onTrk=${kartInfo.onTrk}`);
  
  state = await page.evaluate(() => GM);
  console.log(`Game state: ${state}`);
  
  // Check lap
  let lap = await page.evaluate(() => lap);
  console.log(`Lap: ${lap}`);
  
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ArrowRight');
  
  await browser.close();
  console.log('Test complete!');
}

runLapTest().catch(e => { console.error(e); process.exit(1); });
