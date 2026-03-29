import { useState, useRef } from 'react';

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const API = import.meta.env.VITE_API_URL || 'https://citybest-1.onrender.com';

const SYSTEM_PROMPT = (products) => `You are an AI assistant for CityBest grocery admin dashboard in Sirajganj, Bangladesh.
You help the admin update products using natural language, short commands, or CSV data.

CURRENT PRODUCTS (JSON):
${JSON.stringify(products, null, 2)}

Your job: interpret the admin's request and return a JSON array of updates to apply.
Each update must follow this exact format:
{ "_id": "<product _id>", "changes": { "field": value, ... } }

Valid fields to change: price, stock, isAvailable, isFast, name, nameBn, unit, category, emoji

Rules:
- Match products by name (partial, case-insensitive), category, or _id
- For commands like "Rice/Miniket-72, 15" interpret as: name match "Miniket Rice", price=72, stock=15
- For "disable all fish" set isAvailable:false for all fish category
- For "increase all prices by 10%" calculate new prices
- For CSV data, parse rows and match to existing products by name
- ONLY return valid JSON, no explanation, no markdown, no backticks
- Format: { "summary": "Human readable summary of changes", "updates": [...] }
- If you cannot understand the request, return: { "summary": "Sorry, I could not understand that request.", "updates": [] }`;

export default function AIAssistant({ products, token, onRefresh }) {
  const [open,    setOpen]    = useState(false);
  const [msgs,    setMsgs]    = useState([{ role:'assistant', text:'👋 Hi! I can update your products. Try: "Disable all fish" or "Set Miniket Rice price to 72, stock 15"' }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();
  const bottomRef = useRef();

  const headers = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };

  const scrollDown = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100);

  const addMsg = (role, text, extra) => {
    setMsgs(m => [...m, { role, text, ...extra }]);
    scrollDown();
  };

  const askClaude = async (userMsg) => {
    setLoading(true);
    addMsg('user', userMsg);
    try {
      const res  = await fetch(CLAUDE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT(products),
          messages: [{ role:'user', content: userMsg }],
        }),
      });
      const data = await res.json();
      const raw  = data.content?.[0]?.text || '{}';
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed.updates && parsed.updates.length > 0) {
        setPreview(parsed);
        addMsg('assistant', `📋 ${parsed.summary}\n\nI will update ${parsed.updates.length} product(s). Confirm?`, { hasPreview: true, previewData: parsed });
      } else {
        addMsg('assistant', parsed.summary || 'No changes needed.');
      }
    } catch (err) {
      addMsg('assistant', '❌ Error processing request. Please try again.');
    }
    setLoading(false);
  };

  const applyChanges = async (parsed) => {
    setPreview(null);
    addMsg('assistant', '⏳ Applying changes...');
    let success = 0, fail = 0;
    for (const u of parsed.updates) {
      try {
        const r = await fetch(`${API}/api/products/${u._id}`, { method:'PUT', headers, body: JSON.stringify(u.changes) });
        const d = await r.json();
        if (d.success) success++; else fail++;
      } catch { fail++; }
    }
    addMsg('assistant', `✅ Done! ${success} product(s) updated${fail ? `, ${fail} failed` : ''}.`);
    onRefresh();
  };

  const handleCSV = (text) => {
    askClaude(`Here is CSV data, please update products accordingly:\n${text}`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleCSV(ev.target.result);
    reader.readAsText(file);
  };

  const send = () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    askClaude(msg);
  };

  return (
    <>
      {/* Floating Button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position:'fixed', bottom:'1.5rem', right:'1.5rem', width:'56px', height:'56px',
        borderRadius:'50%', background:'#2563eb', color:'#fff', border:'none',
        fontSize:'1.5rem', cursor:'pointer', boxShadow:'0 4px 20px #2563eb55', zIndex:1000,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>🤖</button>

      {/* Chat Panel */}
      {open && (
        <div style={{
          position:'fixed', bottom:'5rem', right:'1.5rem', width:'360px', maxHeight:'520px',
          background:'#fff', borderRadius:'16px', boxShadow:'0 8px 40px #0002',
          display:'flex', flexDirection:'column', zIndex:999, overflow:'hidden',
        }}>
          {/* Header */}
          <div style={{ background:'#2563eb', color:'#fff', padding:'0.75rem 1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:600 }}>🤖 AI Product Assistant</div>
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:'#fff', fontSize:'1.2rem', cursor:'pointer' }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'1rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth:'85%', padding:'0.6rem 0.9rem', borderRadius:'12px', fontSize:'0.85rem', lineHeight:1.5,
                  background: m.role==='user' ? '#2563eb' : '#f1f5f9',
                  color: m.role==='user' ? '#fff' : '#1a1a1a',
                  whiteSpace:'pre-wrap',
                }}>
                  {m.text}
                  {m.hasPreview && (
                    <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.5rem' }}>
                      <button onClick={() => applyChanges(m.previewData)} style={{ padding:'0.3rem 0.7rem', background:'#16a34a', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem' }}>✅ Apply</button>
                      <button onClick={() => { setPreview(null); addMsg('assistant', '❌ Cancelled.'); }} style={{ padding:'0.3rem 0.7rem', background:'#dc2626', color:'#fff', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem' }}>Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex', justifyContent:'flex-start' }}>
                <div style={{ background:'#f1f5f9', padding:'0.6rem 0.9rem', borderRadius:'12px', fontSize:'0.85rem', color:'#888' }}>⏳ Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding:'0.75rem', borderTop:'1px solid #e2e8f0', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
                placeholder='Try: "Rice/Miniket-72, 15" or "disable fish"'
                style={{ flex:1, padding:'0.5rem 0.75rem', borderRadius:'8px', border:'1px solid #ddd', fontSize:'0.85rem' }}
              />
              <button onClick={send} disabled={loading} style={{ padding:'0.5rem 0.9rem', background:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer' }}>➤</button>
            </div>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button onClick={() => fileRef.current.click()} style={{ flex:1, padding:'0.4rem', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem' }}>📎 Upload CSV</button>
              <button onClick={() => askClaude('Show me a summary of all products and their current status')} style={{ flex:1, padding:'0.4rem', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem' }}>📊 Summary</button>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display:'none' }} onChange={handleFileUpload} />
          </div>
        </div>
      )}
    </>
  );
}
