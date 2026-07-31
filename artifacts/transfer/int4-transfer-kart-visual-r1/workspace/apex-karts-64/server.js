const http = require('http');
const fs = require('fs');
const mime = {'html':'text/html','js':'application/javascript','css':'text/css','json':'application/json','png':'image/png'};
const srv = http.createServer((req, res) => {
  let path = req.url === '/' ? 'index.html' : req.url.slice(1);
  try {
    const data = fs.readFileSync(path);
    const ext = path.split('.').pop();
    res.writeHead(200, {'Content-Type': mime[ext]||'application/octet-stream'});
    res.end(data);
  } catch(e) { res.writeHead(404); res.end('not found'); }
});
srv.listen(8766);
console.log('serving on 8766');
