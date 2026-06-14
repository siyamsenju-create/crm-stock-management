const admin = require('firebase-admin');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    if (process.env.NODE_ENV === 'test') {
      logger.info('Test mode: using in-memory database');
      return;
    }

    if (!admin.apps.length) {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const path = require('path');
        const fs = require('fs');
        const resolvedPath = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
        if (fs.existsSync(resolvedPath)) {
          admin.initializeApp({
            credential: admin.credential.cert(require(resolvedPath)),
            projectId: process.env.FIREBASE_PROJECT_ID || 'crm-project-management-f21f3'
          });
        } else {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID || 'crm-project-management-f21f3'
          });
        }
      } else {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'crm-project-management-f21f3'
        });
      }
    }

    // Perform a quick verification check
    const db = admin.firestore();
    await db.collection('_health_check').limit(1).get();

    logger.info(`Firebase Firestore Connected successfully (Project: ${admin.app().options.projectId})`);
  } catch (error) {
    logger.error(`Error connecting to Firebase Firestore: ${error.message}`);
    if (error.message.includes('Could not load the default credentials') || error.message.includes('default credentials')) {
      logger.error('================================================================');
      logger.error('⚠️  Missing Firebase Service Account Credentials for Local Dev! ⚠️');
      logger.error('To run the backend locally, please:');
      logger.error('1. Go to Firebase Console -> Project Settings -> Service accounts');
      logger.error('2. Click "Generate new private key" to download the service account JSON');
      logger.error('3. Place the file in the "backend/" folder as "firebase-service-account.json"');
      logger.error('4. Add this line to your backend/.env:');
      logger.error('   GOOGLE_APPLICATION_CREDENTIALS=firebase-service-account.json');
      logger.error('================================================================');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
