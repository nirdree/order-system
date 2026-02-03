import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Session from '@/models/Session';
import Table from '@/models/Table';
import MenuItem from '@/models/MenuItem';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

// GET - Fetch all orders
export async function GET(req) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    if (!['staff', 'manager', 'owner', "admin"].includes(currentUser.role)) {
      return errorResponse('You do not have access', 403);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const orderType = searchParams.get('orderType');
    const placedBy = searchParams.get('placedBy');
    const sessionId = searchParams.get('sessionId');
    const tableId = searchParams.get('tableId');
    const searchTerm = searchParams.get('search');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    let filter = {};

    // Filter by status
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    // Filter by order type
    if (orderType && orderType !== 'all') {
      filter.orderType = orderType;
    }

    // Filter by placed by
    if (placedBy && placedBy !== 'all') {
      filter.placedBy = placedBy;
    }

    // Filter by session
    if (sessionId) {
      filter.session = sessionId;
    }

    // Filter by table
    if (tableId) {
      filter.table = tableId;
    }

    // Search by order ID
    if (searchTerm) {
      filter.orderId = { $regex: searchTerm, $options: 'i' };
    }

    const totalCount = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate('session', 'sessionId tableNumber')
      .populate('table', 'tableNumber floorNumber')
      .populate('items.menuItem', 'name price imgURL')
      .populate('orderedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return successResponse(
      {
        orders,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      },
      'Orders retrieved successfully',
      200
    );

  } catch (error) {
    console.error('Orders fetch error:', error.message);
    return errorResponse('Failed to fetch orders', 500);
  }
}

// POST - Create new order (staff-initiated)
export async function POST(req) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    if (!['staff', 'manager', 'owner'].includes(currentUser.role)) {
      return errorResponse('You do not have access to create orders', 403);
    }

    const body = await req.json();
    const {
      sessionId,
      tableId,
      orderType = 'dine-in',
      items,
      customerNotes
    } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return errorResponse('Order must have at least one item', 400);
    }

    // For dine-in orders, sessionId is required
    if (orderType === 'dine-in' && !sessionId) {
      return errorResponse('Session ID is required for dine-in orders', 400);
    }

    // For counter orders, sessionId should be null
    let session = null;
    let table = null;

    if (orderType === 'dine-in') {
      // Verify session exists and is active
      session = await Session.findById(sessionId);
      if (!session) {
        return errorResponse('Session not found', 404);
      }
      if (session.status !== 'active') {
        return errorResponse('Session is not active', 400);
      }
      table = session.table;
    }

    // Validate and prepare order items
    const orderItems = [];
    let totalAmount = 0;
    let maxPreparationTime = 15;

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return errorResponse(`Menu item ${item.menuItemId} not found`, 404);
      }

      if (!menuItem.available) {
        return errorResponse(`${menuItem.name} is not available`, 400);
      }

      const subtotal = menuItem.price * item.quantity;
      totalAmount += subtotal;

      // Track the maximum preparation time
      if (menuItem.preparationTime) {
        maxPreparationTime = Math.max(maxPreparationTime, menuItem.preparationTime);
      }

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        subtotal,
        specialInstructions: item.specialInstructions || ''
      });
    }
    const orderIdNext = await Order.countDocuments().then(count => count + 1);
    // Create order
    const order = await Order.create({
      session: session?._id || null,
      orderId: `Order ID-${orderIdNext}`,
      table: table || null,
      orderType,
      placedBy: 'staff',
      items: orderItems,
      orderAmount: totalAmount,
      orderedBy: currentUser.userId,
      customerNotes,
      estimatedTime: maxPreparationTime,
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        updatedBy: currentUser.userId
      }]
    });

    // If dine-in order, update session
    if (session) {
      session.orders.push(order._id);
      await session.save();
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('session', 'sessionId tableNumber')
      .populate('table', 'tableNumber floorNumber')
      .populate('items.menuItem', 'name price imgURL')
      .populate('orderedBy', 'name email');

    return successResponse(
      populatedOrder,
      'Order created successfully',
      201
    );

  } catch (error) {
    console.error('Create order error:', error.message);
    return errorResponse('Failed to create order', 500);
  }
}