const express = require('express');
const addressController = require('../controllers/addressController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protectRoute);

router
  .route('/')
  .get(addressController.getListAddresses)
  .post(addressController.createAddress);

router
  .route('/:id')
  .patch(addressController.updateAddress)
  .delete(addressController.deleteAddress);

module.exports = router;
