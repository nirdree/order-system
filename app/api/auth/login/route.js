import connectDB from '@/lib/mongodb';
import User from '@/models/User';
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

    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    if (!user.isActive) {
      return errorResponse('Account is deactivated', 401);
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401);
    }

    const token = generateToken(user._id, user.role);

    // Set token in secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        token
      },
      'Login successful',
      200
    );

  } catch (error) {
    return handleError(error);
  }
}