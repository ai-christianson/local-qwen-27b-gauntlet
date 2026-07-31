const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({executablePath:'/home/qg/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome'});
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  
  // Capture console and errors
  page.on('console',msg=>console.log('BROWSER:',msg.type(),msg.text()));
  page.on('pageerror',err=>console.log('ERROR:',err.message));
  
  await page.goto('http://localhost:8766/');
  await page.waitForTimeout(5000);
  
  // Check if canvas has content
  const canvasContent = await page.evaluate(()=>{
    const c=document.querySelector('canvas');
    if(!c)return'no canvas';
    const ctx=c.getContext('webgl');
    if(!ctx)return'no webgl context';
    // Check if we can get rendering info
    const info=ctx.getExtension('WEBGL_debug_renderer_info');
    return canvasContent||'has canvas';
  });
  console.log('Canvas:',canvasContent);
  
  await page.screenshot({path:'screenshots/debug.png'});
  console.log('Debug screenshot taken');
  
  await browser.close();
})();