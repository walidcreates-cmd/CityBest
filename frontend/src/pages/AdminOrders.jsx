import { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://citybest-1.onrender.com';

const STATUSES = ['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'];

const STATUS_STYLE = {
  pending:          { bg:'#fef9c3', color:'#854d0e', label:'Pending' },
  confirmed:        { bg:'#dbeafe', color:'#1e40af', label:'Confirmed' },
  preparing:        { bg:'#ede9fe', color:'#5b21b6', label:'Preparing' },
  out_for_delivery: { bg:'#d1fae5', color:'#065f46', label:'Out for Delivery' },
  delivered:        { bg:'#f0fdf4', color:'#166534', label:'Delivered' },
  cancelled:        { bg:'#fee2e2', color:'#991b1b', label:'Cancelled' },
};

const NEXT_STATUS = {
  pending:          'confirmed',
  confirmed:        'preparing',
  preparing:        'out_for_delivery',
  out_for_delivery: 'delivered',
};

function Badge({ status }) {
  const s = STATUS_STYLE[status] || { bg:'#f1f5f9', color:'#475569', label: status };
  return (
    <span style={{ background:s.bg, color:s.color, padding:'0.25rem 0.65rem', borderRadius:'999px', fontSize:'0.75rem', fontWeight:600, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  );
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-GB');
}

export default function AdminOrders({ token }) {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [alert,    setAlert]    = useState(false);
  const prevCountRef = useRef(null);
  const audioRef     = useRef(null);

  const headers = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/orders`, { headers });
      const data = await res.json();
      if (data.success) {
        const fresh = data.orders;
        if (prevCountRef.current !== null && fresh.length > prevCountRef.current) {
          setAlert(true);
          try { audioRef.current && audioRef.current.play(); } catch {}
          setTimeout(() => setAlert(false), 5000);
        }
        prevCountRef.current = fresh.length;
        setOrders(fresh);
      }
    } catch (e) { console.error(e); }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => loadOrders(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId + newStatus);
    try {
      const res  = await fetch(`${API}/api/admin/orders/${orderId}/status`, {
        method:'PATCH', headers, body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (e) { console.error(e); }
    setUpdating(null);
  };

  const displayed = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const counts = STATUSES.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc; }, {});

  return (
    <div style={{ fontFamily:'sans-serif' }}>
      <audio ref={audioRef} src="https://cdn.pixabay.com/audio/2022/03/15/audio_6e7ba01742.mp3" preload="auto" />

      {alert && (
        <div style={{ background:'#fef9c3', border:'1px solid #fbbf24', borderRadius:'10px', padding:'0.75rem 1rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem', fontWeight:600 }}>
          🔔 New order received!
        </div>
      )}

      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.25rem' }}>
        <button onClick={() => setFilter('all')}
          style={{ padding:'0.4rem 0.9rem', borderRadius:'999px', border:'none', cursor:'pointer', fontWeight: filter==='all' ? 700 : 400, background: filter==='all' ? '#1e40af' : '#f1f5f9', color: filter==='all' ? '#fff' : '#374151', fontSize:'0.82rem' }}>
          All ({orders.length})
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding:'0.4rem 0.9rem', borderRadius:'999px', border:'none', cursor:'pointer', fontWeight: filter===s ? 700 : 400, background: filter===s ? STATUS_STYLE[s].color : '#f1f5f9', color: filter===s ? '#fff' : '#374151', fontSize:'0.82rem' }}>
            {STATUS_STYLE[s].label} {counts[s] > 0 ? `(${counts[s]})` : ''}
          </button>
        ))}
        <button onClick={() => loadOrders()} style={{ marginLeft:'auto', padding:'0.4rem 0.9rem', borderRadius:'999px', border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:'0.82rem' }}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'#888' }}>Loading orders...</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'#aaa' }}>No orders found.</div>
      ) : (
        <div style={{ display:'grid', gap:'0.75rem' }}>
          {displayed.map(order => {
            const isExpanded = expanded === order._id;
            const next  = NEXT_STATUS[order.status];
            const items = order.items || [];
            const total = order.total || 0;
            const addressParts = [order.houseNo, order.roadNo, order.area].filter(Boolean);
            const address = addressParts.length > 0 ? addressParts.join(', ') : '—';

            return (
              <div key={order._id} style={{ background:'#fff', border: order.status==='pending' ? '2px solid #fbbf24' : '1px solid #e2e8f0', borderRadius:'12px', overflow:'hidden' }}>
                <div style={{ padding:'1rem', display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:'180px' }}>
                    <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{order.customerName || 'Unknown'}</div>
                    <div style={{ fontSize:'0.82rem', color:'#555', marginTop:'0.15rem' }}>📞 {order.customerPhone || '—'}</div>
                    <div style={{ fontSize:'0.78rem', color:'#888', marginTop:'0.1rem' }}>📍 {address}</div>
                  </div>
                  <div style={{ textAlign:'right', minWidth:'80px' }}>
                    <div style={{ fontWeight:700, color:'#2563eb', fontSize:'1rem' }}>৳{total}</div>
                    <div style={{ fontSize:'0.75rem', color:'#aaa', marginTop:'0.1rem' }}>{timeAgo(order.createdAt)}</div>
                    <div style={{ fontSize:'0.75rem', color:'#888' }}>{items.length} item{items.length!==1?'s':''}</div>
                  </div>
                  <Badge status={order.status} />
                  {next && (
                    <button disabled={updating===order._id+next} onClick={() => updateStatus(order._id, next)}
                      style={{ padding:'0.45rem 0.9rem', background:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'0.8rem', whiteSpace:'nowrap', opacity: updating===order._id+next ? 0.6 : 1 }}>
                      {updating===order._id+next ? '...' : `→ ${STATUS_STYLE[next].label}`}
                    </button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button disabled={updating===order._id+'cancelled'} onClick={() => updateStatus(order._id, 'cancelled')}
                      style={{ padding:'0.45rem 0.75rem', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:'8px', cursor:'pointer', fontSize:'0.8rem', opacity: updating===order._id+'cancelled' ? 0.6 : 1 }}>
                      ✕ Cancel
                    </button>
                  )}
                  <button onClick={() => setExpanded(isExpanded ? null : order._id)}
                    style={{ padding:'0.45rem 0.75rem', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', cursor:'pointer', fontSize:'0.8rem' }}>
                    {isExpanded ? '▲ Hide' : '▼ Items'}
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ borderTop:'1px solid #f1f5f9', background:'#fafafa', padding:'0.75rem 1rem' }}>
                    <div style={{ fontSize:'0.8rem', fontWeight:600, color:'#555', marginBottom:'0.5rem' }}>Order items</div>
                    {items.length === 0 ? (
                      <div style={{ color:'#aaa', fontSize:'0.8rem' }}>No item details available</div>
                    ) : items.map((item, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.4rem 0', borderBottom: i < items.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                        {item.image
                          ? <img src={item.image} alt={item.name} style={{ width:'36px', height:'36px', objectFit:'contain', borderRadius:'6px', background:'#f1f5f9' }} />
                          : <div style={{ width:'36px', height:'36px', background:'#f1f5f9', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem' }}>{item.emoji||'📦'}</div>
                        }
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'0.85rem', fontWeight:600 }}>{item.name}</div>
                          {item.variantName && <div style={{ fontSize:'0.75rem', color:'#2563eb' }}>🔀 {item.variantName}</div>}
                          {item.nameBn && <div style={{ fontSize:'0.75rem', color:'#888' }}>{item.nameBn}</div>}
                        </div>
                        <div style={{ fontSize:'0.85rem', color:'#666' }}>x{item.qty}</div>
                        <div style={{ fontSize:'0.85rem', fontWeight:600, color:'#2563eb' }}>৳{(item.price * item.qty).toLocaleString()}</div>
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'0.5rem', paddingTop:'0.5rem', borderTop:'1px solid #e2e8f0' }}>
                      <span style={{ fontWeight:700, color:'#1e40af' }}>Total: ৳{total}</span>
                    </div>
                    {order.paymentMethod && (
                      <div style={{ fontSize:'0.78rem', color:'#888', marginTop:'0.4rem', textAlign:'right' }}>Payment: {order.paymentMethod}</div>
                    )}
                    {order.notes && (
                      <div style={{ fontSize:'0.78rem', color:'#888', marginTop:'0.25rem', textAlign:'right' }}>Note: {order.notes}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}