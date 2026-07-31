const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({executablePath:'/home/qg/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome'});
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  await page.goto('http://localhost:8766/');
  await page.waitForTimeout(3000);
  // 1: Initial
  await page.screenshot({path:'screenshots/01_initial.png'});
  console.log('1: Initial');
  // Click demo
  await page.click('#bde');
  await page.waitForTimeout(2000);
  // 2: Countdown
  await page.screenshot({path:'screenshots/02_countdown.png'});
  console.log('2: Countdown');
  await page.waitForTimeout(4000);
  // 3: Demo racing start
  await page.screenshot({path:'screenshots/03_demo_start.png'});
  console.log('3: Demo start');
  await page.waitForTimeout(6000);
  // 4: Demo mid-track
  await page.screenshot({path:'screenshots/04_demo_mid.png'});
  console.log('4: Demo mid');
  await page.waitForTimeout(8000);
  // 5: Demo progressing
  await page.screenshot({path:'screenshots/05_demo_prog.png'});
  console.log('5: Demo progressing');
  await page.waitForTimeout(12000);
  // 6: Demo near finish
  await page.screenshot({path:'screenshots/06_demo_finish.png'});
  console.log('6: Demo finish');
  // Wait for finish message
  await page.waitForTimeout(3000);
  // 7: Finish state
  await page.screenshot({path:'screenshots/07_finished.png'});
  console.log('7: Finished');
  // 8: Reset and show player mode
  await page.click('#bre');
  await page.waitForTimeout(1000);
  await page.screenshot({path:'screenshots/08_player_ready.png'});
  console.log('8: Player ready');
  await browser.close();
})();