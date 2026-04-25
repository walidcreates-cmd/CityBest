const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id:      { type:String, required:true, unique:true },
  label:   { type:String, required:true },
  emoji:   { type:String, default:'' },
  image:   { type:String, default:'' },
  bg:      { type:String, default:'#f0fdf4' },
  accent:  { type:String, default:'#16a34a' },
  visible: { type:Boolean, default:true },
  order:   { type:Number, default:0 },
}, { timestamps:true });

module.exports = mongoose.model('Category', categorySchema);
