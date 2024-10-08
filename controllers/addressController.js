const catchAsync = require('../utils/catchAsync');
const Address = require('../models/addressModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');

exports.getListAddresses = catchAsync(async (req, res, next) => {
  const addresses = await Address.find();
  res.status(200).json({
    status: 'success',
    results: addresses.length,
    data: {
      addresses,
    },
  });
});

exports.createAddress = catchAsync(async (req, res, next) => {
  const user = req.user;
  if (!user) {
    return next(new AppError('Please login first', 401));
  }
  const address = await Address.create({
    user: user._id,
    address: req.body.address,
    name: req.body.name,
    phone: req.body.phone,
  });
  const userToUpdate = await User.findById(user._id);
  userToUpdate.addresses.push(address._id);
  await userToUpdate.save();
  res.status(200).json({
    status: 'success',
    data: {
      address,
    },
  });
});

exports.updateAddress = catchAsync(async (req, res, next) => {
  const user = req.user;
  if (!user) {
    return next(new AppError('Please login first', 401));
  }
  const addressId = req.params.id;
  const address = await Address.findOne({
    _id: addressId,
    user: user._id,
  });
  if (!address) {
    return next(new AppError('No address found with that ID', 404));
  }
  const updatedAddress = await Address.findByIdAndUpdate(addressId, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      address: updatedAddress,
    },
  });
});

exports.deleteAddress = catchAsync(async (req, res, next) => {
  const user = req.user;
  if (!user) {
    return next(new AppError('Please login first', 401));
  }
  const addressId = req.params.id;

  const address = await Address.findOne({
    _id: addressId,
    user: user._id,
  });

  if (!address) {
    return next(new AppError('No address found with that ID', 404));
  }

  await Address.findByIdAndDelete(addressId);

  res.status(204).json({
    status: 'success',
    message: 'Address deleted successfully',
    data: null,
  });
});
