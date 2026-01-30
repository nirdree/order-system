import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Session from '@/models/Session';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

// GET - Fetch single order
export async function GET(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    if (!['staff', 'manager', 'owner'].includes(currentUser.role)) {
      return errorResponse('You do not have access', 403);
    }

    const { id } = await params;

    const order = await Order.findById(id)
      .populate('session', 'sessionId tableNumber')
      .populate('table', 'tableNumber floorNumber')
      .populate('items.menuItem', 'name price imgURL category')
      .populate('orderedBy', 'name email')
      .populate('statusHistory.updatedBy', 'name');

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    return successResponse(
      order,
      'Order retrieved successfully',
      200
    );

  } catch (error) {
    console.error('Order fetch error:', error.message);
    return errorResponse('Failed to fetch order', 500);
  }
}

// PUT - Update order
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    if (!['staff', 'manager', 'owner'].includes(currentUser.role)) {
      return errorResponse('You do not have access to update orders', 403);
    }

    const { id } = await params;

    const targetOrder = await Order.findById(id);
    if (!targetOrder) {
      return errorResponse('Order not found', 404);
    }

    // Cannot modify cancelled orders
    if (targetOrder.orderStatus === 'cancelled') {
      return errorResponse('Cannot modify cancelled order', 400);
    }

    const body = await req.json();

    // If updating status, add to status history
    if (body.orderStatus && body.orderStatus !== targetOrder.orderStatus) {
      if (!targetOrder.statusHistory) {
        targetOrder.statusHistory = [];
      }
      targetOrder.statusHistory.push({
        status: body.orderStatus,
        timestamp: new Date(),
        updatedBy: currentUser._id
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        ...body,
        statusHistory: targetOrder.statusHistory
      },
      { new: true, runValidators: true }
    )
      .populate('session', 'sessionId tableNumber')
      .populate('table', 'tableNumber floorNumber')
      .populate('items.menuItem', 'name price imgURL')
      .populate('orderedBy', 'name email');

    return successResponse(
      updatedOrder,
      'Order updated successfully',
      200
    );

  } catch (error) {
    console.error('Update order error:', error.message);
    return errorResponse('Failed to update order', 500);
  }
}

// DELETE - Cancel order
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    // Only manager and owner can delete orders
    if (!['manager', 'owner'].includes(currentUser.role)) {
      return errorResponse('You do not have access to delete orders', 403);
    }

    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Update order status to cancelled
    order.orderStatus = 'cancelled';
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      updatedBy: currentUser._id
    });
    await order.save();

    // Update session total if order belongs to a session
    if (order.session) {
      const session = await Session.findById(order.session);
      if (session) {
        // Recalculate session total
        const activeOrders = await Order.find({
          session: session._id,
          orderStatus: { $ne: 'cancelled' }
        });
        
        const newTotal = activeOrders.reduce((sum, o) => sum + o.orderAmount, 0);
        session.totalAmount = newTotal;
        await session.save();
      }
    }

    return successResponse(
      null,
      'Order cancelled successfully',
      200
    );

  } catch (error) {
    console.error('Delete order error:', error.message);
    return errorResponse('Failed to delete order', 500);
  }
}