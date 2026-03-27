const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const Product = require('../models/Product');

// GET — dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      preparingOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
      totalProducts,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'confirmed' }),
      Order.countDocuments({ status: 'preparing' }),
      Order.countDocuments({ status: 'out_for_delivery' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Product.countDocuments({ isAvailable: true }),
      Order.find().sort({ createdAt: -1 }).limit(5),
    ]);

    // Total revenue from delivered orders
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        orders: {
          total:          totalOrders,
          pending:        pendingOrders,
          confirmed:      confirmedOrders,
          preparing:      preparingOrders,
          outForDelivery: outForDeliveryOrders,
          delivered:      deliveredOrders,
          cancelled:      cancelledOrders,
        },
        totalProducts,
        totalRevenue,
        recentOrders,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
