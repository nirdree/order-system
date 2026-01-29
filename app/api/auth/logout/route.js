import { cookies } from 'next/headers';
import { successResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    // Clear the authToken cookie
    const cookieStore = await cookies();
    cookieStore.delete('authToken');

    return successResponse(
      { message: 'Logged out successfully' },
      'Logout successful',
      200
    );
  } catch (error) {
    console.log(error);
    return successResponse(
      { message: 'Logged out' },
      'Logout successful',
      200
    );
  }
}
