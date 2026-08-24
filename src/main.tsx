import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE = 'https://amendment-windy-horse.abasthan.app';

const suggestions = [
  { icon: '✦', text: 'Nisaidie kuelewa jambo fulani' },
  { icon: '⌁', text: 'Andika wazo la ubunifu' },
  { icon: '◈', text: 'Nifafanulie kwa ufupi' },
];

function App() {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!message.trim() || loading) return;
    setLoading(true); setError(''); setReply('');
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message })
      });
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : { error: `Server returned ${response.status} ${response.statusText}` };
      if (!response.ok) throw new Error(data.error || 'Request failed');
      setReply(data.text || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally { setLoading(false); }
  }

  function useSuggestion(text: string) { setMessage(text); }

  return <main className="app">
    <div className="ambient ambient-one" />
    <div className="ambient ambient-two" />
    <section className="shell">
      <header className="topbar">
        <div className="brand-mark"><div className="brand-orb">B</div><div><strong>BONGO</strong><span>AI</span></div></div>
        <div className="online"><i /> Online</div>
      </header>

      <div className="hero">
        <div className="eyebrow"><span>✦</span> BONGO AI</div>
        <h1>Habari, <em>karibu.</em></h1>
        <p className="tagline">Msaidizi wako wa akili wa kizazi kipya.</p>
        <p className="intro">Uliza swali, eleza unachohitaji, au anza tu mazungumzo.</p>
      </div>

      {!reply && !error && !loading && <div className="suggestions">
        {suggestions.map(item => <button key={item.text} type="button" onClick={() => useSuggestion(item.text)}><span>{item.icon}</span>{item.text}<b>›</b></button>)}
      </div>}

      {(reply || error || loading) && <div className={`response ${error ? 'has-error' : ''}`}>
        {loading && <div className="thinking"><span /><span /><span /> BONGO AI inafikiri...</div>}
        {reply && <><div className="response-label"><span className="mini-orb">B</span> BONGO AI</div><p>{reply}</p></>}
        {error && <p className="error">{error}</p>}
      </div>}

      <form onSubmit={sendMessage} className="composer">
        <div className="composer-icon">+</div>
        <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Muulize BONGO AI chochote..." aria-label="Andika ujumbe" />
        <button className="send" disabled={loading || !message.trim()} aria-label="Tuma ujumbe">{loading ? '…' : '↑'}</button>
      </form>
      <div className="hint">BONGO AI inaweza kufanya makosa. Hakiki taarifa muhimu.</div>
    </section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
