const FirestoreModel = require('../config/firestore');
module.exports = new FirestoreModel('customers', {
  status: 'Active',
  ordersCount: 0,
  totalSpent: 0
});
