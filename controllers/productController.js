const Product = require('../models/productModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
exports.getAllProduct = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query;

  const totalResult = await Product.countDocuments(features.query.getFilter());
  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    total: totalResult,
    results: products.length,
    data: {
      products,
    },
  });
});

exports.getTopRatedProduct = catchAsync(async (req, res, next) => {
  const products = await Product.find().sort({ rated: -1 }).limit(8);
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products,
    },
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  const newProduct = await Product.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      product: newProduct,
    },
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(201).json({
    status: 'success',
    data: {
      product,
    },
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedProduct) {
    return next(new AppError('Product not found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      product: updatedProduct,
    },
  });
});
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const productDeleted = await Product.findByIdAndDelete(id);

  if (!productDeleted) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    message: 'Product deleted successfully!',
    data: null,
  });
});
