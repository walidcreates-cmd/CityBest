import { useState, useRef } from 'react';
import { auth } from '../firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

const provider = new GoogleAuthProvider();

export default function Login() {
  const [phone, setPhone]         = useState('');
  const [otp, setOtp]             = useState('');
  const [step, setStep]           = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const confirmRef                = useRef(null);

  // ── Setup invisible reCAPTCHA ──────────────────────────────────────────
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  // ── Send OTP ───────────────────────────────────────────────────────────
  const sendOtp = async () => {
    setError('');
    if (!phone || phone.length < 10) {
      setError('সঠিক ফোন নম্বর দিন');
      return;
    }
    setLoading(true);
    try {
      setupRecaptcha();
      const fullPhone = phone.startsWith('+') ? phone : `+88${phone}`;
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      confirmRef.current = result;
      setStep('otp');
    } catch (err) {
      setError('OTP পাঠানো যায়নি। আবার চেষ্টা করুন।');
      console.error(err);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
    setLoading(false);
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────
  const verifyOtp = async () => {
    setError('');
    if (!otp || otp.length !== 6) {
      setError('৬ সংখ্যার OTP দিন');
      return;
    }
    setLoading(true);
    try {
      await confirmRef.current.confirm(otp);
      // onAuthStateChanged in AuthContext will pick up the user automatically
    } catch (err) {
      setError('OTP ভুল হয়েছে। আবার চেষ্টা করুন।');
      console.error(err);
    }
    setLoading(false);
  };

  // ── Google Sign-in ─────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError('Google লগইন ব্যর্থ হয়েছে।');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>🛒</span>
          <h1 style={styles.logoText}>CityBest</h1>
          <p style={styles.tagline}>সিরাজগঞ্জের সেরা গ্রোসারি</p>
        </div>

        {/* Phone step */}
        {step === 'phone' && (
          <>
            <p style={styles.label}>মোবাইল নম্বর দিন</p>
            <div style={styles.inputRow}>
              <span style={styles.prefix}>+88</span>
              <input
                style={styles.input}
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={11}
              />
            </div>
            <button
              style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
              onClick={sendOtp}
              disabled={loading}
            >
              {loading ? 'পাঠানো হচ্ছে...' : 'OTP পাঠান'}
            </button>

            <div style={styles.divider}><span>অথবা</span></div>

            <button style={styles.googleBtn} onClick={signInWithGoogle} disabled={loading}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: 20, marginRight: 10 }} />
              Google দিয়ে লগইন করুন
            </button>
          </>
        )}

        {/* OTP step */}
        {step === 'otp' && (
          <>
            <p style={styles.label}>আপনার ফোনে OTP পাঠানো হয়েছে</p>
            <p style={styles.phoneSent}>+88{phone}</p>
            <input
              style={{ ...styles.input, width: '100%', textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
              type="number"
              placeholder="------"
              value={otp}
              onChange={e => setOtp(e.target.value.slice(0, 6))}
              maxLength={6}
            />
            <button
              style={{ ...styles.btn, marginTop: 16, opacity: loading ? 0.7 : 1 }}
              onClick={verifyOtp}
              disabled={loading}
            >
              {loading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
            </button>
            <button style={styles.backBtn} onClick={() => { setStep('phone'); setOtp(''); setError(''); }}>
              ← নম্বর পরিবর্তন করুন
            </button>
          </>
        )}

        {/* Error */}
        {error && <p style={styles.error}>{error}</p>}

        {/* Invisible reCAPTCHA container */}
        <div id="recaptcha-container" />
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Hind Siliguri', sans-serif",
    padding: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '36px 32px',
    width: '100%',
    maxWidth: 380,
    boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: 28,
  },
  logoIcon: { fontSize: 48 },
  logoText: {
    margin: '4px 0 0',
    fontSize: 28,
    fontWeight: 800,
    color: '#1a9e5c',
  },
  tagline: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#888',
  },
  label: {
    fontSize: 15,
    color: '#444',
    marginBottom: 10,
    fontWeight: 600,
  },
  phoneSent: {
    fontSize: 14,
    color: '#1a9e5c',
    marginBottom: 14,
    fontWeight: 600,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    border: '2px solid #e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,
  },
  prefix: {
    padding: '12px 10px',
    background: '#f5f5f5',
    color: '#555',
    fontWeight: 700,
    fontSize: 15,
    borderRight: '1px solid #e0e0e0',
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '12px 14px',
    fontSize: 16,
    fontFamily: 'inherit',
  },
  btn: {
    width: '100%',
    padding: '14px',
    background: '#1a9e5c',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  },
  divider: {
    textAlign: 'center',
    margin: '18px 0',
    color: '#bbb',
    fontSize: 13,
    position: 'relative',
  },
  googleBtn: {
    width: '100%',
    padding: '13px',
    background: '#fff',
    color: '#333',
    border: '2px solid #e0e0e0',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
  },
  backBtn: {
    width: '100%',
    marginTop: 12,
    padding: '10px',
    background: 'transparent',
    border: 'none',
    color: '#888',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  error: {
    marginTop: 14,
    color: '#e53935',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 600,
  },
};
