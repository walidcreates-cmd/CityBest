const express  = require('express');
const router   = express.Router();
const Merchant = require('../models/Merchant');

// ── GET all merchants ──────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const merchants = await Merchant.find().sort({ createdAt: -1 });
    res.json(merchants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET single merchant ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const m = await Merchant.findById(req.params.id);
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json(m);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST create merchant ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const merchant = new Merchant(req.body);
    await merchant.save();
    res.status(201).json(merchant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PUT update merchant ────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const m = await Merchant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json(m);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE merchant ────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await Merchant.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET dashboard stats ────────────────────────────────────────────────────
router.get('/stats/dashboard', async (req, res) => {
  try {
    const merchants = await Merchant.find();
    const total = merchants.length;

    // Per-merchant totals
    const withTotals = merchants.map(m => {
      const gasTotal      = m.gasCylindersPerMonth * m.gasPricePerCylinder;
      const riceTotal     = m.riceQty * m.ricePrice + m.whiteRiceQty * m.whiteRicePrice;
      const flourTotal    = m.flourQty * m.flourPrice;
      const grainTotal    = riceTotal + flourTotal;
      const vegTotal      = m.potatoQty*m.potatoPrice + m.onionQty*m.onionPrice +
                            m.garlicGingerQty*m.garlicGingerPrice + m.greenChiliQty*m.greenChiliPrice;
      const oilTotal      = m.oilQtyPerDay*m.oilPrice*30 + m.palmOilQty*m.palmOilPrice;
      const pantryTotal   = oilTotal + m.dalQty*m.dalPrice + m.sugarQty*m.sugarPrice +
                            m.spicesQty*m.spicesPrice + m.teaLeavesQty*m.teaLeavesPrice;
      const proteinTotal  = m.chickenQtyPerDay*m.chickenPrice*30 + m.eggsQtyPerDay*m.eggsPrice*30 +
                            m.beefQtyPerDay*m.beefPrice*30 + m.muttonQtyPerDay*m.muttonPrice*30;
      const grandTotal    = gasTotal + grainTotal + vegTotal + pantryTotal + proteinTotal;

      return {
        _id: m._id,
        merchantName: m.merchantName,
        shopName: m.shopName,
        businessType: m.businessType,
        area: m.area,
        mobileNo: m.mobileNo,
        interestedInCityBest: m.interestedInCityBest,
        followUpStatus: m.followUpStatus,
        gasBrand: m.gasBrand,
        gasCylindersPerMonth: m.gasCylindersPerMonth,
        gasPricePerCylinder: m.gasPricePerCylinder,
        gasTotal, grainTotal, vegTotal, pantryTotal, proteinTotal, grandTotal,
        // product details for per-customer view
        products: {
          rice:        { qty: m.riceQty,          price: m.ricePrice,          total: m.riceQty*m.ricePrice,                   unit:'kg/mo',    cat:'grain'   },
          whiteRice:   { qty: m.whiteRiceQty,      price: m.whiteRicePrice,      total: m.whiteRiceQty*m.whiteRicePrice,           unit:'kg/mo',    cat:'grain'   },
          potato:      { qty: m.potatoQty,         price: m.potatoPrice,         total: m.potatoQty*m.potatoPrice,                unit:'kg/mo',    cat:'veg'     },
          onion:       { qty: m.onionQty,          price: m.onionPrice,          total: m.onionQty*m.onionPrice,                  unit:'kg/mo',    cat:'veg'     },
          oil:         { qty: m.oilQtyPerDay,      price: m.oilPrice,            total: m.oilQtyPerDay*m.oilPrice*30,             unit:'Ltr/day',  cat:'pantry', daily:true },
          palmOil:     { qty: m.palmOilQty,        price: m.palmOilPrice,        total: m.palmOilQty*m.palmOilPrice,              unit:'kg/mo',    cat:'pantry'  },
          flour:       { qty: m.flourQty,          price: m.flourPrice,          total: m.flourQty*m.flourPrice,                  unit:'pack/mo',  cat:'grain'   },
          chicken:     { qty: m.chickenQtyPerDay,  price: m.chickenPrice,        total: m.chickenQtyPerDay*m.chickenPrice*30,     unit:'kg/day',   cat:'protein',daily:true },
          eggs:        { qty: m.eggsQtyPerDay,     price: m.eggsPrice,           total: m.eggsQtyPerDay*m.eggsPrice*30,           unit:'cage/day', cat:'protein',daily:true },
          beef:        { qty: m.beefQtyPerDay,     price: m.beefPrice,           total: m.beefQtyPerDay*m.beefPrice*30,           unit:'kg/day',   cat:'protein',daily:true },
          mutton:      { qty: m.muttonQtyPerDay,   price: m.muttonPrice,         total: m.muttonQtyPerDay*m.muttonPrice*30,       unit:'kg/day',   cat:'protein',daily:true },
          dal:         { qty: m.dalQty,            price: m.dalPrice,            total: m.dalQty*m.dalPrice,                      unit:'kg/mo',    cat:'pantry'  },
          sugar:       { qty: m.sugarQty,          price: m.sugarPrice,          total: m.sugarQty*m.sugarPrice,                  unit:'kg/mo',    cat:'pantry'  },
          spices:      { qty: m.spicesQty,         price: m.spicesPrice,         total: m.spicesQty*m.spicesPrice,                unit:'kg/mo',    cat:'pantry'  },
          teaLeaves:   { qty: m.teaLeavesQty,      price: m.teaLeavesPrice,      total: m.teaLeavesQty*m.teaLeavesPrice,          unit:'kg/mo',    cat:'pantry'  },
          garlicGinger:{ qty: m.garlicGingerQty,  price: m.garlicGingerPrice,   total: m.garlicGingerQty*m.garlicGingerPrice,   unit:'kg/mo',    cat:'veg'     },
          greenChili:  { qty: m.greenChiliQty,     price: m.greenChiliPrice,     total: m.greenChiliQty*m.greenChiliPrice,        unit:'kg/mo',    cat:'veg'     },
        }
      };
    });

    // Aggregate totals
    const aggregates = {
      totalMerchants:   total,
      highPriority:     merchants.filter(m => {
        const score = m.gasCylindersPerMonth*3 + m.riceQty*0.05 + m.flourQty*0.1 +
                      m.chickenQtyPerDay*2 + (m.interestedInCityBest==='Yes'?20:m.interestedInCityBest==='Maybe'?8:0);
        return score >= 50;
      }).length,
      interested:       merchants.filter(m => m.interestedInCityBest === 'Yes').length,
      totalGasCylinders:merchants.reduce((s,m) => s + m.gasCylindersPerMonth, 0),
      totalMarket:      withTotals.reduce((s,m) => s + m.grandTotal, 0),
      byBrand: {},
      byBusinessType: {},
      productTotals: {},
    };

    // By brand
    merchants.forEach(m => {
      if (!m.gasBrand) return;
      if (!aggregates.byBrand[m.gasBrand]) aggregates.byBrand[m.gasBrand] = { count:0, totalCylinders:0, totalSpend:0, prices:[] };
      aggregates.byBrand[m.gasBrand].count++;
      aggregates.byBrand[m.gasBrand].totalCylinders += m.gasCylindersPerMonth;
      aggregates.byBrand[m.gasBrand].totalSpend += m.gasCylindersPerMonth * m.gasPricePerCylinder;
      if (m.gasPricePerCylinder > 0) aggregates.byBrand[m.gasBrand].prices.push(m.gasPricePerCylinder);
    });
    Object.keys(aggregates.byBrand).forEach(b => {
      const prices = aggregates.byBrand[b].prices;
      aggregates.byBrand[b].avgPrice = prices.length ? Math.round(prices.reduce((a,b)=>a+b,0)/prices.length) : 0;
    });

    // By business type
    merchants.forEach(m => {
      const t = m.businessType || 'Other';
      if (!aggregates.byBusinessType[t]) aggregates.byBusinessType[t] = { count:0, gasTotal:0, grandTotal:0 };
      aggregates.byBusinessType[t].count++;
      aggregates.byBusinessType[t].gasTotal    += m.gasCylindersPerMonth * m.gasPricePerCylinder;
      const mData = withTotals.find(x => x._id.toString() === m._id.toString());
      aggregates.byBusinessType[t].grandTotal  += mData ? mData.grandTotal : 0;
    });

    // Product demand totals
    const prodFields = ['rice','whiteRice','potato','onion','oil','palmOil','flour',
                        'chicken','eggs','beef','mutton','dal','sugar','spices','teaLeaves','garlicGinger','greenChili'];
    prodFields.forEach(p => {
      aggregates.productTotals[p] = {
        totalQty:   withTotals.reduce((s,m) => s + (m.products[p]?.qty||0), 0),
        totalSpend: withTotals.reduce((s,m) => s + (m.products[p]?.total||0), 0),
        unit:       withTotals[0]?.products[p]?.unit || '',
        cat:        withTotals[0]?.products[p]?.cat  || '',
        daily:      withTotals[0]?.products[p]?.daily || false,
      };
    });

    res.json({ merchants: withTotals, aggregates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
