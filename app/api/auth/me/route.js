import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

export async function GET(req) {
  try {
    await connectDB();
    
    const currentUser = await authenticate(req);
    const user = await User.findById(currentUser.userId);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      salary: user.salary,
      joiningDate: user.joiningDate,
      isActive: user.isActive
    }, 'User retrieved successfully', 200);

  } catch (error) {
    console.log('Auth error:', error.message);
    return errorResponse('Authentication failed', 401);
  }
}