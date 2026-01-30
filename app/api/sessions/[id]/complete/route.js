import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import Table from '@/models/Table';
import Order from '@/models/Order';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

// PUT - Complete session and generate bill
export async function PUT(req, { params }) {
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

    const session = await Session.findById(id)
      .populate('table', 'tableNumber floorNumber')
      .populate({
        path: 'orders',
        populate: {
          path: 'items.menuItem',
          select: 'name price'
        }
      });

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    if (session.status !== 'active') {
      return errorResponse('Session is not active', 400);
    }

    const body = await req.json();
    const { paymentMethod = 'cash' } = body;

    // Calculate total from all orders
    const activeOrders = session.orders.filter(
      order => order.orderStatus !== 'cancelled'
    );

    const subtotal = activeOrders.reduce((sum, order) => sum + order.orderAmount, 0);
    
    // You can add tax and service charge here
    const tax = subtotal * 0.05; // 5% tax (optional)
    const serviceCharge = subtotal * 0.10; // 10% service charge (optional)
    const total = subtotal + tax + serviceCharge;

    // Update session
    session.status = 'completed';
    session.endTime = new Date();
    session.totalAmount = total;
    session.paymentMethod = paymentMethod;
    session.paymentStatus = 'paid';
    await session.save();

    // Update table status to available
    await Table.findByIdAndUpdate(session.table._id, { status: 'available' });

    // Generate bill data
    const bill = {
      sessionId: session.sessionId,
      tableNumber: session.table.tableNumber,
      startTime: session.startTime,
      endTime: session.endTime,
      customerCount: session.customerCount,
      orders: activeOrders.map(order => ({
        orderId: order.orderId,
        orderedAt: order.orderedAt,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        })),
        orderAmount: order.orderAmount
      })),
      subtotal,
      tax,
      serviceCharge,
      total,
      paymentMethod: session.paymentMethod,
      paymentStatus: session.paymentStatus
    };

    return successResponse(
      bill,
      'Session completed and bill generated successfully',
      200
    );

  } catch (error) {
    console.error('Complete session error:', error.message);
    return errorResponse('Failed to complete session', 500);
  }
}