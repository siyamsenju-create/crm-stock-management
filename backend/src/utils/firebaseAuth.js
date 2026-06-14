const jwt = require('jsonwebtoken');
const axios = require('axios');
const AppError = require('./AppError');
const logger = require('./logger');

// Firebase public certificate endpoint (Google-maintained)
const FIREBASE_CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts = {};
let certsExpiry = 0;

/**
 * Fetch Google's public certificates for Firebase token validation.
 * Caches certs according to the Cache-Control max-age header.
 */
async function getGooglePublicCerts() {
  const now = Date.now();

  if (Object.keys(cachedCerts).length > 0 && now < certsExpiry) {
    logger.debug('[firebaseAuth] Using cached Firebase public certificates');
    return cachedCerts;
  }

  logger.debug('[firebaseAuth] Fetching Firebase public certificates');

  try {
    const response = await axios.get(FIREBASE_CERT_URL, {
      timeout: 10000,
      headers: { Accept: 'application/json' },
    });

    // Parse cache expiry from Cache-Control header
    const cacheControl = response.headers['cache-control'] || '';
    let maxAge = 3600; // default 1 hour
    const match = cacheControl.match(/max-age=(\d+)/);
    if (match) {
      maxAge = parseInt(match[1], 10);
    }

    cachedCerts = response.data;
    certsExpiry = now + maxAge * 1000;

    logger.debug('[firebaseAuth] Firebase certificates refreshed', {
      keyCount: Object.keys(cachedCerts).length,
      expiresInSeconds: maxAge,
    });

    return cachedCerts;
  } catch (error) {
    logger.error('[firebaseAuth] Failed to fetch Firebase public certificates', {
      message: error.message,
    });
    throw new Error(`Failed to fetch Firebase public certificates: ${error.message}`);
  }
}

/**
 * Decodes and cryptographically verifies a Firebase Google ID token.
 * Validates issuer, audience, and signature using RS256 algorithm.
 *
 * @param {string} idToken
 * @returns {Promise<Object>} Verified payload containing email, name, etc.
 */
async function verifyFirebaseIdToken(idToken) {
  // Decode header to get the key ID (kid) — no secrets logged here
  const decodedHeader = jwt.decode(idToken, { complete: true });
  if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
    throw AppError.unauthorized('Invalid ID token format: missing key ID (kid).');
  }

  const kid = decodedHeader.header.kid;

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    'crm-project-management-f21f3';

  const certs = await getGooglePublicCerts();
  const cert = certs[kid];

  if (!cert) {
    logger.error('[firebaseAuth] Signing key not found in Google certificates', {
      requestedKid: kid,
      availableKids: Object.keys(certs),
    });
    throw AppError.unauthorized('Invalid ID token: signing key not found.');
  }

  try {
    // Cryptographically verify signature, audience, and issuer
    const payload = jwt.verify(idToken, cert, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    });

    logger.debug('[firebaseAuth] Firebase token verified successfully');
    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Firebase ID token has expired. Please sign in again.');
    }
    logger.error('[firebaseAuth] Token verification failed', { message: error.message });
    throw AppError.unauthorized('Firebase token verification failed.');
  }
}

module.exports = { verifyFirebaseIdToken };
