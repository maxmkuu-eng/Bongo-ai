import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE = 'https://amendment-windy-horse.abasthan.app';
const STORAGE_KEY = 'bongo-ai-chat-v1';
const suggestions = [
  { icon: '✦', text: 'Nisaidie kuelewa jambo fulani' },
  { icon: '⌁', text: 'Andika wazo la ubunifu' },
  { icon: '◈', text: 'Nifafanulie kwa ufupi' },
];
type Message = { role: 'user' | 'ai'; text: string; image?: string };

async function compressImage(file: File): Promise<{ dataUrl: string; mimeType: string }> {
  const bitmap = await createImageBitmap(file);
  const maxDimension = 1024;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Imeshindikana kuandaa picha.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Keep the JSON request comfortably below common reverse-proxy limits.
  const targetBytes = 700 * 1024;
  let quality = 0.72;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > targetBytes * 1.37 && quality > 0.25) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrl.length > targetBytes * 1.37) {
    throw new Error('Picha hii haiwezi kubanwa vya kutosha. Tafadhali chagua picha nyingine.');
  }
  return { dataUrl, mimeType: 'image/jpeg' };
}

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => { try { const saved=localStorage.getItem(STORAGE_KEY); const parsed=saved?JSON.parse(saved):[]; return Array.isArray(parsed)?parsed:[]; } catch { return []; } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [imageData, setImageData] = useState('');
  const [imageMime, setImageMime] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {} }, [messages]);

  async function chooseImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0]; if(!file) return;
    if(!file.type.startsWith('image/')) { setError('Tafadhali chagua picha.'); return; }
    if(file.size>20*1024*1024) { setError('Picha ni kubwa sana. Tumia picha isiyozidi 20 MB.'); return; }
    try {
      setError('');
      const compressed = await compressImage(file);
      setImageData(compressed.dataUrl);
      setImagePreview(compressed.dataUrl);
      setImageMime(compressed.mimeType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Imeshindikana kuandaa picha.');
    }
    e.target.value='';
  }
  function openImagePicker(){ fileRef.current?.click(); }
  function removeImage(){ setImageData(''); setImagePreview(''); setImageMime(''); }

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault(); const text=message.trim() || (imageData ? 'Eleza picha hii kwa undani.' : ''); if(!text||loading)return;
    const attachedImage=imagePreview; setMessages(prev=>[...prev,{role:'user',text,image:attachedImage||undefined}]); setMessage(''); setLoading(true); setError(''); setCopied(false);
    try {
      const endpoint=imageData ? '/api/vision' : '/api/chat';
      const payload=imageData ? {message:text,imageData,mimeType:imageMime} : {message:text};
      const response=await fetch(`${API_BASE}${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const contentType=response.headers.get('content-type')||''; const data=contentType.includes('application/json')?await response.json():{error:`Server returned ${response.status} ${response.statusText}`};
      if(!response.ok)throw new Error(data.error||'Request failed');
      setMessages(prev=>[...prev,{role:'ai',text:data.text||''}]); removeImage();
    } catch(err){ setError(err instanceof Error?err.message:'Something went wrong.'); }
    finally{setLoading(false);}
  }
  function newChat(){setMessages([]);setError('');setMessage('');setCopied(false);removeImage();try{localStorage.removeItem(STORAGE_KEY);}catch{}}
  async function copyLast(){const last=[...messages].reverse().find(m=>m.role==='ai');if(!last)return;try{await navigator.clipboard.writeText(last.text);setCopied(true);setTimeout(()=>setCopied(false),1400);}catch{}}
  const started=messages.length>0||loading||!!error;

  return <main className="app"><div className="ambient ambient-one"/><div className="ambient ambient-two"/><section className={`shell ${started?'chat-mode':''}`}>
    <header className="topbar"><button className="brand-mark brand-button" type="button" onClick={newChat} aria-label="BONGO AI home"><div className="brand-orb">B</div><div><strong>BONGO</strong><span>AI</span></div></button><div className="top-actions"><div className="online"><i/> Online</div>{started&&<button className="new-chat" onClick={newChat} type="button">＋ New chat</button>}</div></header>
    {!started?<><div className="hero"><div className="eyebrow"><span>✦</span> BONGO AI</div><h1>Habari, <em>karibu.</em></h1><p className="tagline">Msaidizi wako wa akili wa kizazi kipya.</p><p className="intro">Uliza swali, eleza unachohitaji, au tuma picha.</p></div><div className="suggestions">{suggestions.map(item=><button key={item.text} type="button" onClick={()=>setMessage(item.text)}><span>{item.icon}</span>{item.text}<b>›</b></button>)}</div></>:<div className="conversation">{messages.map((item,index)=><article key={`${item.role}-${index}`} className={`message ${item.role}`}><div className="message-avatar">{item.role==='ai'?'B':'M'}</div><div className="message-body"><div className="message-name">{item.role==='ai'?'BONGO AI':'Wewe'}</div>{item.image&&<img className="message-image" src={item.image} alt="Picha iliyotumwa"/>}<p>{item.text}</p></div></article>)}{loading&&<article className="message ai"><div className="message-avatar">B</div><div className="message-body"><div className="message-name">BONGO AI</div><div className="thinking"><span/><span/><span/> Inachambua...</div></div></article>}{error&&<div className="error-card">{error}</div>}{messages.some(m=>m.role==='ai')&&!loading&&<button className="copy-btn" type="button" onClick={copyLast}>{copied?'✓ Imenakili':'⧉ Nakili jibu la mwisho'}</button>}</div>}
    {imagePreview&&<div className="attachment-preview"><img src={imagePreview} alt="Preview ya picha"/><div><strong>Picha imeambatanishwa</strong><span>BONGO AI itaichambua</span></div><button type="button" onClick={removeImage} aria-label="Ondoa picha">×</button></div>}
    <form onSubmit={sendMessage} className="composer">
      <input ref={fileRef} id="bongo-image-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={chooseImage} hidden aria-label="Chagua picha" />
      <label className="composer-icon attach" htmlFor="bongo-image-input" role="button" tabIndex={0} aria-label="Ambatanisha picha" onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openImagePicker();}}}>＋</label>
      <input value={message} onChange={e=>setMessage(e.target.value)} placeholder={imageData?'Uliza kuhusu picha hii...':'Muulize BONGO AI chochote...'} aria-label="Andika ujumbe"/>
      <button className="send" disabled={loading||(!message.trim()&&!imageData)} aria-label="Tuma ujumbe">{loading?'…':'↑'}</button>
    </form>
    <div className="hint">Tuma picha ili BONGO AI ichambue na kujibu maswali kuhusu picha hiyo.</div>
  </section></main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
