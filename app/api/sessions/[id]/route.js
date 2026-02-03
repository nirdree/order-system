import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import Table from '@/models/Table';
import Order from '@/models/Order';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

// GET - Fetch single session with all orders
export async function GET(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    if (!['staff', 'manager', 'owner' , 'admin'].includes(currentUser.role)) {
      return errorResponse('You do not have access', 403);
    }

    const { id } = await params;

    const session = await Session.findById(id)
      .populate('table', 'tableNumber floorNumber capacity location')
      .populate({
        path: 'orders',
        populate: {
          path: 'items.menuItem',
          select: 'name price imgURL'
        }
      })
      .populate('createdBy', 'name email');

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    return successResponse(
      session,
      'Session retrieved successfully',
      200
    );

  } catch (error) {
    console.error('Session fetch error:', error.message);
    return errorResponse('Failed to fetch session', 500);
  }
}

// PUT - Update session
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    if (!['staff', 'manager', 'owner','admin'].includes(currentUser.role)) {
      return errorResponse('You do not have access to update sessions', 403);
    }

    const { id } = await params;

    const targetSession = await Session.findById(id);
    if (!targetSession) {
      return errorResponse('Session not found', 404);
    }

    const body = await req.json();

    // Prevent updating completed or cancelled sessions
    if (targetSession.status !== 'active' && body.status === 'active') {
      return errorResponse('Cannot reactivate completed or cancelled session', 400);
    }

    const updatedSession = await Session.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    )
      .populate('table', 'tableNumber floorNumber')
      .populate('orders')
      .populate('createdBy', 'name email');

    return successResponse(
      updatedSession,
      'Session updated successfully',
      200
    );

  } catch (error) {
    console.error('Update session error:', error.message);
    return errorResponse('Failed to update session', 500);
  }
}

// DELETE - Cancel session
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    // Only manager and owner can delete sessions
    if (!['manager', 'owner'].includes(currentUser.role)) {
      return errorResponse('You do not have access to delete sessions', 403);
    }

    const { id } = await params;

    const session = await Session.findById(id);
    if (!session) {
      return errorResponse('Session not found', 404);
    }

    // Cancel all orders in the session
    await Order.updateMany(
      { session: id, orderStatus: { $ne: 'cancelled' } },
      { orderStatus: 'cancelled' }
    );

    // Update session status to cancelled
    session.status = 'cancelled';
    session.endTime = new Date();
    await session.save();

    // Update table status to available
    await Table.findByIdAndUpdate(session.table, { status: 'available' });

    return successResponse(
      null,
      'Session cancelled successfully',
      200
    );

  } catch (error) {
    console.error('Delete session error:', error.message);
    return errorResponse('Failed to delete session', 500);
  }
}