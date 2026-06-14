const FirestoreModel = require('../config/firestore');
module.exports = new FirestoreModel('orders', {
  status: 'Pending'
});
