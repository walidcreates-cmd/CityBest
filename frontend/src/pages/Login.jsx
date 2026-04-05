import { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

const provider = new GoogleAuthProvider();

// Inject responsive CSS once
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cb-page {
    min-height: 100vh;
    display: flex;
    font-family: 'Hind Siliguri', sans-serif;
    background: #f0faf4;
  }

  /* ── Left panel (desktop only) ── */
  .cb-left {
    display: none;
  }

  /* ── Right / form side ── */
  .cb-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: linear-gradient(160deg, #e8f5e9 0%, #f1f8e9 100%);
    min-height: 100vh;
  }

  .cb-card {
    background: #fff;
    border-radius: 20px;
    padding: 40px 32px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.10);
  }

  .cb-logo-wrap { text-align: center; margin-bottom: 32px; }
  .cb-logo-icon { font-size: 52px; display: block; }
  .cb-logo-text { font-size: 30px; font-weight: 800; color: #1a9e5c; margin: 6px 0 4px; }
  .cb-tagline   { font-size: 13px; color: #888; }

  .cb-label     { font-size: 15px; color: #444; font-weight: 600; margin-bottom: 10px; }
  .cb-phone-sent{ font-size: 14px; color: #1a9e5c; font-weight: 600; margin-bottom: 14px; }

  .cb-input-row {
    display: flex;
    align-items: center;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 14px;
    transition: border-color 0.2s;
  }
  .cb-input-row:focus-within { border-color: #1a9e5c; }

  .cb-prefix {
    padding: 13px 12px;
    background: #f5f5f5;
    color: #555;
    font-weight: 700;
    font-size: 15px;
    border-right: 1px solid #e0e0e0;
    white-space: nowrap;
  }

  .cb-input {
    flex: 1;
    border: none;
    outline: none;
    padding: 13px 14px;
    font-size: 16px;
    font-family: 'Hind Siliguri', sans-serif;
    background: transparent;
  }

  .cb-input-otp {
    width: 100%;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    outline: none;
    padding: 14px;
    font-size: 26px;
    text-align: center;
    letter-spacing: 10px;
    font-family: monospace;
    transition: border-color 0.2s;
  }
  .cb-input-otp:focus { border-color: #1a9e5c; }

  .cb-btn {
    width: 100%;
    padding: 14px;
    background: #1a9e5c;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Hind Siliguri', sans-serif;
    transition: background 0.2s, transform 0.1s;
  }
  .cb-btn:hover:not(:disabled) { background: #158a4f; transform: translateY(-1px); }
  .cb-btn:disabled { opacity: 0.7; cursor: not-allowed; }

  .cb-divider {
    text-align: center;
    margin: 18px 0;
    color: #bbb;
    font-size: 13px;
    position: relative;
  }
  .cb-divider::before, .cb-divider::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 42%;
    height: 1px;
    background: #e8e8e8;
  }
  .cb-divider::before { left: 0; }
  .cb-divider::after  { right: 0; }

  .cb-google-btn {
    width: 100%;
    padding: 13px;
    background: #fff;
    color: #333;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: 'Hind Siliguri', sans-serif;
    transition: border-color 0.2s, box-shadow 0.2s;
    white-space: nowrap;
    flex-wrap: nowrap;
  }
  .cb-google-btn span { white-space: nowrap; }
  .cb-google-btn:hover:not(:disabled) {
    border-color: #1a9e5c;
    box-shadow: 0 2px 8px rgba(26,158,92,0.12);
  }

  .cb-back-btn {
    width: 100%;
    margin-top: 12px;
    padding: 10px;
    background: transparent;
    border: none;
    color: #888;
    font-size: 14px;
    cursor: pointer;
    font-family: 'Hind Siliguri', sans-serif;
    transition: color 0.2s;
  }
  .cb-back-btn:hover { color: #1a9e5c; }

  .cb-error {
    margin-top: 14px;
    color: #e53935;
    font-size: 14px;
    text-align: center;
    font-weight: 600;
    padding: 10px;
    background: #ffeaea;
    border-radius: 8px;
  }

  /* ── Desktop layout (≥ 1024px) ── */
  @media (min-width: 1024px) {
    .cb-left {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 52%;
      min-height: 100vh;
      background: linear-gradient(145deg, #1a9e5c 0%, #0d6e3f 100%);
      padding: 48px;
      position: relative;
      overflow: hidden;
    }

    .cb-left::before {
      content: '';
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      top: -120px;
      right: -120px;
    }
    .cb-left::after {
      content: '';
      position: absolute;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
      bottom: -80px;
      left: -60px;
    }

    .cb-left-content { position: relative; z-index: 1; text-align: center; color: #fff; }

    .cb-brand-icon  { font-size: 72px; display: block; margin-bottom: 16px; }
    .cb-brand-name  { font-size: 42px; font-weight: 800; margin-bottom: 8px; }
    .cb-brand-sub   { font-size: 16px; opacity: 0.8; margin-bottom: 48px; }

    .cb-features    { list-style: none; text-align: left; }
    .cb-features li {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      margin-bottom: 18px;
      opacity: 0.92;
    }
    .cb-feature-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.15);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .cb-right {
      width: 48%;
      min-height: 100vh;
      background: #f8fdfb;
    }

    .cb-card {
      max-width: 420px;
      min-width: 360px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.07);
    }

    /* Hide logo on desktop (shown in left panel) */
    .cb-logo-wrap { display: none; }
    .cb-desktop-heading {
      font-size: 24px;
      font-weight: 800;
      color: #1a2d22;
      margin-bottom: 6px;
    }
    .cb-desktop-sub {
      font-size: 14px;
      color: #888;
      margin-bottom: 28px;
    }
  }

  /* ── Large desktop ── */
  @media (min-width: 1200px) {
    .cb-card { padding: 48px 44px; }
    .cb-brand-name { font-size: 52px; }
  }
`;

export default function Login() {
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
  const [step, setStep]       = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const confirmRef            = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const sendOtp = async () => {
    setError('');
    if (!phone || phone.length < 10) { setError('সঠিক ফোন নম্বর দিন'); return; }
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
      if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; }
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setError('');
    if (!otp || otp.length !== 6) { setError('৬ সংখ্যার OTP দিন'); return; }
    setLoading(true);
    try {
      await confirmRef.current.confirm(otp);
    } catch (err) {
      setError('OTP ভুল হয়েছে। আবার চেষ্টা করুন।');
      console.error(err);
    }
    setLoading(false);
  };

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
    <div className="cb-page">

      {/* ── Left panel (desktop only) ── */}
      <div className="cb-left">
        <div className="cb-left-content">
          <span className="cb-brand-icon">🛒</span>
          <h1 className="cb-brand-name">CityBest</h1>
          <p className="cb-brand-sub">সিরাজগঞ্জের সেরা গ্রোসারি</p>
          <ul className="cb-features">
            <li>
              <div className="cb-feature-icon">⚡</div>
              দ্রুত ডেলিভারি — মাত্র ৩০ মিনিটে
            </li>
            <li>
              <div className="cb-feature-icon">🥦</div>
              সতেজ এবং মানসম্পন্ন পণ্য
            </li>
            <li>
              <div className="cb-feature-icon">💰</div>
              সেরা দামে কেনাকাটা করুন
            </li>
            <li>
              <div className="cb-feature-icon">📦</div>
              নিরাপদ প্যাকেজিং ও ডেলিভারি
            </li>
          </ul>
        </div>
      </div>

      {/* ── Right / form side ── */}
      <div className="cb-right">
        <div className="cb-card">

          {/* Mobile logo (hidden on desktop via CSS) */}
          <div className="cb-logo-wrap">
            <span className="cb-logo-icon">🛒</span>
            <h1 className="cb-logo-text">CityBest</h1>
            <p className="cb-tagline">সিরাজগঞ্জের সেরা গ্রোসারি</p>
          </div>

          {/* Desktop heading (shown via CSS when logo is hidden) */}
          <p className="cb-desktop-heading">স্বাগতম! 👋</p>
          <p className="cb-desktop-sub">আপনার অ্যাকাউন্টে লগইন করুন</p>

          {/* Phone step */}
          {step === 'phone' && (
            <>
              <p className="cb-label">মোবাইল নম্বর দিন</p>
              <div className="cb-input-row">
                <span className="cb-prefix">+88</span>
                <input
                  className="cb-input"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={11}
                />
              </div>
              <button className="cb-btn" onClick={sendOtp} disabled={loading}>
                {loading ? 'পাঠানো হচ্ছে...' : 'OTP পাঠান'}
              </button>

              <div className="cb-divider"><span>অথবা</span></div>

              <button className="cb-google-btn" onClick={signInWithGoogle} disabled={loading}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: 20 }} />
                <span>Google দিয়ে লগইন করুন</span>
              </button>
            </>
          )}

          {/* OTP step */}
          {step === 'otp' && (
            <>
              <p className="cb-label">আপনার ফোনে OTP পাঠানো হয়েছে</p>
              <p className="cb-phone-sent">+88{phone}</p>
              <input
                className="cb-input-otp"
                type="number"
                placeholder="------"
                value={otp}
                onChange={e => setOtp(e.target.value.slice(0, 6))}
                maxLength={6}
              />
              <button className="cb-btn" style={{ marginTop: 16 }} onClick={verifyOtp} disabled={loading}>
                {loading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
              </button>
              <button className="cb-back-btn" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}>
                ← নম্বর পরিবর্তন করুন
              </button>
            </>
          )}

          {error && <p className="cb-error">{error}</p>}
          <div id="recaptcha-container" />
        </div>
      </div>
    </div>
  );
}
