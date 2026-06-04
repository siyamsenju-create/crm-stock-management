const jwt = require('jsonwebtoken');
const axios = require('axios');
const AppError = require('./AppError');

// Correct Firebase public certificate endpoint
const FIREBASE_CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts = {};
let certsExpiry = 0;

/**
 * Fetch Google's public certificates for Firebase token validation using axios.
 * Caches certs according to the Cache-Control max-age header.
 */
async function getGooglePublicCerts() {
  const now = Date.now();

  if (Object.keys(cachedCerts).length > 0 && now < certsExpiry) {
    console.log('[firebaseAuth] Using cached Firebase public certificates');
    return cachedCerts;
  }

  console.log('[firebaseAuth] Fetching Firebase public certificates...');
  console.log('[firebaseAuth] Certificate URL:', FIREBASE_CERT_URL);

  try {
    const response = await axios.get(FIREBASE_CERT_URL, {
      timeout: 10000,
      headers: { Accept: 'application/json' },
    });

    console.log('[firebaseAuth] Certificate fetch success');
    console.log('[firebaseAuth] Certificates received:', Object.keys(response.data));

    // Parse cache expiry from Cache-Control header
    const cacheControl = response.headers['cache-control'] || '';
    let maxAge = 3600; // default 1 hour
    const match = cacheControl.match(/max-age=(\d+)/);
    if (match) {
      maxAge = parseInt(match[1], 10);
    }

    cachedCerts = response.data;
    certsExpiry = now + maxAge * 1000;
    return cachedCerts;
  } catch (error) {
    console.error(
      '[firebaseAuth] Firebase public key fetch error:',
      error.response?.data || error.message
    );
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
  try {
    // Decode header to get the key ID (kid)
    const decodedHeader = jwt.decode(idToken, { complete: true });
    if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
      throw new Error('Invalid ID token format: missing key ID (kid).');
    }

    const kid = decodedHeader.header.kid;

    // Decode payload for diagnostic logging
    const decodedToken = jwt.decode(idToken);

    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      'crm-project-management-f21f3';

    console.log('[firebaseAuth] Expected Project ID:', projectId);
    if (decodedToken) {
      console.log('[firebaseAuth] Decoded Token Audience:', decodedToken.aud);
      console.log('[firebaseAuth] Decoded Token Issuer:', decodedToken.iss);
      console.log('[firebaseAuth] Token Key ID (kid):', kid);
    }

    const certs = await getGooglePublicCerts();
    const cert = certs[kid];

    if (!cert) {
      console.error('[firebaseAuth] Available cert keys:', Object.keys(certs));
      console.error('[firebaseAuth] Requested kid:', kid);
      throw new Error('Invalid ID token: signing key not found in Google certificates.');
    }

    // Cryptographically verify signature, audience, and issuer
    const payload = jwt.verify(idToken, cert, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    });

    console.log('[firebaseAuth] Token verified successfully for:', payload.email);
    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Firebase ID token has expired. Please sign in again.');
    }
    if (error instanceof AppError) {
      throw error;
    }
    console.error('[firebaseAuth] Token verification failed:', error.message);
    throw AppError.unauthorized(`Firebase token verification failed: ${error.message}`);
  }
}

module.exports = { verifyFirebaseIdToken };
