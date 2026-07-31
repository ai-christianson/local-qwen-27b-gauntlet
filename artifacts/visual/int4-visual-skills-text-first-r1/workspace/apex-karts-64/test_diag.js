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
  
  // Evaluate the physics directly
  let analysis = await page.evaluate(() => {
    // Check 1: Track waypoint density and spacing
    let spacing = [];
    for (let i = 0; i < TP.length - 1; i++) {
      let dx2 = TP[i+1].x - TP[i].x;
      let dz2 = TP[i+1].z - TP[i].z;
      spacing.push(Math.sqrt(dx2*dx2 + dz2*dz2));
    }
    let avgSpd = spacing.reduce((a,b) => a+b, 0) / spacing.length;
    let maxSpd = Math.max(...spacing);
    let minSpd = Math.min(...spacing);
    
    // Check 2: Kart start direction vs track direction
    var dx2 = TP[1].x - TP[0].x, dz2 = TP[1].z - TP[0].z;
    var trackAngle = Math.atan2(dx2, dz2);
    var kartAngle = Math.PI; // initial hardcoded heading
    
    // Check 3: nearest track point search
    let nearestSearchPoints = TP.length;
    
    // Check 4: Checkpoint spacing
    let cpSpacing = [];
    for (let i = 1; i < CPS.length; i++) {
      let dx3 = CPS[i].x - CPS[i-1].x;
      let dz3 = CPS[i].z - CPS[i-1].z;
      cpSpacing.push(Math.sqrt(dx3*dx3 + dz3*dz3));
    }
    // Last to first
    let dx3 = CPS[0].x - CPS[CPS.length-1].x;
    let dz3 = CPS[0].z - CPS[CPS.length-1].z;
    cpSpacing.push(Math.sqrt(dx3*dx3 + dz3*dz3));
    
    return {
      trackPoints: TP.length,
      spacingAvg: avgSpd.toFixed(3),
      spacingMax: maxSpd.toFixed(3),
      spacingMin: minSpd.toFixed(3),
      trackAngle: trackAngle.toFixed(3),
      kartAngle: kartAngle.toFixed(3),
      angleDiff: (trackAngle - kartAngle).toFixed(3),
      nearestSearchPoints: nearestSearchPoints,
      cpSpacing: cpSpacing.map(s => s.toFixed(2)),
      countdownPhase: cdPhase,
      countdownTimer: cdTimer,
      gameMode: GM
    };
  });
  
  console.log('=== GAME ANALYSIS ===');
  console.log('Track points:', analysis.trackPoints);
  console.log('Point spacing: avg=' + analysis.spacingAvg + ' max=' + analysis.spacingMax + ' min=' + analysis.spacingMin);
  console.log('Track direction at start:', analysis.trackAngle);
  console.log('Kart heading at start:', analysis.kartAngle);
  console.log('Angle difference:', analysis.angleDiff);
  console.log('Nearest point search:', analysis.nearestSearchPoints + ' points');
  console.log('Checkpoint spacing:', analysis.cpSpacing.join(', '));
  console.log('Game mode:', analysis.gameMode);
  
  // Click start race and wait
  console.log('\n--- Starting race ---');
  await page.click('button:has-text("START RACE")');
  
  // Check every 1s for 8 seconds
  for (let i = 1; i <= 8; i++) {
    await sleep(1000);
    let state = await page.evaluate(() => ({gm: GM, cp: cdPhase, ct: cdTimer}));
    console.log(`t=${i}s: GM=${state.gm} cdPhase=${state.cp} cdTimer=${state.ct.toFixed(2)}`);
  }
  
  // Now drive
  console.log('\n--- Driving test ---');
  await page.keyboard.down('ArrowUp');
  await sleep(2000);
  
  let kartState = await page.evaluate(() => ({
    x: KS.x, z: KS.z, spd: KS.spd, h: KS.h, onTrk: KS.onTrk,
    gm: GM
  }));
  console.log(`Kart: x=${kartState.x.toFixed(2)} z=${kartState.z.toFixed(2)} spd=${kartState.spd.toFixed(2)} h=${kartState.h.toFixed(2)} onTrk=${kartState.onTrk} GM=${kartState.gm}`);
  
  await page.keyboard.up('ArrowUp');
  await browser.close();
  console.log('\nDone!');
})().catch(e => { console.error(e); process.exit(1); });
