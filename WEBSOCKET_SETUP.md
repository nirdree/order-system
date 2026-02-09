# WebSocket Real-Time Order Notifications System

## Overview
This document explains the WebSocket integration for real-time order notifications in the Pocket Cafe system.

## Architecture

### Components Added:
1. **Socket.io Server** (`lib/socket-server.js`)
   - Manages WebSocket connections
   - Broadcasts order, session, and table updates
   - Handles authentication and room management

2. **Socket Context** (`context/SocketContext.js`)
   - Client-side WebSocket connection management
   - Event listeners and notifications
   - Auto-reconnection with exponential backoff

3. **Toast Notifications** (`components/Toast.jsx`, `components/ToastContainer.jsx`)
   - Visual notification system
   - Auto-dismiss after 5 seconds
   - Different types: success, error, warning, info

4. **Integration Points**
   - Order API routes emit events on create/update/delete
   - Session API routes emit events on create/complete
   - Table API routes emit events on status change

## Real-Time Events

### Order Events
- `order-created` - New order placed
- `order-updated` - Order status changed
- `order-cancelled` - Order cancelled/deleted

### Session Events
- `session-created` - New table session started
- `session-updated` - Session amount updated
- `session-completed` - Session completed, table vacated

### Table Events
- `table-updated` - Table status changed

## How to Use

### Installation
```bash
npm install
```

### Starting the Server
```bash
npm run dev
```

The WebSocket server is automatically initialized when the app starts.

### Client-Side Integration

#### 1. Using Socket Context in Components
```javascript
import { useSocket } from '@/context/SocketContext';

export default function MyComponent() {
  const { isConnected, notifications, emit, on } = useSocket();

  useEffect(() => {
    // Listen to order updates
    const unsubscribe = on('order-updated', (data) => {
      console.log('Order updated:', data.order);
    });

    return unsubscribe;
  }, [on]);

  return (
    <div>
      Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}
      Notifications: {notifications.length}
    </div>
  );
}
```

#### 2. Using Toast Notifications
Notifications appear automatically through the Socket Context. They're displayed via `ToastContainer` in the root layout.

### Event Examples

#### Order Created Event
```javascript
{
  order: {
    _id: "...",
    orderId: "ORD-1234567890",
    items: [...],
    orderAmount: 250.50,
    orderStatus: "pending",
    ...
  },
  timestamp: "2026-02-10T10:30:00Z",
  eventType: "order-created"
}
```

#### Order Updated Event
```javascript
{
  order: {
    _id: "...",
    orderId: "ORD-1234567890",
    orderStatus: "preparing",  // Status changed
    ...
  },
  timestamp: "2026-02-10T10:35:00Z",
  eventType: "order-updated"
}
```

## Authentication

WebSocket connections require authentication:
- Token is extracted from `authToken` cookie
- User ID is obtained from the token payload
- Unauthenticated connections are rejected

## Connection Management

### Auto-Reconnection
- Automatic reconnection with exponential backoff
- Max 5 reconnection attempts
- Delay: 1s → 2s → 4s → 8s → 16s

### Connection States
- `isConnected` - Boolean indicating connection status
- Automatic recovery on network loss
- Manual connection available via socket instance

## Performance Considerations

1. **Event Deduplication**
   - Socket events are sent via broadcast
   - Each client updates its own state
   - No unnecessary API calls

2. **Memory Management**
   - Notifications auto-clear after 5 seconds
   - Socket listeners properly unsubscribed on unmount
   - Connection pooling handled by Socket.io

3. **Bandwidth Optimization**
   - Only connected clients receive updates
   - Selective event broadcasting to specific rooms
   - Minimal payload size

## Troubleshooting

### Connection Issues
1. Check browser console for connection errors
2. Verify auth token in cookies
3. Ensure backend server is running
4. Check firewall/proxy settings

### Missing Notifications
1. Verify SocketProvider wraps the app
2. Check event names match socket handlers
3. Ensure useSocket is called within SocketProvider
4. Check network tab for WebSocket connection

### Performance Issues
1. Reduce notification duration in Toast.jsx
2. Implement pagination for large order lists
3. Use virtualization for long lists
4. Debounce frequent updates

## Testing

### Manual Testing
1. Open orders page in two browser windows
2. Create/update an order in one window
3. Verify real-time update in other window
4. Check notification toast appears

### Test Commands
```bash
# Monitor WebSocket connections
# Open browser DevTools → Network → WS

# View Socket.IO traffic
# Open browser console and check logs
```

## Future Enhancements

1. **Persistent Storage**
   - Store notifications in localStorage
   - Resume on reconnection

2. **Advanced Filtering**
   - Subscribe to specific tables/sessions
   - Role-based event filtering

3. **Analytics**
   - Track connection metrics
   - Monitor event throughput

4. **Push Notifications**
   - Browser push for important events
   - Mobile app integration

## Files Modified/Created

### Created:
- `lib/socket-server.js` - WebSocket server setup
- `context/SocketContext.js` - Client-side socket management
- `components/Toast.jsx` - Toast notification component
- `components/ToastContainer.jsx` - Toast container component

### Modified:
- `package.json` - Added socket.io dependencies
- `app/layout.js` - Wrapped with SocketProvider
- `app/api/orders/route.js` - Added WebSocket events
- `app/api/orders/[id]/route.js` - Added WebSocket events
- `app/api/sessions/route.js` - Added WebSocket events
- `app/(Producted)/orders/page.js` - Added real-time listeners

## Support

For issues or questions:
1. Check browser console logs
2. Verify Socket.IO is loaded (DevTools Network)
3. Check auth token is valid
4. Review event handlers in SocketContext
