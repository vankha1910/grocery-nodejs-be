const mongoose = require('mongoose');
const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  address: String,
  name: String,
  phone: String,
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
