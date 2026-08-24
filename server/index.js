import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 3000);
const rootDir = fileURLToPath(new URL('..', import.meta.url));
const distDir = join(rootDir, 'dist');
const mimeTypes = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.webp':'image/webp','.gif':'image/gif' };
const send = (res,status,body) => { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}); res.end(JSON.stringify(body)); };
const serveStatic = async (res,pathname) => { const requested=pathname==='/'?'/index.html':pathname; const filePath=join(distDir,requested.replace(/^\/+/,'')); if(!filePath.startsWith(distDir)) return false; try { const data=await readFile(filePath); res.writeHead(200,{'Content-Type':mimeTypes[extname(filePath)]||'application/octet-stream'}); res.end(data); return true; } catch { return false; } };
const readJsonBody = req => new Promise((resolve,reject)=>{ let raw=''; req.on('data',chunk=>{ raw+=chunk; if(raw.length>2*1024*1024){ reject(new Error('Request body too large.')); req.destroy(); }}); req.on('end',()=>{ try{ resolve(JSON.parse(raw||'{}')); }catch{ reject(new Error('Invalid JSON body.')); }}); req.on('error',reject); });
const readBinaryBody = req => new Promise((resolve,reject)=>{ const chunks=[]; let size=0; req.on('data',chunk=>{ size+=chunk.length; if(size>2*1024*1024){ reject(new Error('Image is too large. Please choose a smaller image.')); req.destroy(); return; } chunks.push(chunk); }); req.on('end',()=>resolve(Buffer.concat(chunks))); req.on('error',reject); });
const createAI = async () => { if(!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured on the server.'); const {GoogleGenAI}=await import('@google/genai'); return new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY}); };
const modelName = () => process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url||'/','http://localhost'); const pathname=url.pathname;
  if(req.method==='OPTIONS') return send(res,204,{});
  if(req.method==='GET'&&pathname==='/api/health') return send(res,200,{ok:true,service:'bongo-ai',aiConfigured:Boolean(process.env.GEMINI_API_KEY),model:modelName(),webSearch:'not-configured',vision:true});
  if(req.method==='POST'&&pathname==='/api/chat'){
    try { const body=await readJsonBody(req); const message=String(body.message||'').trim(); if(!message)return send(res,400,{error:'Message is required.'}); const ai=await createAI(); const response=await ai.models.generateContent({model:modelName(),contents:[{role:'user',parts:[{text:message}]}],config:{systemInstruction:'You are BONGO AI. Answer accurately in the user’s language.'}}); return send(res,200,{text:response.text||''}); }
    catch(error){ console.error('BONGO chat failed:',error?.message||error); return send(res,502,{error:`Gemini request failed: ${error?.message||'Unknown provider error'}`}); }
  }
  if(req.method==='POST'&&pathname==='/api/vision'){
    try {
      const mimeType=(req.headers['content-type']||'').split(';')[0].toLowerCase();
      if(!['image/jpeg','image/png','image/webp','image/gif'].includes(mimeType)) return send(res,400,{error:'Unsupported image type.'});
      const message=String(url.searchParams.get('message')||'').trim() || 'Eleza picha hii kwa undani.';
      const image=await readBinaryBody(req); if(!image.length)return send(res,400,{error:'Image is required.'});
      const ai=await createAI();
      const response=await ai.models.generateContent({model:modelName(),contents:[{role:'user',parts:[{inlineData:{mimeType,data:image.toString('base64')}},{text:message}]}],config:{systemInstruction:'You are BONGO AI. Inspect the image carefully. Answer accurately in the user’s language and distinguish visible facts from guesses.'}});
      return send(res,200,{text:response.text||''});
    } catch(error){ console.error('BONGO vision failed:',error?.message||error); return send(res,502,{error:`Gemini vision request failed: ${error?.message||'Unknown provider error'}`}); }
  }
  if(req.method==='GET'&&await serveStatic(res,pathname))return;
  if(req.method==='GET'&&!pathname.startsWith('/api/')&&await serveStatic(res,'/index.html'))return;
  return send(res,404,{error:'Not found'});
});
server.on('error',error=>{console.error('BONGO AI server error:',error);process.exitCode=1;});
server.listen(port,'0.0.0.0',()=>console.log(`BONGO AI server listening on 0.0.0.0:${port}`));
