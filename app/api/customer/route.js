import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Session from '@/models/Session';
import Table from '@/models/Table';
import MenuItem from '@/models/MenuItem';
import Settings from '@/models/Settings';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { generateToken } from '@/middleware/auth';
export const runtime = 'nodejs';

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return distance;
}

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
      location,
      token
    } = body;
    
    const ipAddress = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
    
    // Validate required fields
    const isValidLocation = location &&
      typeof location === 'object' &&
      location.latitude !== undefined &&
      location.longitude !== undefined;
      
    if (!isValidLocation) {
      return errorResponse('Valid location is required', 400);
    }

    // Check if restaurant location is configured in settings
    const settings = await Settings.findOne({ isActive: true });
    
    if (!settings) {
      return errorResponse('Online location is not set. Please contact restaurant admin.', 400);
    }

    // Validate that settings has location data
    if (!settings.locationLatitude || !settings.locationLongitude || !settings.locationAccuracy) {
      return errorResponse('Online location is not set. Please contact restaurant admin.', 400);
    }

    // Calculate distance between customer location and restaurant location
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      settings.locationLatitude,
      settings.locationLongitude
    );

    // Check if customer is within 50 meters of restaurant
    const MAX_DISTANCE = settings.locationAccuracy || 50; // 50 meters
    if (distance > MAX_DISTANCE) {
      return errorResponse(
        `You must be within ${MAX_DISTANCE} meters of the restaurant to place an order. Current distance: ${Math.round(distance)} meters.`,
        403
      );
    }

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
      generatedToken = await generateToken("0", "customer");
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
        token: generatedToken,
        customerLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy || null,
          timestamp: new Date()
        }
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
        generatedToken = await generateToken("0", "customer");
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
      customerLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || null,
        distance: Math.round(distance),
        timestamp: new Date()
      },
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

    // Prepare response
    const response = {
      order: populatedOrder,
      session: {
        sessionId: session.sessionId,
        tableNumber: session.tableNumber,
        totalAmount: session.totalAmount
      },
      locationVerified: true,
      distance: Math.round(distance)
    };

    // Add token to response only if it was generated and is not undefined
    if (generatedToken !== undefined && generatedToken !== null) {
      response.token = generatedToken;
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