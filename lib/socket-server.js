// lib/socket-server.js - WebSocket server setup for real-time notifications
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io = null;

/**
 * Initialize Socket.IO server
 * Should be called once during app startup
 */
export function initializeSocket(server) {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;
    
    if (!token || !userId) {
      return next(new Error('Authentication required'));
    }

    socket.userId = userId;
    socket.token = token;
    next();
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.userId} connected with socket ID: ${socket.id}`);

    // Join user-specific room for direct notifications
    socket.join(`user-${socket.userId}`);

    // Join cafe-wide room for broadcasts
    socket.join('cafe-notifications');

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ User ${socket.userId} disconnected`);
    });

    // Listen for custom events
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 */
export function getIO() {
  if (!io) {
    console.warn('Socket.IO not initialized');
  }
  return io;
}

/**
 * Emit order update to all connected clients
 */
export function emitOrderUpdate(order, eventType = 'order-updated') {
  if (!io) return;
  
  io.to('cafe-notifications').emit(eventType, {
    order,
    timestamp: new Date(),
    eventType
  });

  console.log(`📤 Order event: ${eventType}`, order.orderId);
}

/**
 * Emit session update to all connected clients
 */
export function emitSessionUpdate(session, eventType = 'session-updated') {
  if (!io) return;

  io.to('cafe-notifications').emit(eventType, {
    session,
    timestamp: new Date(),
    eventType
  });

  console.log(`📤 Session event: ${eventType}`, session.sessionId);
}

/**
 * Emit table status update to all connected clients
 */
export function emitTableUpdate(table, eventType = 'table-updated') {
  if (!io) return;

  io.to('cafe-notifications').emit(eventType, {
    table,
    timestamp: new Date(),
    eventType
  });

  console.log(`📤 Table event: ${eventType}`, table.tableNumber);
}

/**
 * Send notification to specific user
 */
export function emitToUser(userId, event, data) {
  if (!io) return;

  io.to(`user-${userId}`).emit(event, {
    ...data,
    timestamp: new Date()
  });

  console.log(`📤 User notification: ${event} to user ${userId}`);
}

/**
 * Send notification to all users
 */
export function broadcastNotification(event, data) {
  if (!io) return;

  io.emit(event, {
    ...data,
    timestamp: new Date()
  });

  console.log(`📤 Broadcast: ${event}`);
}

/**
 * Get connected users count
 */
export function getConnectedUsersCount() {
  if (!io) return 0;
  return io.engine.clientsCount;
}

export default {
  initializeSocket,
  getIO,
  emitOrderUpdate,
  emitSessionUpdate,
  emitTableUpdate,
  emitToUser,
  broadcastNotification,
  getConnectedUsersCount
};
