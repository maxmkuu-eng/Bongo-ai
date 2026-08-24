import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || loading) return;
    setLoading(true); setError(''); setReply('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      setReply(data.text || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally { setLoading(false); }
  }

  return <main className="app">
    <section className="card">
      <div className="brand">BONGO <span>AI</span></div>
      <p className="tagline">Msaidizi wako wa akili wa kizazi kipya.</p>
      <div className="response">
        {!reply && !error && !loading && <span>Uliza chochote...</span>}
        {loading && <span>BONGO AI inafikiri…</span>}
        {reply && <p>{reply}</p>}
        {error && <p className="error">{error}</p>}
      </div>
      <form onSubmit={sendMessage} className="composer">
        <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Andika ujumbe wako..." />
        <button disabled={loading || !message.trim()}>{loading ? '...' : 'Tuma'}</button>
      </form>
    </section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
