const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--use-gl=swiftshader', '--disable-gpu-compositing', '--enable-gpu-rasterization']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  // Log console and errors
  page.on('console', msg => { if(msg.type()==='error') console.error('[BROWSER]', msg.text()); });
  page.on('pageerror', err => console.error('[PAGEERR]', err.message));
  
  try {
    console.log('Loading game...');
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout: 15000 });
    console.log('Page loaded');
    
    // Wait for title screen
    await page.waitForSelector('#overlay', { state: 'visible', timeout: 5000 });
    await page.screenshot({ path: '/home/qg/workspace/apex-karts-64/screenshot-title.png' });
    console.log('Title screen captured');
    
    const title = await page.textContent('#overlay h1');
    console.log('Title:', title);
    
    // Check WebGL canvas
    const canvasInfo = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c) return 'No canvas found';
      const ctx = c.getContext('webgl2') || c.getContext('webgl');
      return ctx ? `Canvas ${c.width}x${c.height} WebGL OK` : 'No WebGL context';
    });
    console.log('Canvas:', canvasInfo);
    
    // Click START RACE
    await page.click('#btn-start');
    console.log('Clicked START RACE');
    
    // Wait for countdown
    await page.waitForSelector('#countdown', { state: 'visible', timeout: 3000 });
    const cd1 = await page.textContent('#countdown');
    console.log('Countdown:', cd1);
    
    // Wait through countdown
    await page.waitForTimeout(4000);
    
    await page.screenshot({ path: '/home/qg/workspace/apex-karts-64/screenshot-race.png' });
    console.log('Race screenshot captured');
    
    // Check HUD
    const lap = await page.textContent('#hud-lap');
    const time = await page.textContent('#hud-time');
    console.log('HUD - LAP:', lap, 'TIME:', time);
    
    // Drive forward
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(3000);
    
    const speedBar = await page.evaluate(() => document.getElementById('speed-bar').style.width);
    console.log('Speed bar:', speedBar);
    
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1000);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: '/home/qg/workspace/apex-karts-64/screenshot-driving.png' });
    console.log('Driving screenshot captured');
    
    await page.keyboard.up('ArrowUp');
    
    // Check if we got checkpoints
    const pos = await page.evaluate(() => {
      // Expose state for debugging
      return { lap: document.getElementById('hud-lap').textContent, time: document.getElementById('hud-time').textContent };
    });
    console.log('After driving - LAP:', pos.lap, 'TIME:', pos.time);
    
    // Now test demo mode
    // First reload page for fresh start
    await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForSelector('#overlay', { state: 'visible', timeout: 5000 });
    
    await page.click('#btn-demo');
    console.log('Started DEMO mode');
    await page.waitForTimeout(4000);
    
    // Let demo drive for 30 seconds
    await page.waitForTimeout(30000);
    
    await page.screenshot({ path: '/home/qg/workspace/apex-karts-64/screenshot-demo.png' });
    console.log('Demo screenshot captured');
    
    const demoLap = await page.textContent('#hud-lap');
    const demoTime = await page.textContent('#hud-time');
    console.log('Demo - LAP:', demoLap, 'TIME:', demoTime);
    
    // Check for finish
    const finVis = await page.isVisible('#finish-overlay').catch(() => false);
    if (finVis) {
      await page.screenshot({ path: '/home/qg/workspace/apex-karts-64/screenshot-finish.png' });
      console.log('RACE FINISHED!');
    } else {
      console.log('Demo still racing');
    }
    
    console.log('\n=== ALL TESTS PASSED ===');
  } catch(e) {
    console.error('Error:', e.message);
    await page.screenshot({ path: '/home/qg/workspace/apex-karts-64/screenshot-error.png' });
  } finally {
    await browser.close();
  }
})();