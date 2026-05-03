import { useState, useRef, useEffect } from 'react';
import { restaurants } from '../menuData';

const CATEGORY_STYLE = {
  Starters: { gradient: 'linear-gradient(135deg, #0d2418 0%, #061310 100%)', emoji: '🥗',  accent: '#34d399' },
  Mains:    { gradient: 'linear-gradient(135deg, #0d1828 0%, #060f18 100%)', emoji: '🍽️', accent: '#60a5fa' },
  Burgers:  { gradient: 'linear-gradient(135deg, #281808 0%, #180f05 100%)', emoji: '🍔',  accent: '#fb923c' },
  Pizza:    { gradient: 'linear-gradient(135deg, #280d0d 0%, #180606 100%)', emoji: '🍕',  accent: '#f87171' },
  Desserts: { gradient: 'linear-gradient(135deg, #28081a 0%, #180610 100%)', emoji: '🍰',  accent: '#f472b6' },
  Drinks:   { gradient: 'linear-gradient(135deg, #081828 0%, #060d18 100%)', emoji: '🥤',  accent: '#38bdf8' },
};

const ACCENT = '#f59e0b';

function buildSystemPrompt(restaurant) {
  const menuText = restaurant.menu
    .map(cat => `${cat.category}:\n${cat.items.map(i => `  - ${i.name} ($${i.price}): ${i.description}`).join('\n')}`)
    .join('\n\n');
  return `You are a friendly AI waiter at ${restaurant.name}. Your ONLY job is to help guests with the menu — recommendations, ingredients, dietary needs, prices, or comparisons.

RULES:
- ONLY answer questions about the menu or dining experience.
- If asked anything unrelated, politely decline and redirect to the menu.
- ALWAYS reply in the same language the user writes in.
- Be warm, concise, and specific.

MENU:\n\n${menuText}`;
}

