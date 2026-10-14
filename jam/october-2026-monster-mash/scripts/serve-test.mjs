import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const root=resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm'};
createServer(async(req,res)=>{
  try {
    let path=new URL(req.url,'http://localhost').pathname;
    // Exercise nested deployment roots, as RUN serves games from subdirectories.
    if(path.startsWith('/games/night-ride/')) path=path.slice('/games/night-ride'.length);
    if(path.endsWith('/')) path+='index.html';
    const target=resolve(root,'.'+path);
    if(!target.startsWith(root+'/')) throw new Error('Outside root');
    const data=await readFile(target);
    res.writeHead(200,{'Content-Type':mime[extname(target)]??'application/octet-stream'});res.end(data);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(4173,'127.0.0.1');

