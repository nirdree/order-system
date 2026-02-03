import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Session from '@/models/Session';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

// app/api/orders/[id]/items/[itemId]/route.js
// PUT - Update item quantity in order
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    if (!['staff', 'manager', 'owner',,'admin'].includes(currentUser.role)) {
      return errorResponse('You do not have access', 403);
    }

    const { id, itemId } = await params;
    const body = await req.json();
    const { quantity, specialInstructions } = body;

    // Validate input
    if (!quantity || quantity < 1) {
      return errorResponse('Valid quantity is required', 400);
    }

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Cannot modify cancelled or completed orders
    if (['cancelled', 'completed'].includes(order.orderStatus)) {
      return errorResponse('Cannot modify completed or cancelled orders', 400);
    }

    // Find the item in the order
    let itemObjectId;
    try {
      itemObjectId = new mongoose.Types.ObjectId(itemId);
    } catch (err) {
      return errorResponse('Invalid item ID format', 400);
    }
    
    const itemIndex = order.items.findIndex(
      item => item._id.equals(itemObjectId)
    );

    if (itemIndex === -1) {
      return errorResponse('Item not found in order', 404);
    }

    const oldQuantity = order.items[itemIndex].quantity;

    // Update item
    order.items[itemIndex].quantity = quantity;
    order.items[itemIndex].subtotal = order.items[itemIndex].price * quantity;
    
    if (specialInstructions !== undefined) {
      order.items[itemIndex].specialInstructions = specialInstructions;
    }

    // Recalculate order amount
    order.orderAmount = order.items.reduce((sum, item) => sum + item.subtotal, 0);

    await order.save();

    // Update session total if order belongs to a session
    if (order.session) {
      const session = await Session.findById(order.session);
      if (session) {
        const activeOrders = await Order.find({
          session: session._id,
          orderStatus: { $ne: 'cancelled' }
        });
        session.totalAmount = activeOrders.reduce((sum, o) => sum + o.orderAmount, 0);
        await session.save();
      }
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('session', 'sessionId tableNumber')
      .populate('table', 'tableNumber floorNumber')
      .populate('items.menuItem', 'name price imgURL category')
      .populate('orderedBy', 'name email');

    return successResponse(
      updatedOrder,
      'Item updated successfully',
      200
    );

  } catch (error) {
    console.error('Update order item error:', error.message);
    return errorResponse('Failed to update order item', 500);
  }
}

// DELETE - Remove item from order
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    if (!['staff', 'manager', 'owner','admin'].includes(currentUser.role)) {
      return errorResponse('You do not have access', 403);
    }

    const { id, itemId } = await params;

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Cannot modify cancelled or completed orders
    if (['cancelled', 'completed'].includes(order.orderStatus)) {
      return errorResponse('Cannot modify completed or cancelled orders', 400);
    }

    // Find the item in the order
    let itemObjectId;
    try {
      itemObjectId = new mongoose.Types.ObjectId(itemId);
    } catch (err) {
      return errorResponse('Invalid item ID format', 400);
    }
    
    const itemIndex = order.items.findIndex(
      item => item._id.equals(itemObjectId)
    );

    if (itemIndex === -1) {
      return errorResponse('Item not found in order', 404);
    }

    const deletedItem = order.items[itemIndex];

    // Remove item from order
    order.items.splice(itemIndex, 1);

    // Recalculate order amount
    order.orderAmount = order.items.reduce((sum, item) => sum + item.subtotal, 0);

    await order.save();

    // Update session total if order belongs to a session
    if (order.session) {
      const session = await Session.findById(order.session);
      if (session) {
        const activeOrders = await Order.find({
          session: session._id,
          orderStatus: { $ne: 'cancelled' }
        });
        session.totalAmount = activeOrders.reduce((sum, o) => sum + o.orderAmount, 0);
        await session.save();
      }
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('session', 'sessionId tableNumber')
      .populate('table', 'tableNumber floorNumber')
      .populate('items.menuItem', 'name price imgURL category')
      .populate('orderedBy', 'name email');

    return successResponse(
      updatedOrder,
      'Item removed from order successfully',
      200
    );

  } catch (error) {
    console.error('Delete order item error:', error.message);
    return errorResponse('Failed to delete order item', 500);
  }
}