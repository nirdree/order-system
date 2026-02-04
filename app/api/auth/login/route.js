import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Settings from '@/models/Settings';
import { generateToken } from '@/middleware/auth';
import { successResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    await connectDB();

    const { email, password } = await req.json();

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return errorResponse('Invalid email or password', 401);
    }

    if (!user.isActive) {
      return errorResponse('Account is deactivated', 401);
    }

    const token = generateToken(user._id, user.role);

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'authToken',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    const settings = await Settings.findOne({ isActive: true });

    return successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          settings,
        }
      },
      'Login successful',
      200
    );
  } catch (error) {
    return handleError(error);
  }
}
