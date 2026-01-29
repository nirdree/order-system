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

    const { id } =await params;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return errorResponse('User not found', 404);
    }

    if (currentUser.role === 'staff') {
      return errorResponse('You do not have access', 403);
    }

    if (
      currentUser.role === 'manager' &&
      targetUser.role !== 'staff'
    ) {
      return errorResponse(
        'Manager can update staff only',
        403
      );
    }

    const body = await req.json();

    if (body.role && body.role === 'owner') {
      return errorResponse('Cannot assign owner role', 403);
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

    if (!currentUser?.role || currentUser.role !== 'owner') {
      return errorResponse(
        'Only owner can delete users',
        403
      );
    }

    const { id } =await params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    if (user.role === 'owner') {
      return errorResponse(
        'Cannot delete owner account',
        403
      );
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
