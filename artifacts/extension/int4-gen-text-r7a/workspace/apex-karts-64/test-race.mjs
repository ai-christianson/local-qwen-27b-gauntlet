import { chromium } from 'playwright';
(async()=>{
  const b = await chromium.launch({headless:true});
  const p = await b.newPage();
  const errors = [];
  p.on('console', msg => { if(msg.type()==='error') errors.push(msg.text()); });
  p.on('pageerror', err => errors.push(err.message));
  
  await p.goto('http://localhost:8080/');
  await p.waitForTimeout(3000);
  
  // Start race
  await p.keyboard.press('Enter');
  await p.waitForTimeout(5000);
  await p.screenshot({path:'screenshot_race.png'});
  
  // Let the demo run for a bit
  await p.waitForTimeout(3000);
  await p.screenshot({path:'screenshot_racing.png'});
  
  // Keep racing
  await p.waitForTimeout(5000);
  await p.screenshot({path:'screenshot_racing2.png'});
  
  // Try demo mode
  await p.waitForTimeout(10000);
  await p.screenshot({path:'screenshot_late.png'});
  
  // Check errors
  await p.waitForTimeout(1000);
  if(errors.length > 0) console.log('Errors:', errors.join('\n'));
  else console.log('No errors');
  
  // Check state
  const state = await p.evaluate(() => window.state || 'unknown');
  console.log('Game state:', state);
  const lapTime = await p.evaluate(() => window.lapTime || 0);
  console.log('Lap time:', lapTime);
  const curCP = await p.evaluate(() => window.curCP || -1);
  console.log('Checkpoints hit:', curCP);
  
  await b.close();
})();