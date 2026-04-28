const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['inventory', 'rent', 'salary', 'delivery', 'tech', 'misc'],
    required: true,
  },
  amount: { type: Number, required: true },
  note: { type: String, default: '' },
  date: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);