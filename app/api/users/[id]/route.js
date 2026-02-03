import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

export async function PUT(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    const { id } = await params;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return errorResponse('User not found', 404);
    }

    // Staff cannot update anyone
    if (currentUser.role === 'staff') {
      return errorResponse('You do not have access', 403);
    }

    // Manager can only update staff
    if (currentUser.role === 'manager' && targetUser.role !== 'staff') {
      return errorResponse('Manager can update staff only', 403);
    }

    // Owner cannot update admin
    if (currentUser.role === 'owner' && targetUser.role === 'admin') {
      return errorResponse('Owner cannot update admin users', 403);
    }

    const body = await req.json();

    // Owner cannot change role to admin
    if (currentUser.role === 'owner' && body.role === 'admin') {
      return errorResponse('Owner cannot assign admin role', 403);
    }

    // Owner cannot change role to owner
    if (currentUser.role === 'owner' && body.role === 'owner' && targetUser.role !== 'owner') {
      return errorResponse('Cannot assign owner role', 403);
    }

    // Admin cannot change role to admin (optional)
    if (currentUser.role === 'admin' && body.role === 'admin' && targetUser.role !== 'admin') {
      return errorResponse('Cannot assign admin role', 403);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).select(
      'name email role phone salary joiningDate isActive'
    );

    return successResponse(
      updatedUser,
      'User updated successfully',
      200
    );

  } catch (error) {
    console.error('Update user error:', error.message);
    return errorResponse('Failed to update user', 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Unauthorized', 403);
    }

    // Only admin and owner can delete
    if (!['admin', 'owner'].includes(currentUser.role)) {
      return errorResponse('Only admin or owner can delete users', 403);
    }

    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Owner cannot delete admin
    if (currentUser.role === 'owner' && user.role === 'admin') {
      return errorResponse('Owner cannot delete admin users', 403);
    }

    // Owner cannot delete owner
    if (currentUser.role === 'owner' && user.role === 'owner') {
      return errorResponse('Cannot delete owner account', 403);
    }

    // Admin cannot delete admin (optional)
    if (currentUser.role === 'admin' && user.role === 'admin') {
      return errorResponse('Cannot delete admin account', 403);
    }

    await User.findByIdAndDelete(id);

    return successResponse(
      null,
      'User deleted successfully',
      200
    );

  } catch (error) {
    console.error('Delete user error:', error.message);
    return errorResponse('Failed to delete user', 500);
  }
}