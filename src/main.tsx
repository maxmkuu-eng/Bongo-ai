import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE = 'https://amendment-windy-horse.abasthan.app';
const STORAGE_KEY = 'bongo-ai-chat-v1';
const suggestions = [
  { icon: '✦', text: 'Nisaidie kuelewa jambo fulani' },
  { icon: '⌁', text: 'Andika wazo la ubunifu' },
  { icon: '◈', text: 'Nifafanulie kwa ufupi' },
];
type Message = { role: 'user' | 'ai'; text: string };

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = message.trim();
    if (!text || loading) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setMessage(''); setLoading(true); setError(''); setCopied(false);
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text })
      });
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : { error: `Server returned ${response.status} ${response.statusText}` };
      if (!response.ok) throw new Error(data.error || 'Request failed');
      setMessages(prev => [...prev, { role: 'ai', text: data.text || '' }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally { setLoading(false); }
  }

  function newChat() {
    setMessages([]); setError(''); setMessage(''); setCopied(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  async function copyLast() {
    const last = [...messages].reverse().find(m => m.role === 'ai');
    if (!last) return;
    try { await navigator.clipboard.writeText(last.text); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
  }

  const started = messages.length > 0 || loading || !!error;

  return <main className="app">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <section className={`shell ${started ? 'chat-mode' : ''}`}>
      <header className="topbar">
        <button className="brand-mark brand-button" type="button" onClick={newChat} aria-label="BONGO AI home">
          <div className="brand-orb">B</div><div><strong>BONGO</strong><span>AI</span></div>
        </button>
        <div className="top-actions"><div className="online"><i /> Online</div>{started && <button className="new-chat" onClick={newChat} type="button">＋ New chat</button>}</div>
      </header>

      {!started ? <>
        <div className="hero">
          <div className="eyebrow"><span>✦</span> BONGO AI</div>
          <h1>Habari, <em>karibu.</em></h1>
          <p className="tagline">Msaidizi wako wa akili wa kizazi kipya.</p>
          <p className="intro">Uliza swali, eleza unachohitaji, au anza tu mazungumzo.</p>
        </div>
        <div className="suggestions">{suggestions.map(item => <button key={item.text} type="button" onClick={() => setMessage(item.text)}><span>{item.icon}</span>{item.text}<b>›</b></button>)}</div>
      </> : <div className="conversation">
        {messages.map((item, index) => <article key={`${item.role}-${index}`} className={`message ${item.role}`}>
          <div className="message-avatar">{item.role === 'ai' ? 'B' : 'M'}</div>
          <div className="message-body"><div className="message-name">{item.role === 'ai' ? 'BONGO AI' : 'Wewe'}</div><p>{item.text}</p></div>
        </article>)}
        {loading && <article className="message ai"><div className="message-avatar">B</div><div className="message-body"><div className="message-name">BONGO AI</div><div className="thinking"><span/><span/><span/> Inafikiri...</div></div></article>}
        {error && <div className="error-card">{error}</div>}
        {messages.some(m => m.role === 'ai') && !loading && <button className="copy-btn" type="button" onClick={copyLast}>{copied ? '✓ Imenakili' : '⧉ Nakili jibu la mwisho'}</button>}
      </div>}

      <form onSubmit={sendMessage} className="composer">
        <div className="composer-icon">＋</div>
        <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Muulize BONGO AI chochote..." aria-label="Andika ujumbe" />
        <button className="send" disabled={loading || !message.trim()} aria-label="Tuma ujumbe">{loading ? '…' : '↑'}</button>
      </form>
      <div className="hint">Mazungumzo yako yanahifadhiwa kwenye kifaa hiki. BONGO AI inaweza kufanya makosa.</div>
    </section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
