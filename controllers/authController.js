const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

const filteredUserField = (user) => {
  const userObj = user.toObject() ? user.toObject() : { ...user };

  delete userObj.__v;
  delete userObj.passwordChangedAt;
  delete userObj.role;
  delete userObj.password;

  return userObj;
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

const createSendToken = async (user, statusCode, res) => {
  const accessToken = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? true : false,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };
  res.cookie('refreshToken', refreshToken, cookieOptions);
  // Remove password from output
  const filteredUser = filteredUserField(user);
  res.status(statusCode).json({
    status: 'success',
    token: accessToken,
    data: {
      user: filteredUser,
    },
  });
};

exports.refreshToken = catchAsync(async (req, res, next) => {
  const refreshToken = req?.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: 'Invalid refresh token',
      });
    }
    const newAccessToken = signToken(decoded.id);
    res.status(200).json({
      status: 'success',
      token: newAccessToken,
    });
  });
});

exports.signup = catchAsync(async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    // console.log(`newUser is ${newUser}`);
    createSendToken(newUser, 201, res);
  } catch (error) {
    // Handle createUser errors gracefully
    console.error(error); // Log the error for debugging

    // Check for specific error types (e.g., validation errors, duplicate emails)
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    } else if (error.name === 'MongoError' && error.code === 11000) {
      // Duplicate email
      return res.status(400).json({ message: 'Email already exists' });
    } else {
      // Handle other errors
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  // console.log(user);
  if (!user || !(await user.correctPassword(password, user.password))) {
    // return next(new AppError('Incorrect email or password', 401));
    return res.status(401).json({ message: 'Incorrect email or password' });
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('refreshToken', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Chỉ bật secure trong production
    sameSite: 'Lax',
  });
  res.status(200).json({ status: 'success', message: 'Logged out!' });
};

exports.protectRoute = catchAsync(async (req, res, next) => {
  // Getting token from request headers
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res
      .status(401)
      .json({ message: 'You are not logged in! Please log in to get access.' });
  }

  // Verification token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    // Token expired or invalid
    return res
      .status(401)
      .json({ message: 'Invalid or expired token, please log in again.' });
  }

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return res.status(401).json({
      message: 'The user belonging to this token does no longer exist.',
    });
  }

  // Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return res.status(401).json({
      message: 'User recently changed password! Please log in again.',
    });
  }

  // Grant access to the protected route
  req.user = currentUser;
  next();
});
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.newPassword;
  // user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

exports.checkLogin = catchAsync(async (req, res, next) => {
  // Getting token from request
  let token = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token || token === 'null') {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  // Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user exist
  const currentUser = await User.findById(decoded.id);
  const filteredUser = filteredUserField(currentUser);

  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: filteredUser,
    },
  });
});

exports.updateAvatar = catchAsync(async (req, res, next) => {
  if (!req.body.avatar) {
    return next(new AppError('Please provide a file ', 400));
  }
  const user = await User.findByIdAndUpdate(req.user.id, {
    avatar: req.body.avatar,
  });

  const filteredUser = filteredUserField(user);

  res.status(200).json({
    status: 'success',
    data: {
      user: filteredUser,
    },
  });
});
exports.updateUserInfo = catchAsync(async (req, res, next) => {
  const { name, address, phoneNumber } = req.body;

  if (!name && !address && !phoneNumber) {
    return next(
      new AppError(
        'Please provide name, address or phone number to update.',
        400
      )
    );
  }

  // Tạo một object để lưu các trường cần cập nhật
  const updateData = {};
  if (name) updateData.name = name;
  if (address) updateData.address = address;
  if (phoneNumber) updateData.phoneNumber = phoneNumber;

  const user = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  const filteredUser = filteredUserField(user);

  res.status(200).json({
    status: 'success',
    data: {
      user: filteredUser,
    },
  });
});
