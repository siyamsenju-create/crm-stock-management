const logger = require('../utils/logger');

/**
 * Registers all Socket.IO event handlers.
 * @param {import('socket.io').Server} io
 */
const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.info('WebSocket: client connected', { socketId: socket.id });

    // ── Client subscribes to a product room ───────────────────────────────
    socket.on('product:subscribe', (productId) => {
      if (typeof productId !== 'string') return;
      socket.join(`product:${productId}`);
      logger.debug('WebSocket: client subscribed to product room', {
        socketId: socket.id,
        productId,
      });
    });

    socket.on('product:unsubscribe', (productId) => {
      socket.leave(`product:${productId}`);
    });

    // ── Ping / Pong (keep-alive check) ───────────────────────────────────
    socket.on('ping', () => {
      socket.emit('pong', { ts: Date.now() });
    });

    // ── Cleanup ───────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info('WebSocket: client disconnected', { socketId: socket.id, reason });
    });

    socket.on('error', (err) => {
      logger.error('WebSocket: socket error', { socketId: socket.id, error: err.message });
    });
  });

  logger.info('WebSocket: socket handlers registered');
};

module.exports = registerSocketHandlers;
