const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Order = require('../models/Order');

// GET /api/finance/summary?month=2025-04
router.get('/summary', async (req, res) => {
  try {
    const { month } = req.query;
    const start = month ? new Date(`${month}-01`) : new Date(new Date().getFullYear(), 0, 1);
    const end = month ? new Date(new Date(start).setMonth(start.getMonth() + 1)) : new Date();

    const orders = await Order.find({ createdAt: { $gte: start, $lt: end }, status: { $ne: 'cancelled' } });
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    const expenses = await Expense.find({ date: { $gte: start, $lt: end } });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      revenue,
      expenses: totalExpenses,
      profit: revenue - totalExpenses,
      margin: revenue > 0 ? (((revenue - totalExpenses) / revenue) * 100).toFixed(1) : 0,
      orderCount: orders.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/yearly?year=2025
router.get('/yearly', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const result = [];

    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 1);

      const orders = await Order.find({ createdAt: { $gte: start, $lt: end }, status: { $ne: 'cancelled' } });
      const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

      const expenses = await Expense.find({ date: { $gte: start, $lt: end } });
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      result.push({ month: m + 1, revenue, expenses: totalExpenses, profit: revenue - totalExpenses });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/expenses?month=2025-04
router.get('/expenses', async (req, res) => {
  try {
    const { month } = req.query;
    const start = month ? new Date(`${month}-01`) : new Date(0);
    const end = month ? new Date(new Date(start).setMonth(start.getMonth() + 1)) : new Date();
    const expenses = await Expense.find({ date: { $gte: start, $lt: end } }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/expenses
router.post('/expenses', async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/finance/expenses/:id
router.delete('/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;