const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    page.on('console', m => console.log('PAGE:', m.text()));
    page.on('pageerror', e => console.error('PERR:', e.message));
    await page.setViewport({width: 1280, height: 720});
    await page.goto('http://localhost:8080/', {waitUntil: 'domcontentloaded', timeout: 30000});
    console.log('Page loaded');

    // Wait for loading to finish
    await new Promise(r => setTimeout(r, 2000));
    const loadingHidden = await page.$eval('#loading', el => el.style.display).catch(() => 'block');
    console.log('Loading hidden:', loadingHidden !== 'block');

    // Click demo button
    await page.click('#demo-btn');
    console.log('Demo button clicked');
    
    const demoBtnText = await page.$eval('#demo-btn', el => el.textContent);
    console.log('Demo button text:', demoBtnText);

    // Wait for demo to complete (total hold time ~7.5s + travel ~10s = ~17.5s max)
    // Check every 2 seconds
    let demoFinished = false;
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const msgDisplay = await page.$eval('#message', el => el.style.display);
      const timerVal = await page.$eval('#timer', el => el.textContent);
      const playerPos = await page.evaluate(() => ({
        x: player ? player.position.x.toFixed(2) : 'null',
        y: player ? player.position.y.toFixed(2) : 'null',
        z: player ? player.position.z.toFixed(2) : 'null',
        grounded: PS.grounded
      }));
      console.log(`T+${(i+1)*2}s: msg=${msgDisplay} timer=${timerVal} pos=${JSON.stringify(playerPos)}`);
      if (msgDisplay !== 'none') {
        demoFinished = true;
        break;
      }
    }

    // Final state
    const msgDisplay = await page.$eval('#message', el => el.style.display);
    const timerVal = await page.$eval('#timer', el => el.textContent);
    const cp1Active = await page.$eval('#cp1', el => el.classList.contains('active')).catch(() => false);
    const cp2Active = await page.$eval('#cp2', el => el.classList.contains('active')).catch(() => false);
    const cp3Active = await page.$eval('#cp3', el => el.classList.contains('active')).catch(() => false);
    const playerPos = await page.evaluate(() => ({
      x: player ? player.position.x.toFixed(2) : 'null',
      y: player ? player.position.y.toFixed(2) : 'null',
      z: player ? player.position.z.toFixed(2) : 'null',
      grounded: PS.grounded
    }));

    console.log('======================');
    console.log('FINAL STATE:');
    console.log('  Message visible:', msgDisplay !== 'none');
    console.log('  Timer:', timerVal);
    console.log('  CP1:', cp1Active, 'CP2:', cp2Active, 'CP3:', cp3Active);
    console.log('  Player pos:', JSON.stringify(playerPos));
    console.log('  Demo completed:', demoFinished ? 'YES' : 'NO');
    console.log('======================');

    await browser.close();
    process.exit(demoFinished ? 0 : 1);
  } catch (e) {
    console.error('FAIL:', e.message);
    process.exit(1);
  }
})();