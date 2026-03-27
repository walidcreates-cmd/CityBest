const express = require('express');
const router = express.Router();
const otpStore = {};

// POST /api/otp/send
router.post('/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const fullPhone = phone.startsWith('880') ? phone : phone.startsWith('0') ? '880' + phone.slice(1) : '880' + phone;

    // Save OTP with 5 min expiry
    otpStore[fullPhone] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    // Send SMS via sms.net.bd
    const msg = encodeURIComponent(`CityBest OTP Code is ${otp}. Valid for 5 minutes.`);
    const url = `https://api.sms.net.bd/sendsms?api_key=${process.env.SMS_API_KEY}&msg=${msg}&to=${fullPhone}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error === 0) {
      res.json({ success: true, message: 'OTP sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'SMS sending failed', error: data });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/otp/verify
router.post('/verify', (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP required' });

    const fullPhone = phone.startsWith('880') ? phone : phone.startsWith('0') ? '880' + phone.slice(1) : '880' + phone;
    const record = otpStore[fullPhone];

    if (!record) return res.status(400).json({ success: false, message: 'OTP not found. Please request again.' });
    if (Date.now() > record.expires) {
      delete otpStore[fullPhone];
      return res.status(400).json({ success: false, message: 'OTP expired. Please request again.' });
    }
    if (record.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    delete otpStore[fullPhone];
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;