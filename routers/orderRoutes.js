const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protectRoute);

router.route('/my-orders').get(orderController.getMyOrder);

router
  .route('/')
  .get(orderController.getAllOrder)
  .post(orderController.createOrder);

router
  .route('/:id')
  .get(orderController.getOrderById)
  .patch(orderController.updateOrderStatus)
  .delete(orderController.deleteOrder);

module.exports = router;
