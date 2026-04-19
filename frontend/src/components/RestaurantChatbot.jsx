import { useState, useRef, useEffect } from 'react';
import { restaurants } from '../menuData';

const CATEGORY_EMOJI = {
  'New Items': '⭐',
  'Classic Burgers': '🍔',
  'Special Burgers': '🔥',
  'Diet Burgers': '🥗',
  Starters: '🍗',
  Salads: '🥙',
  Fries: '🍟',
  Desserts: '🍰',
  Drinks: '🥤',
};

const CATEGORY_BG = {
  'New Items': '#1e1a00',
  'Classic Burgers': '#1e0e00',
  'Special Burgers': '#1e0800',
  'Diet Burgers': '#0e1e0e',
  Starters: '#1a1000',
  Salads: '#0e1a0e',
  Fries: '#1e1200',
  Desserts: '#1e0a14',
  Drinks: '#0a0e1e',
};

function buildSystemPrompt(restaurant) {
  if (!restaurant) return '';
  const menuText = restaurant.menu
    .map(
      (cat) =>
        `${cat.category}:\n${cat.items
          .map((item) => `  - ${item.name} ($${item.price}): ${item.description}`)
          .join('\n')}`
    )
    .join('\n\n');
  return `You are an AI waiter at ${restaurant.name}. Your ONLY job is to help customers with questions related to the menu — such as recommendations, ingredients, calories, prices, dietary options, or comparisons between items.

STRICT RULES:
- ONLY answer questions about the menu, food items, drinks, or dining at ${restaurant.name}.
- If the user asks ANYTHING unrelated to the menu (e.g. general knowledge, coding, news, math, personal advice, or any other topic), politely decline and redirect them to the menu. Say something like: "I'm only here to help you with our menu! Can I recommend something for you?"
- ALWAYS reply in the same language the user writes in. If they write in Arabic, reply fully in Arabic. If they write in English, reply in English. Never mix languages in a single reply.
- Be warm, concise, and helpful — but stay strictly on topic.

Here is the full menu:\n\n${menuText}`;
}

