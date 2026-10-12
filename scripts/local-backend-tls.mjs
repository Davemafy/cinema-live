// Development-only TLS termination for actual local worker verification.
// Not a hosted public endpoint; no model/media substitution.
import https from 'node:https';
import http from 'node:http';
import {readFileSync} from 'node:fs';
const server=https.createServer({key:readFileSync('artifacts/backend-tls/key.pem'),cert:readFileSync('artifacts/backend-tls/cert.pem')},(req,res)=>{
 const headers={...req.headers,host:'127.0.0.1:8892'};delete headers.connection;
 const upstream=http.request({hostname:'127.0.0.1',port:8892,path:req.url,method:req.method,headers},reply=>{
  res.writeHead(reply.statusCode||502,reply.headers);reply.pipe(res);
 });
 upstream.on('error',()=>{res.writeHead(502);res.end('Worker unavailable')});
 req.pipe(upstream);
});
server.listen(9443,'::',()=>console.log('Development-only HTTPS worker proxy ready on port 9443'));
