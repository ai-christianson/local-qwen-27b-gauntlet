import { chromium } from 'playwright';
const fs=require('fs');
constpage=awaitchromium.launch({headless:true});
constpage=awaitbrowser.newPage({viewport:{width:1280,height:720}});

//Buildimplereplacedomdocument
consthtml=`<!DOCTYPEhtml>
<html>
<head>
<style>
body{background:#87CEEB;overflow:hidden}
canvas{display:block}
#display{position:absolute;top:0;left:0;width:100%;height:100%}
</style>
</head>
<body>
<canvas id="display"></canvas>
</body>
</html>`;

awaitpage.setContent(html);
awaitpage.waitForTimeout(2000);
awaitpage.screenshot({path:'/home/qg/workspace/apex-karts-64/screenshot1.png'});
console.log("Screenshot1taken");

awaitbrowser.close();