const mongoose = require('mongoose');
const Product = require('./productModel');
const schema = mongoose.Schema;

const orderSchema = new schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  products: [
    {
      _id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      size: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      grind: {
        type: String,
        required: true,
      },
      thumbnail: {
        type: String,
      },
      discount: {
        type: Number,
      },
    },
  ],
  shippingAddress: {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
    },
  },
  paymentMethod: {
    type: String,
    enum: ['credit card', 'paypal', 'cod'],
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing',
  },
  orderDate: {
    type: Date,
    default: Date.now(),
  },
  shippingCost: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
  },
  coupon: {
    code: {
      type: String,
    },
    discount: {
      type: Number,
    },
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },
  deliveredAt: {
    type: Date,
  },
  orderCode: {
    type: String,
  },
});

orderSchema.pre(/^find/, function (next) {
  this.populate('user', 'name email').populate(
    'products.product',
    'name thumbImg'
  );
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
