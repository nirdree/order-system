import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Settings from '@/models/Settings';
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

    const settings = await Settings.findOne({ isActive: true });

    return successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          salary: user.salary,
          joiningDate: user.joiningDate,
          isActive: user.isActive,
          settings,
        },
       
      },
      'User retrieved successfully',
      200
    );
  } catch (error) {
    console.log('Auth error:', error.message);
    return errorResponse('Authentication failed', 401);
  }
}
