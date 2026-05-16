const express = require('express');
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customer.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const paginate = require('../middlewares/paginate.middleware');
const customerSchemas = require('../validations/customer.validation');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(validate(customerSchemas.list), paginate, getCustomers)
  .post(authorize('Admin', 'Manager'), validate(customerSchemas.create), createCustomer);

router.route('/:id')
  .get(validate(customerSchemas.getById), getCustomerById)
  .put(authorize('Admin', 'Manager'), validate(customerSchemas.update), updateCustomer)
  .delete(authorize('Admin'), validate(customerSchemas.deleteById), deleteCustomer);

module.exports = router;
