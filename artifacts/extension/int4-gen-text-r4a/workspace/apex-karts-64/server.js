const http=require('http'),fs=require('fs'),path=require('path');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css'};
http.createServer((req,res)=>{
  let f=req.url==='/'?'/index.html':req.url;
  let ext=path.extname(f);
  try{const d=fs.readFileSync(__dirname+f);res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream'});res.end(d)}
  catch(e){res.writeHead(404);res.end('Not found')}
}).listen(8080,()=>console.log('Server running on http://localhost:8080'))