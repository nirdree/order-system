import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    // Only allow signup in development mode
    if (process.env.NEXT_PUBLIC_Mode !== 'development') {
      return NextResponse.json(
        { message: 'Signup is only available in development mode' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { name, email, password, role, phone, salary } = body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password, // will be hashed by schema
      role,
      phone,
      salary
    });

    return NextResponse.json(
      {
        message: 'Signup successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
