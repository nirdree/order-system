import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Session from '@/models/Session';
import Table from '@/models/Table';
import MenuItem from '@/models/MenuItem';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { generateToken } from '@/middleware/auth';
export const runtime = 'nodejs';

// POST - Create customer order (No authentication required)
export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      tableId,
      items,
      customerName,
      customerPhone,
      customerNotes,
      token
    } = body;

    // Validate required fields
    if (!tableId) {
      return errorResponse('Table ID is required', 400);
    }

    if (!items || items.length === 0) {
      return errorResponse('Order must have at least one item', 400);
    }

    // Check if table exists
    const table = await Table.findById(tableId);
    if (!table) {
      return errorResponse('Table not found', 404);
    }

    // Check if table is active
    if (!table.isActive) {
      return errorResponse('This table is not available for ordering', 400);
    }

    // Find or create active session for this table
    let session = await Session.findOne({
      table: tableId,
      status: 'active'
    });
    
    let isNewSession = false;
    let generatedToken = null;

    // If no active session exists, create one
    if (!session) {
      // Generate token for new session
      generatedToken = await generateToken("0" , "customer");
      isNewSession = true;

      session = await Session.create({
        table: tableId,
        tableNumber: table.tableNumber,
        customerCount: 1,
        customerName,
        customerPhone,
        initiatedBy: 'customer',
        isCustomerSelfService: true,
        createdBy: null,
        token: generatedToken
      });

      // Update table status to occupied
      await Table.findByIdAndUpdate(tableId, { status: 'occupied' });
    } else {
      // Existing session - check token if provided
      if (token && token !== session.token) {
        return errorResponse('Invalid session token', 401);
      }

      // If session exists but no token is assigned, generate and assign one
      if (!session.token) {
        generatedToken = await generateToken("0" , "customer");
        session.token = generatedToken;
      }

      // Update customer info if provided and not already set
      if (customerName && !session.customerName) {
        session.customerName = customerName;
      }
      if (customerPhone && !session.customerPhone) {
        session.customerPhone = customerPhone;
      }
      
      await session.save();
    }

    // Validate and prepare order items
    const orderItems = [];
    let totalAmount = 0;
    let maxPrepTime = 0;

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return errorResponse(`Menu item ${item.menuItemId} not found`, 404);
      }

      if (!menuItem.available) {
        return errorResponse(`${menuItem.name} is currently not available`, 400);
      }

      if (!menuItem.isActive) {
        return errorResponse(`${menuItem.name} is not active`, 400);
      }

      const subtotal = menuItem.price * item.quantity;
      totalAmount += subtotal;
      maxPrepTime = Math.max(maxPrepTime, menuItem.preparationTime || 15);

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
       orderId: `Order ID-${orderIdNext}`,
      session: session._id,
      table: tableId,
      orderType: 'dine-in',
      placedBy: 'customer',
      items: orderItems,
      orderAmount: totalAmount,
      orderedBy: null,
      customerNotes,
      notifyCustomer: !!customerPhone,
      estimatedTime: maxPrepTime,
      statusHistory: [{
        status: 'pending',
        timestamp: new Date()
      }]
    });

    // Update session
    session.orders.push(order._id);
    session.totalAmount = (session.totalAmount || 0) + totalAmount;
    await session.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('session', 'sessionId tableNumber')
      .populate('table', 'tableNumber floorNumber')
      .populate('items.menuItem', 'name price imgURL preparationTime');

    // Prepare response - include token only if session is new or didn't have one previously
    const response = {
      order: populatedOrder,
      session: {
        sessionId: session.sessionId,
        tableNumber: session.tableNumber,
        totalAmount: session.totalAmount
      }
    };

    // Add token to response only if it's a new session or we just generated one
    if (isNewSession || generatedToken) {
      response.token = generatedToken || session.token;
    }

    return successResponse(
      response,
      'Order placed successfully',
      201
    );

  } catch (error) {
    console.error('Customer order error:', error.message);
    return errorResponse('Failed to place order', 500);
  }
}