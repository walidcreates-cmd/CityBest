const express = require('express');
const router = express.Router();
const LiveRate = require('../models/LiveRate');

// Public — liverate page এ দেখাবে
router.get('/', async (req, res) => {
  try {
    const rates = await LiveRate.find({ active: true }).sort({ type: 1, name: 1 });
    res.json(rates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin — rate update
router.post('/update', async (req, res) => {
  try {
    const { id, price } = req.body;
    const updated = await LiveRate.findOneAndUpdate(
      { id },
      { price },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin — seed initial data (একবার run করবে)
router.post('/seed', async (req, res) => {
  try {
    await LiveRate.deleteMany({});
    const initial = [
      { type:'cylinder', id:'omera',       name:'ওমেরা',      price:1250, unit:'১২ কেজি সিলিন্ডার', img:'https://res.cloudinary.com/dpzlzcyuj/image/upload/v1774787034/a7nheq7xjpljr9sshn4f.png' },
      { type:'cylinder', id:'bashundhara', name:'বসুন্ধরা',   price:1260, unit:'১২ কেজি সিলিন্ডার', img:'https://res.cloudinary.com/dpzlzcyuj/image/upload/v1774787467/ijav7iuuwfnzwu9n0pfd.png' },
      { type:'cylinder', id:'jamuna',      name:'যমুনা',      price:1240, unit:'১২ কেজি সিলিন্ডার', img:'https://res.cloudinary.com/dpzlzcyuj/image/upload/v1774787626/nsa6ubcgvqyqibrzkwwl.png' },
      { type:'cylinder', id:'fresh',       name:'ফ্রেশ',      price:1255, unit:'১২ কেজি সিলিন্ডার', img:'https://res.cloudinary.com/dpzlzcyuj/image/upload/v1774786508/o9hi5htwvmcrunb9s2ph.png' },
      { type:'cylinder', id:'laugfs',      name:'লাউগফস',    price:1245, unit:'১২ কেজি সিলিন্ডার', img:'' },
      { type:'cylinder', id:'beximco',     name:'বেক্সিমকো',  price:1250, unit:'১২ কেজি সিলিন্ডার', img:'' },
      { type:'rice', id:'miniket',    name:'মিনিকেট চাল',    price:75,  unit:'প্রতি কেজি', img:'' },
      { type:'rice', id:'nazirshail', name:'নাজিরশাইল চাল', price:85,  unit:'প্রতি কেজি', img:'' },
      { type:'rice', id:'paijam',     name:'পাইজাম চাল',     price:65,  unit:'প্রতি কেজি', img:'' },
      { type:'rice', id:'biroi',      name:'বিরই চাল',       price:70,  unit:'প্রতি কেজি', img:'' },
      { type:'rice', id:'br28',       name:'BR-28 চাল',      price:60,  unit:'প্রতি কেজি', img:'' },
      { type:'rice', id:'chinigura',  name:'চিনিগুড়া চাল',  price:110, unit:'প্রতি কেজি', img:'' },
    ];
    await LiveRate.insertMany(initial);
    res.json({ message: 'Seeded!', count: initial.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;