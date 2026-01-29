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
      filter = {};
    }

    const users = await User.find(filter).select(
      'name email role phone salary joiningDate isActive'
    );

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

    if (!currentUser?.role || currentUser.role !== 'owner') {
      return errorResponse('Only owner can create users', 403);
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

    if (role === 'owner') {
      return errorResponse('Cannot create another owner', 403);
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
      password, // assume hashing is handled in model middleware
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