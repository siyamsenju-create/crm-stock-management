const FirestoreModel = require('../config/firestore');
module.exports = new FirestoreModel('products', {
  lowStockThreshold: 10
});
