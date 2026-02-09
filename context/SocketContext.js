// context/SocketContext.js - Client-side WebSocket management
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useUser } from '@/context/UserContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, loading } = useUser();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Initialize Socket.IO connection
  useEffect(() => {
    // Only connect if user is authenticated and not on public pages
    if (loading || !user) {
      return;
    }

    if (typeof window === 'undefined') return;

    // Don't connect on public pages
    const publicPages = ['/', '/login', '/signup', '/menu'];
    const isPublicPage = publicPages.some(page => window.location.pathname.startsWith(page));
    
    if (isPublicPage) {
      return;
    }

    console.log('🔗 Connecting to WebSocket...');

    // Get or create auth token from cookie
    const getToken = () => {
      const value = `; ${document.cookie}`;
      const parts = value.split('; authToken=');
      if (parts.length === 2) return parts.pop().split(';')[0];
      return null;
    };

    const token = getToken();

    if (!token) {
      console.warn('No auth token found for WebSocket connection');
      return;
    }

    // Create socket connection
    const newSocket = io(window.location.origin, {
      auth: {
        token,
        userId: user.id || user._id
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Order events
    newSocket.on('order-created', (data) => {
      console.log('📦 New order:', data.order);
      addNotification({
        type: 'order-created',
        title: `New Order: ${data.order.orderId}`,
        message: `Order created with ${data.order.items.length} item(s)`,
        data: data.order,
        icon: '📦'
      });
    });

    newSocket.on('order-updated', (data) => {
      console.log('🔄 Order updated:', data.order);
      addNotification({
        type: 'order-updated',
        title: `Order Updated: ${data.order.orderId}`,
        message: `Status changed to: ${data.order.orderStatus}`,
        data: data.order,
        icon: '🔄'
      });
    });

    newSocket.on('order-cancelled', (data) => {
      console.log('❌ Order cancelled:', data.order);
      addNotification({
        type: 'order-cancelled',
        title: `Order Cancelled: ${data.order.orderId}`,
        message: `Order has been cancelled`,
        data: data.order,
        icon: '❌'
      });
    });

    // Session events
    newSocket.on('session-created', (data) => {
      console.log('🪑 New session:', data.session);
      addNotification({
        type: 'session-created',
        title: `Table ${data.session.tableNumber} Occupied`,
        message: `New session started`,
        data: data.session,
        icon: '🪑'
      });
    });

    newSocket.on('session-updated', (data) => {
      console.log('🔄 Session updated:', data.session);
      addNotification({
        type: 'session-updated',
        title: `Session Updated`,
        message: `Total amount: ₹${data.session.totalAmount}`,
        data: data.session,
        icon: '💰'
      });
    });

    newSocket.on('session-completed', (data) => {
      console.log('✅ Session completed:', data.session);
      addNotification({
        type: 'session-completed',
        title: `Table ${data.session.tableNumber} Vacated`,
        message: `Final amount: ₹${data.session.totalAmount}`,
        data: data.session,
        icon: '✅'
      });
    });

    // Table events
    newSocket.on('table-updated', (data) => {
      console.log('🪑 Table status updated:', data.table);
      addNotification({
        type: 'table-updated',
        title: `Table ${data.table.tableNumber}`,
        message: `Status: ${data.table.status}`,
        data: data.table,
        icon: '🪑'
      });
    });

    // Generic notification
    newSocket.on('notification', (data) => {
      console.log('📢 Notification:', data);
      addNotification({
        type: 'notification',
        title: data.title || 'Notification',
        message: data.message,
        data,
        icon: '📢'
      });
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user, loading]);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const notif = {
      id,
      ...notification,
      timestamp: new Date()
    };

    setNotifications(prev => [notif, ...prev]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  }, [socket, isConnected]);

  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
  }, [socket]);

  const value = {
    socket,
    isConnected,
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    emit,
    on
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
