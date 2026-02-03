// app/api/settings/route.js
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';
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

    // Fixed: Changed from ! to !== for proper comparison
    if (currentUser.role !== 'admin') {
      return errorResponse('You do not have access', 403);
    }

    const filter = {};
    
    const settings = await Settings.find(filter);

    return successResponse(
      settings,
      'Settings retrieved successfully',
      200
    );

  } catch (error) {
    console.error('Settings fetch error:', error.message);
    return errorResponse('Failed to fetch Settings', 500);
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role || currentUser.role !== 'admin') {
      return errorResponse('Only admin can create Settings', 403);
    }

    const body = await req.json();
    const {
      locationAddress,
      locationLongitude,
      locationLatitude,
      locationAccuracy,
      businessName,
      orderLimit,
      isActive = true,
    } = body;

    if (!locationAddress || !locationLongitude || !locationLatitude || !locationAccuracy || !businessName) {
      return errorResponse('Required fields are missing', 400);
    }

    // Fixed: Changed logic from < 1 to >= 1 (only allow if count is 0)
    const settingsExists = await Settings.countDocuments();
    if (settingsExists >= 1) {
      return errorResponse('Only one Setting can exist', 409);
    }

    const settings = await Settings.create({
      locationAddress,
      locationLongitude,
      locationLatitude,
      locationAccuracy,
      businessName,
      orderLimit,
      isActive 
    });

    return successResponse(
      settings, // Return the created document instead of reconstructing it
      'Settings created successfully',
      201
    );

  } catch (error) {
    console.error('Create Setting error:', error.message);
    return errorResponse('Failed to create Setting', 500);
  }
}