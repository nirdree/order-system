import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

export async function GET(req) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    if (currentUser.role === 'staff') {
      return errorResponse('You do not have access', 403);
    }

    let filter = {};

    if (currentUser.role === 'manager') {
      filter = { role: 'staff' };
    }

    if (currentUser.role === 'owner') {
      // Owner can see everyone except admin
      filter = { role: { $ne: 'admin' } };
    }

    if (currentUser.role === 'admin') {
      // Admin can see everyone
      filter = {};
    }

    // Use lean() to get plain JS objects - much faster
    const users = await User.find(filter)
      .select('name email role phone salary joiningDate isActive')
      .lean()
      .exec();

    return successResponse(
      users,
      'Users retrieved successfully',
      200
    );

  } catch (error) {
    console.error('User fetch error:', error.message);
    return errorResponse('Failed to fetch users', 500);
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Unauthorized', 403);
    }

    // Only admin and owner can create users
    if (!['admin', 'owner'].includes(currentUser.role)) {
      return errorResponse('Only admin or owner can create users', 403);
    }

    const body = await req.json();
    const {
      name,
      email,
      role,
      phone,
      salary,
      joiningDate,
      isActive = true,
      password,
    } = body;

    if (!name || !email || !role || !password) {
      return errorResponse('Required fields are missing', 400);
    }

    // Owner cannot create admin
    if (currentUser.role === 'owner' && role === 'admin') {
      return errorResponse('Owner cannot create admin users', 403);
    }

    // Owner cannot create another owner
    if (currentUser.role === 'owner' && role === 'owner') {
      return errorResponse('Cannot create another owner', 403);
    }

    // Admin cannot create another admin (optional restriction)
    if (currentUser.role === 'admin' && role === 'admin') {
      return errorResponse('Cannot create another admin', 403);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse('User already exists', 409);
    }

    const user = await User.create({
      name,
      email,
      role,
      phone,
      salary,
      joiningDate,
      isActive,
      password,
    });

    return successResponse(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        salary: user.salary,
        joiningDate: user.joiningDate,
        isActive: user.isActive,
      },
      'User created successfully',
      201
    );

  } catch (error) {
    console.error('Create user error:', error.message);
    return errorResponse('Failed to create user', 500);
  }
}