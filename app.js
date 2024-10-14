const express = require('express');
const morgan = require('morgan');
const app = express();
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const productRouter = require('./routers/productRoutes');
const userRouter = require('./routers/userRoutes');
const orderRouter = require('./routers/orderRoutes');
const addressRouter = require('./routers/addressRoutes');
const cors = require('cors');
dotenv.config({
  path: './config.env',
});

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(
  cors({
    origin: process.env.NODE_ENV.FE_URL,
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(cookieParser());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.NODE_ENV.FE_URL); // Replace with your frontend origin
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Allowed methods
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allowed headers
  res.header('Access-Control-Allow-Credentials', true);
  next();
});
app.use('/api/v1/products', productRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/address', addressRouter);
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

module.exports = app;