export default function RestaurantChatbot() {
  const restaurant = restaurants[0];
  const [activeCategory, setActiveCategory] = useState(restaurant.menu[0].category);
  const [chatOpen, setChatOpen]   = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-US');
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef       = useRef(null);

  const currentCategory = restaurant.menu.find(c => c.category === activeCategory);
  const catStyle = CATEGORY_STYLE[activeCategory] || { gradient: 'linear-gradient(135deg,#1a1a1a,#0a0a0a)', emoji: '🍽️', accent: ACCENT };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { if (chatOpen) inputRef.current?.focus(); }, [chatOpen]);

  // ── ElevenLabs TTS ──
  const speak = async (text) => {
    try {
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); audioRef.current = null; }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      audioRef.current = new Audio(URL.createObjectURL(blob));
      audioRef.current.play();
    } catch (err) { console.error('TTS error:', err); }
  };

  // ── Speech Recognition ──
  const toggleListening = () => {
    if (isListening) { recognitionRef.current?.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input requires Chrome or Edge.'); return; }
    const r = new SR();
    r.lang = voiceLang; r.interimResults = false; r.maxAlternatives = 1;
    r.onstart  = () => setIsListening(true);
    r.onend    = () => setIsListening(false);
    r.onerror  = () => setIsListening(false);
    r.onresult = (e) => { setInput(e.results[0][0].transcript); inputRef.current?.focus(); };
    recognitionRef.current = r;
    r.start();
  };

  // ── Send message ──
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history); setInput(''); setLoading(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, systemPrompt: buildSystemPrompt(restaurant) }),
      });
      const data = await res.json();
      const reply = data.error ? `Error: ${data.error}` : data.reply;
      setMessages([...history, { role: 'assistant', content: reply }]);
      if (autoSpeak && !data.error) speak(reply);
    } catch {
      setMessages([...history, { role: 'assistant', content: 'Could not reach the server. Please make sure the backend is running.' }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  // ── Shared button style helper ──
  const iconBtn = (active, color = ACCENT) => ({
    padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px',
    fontWeight: '600', transition: 'all 0.2s',
    background: active ? color : '#1e1e1e',
    color: active ? '#000' : '#666',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f0f0f0', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1a1a1a',
        padding: '0 40px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', background: ACCENT,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
          }}>🤖</div>
          <span style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '-0.3px' }}>
            Bot<span style={{ color: ACCENT }}>Waiter</span>
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#444', fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {restaurant.tagline}
        </div>
      </header>

      {/* ── HERO ── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        padding: '72px 40px 56px',
        background: 'radial-gradient(ellipse 80% 60% at 10% 50%, rgba(245,158,11,0.1) 0%, transparent 60%), #0a0a0a',
        borderBottom: '1px solid #141414',
      }}>
        <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '700', color: ACCENT, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Welcome to
        </p>
        <h1 style={{ margin: '0 0 14px', fontSize: '56px', fontWeight: '800', letterSpacing: '-2px', lineHeight: 1.05 }}>
          {restaurant.name}
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: '#555', maxWidth: '480px', lineHeight: 1.6 }}>
          Browse our menu and tap the chat icon to get personalized recommendations from your AI waiter.
        </p>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div style={{
        padding: '0 40px',
        borderBottom: '1px solid #141414',
        display: 'flex', gap: '0', overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {restaurant.menu.map(cat => {
          const s = CATEGORY_STYLE[cat.category] || {};
          const isActive = activeCategory === cat.category;
          return (
            <button key={cat.category} onClick={() => setActiveCategory(cat.category)} style={{
              padding: '16px 20px', border: 'none', cursor: 'pointer', background: 'transparent',
              color: isActive ? s.accent || ACCENT : '#444',
              fontWeight: isActive ? '700' : '500', fontSize: '14px', whiteSpace: 'nowrap',
              borderBottom: isActive ? `2px solid ${s.accent || ACCENT}` : '2px solid transparent',
              transition: 'all 0.2s', marginBottom: '-1px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span>{CATEGORY_STYLE[cat.category]?.emoji || '🍽️'}</span>
              <span>{cat.category}</span>
            </button>
          );
        })}
      </div>

      {/* ── MENU GRID ── */}
      <div style={{ padding: '32px 40px 140px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {currentCategory?.items.map(item => (
            <div key={item.name}
              style={{ background: '#111', borderRadius: '16px', overflow: 'hidden', border: '1px solid #1a1a1a', transition: 'all 0.25s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${catStyle.accent}40`; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${catStyle.accent}15`; }}
              onMouseLeave={e => { e.currentTarget.style.border = '1px solid #1a1a1a'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Visual area */}
              <div style={{
                height: '140px', background: catStyle.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '48px', position: 'relative',
              }}>
                <span style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>{catStyle.emoji}</span>
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                  padding: '4px 10px', borderRadius: '20px',
                  fontSize: '13px', fontWeight: '700', color: catStyle.accent,
                }}>
                  ${item.price}
                </div>
              </div>
              {/* Content */}
              <div style={{ padding: '16px' }}>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#f0f0f0', marginBottom: '6px' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.55' }}>
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FLOATING CHAT BUTTON ── */}
      <button onClick={() => setChatOpen(o => !o)} style={{
        position: 'fixed', bottom: '28px', left: '28px',
        width: '54px', height: '54px', borderRadius: '50%',
        background: chatOpen ? '#1e1e1e' : ACCENT,
        border: `1px solid ${chatOpen ? '#333' : ACCENT}`,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px',
        boxShadow: chatOpen ? 'none' : `0 8px 32px rgba(245,158,11,0.4)`,
        zIndex: 300, transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {chatOpen ? '✕' : '💬'}
      </button>

      {/* ── CHAT WIDGET ── */}
      <div style={{
        position: 'fixed', bottom: '96px', left: '28px',
        width: '370px', height: '520px',
        background: '#111', borderRadius: '24px',
        border: '1px solid #1e1e1e',
        display: 'flex', flexDirection: 'column',
        zIndex: 300, boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        transformOrigin: 'bottom left',
        transform: chatOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(10px)',
        opacity: chatOpen ? 1 : 0,
        pointerEvents: chatOpen ? 'all' : 'none',
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease',
      }}>

        {/* Widget header */}
        <div style={{
          padding: '16px 18px', borderBottom: '1px solid #1a1a1a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: '24px 24px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${ACCENT}, #d97706)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>🤖</div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#f0f0f0' }}>AI Waiter</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#34d399' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                {restaurant.name}
              </div>
            </div>
          </div>
          {/* Auto-speak toggle */}
          <button onClick={() => setAutoSpeak(s => !s)} title="Toggle voice responses" style={iconBtn(autoSpeak, ACCENT)}>
            {autoSpeak ? '🔊' : '🔇'}
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>👋</div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#f0f0f0', marginBottom: '6px' }}>
                Hi, I'm your AI Waiter!
              </div>
              <div style={{ fontSize: '13px', color: '#555', lineHeight: 1.6 }}>
                Ask me anything about the menu — I'll help you find the perfect dish.
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%', padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? ACCENT : '#1a1a1a',
              color: msg.role === 'user' ? '#000' : '#ddd',
              fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap',
            }} dir="auto">
              {msg.content}
            </div>
          ))}
          {loading && (
            <div style={{
              alignSelf: 'flex-start', padding: '10px 16px', borderRadius: '18px 18px 18px 4px',
              background: '#1a1a1a', display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%', background: '#444', display: 'inline-block',
                  animation: `bounce 1s ease ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: '10px 12px 14px', borderTop: '1px solid #1a1a1a' }}>
          {/* Voice row */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
            <button onClick={toggleListening} style={iconBtn(isListening, '#ef4444')}>
              {isListening ? '⏹ Stop' : '🎤 Speak'}
            </button>
            <button onClick={() => setVoiceLang(l => l === 'en-US' ? 'ar-SA' : 'en-US')} style={iconBtn(false)}>
              {voiceLang === 'en-US' ? '🇺🇸 EN' : '🇸🇦 AR'}
            </button>
          </div>
          {/* Text row */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              ref={inputRef} value={input} dir="auto"
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the menu…"
              disabled={loading}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '12px',
                border: '1px solid #222', background: '#0a0a0a',
                color: '#f0f0f0', fontSize: '13px', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e  => { e.target.style.borderColor = ACCENT; }}
              onBlur={e   => { e.target.style.borderColor = '#222'; }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
              padding: '10px 16px', borderRadius: '12px', border: 'none',
              background: ACCENT, color: '#000', fontWeight: '700', fontSize: '13px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !input.trim() ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}>
              Send
            </button>
          </div>
        </div>

      </div>

      {/* Bounce animation for typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

    </div>
  );
}
