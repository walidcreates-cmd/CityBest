export default function VariantPicker({ product, onSelect, onClose }) {
  return (
    <div style={{
      position:'fixed', inset:0, background:'#0007', zIndex:2000,
      display:'flex', alignItems:'flex-end', justifyContent:'center'
    }} onClick={onClose}>
      <div style={{
        background:'#fff', borderRadius:'16px 16px 0 0', padding:'1.5rem',
        width:'100%', maxWidth:'480px', maxHeight:'80vh', overflowY:'auto'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:'1.1rem' }}>{product.name}</div>
            <div style={{ fontSize:'0.85rem', color:'#666' }}>Select a variant</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#888' }}>✕</button>
        </div>
        <div style={{ display:'grid', gap:'0.75rem' }}>
          {product.variants.map((v, i) => (
            <button key={i} onClick={() => onSelect(v)} style={{
              display:'flex', alignItems:'center', gap:'1rem',
              padding:'0.75rem 1rem', background:'#f8fafc',
              border:'1px solid #e2e8f0', borderRadius:'10px',
              cursor:'pointer', textAlign:'left', width:'100%'
            }}>
              {v.image
                ? <img src={v.image} alt={v.name} style={{ width:'48px', height:'48px', objectFit:'contain', borderRadius:'6px' }} />
                : <div style={{ fontSize:'1.8rem' }}>{v.emoji || product.emoji}</div>
              }
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:'0.95rem' }}>{v.name}</div>
                {v.nameBn && <div style={{ fontSize:'0.8rem', color:'#888' }}>{v.nameBn}</div>}
              </div>
              <div style={{ fontWeight:700, color:'#2563eb', fontSize:'1rem' }}>৳{v.price}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
