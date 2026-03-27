export default function OrderSuccess({ order, onContinue }) {
  return (
    <div style={s.wrap}>
      <div style={s.icon}>✅</div>
      <div style={s.title}>অর্ডার হয়েছে!</div>
      <div style={s.msg}>আপনার অর্ডার নিশ্চিত হয়েছে। শীঘ্রই ডেলিভারি পাবেন।</div>
      <button style={s.btn} onClick={onContinue}>কেনাকাটা চালিয়ে যান</button>
    </div>
  );
}

const s = {
  wrap: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, textAlign:'center' },
  icon: { fontSize:64, marginBottom:16 },
  title: { fontSize:22, fontWeight:800, color:'#1a9e5c', marginBottom:10 },
  msg: { fontSize:14, color:'#6b7280', marginBottom:24, lineHeight:1.6 },
  btn: { padding:'12px 28px', background:'#1a9e5c', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
};
