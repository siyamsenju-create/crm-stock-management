const FirestoreModel = require('../config/firestore');
module.exports = new FirestoreModel('users', { role: 'User' });
