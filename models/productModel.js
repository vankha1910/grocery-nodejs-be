const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  },
  brand: {
    type: String,
    required: true,
  },
  taste: String,
  tags: [String],

  discount: {
    type: Number,
    min: 0,
    max: 100,
  },

  size: {
    type: [
      {
        label: String,
        value: String,
        quantity: Number,
        price: Number,
      },
    ],
    required: true,
  },
  thumbImg: {
    type: String,
    // required: true,
  },
  images: {
    type: [String],
    // required: true,
    // validate: [
    //   {
    //     validator: (value) => value.length <= 5,
    //     message: 'Số lượng ảnh tối đa là 5',
    //   },
    // ],
  },
  rated: Number,
  grindType: [String],
  description: {
    type: String,
    required: true,
    trim: true,
  },
  longDescription: String,
  origin: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// productSchema.pre('save', async function (next) {
//   if (this.isModified('images')) {
//     for (const image of this.images) {
//       if (!image.startsWith('http') && !image.startsWith('data:image')) {
//         return next(new Error('Ảnh không hợp lệ'));
//       }
//     }
//   }
//   next();
// });
// productSchema.pre('save', async function (next) {
//   if (this.isModified('price')) {
//     this.discountPrice = this.price - (this.price * this.discount) / 100;
//   }
//   next();
// });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
