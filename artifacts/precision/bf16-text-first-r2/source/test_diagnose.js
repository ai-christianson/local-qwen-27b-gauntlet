const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  
  console.log('Loading game...');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Start demo mode  
  await page.click('button:has-text("DEMO MODE")');
  await page.waitForTimeout(5000); // Wait for countdown
  
  // Dump state after countdown
  console.log('\n=== STATE AFTER COUNTDOWN ===');
  const s1 = await page.evaluate(() => ({
    GM, lap, KS_x: KS.x.toFixed(3), KS_z: KS.z.toFixed(3), KS_h: KS.h.toFixed(4),
    KS_spd: KS.spd.toFixed(3), CPS_passed: CPS.map(c => c.passed)
  }));
  console.log(JSON.stringify(s1));
  
  // Let it run for 10 seconds
  await page.waitForTimeout(10000);
  
  console.log('\n=== STATE AFTER 10s ===');
  const s2 = await page.evaluate(() => ({
    GM, lap, KS_x: KS.x.toFixed(3), KS_z: KS.z.toFixed(3), KS_h: KS.h.toFixed(4),
    KS_spd: KS.spd.toFixed(3), onTrk: KS.onTrk,
    CPS_passed: CPS.map(c => c.passed)
  }));
  console.log(JSON.stringify(s2));
  
  // Now test manual control - go to menu first
  await page.evaluate(() => doMenu());
  await page.waitForTimeout(1000);
  
  // Start a real race with keyboard
  await page.click('button:has-text("START RACE")');
  await page.waitForTimeout(5000);
  
  console.log('\n=== STATE AFTER MANUAL START ===');
  const s3 = await page.evaluate(() => ({
    GM, lap, KS_spd: KS.spd.toFixed(3)
  }));
  console.log(JSON.stringify(s3));
  
  // Press gas
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(3000);
  
  console.log('\n=== STATE AFTER 3s GAS ===');
  const s4 = await page.evaluate(() => ({
    GM, KS_x: KS.x.toFixed(3), KS_z: KS.z.toFixed(3),
    KS_spd: KS.spd.toFixed(3), onTrk: KS.onTrk,
    CPS_passed: CPS.map(c => c.passed)
  }));
  console.log(JSON.stringify(s4));
  
  // Test the countdown issue - inject console log
  await page.evaluate(() => {
    // Override doCountdown to log
    var orig_doCountdown = doCountdown;
    doCountdown = function(cb) {
      console.log('COUNTDOWN: starting');
      var el = document.getElementById('cd');
      el.style.display = 'block';
      GM = 'countdown';
      cdPhase = 0;
      cdTimer = 0;
      var words = ['3','2','1','GO!'];
      function tick() {
        if(GM !== 'countdown') { console.log('COUNTDOWN: aborted'); return; }
        cdTimer += 0.016;
        console.log('COUNTDOWN tick: phase=' + cdPhase + ' timer=' + cdTimer.toFixed(3));
        if(cdPhase < 3) {
          el.textContent = words[cdPhase];
          if(cdTimer > 1) { cdTimer = 0; cdPhase++; }
        } else if(cdPhase === 3) {
          el.textContent = words[3];
          if(cdTimer > 0.8) {
            console.log('COUNTDOWN: COMPLETE');
            el.style.display = 'none';
            GM = 'racing';
            startTime = clk.getElapsedTime();
            cb();
            return;
          }
        }
        requestAnimationFrame(tick);
      }
      tick();
    };
  });
  
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(500);
  await page.evaluate(() => doMenu());
  await page.waitForTimeout(500);
  
  // Start a new race with instrumented countdown
  await page.click('button:has-text("START RACE")');
  console.log('\n=== COUNTDOWN LOG ===');
  await page.waitForTimeout(6000);
  
  const s5 = await page.evaluate(() => ({ GM }));
  console.log('\nFinal GM:', s5);
  
  await browser.close();
})().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});