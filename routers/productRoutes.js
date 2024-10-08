const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/top-rated-product').get(productController.getTopRatedProduct);

router
  .route('/')
  .get(productController.getAllProduct)
  .post(productController.createProduct);

router
  .route('/:id')
  .get(productController.getProduct)
  .patch(productController.updateProduct)
  .delete(authController.protectRoute, productController.deleteProduct);

module.exports = router;
