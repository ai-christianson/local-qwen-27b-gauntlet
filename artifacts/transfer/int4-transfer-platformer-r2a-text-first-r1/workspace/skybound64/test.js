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

    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({path: '/tmp/sb64_01_start.png'});
    console.log('1: start view');

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({path: '/tmp/sb64_02_playing.png'});
    console.log('2: playing');

    // Click demo button
    await page.click('#demo-btn');
    console.log('Demo button clicked');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({path: '/tmp/sb64_03_demo_on.png'});
    console.log('3: demo on');

    // Let demo run
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({path: '/tmp/sb64_04_demo_run1.png'});
    console.log('4: demo run 1');

    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({path: '/tmp/sb64_05_demo_run2.png'});
    console.log('5: demo run 2');

    await new Promise(r => setTimeout(r, 8000));
    await page.screenshot({path: '/tmp/sb64_06_demo_run3.png'});
    console.log('6: demo run 3');

    await new Promise(r => setTimeout(r, 8000));
    await page.screenshot({path: '/tmp/sb64_07_demo_run4.png'});
    console.log('7: demo run 4');

    await new Promise(r => setTimeout(r, 8000));
    await page.screenshot({path: '/tmp/sb64_08_demo_final.png'});
    console.log('8: demo final');

    const time = await page.$eval('#timer', el => el.textContent);
    console.log('Final time:', time);
    const msg = await page.$eval('#message', el => el.style.display).catch(() => 'none');
    console.log('Message visible:', msg !== 'none');

    await browser.close();
    console.log('DONE');
  } catch (e) {
    console.error('FAIL:', e.message);
  }
})();