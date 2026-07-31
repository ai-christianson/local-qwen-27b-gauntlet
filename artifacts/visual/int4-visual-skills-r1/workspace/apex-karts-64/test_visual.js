const {chromium} = require('playwright');
(async()=>{
const browser=await chromium.launch();
const page=await browser.newPage();
// Set viewport
await page.setViewportSize({width:1280,height:720});
// Serve the file
const http=require('http'),fs=require('fs'),url=require('url');
const srv=http.createServer((req,res)=>{
let path=req.url==='/'?'/index.html':req.url;
let ext=path.split('.').pop().toLowerCase();
let mime='text/html';
if(ext==='css')mime='text/css';
else if(ext==='js')mime='application/javascript';
else if(ext==='png')mime='image/png';
else if(ext==='jpg')mime='image/jpeg';
try{
let content=fs.readFileSync('./'+path);
res.writeHead(200,{'Content-Type':mime});
res.end(content);
}catch(e){res.writeHead(404);res.end('Not found');}
});
await new Promise(r=>srv.listen(8765,r));
console.log('Server on 8765');

// Navigate and wait for Three.js to load
await page.goto('http://localhost:8765/');
await page.waitForTimeout(2000);

// Title screen
await page.screenshot({path:'test_title.png'});
console.log('Screenshot: title');

// Click START RACE
await page.click('button:has-text("START RACE")');
await page.waitForTimeout(3000);

// Countdown
await page.screenshot({path:'test_countdown.png'});
console.log('Screenshot: countdown');

// Hold W (gas) and start racing
await page.keyboard.down('KeyW');
await page.waitForTimeout(2000);
await page.screenshot({path:'test_racing1.png'});
console.log('Screenshot: racing1');

// Turn right
await page.keyboard.down('KeyD');
await page.waitForTimeout(1500);
await page.screenshot({path:'test_turn.png'});
console.log('Screenshot: turn');

// Drift
await page.keyboard.down('Space');
await page.waitForTimeout(1500);
await page.screenshot({path:'test_drift.png'});
console.log('Screenshot: drift');

await page.keyboard.up('Space');
await page.keyboard.up('KeyD');
await page.waitForTimeout(1000);

// Continue racing
await page.screenshot({path:'test_racing2.png'});
console.log('Screenshot: racing2');

await page.keyboard.up('KeyW');
await page.waitForTimeout(500);
await page.screenshot({path:'test_brake.png'});
console.log('Screenshot: brake');

// Check console for errors
const logs=[];
page.on('console',msg=>logs.push(msg.type()+': '+msg.text()));
page.on('pageerror',err=>logs.push('error: '+err.message));

// Check for any errors
const errors=logs.filter(l=>l.startsWith('error:')||l.startsWith('err:'));
if(errors.length>0){
console.log('Console errors:');
errors.forEach(e=>console.log('  '+e));
}else{
console.log('No console errors');
}

// Also check all logs for warnings
const warns=logs.filter(l=>l.startsWith('warn'));
if(warns.length>0){
console.log('Console warnings:');
warns.forEach(w=>console.log('  '+w));
}

await browser.close();
srv.close();
console.log('Done!');
})().catch(e=>{console.error(e);process.exit(1);});
