const mongoose = require('mongoose');

const Property = mongoose.model('property', {
  title: { type: String, required: true, minlength: 1, trim: true },
  address: { type: String, required: true, minlength: 1, trim: true },
  lat: { type: String, required: true },
  long: { type: String, required: true },
  price: { type: Number, required: true },
  beds: { type: Number, required: true },
  baths: { type: Number, required: true },
  sqft: { type: Number, required: true },
  built: { type: Number, default: null },
  lot: { type: Number, default: null },
  description: { type: String, trim: true },
  available: { type: Boolean, default: true },
  forRent: { type: Boolean, default: false },
  forSale: { type: Boolean, default: false },
  postedOn: { type: Number, default: null },
  _creator: { type: mongoose.Schema.Types.ObjectId, required: true }
});

module.exports = { Property };