const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  
  // Capture console messages
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    logs.push(`[pageerror] ${err.message}`);
  });
  
  const filePath = 'file://' + process.cwd() + '/index.html';
  console.log('Loading:', filePath);
  
  try {
    await page.goto(filePath, { waitUntil: 'load', timeout: 15000 });
  } catch(e) {
    console.log('Navigation error:', e.message);
    await browser.close();
    return;
  }
  
  // Wait for loading to disappear
  await page.waitForSelector('#loading', { hidden: true, timeout: 10000 }).catch(() => {
    console.log('Loading element not found or timed out');
  });
  
  console.log('Game loaded. Checking initial state...');
  const initialCP = await page.$eval('#cp-display', el => el.textContent);
  const initialTime = await page.$eval('#timer', el => el.textContent);
  console.log(`Initial: ${initialCP}, ${initialTime}`);
  
  // Click the DEMO button
  await page.click('#demo-btn');
  console.log('Clicked DEMO button');
  
  const btnText = await page.$eval('#demo-btn', el => el.textContent);
  console.log(`Button text: ${btnText}`);
  
  // Wait for demo to play - the demo sequence totals about 30 seconds
  // Let's wait 40 seconds to be safe
  console.log('Waiting for demo to play (up to 50s)...');
  await new Promise(resolve => setTimeout(resolve, 50000));
  
  // Check game state
  const cpDisplay = await page.$eval('#cp-display', el => el.textContent);
  const timerDisplay = await page.$eval('#timer', el => el.textContent);
  const btnText2 = await page.$eval('#demo-btn', el => el.textContent);
  
  // Check if message is visible
  const msgVisible = await page.$eval('#message', el => window.getComputedStyle(el).display !== 'none');
  
  console.log('\n--- Results ---');
  console.log(`CP: ${cpDisplay}`);
  console.log(`Time: ${timerDisplay}`);
  console.log(`Button: ${btnText2}`);
  console.log(`Course Clear visible: ${msgVisible}`);
  
  // Get player position
  const playerPos = await page.evaluate(() => {
    if (typeof P !== 'undefined') {
      return { x: P.pos.x, y: P.pos.y, z: P.pos.z, onGround: P.onGround };
    }
    return null;
  });
  console.log(`Player pos: ${JSON.stringify(playerPos)}`);
  
  // Check if finished
  const finished = await page.evaluate(() => {
    if (typeof G !== 'undefined') return G.finished;
    return false;
  });
  console.log(`Game finished: ${finished}`);
  
  // Check respawn count
  const cps = await page.evaluate(() => {
    if (typeof cps !== 'undefined') {
      return cps.map((cp, i) => ({ id: cp.id, cleared: cp.cleared, x: cp.x, y: cp.y, z: cp.z }));
    }
    return null;
  });
  console.log(`Checkpoints: ${JSON.stringify(cps)}`);
  
  if (logs.length > 0) {
    console.log('\n--- Console logs ---');
    logs.forEach(l => console.log(l));
  } else {
    console.log('\nNo console logs');
  }
  
  // Check for JS errors
  const errors = logs.filter(l => l.startsWith('[error]') || l.startsWith('[pageerror]'));
  if (errors.length > 0) {
    console.log('\n--- Errors ---');
    errors.forEach(e => console.log(e));
  }
  
  // Now test manual play - press R to restart, then try WASD + jump
  console.log('\n--- Testing manual restart ---');
  await page.keyboard.press('r');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const btnText3 = await page.$eval('#demo-btn', el => el.textContent);
  console.log(`Button after R: ${btnText3}`);
  
  // Try playing: move forward, jump, move forward
  await page.keyboard.down('KeyW');
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.keyboard.press('Space');
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.keyboard.up('KeyW');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const cpAfterPlay = await page.$eval('#cp-display', el => el.textContent);
  const playerPos2 = await page.evaluate(() => {
    if (typeof P !== 'undefined') {
      return { x: P.pos.x, y: P.pos.y, z: P.pos.z, onGround: P.onGround };
    }
    return null;
  });
  console.log(`After manual play: ${cpAfterPlay}, pos: ${JSON.stringify(playerPos2)}`);
  
  // Test if DEMO button text toggles properly  
  console.log('\n--- Testing DEMO toggle ---');
  await page.click('#demo-btn');
  const btnText4 = await page.$eval('#demo-btn', el => el.textContent);
  console.log(`Button after second DEMO click: ${btnText4}`);
  
  await page.click('#demo-btn');
  const btnText5 = await page.$eval('#demo-btn', el => el.textContent);
  console.log(`Button after third DEMO click: ${btnText5}`);
  
  await browser.close();
})();