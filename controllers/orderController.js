const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

const generateOrderCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Các chữ cái
  const numbers = '0123456789'; // Các chữ số

  let result = '';

  result += chars.charAt(Math.floor(Math.random() * chars.length));

  for (let i = 0; i < 2; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};

exports.getAllOrder = catchAsync(async (req, res, next) => {
  const order = await Order.find();
  res.status(200).json({
    status: 'success',
    results: order.length,
    data: {
      order,
    },
  });
});

exports.getMyOrder = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Order.find({ user: req.user._id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const orders = await features.query;

  const orderAgg = await Order.aggregate([
    {
      $match: { user: req.user._id },
    },
    {
      $group: {
        _id: null,
        all: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        processing: {
          $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] },
        },
        shipped: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
        delivered: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        all: 1,
        pending: 1,
        processing: 1,
        shipped: 1,
        delivered: 1,
        cancelled: 1,
      },
    },
  ]);
  const orderCounts = orderAgg[0] || {};

  res.status(200).json({
    status: 'success',
    results: orders.length,
    count: orderCounts,
    data: {
      orders,
    },
  });
});

exports.getOrderById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});

exports.createOrder = catchAsync(async (req, res, next) => {
  const { products, shippingAddress, paymentMethod, totalPrice } = req.body;
  const userId = req.user._id;

  const productsWithThumb = await Promise.all(
    products.map(async (product) => {
      const productData = await Product.findById(product._id).select(
        'thumbImg'
      );
      return {
        ...product,
        thumbnail: productData.thumbImg, // Thêm thuộc tính thumbnail
      };
    })
  );

  const orderCode = generateOrderCode();

  const order = await Order.create({
    products: productsWithThumb,
    shippingAddress,
    totalPrice,
    paymentMethod,
    orderCode,
    user: userId,
  });

  res.status(201).json({
    status: 'success',
    data: {
      order,
    },
  });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});

exports.deleteOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const orderDeleted = await Order.findByIdAndDelete(id);
  if (!orderDeleted) {
    return next(new AppError('No order found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    message: 'Order deleted successfully!',
    data: null,
  });
});