export default function RestaurantChatbot() {
  const [activeCategory, setActiveCategory] = useState(restaurants[0].menu[0].category);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-US'); // 'en-US' or 'ar-SA'
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  const currentRestaurant = restaurants[0];
  const currentCategory = currentRestaurant.menu.find((c) => c.category === activeCategory);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (chatOpen) inputRef.current?.focus();
  }, [chatOpen]);

  // ── Text-to-Speech (ElevenLabs via backend) ──
  const speak = async (text) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current = null;
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current = new Audio(url);
      audioRef.current.play();
    } catch (err) {
      console.error('TTS error:', err);
    }
  };

  // ── Speech-to-Text ──
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      inputRef.current?.focus();
    };
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: 'user', content: input.trim() };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          systemPrompt: buildSystemPrompt(currentRestaurant),
        }),
      });
      const data = await res.json();
      const reply = data.error ? `Error: ${data.error}` : data.reply;
      setMessages([...history, { role: 'assistant', content: reply }]);
      if (autoSpeak && !data.error) speak(reply);
    } catch {
      setMessages([...history, { role: 'assistant', content: 'Could not reach the server. Please make sure the backend is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1f1f1f',
        padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px',
      }}>
        <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px', color: '#e8a045' }}>
          CENTURY BURGER
        </div>
        <div style={{ fontSize: '13px', color: '#555' }}>Est. 2011 · Saudi Arabia</div>
      </header>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(160deg, #1a0e00 0%, #0a0a0a 60%)',
        padding: '64px 40px 48px',
        borderBottom: '1px solid #1f1f1f',
      }}>
        <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#e8a045', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Welcome to / أهلاً بك في
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '52px', fontWeight: '800', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
            {currentRestaurant.name}
          </h1>
          <h1 style={{ margin: 0, fontSize: '40px', fontWeight: '800', lineHeight: 1.1, color: '#e8a045', direction: 'rtl' }}>
            {currentRestaurant.nameAr}
          </h1>
        </div>
        <p style={{ margin: 0, color: '#666', fontSize: '15px' }}>
          Browse our menu below — or ask our AI waiter for a recommendation.
          <span style={{ display: 'block', direction: 'rtl', marginTop: '4px' }}>تصفح قائمتنا أدناه — أو اسأل نادلنا الذكي للحصول على توصية.</span>
        </p>
      </div>

      {/* ── Category tabs ── */}
      <div style={{
        padding: '20px 40px 0',
        display: 'flex', gap: '10px', overflowX: 'auto',
        borderBottom: '1px solid #1f1f1f',
      }}>
        {currentRestaurant.menu.map((cat) => (
          <button key={cat.category} onClick={() => setActiveCategory(cat.category)} style={{
            padding: '10px 20px', borderRadius: '0', border: 'none', cursor: 'pointer',
            background: 'transparent',
            color: activeCategory === cat.category ? '#e8a045' : '#555',
            fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap',
            borderBottom: activeCategory === cat.category ? '2px solid #e8a045' : '2px solid transparent',
            transition: 'all 0.2s', marginBottom: '-1px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
          }}>
            <span>{CATEGORY_EMOJI[cat.category] || '🍽️'} {cat.category}</span>
            <span style={{ fontSize: '11px', fontWeight: '500', direction: 'rtl' }}>{cat.categoryAr}</span>
          </button>
        ))}
      </div>

      {/* ── Menu grid ── */}
      <div style={{ padding: '32px 40px 120px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {currentCategory?.items.map((item) => (
          <div key={item.name} style={{
            background: '#141414', borderRadius: '14px', overflow: 'hidden',
            border: '1px solid #1f1f1f', transition: 'border-color 0.2s, transform 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8a045'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1f1f1f'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {/* Image placeholder */}
            <div style={{
              height: '170px',
              background: CATEGORY_BG[activeCategory] || '#1a1a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '56px',
            }}>
              {CATEGORY_EMOJI[activeCategory] || '🍽️'}
            </div>
            <div style={{ padding: '16px' }}>
              {/* Name row: EN left, price center-right, AR right */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color: '#f0f0f0', lineHeight: 1.3 }}>{item.name}</span>
                <span style={{ color: '#e8a045', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap' }}>{item.price}</span>
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#bbb', direction: 'rtl', marginBottom: '10px' }}>
                {item.nameAr}
              </div>
              {/* Divider */}
              <div style={{ borderTop: '1px solid #222', marginBottom: '10px' }} />
              {/* English description */}
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#666', lineHeight: '1.5' }}>{item.description}</p>
              {/* Arabic description */}
              <p style={{ margin: 0, fontSize: '12px', color: '#555', lineHeight: '1.5', textAlign: 'right', direction: 'rtl' }}>{item.descriptionAr}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Floating chat button ── */}
      <button onClick={() => setChatOpen((o) => !o)} style={{
        position: 'fixed', bottom: '24px', left: '24px',
        width: '56px', height: '56px', borderRadius: '50%',
        background: chatOpen ? '#333' : '#e8a045',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px',
        boxShadow: chatOpen ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 24px rgba(232,160,69,0.5)',
        zIndex: 200, transition: 'all 0.25s',
      }}>
        {chatOpen ? '✕' : '💬'}
      </button>

      {/* ── Chat widget ── */}
      <div style={{
        position: 'fixed', bottom: '92px', left: '24px',
        width: '360px', height: '500px',
        background: '#141414', borderRadius: '20px',
        border: '1px solid #2a2a2a',
        display: 'flex', flexDirection: 'column',
        zIndex: 200,
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        transformOrigin: 'bottom left',
        transform: chatOpen ? 'scale(1)' : 'scale(0.85)',
        opacity: chatOpen ? 1 : 0,
        pointerEvents: chatOpen ? 'all' : 'none',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s',
      }}>
        {/* Widget header */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #222',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: '20px 20px 0 0', background: '#1a1a1a',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: '#e8a045', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
            }}>🤖</div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#f0f0f0' }}>AI Waiter · النادل الذكي</div>
              <div style={{ fontSize: '11px', color: '#4CAF50', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50', display: 'inline-block' }} />
                {currentRestaurant.name}
              </div>
            </div>
          </div>
          {/* Auto-speak toggle */}
          <button
            onClick={() => setAutoSpeak((s) => !s)}
            title={autoSpeak ? 'Mute AI responses' : 'Read AI responses aloud'}
            style={{
              background: autoSpeak ? '#e8a045' : '#2a2a2a', border: 'none',
              borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
              fontSize: '16px', transition: 'background 0.2s',
            }}
          >
            {autoSpeak ? '🔊' : '🔇'}
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.length === 0 && (
            <div style={{
              margin: 'auto', textAlign: 'center', color: '#555', fontSize: '13px', padding: '20px',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>👋</div>
              Hi! I'm your AI waiter at {currentRestaurant.name}.<br />Ask me for a recommendation!
              <br /><br />
              <span style={{ direction: 'rtl', display: 'block' }}>أهلاً! أنا نادلك الذكي في {currentRestaurant.nameAr}.<br />اسألني عن توصية!</span>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? '#e8a045' : '#222',
              color: msg.role === 'user' ? '#000' : '#e0e0e0',
              fontSize: '13px', lineHeight: '1.55', whiteSpace: 'pre-wrap',
            }} dir="auto">
              {msg.content}
            </div>
          ))}
          {loading && (
            <div style={{
              alignSelf: 'flex-start', padding: '10px 14px',
              borderRadius: '16px 16px 16px 4px', background: '#222',
              fontSize: '13px', color: '#666',
            }}>
              Typing…
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #222' }}>
          {/* Voice controls row */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
            {/* Mic button */}
            <button
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Speak a message'}
              style={{
                padding: '5px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: isListening ? '#e94560' : '#2a2a2a',
                fontSize: '14px', transition: 'background 0.2s',
                animation: isListening ? 'pulse 1s infinite' : 'none',
              }}
            >
              {isListening ? '⏹ Listening…' : '🎤 Speak'}
            </button>
            {/* Language toggle */}
            <button
              onClick={() => setVoiceLang((l) => l === 'en-US' ? 'ar-SA' : 'en-US')}
              title="Switch voice language"
              style={{
                padding: '5px 10px', borderRadius: '8px', border: '1px solid #333',
                background: '#1a1a1a', color: '#aaa', cursor: 'pointer',
                fontSize: '12px', fontWeight: '600',
              }}
            >
              {voiceLang === 'en-US' ? '🇺🇸 EN' : '🇸🇦 AR'}
            </button>
            <span style={{ fontSize: '11px', color: '#444', marginLeft: '2px' }}>
              {voiceLang === 'en-US' ? 'Voice: English' : 'الصوت: عربي'}
            </span>
          </div>
          {/* Text input row */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for a recommendation… / اسأل عن توصية"
            disabled={loading}
            dir="auto"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '10px',
              border: '1px solid #2a2a2a', background: '#0f0f0f',
              color: 'white', fontSize: '13px', outline: 'none',
            }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
            padding: '10px 16px', borderRadius: '10px', border: 'none',
            background: '#e8a045', color: '#000', fontWeight: '700', fontSize: '13px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
            transition: 'opacity 0.15s', whiteSpace: 'nowrap',
          }}>
            Send
          </button>
        </div>
      </div>

      </div>

    </div>
  );
}
