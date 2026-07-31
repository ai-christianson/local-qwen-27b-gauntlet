import { chromium } from 'playwright';
(async()=>{
  const b = await chromium.launch({headless:true});
  const p = await b.newPage();
  const errors = [];
  p.on('console', msg => { if(msg.type()==='error') errors.push(msg.text()); });
  p.on('pageerror', err => errors.push(err.message));
  await p.goto('http://localhost:8080/');
  await p.waitForTimeout(3000);
  await p.screenshot({path:'screenshot1.png'});
  if(errors.length > 0) console.log('Errors:', errors.join('\n'));
  else console.log('No errors');
  await b.close();
})();