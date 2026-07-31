import { chromium } from 'playwright';

(async()=>{
  const b=await chromium.launch({headless:true});
  const p=await b.newPage();
  const logs=[];
  p.on('console',m=>logs.push(m.text()));
  p.on('pageerror',e=>logs.push('ERROR: '+e.message));
  
  await p.goto('http://localhost:3000');
  await p.waitForTimeout(3000);
  console.log('Console:',logs.filter(l=>l.includes('error')||l.includes('Error')||l.includes('fail')).join('; '));
  if(!logs.some(l=>l.includes('error')||l.includes('Error')))console.log('No errors detected');
  
  // Screenshot menu
  await p.screenshot({path:'/tmp/menu.png'});
  console.log('Menu screenshot saved');
  
  // Click DEMO MODE
  await p.click('#btn-demo');
  await p.waitForTimeout(5000);
  
  const hud=await p.evaluate(()=>({
    lap:document.getElementById('lap-value')?.textContent,
    speed:document.getElementById('speed-value')?.textContent,
    time:document.getElementById('timer-value')?.textContent,
    pos:document.getElementById('pos-value')?.textContent,
    cd:document.getElementById('cd')?.textContent
  }));
  console.log('After start:',JSON.stringify(hud));
  
  await p.screenshot({path:'/tmp/racing.png'});
  console.log('Racing screenshot saved');
  
  // Wait for more racing
  await p.waitForTimeout(20000);
  
  const hud2=await p.evaluate(()=>({
    lap:document.getElementById('lap-value')?.textContent,
    speed:document.getElementById('speed-value')?.textContent,
    time:document.getElementById('timer-value')?.textContent,
    pos:document.getElementById('pos-value')?.textContent,
    overlay:document.getElementById('ov')?.classList?.contains('h')
  }));
  console.log('After 20s:',JSON.stringify(hud2));
  await p.screenshot({path:'/tmp/racing2.png'});
  console.log('Racing2 screenshot saved');
  
  await b.close();
  console.log('Done');
})().catch(e=>console.error(e));