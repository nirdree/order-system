// app/api/settings/[id]/route.js
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings'; // Fixed: Import Settings instead of User
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

    const { id } = await params;

    // Fixed: Changed User to Settings
    const targetSettings = await Settings.findById(id);
    if (!targetSettings) {
      return errorResponse('Settings not found', 404);
    }

    // Fixed: Proper role checking logic
    const allowedRoles = ['staff', 'manager', 'owner', 'admin'];
    if (!allowedRoles.includes(currentUser.role)) {
      return errorResponse('You do not have access to edit the settings', 403);
    }

    const body = await req.json();

    // Validate the update data
    const allowedFields = [
      'locationAddress',
      'locationLongitude',
      'locationLatitude',
      'locationAccuracy',
      'businessName',
      'orderLimit',
      'isActive'
    ];

    // Filter body to only include allowed fields
    const updateData = {};
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    // Fixed: Changed User to Settings
    const updatedSettings = await Settings.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return successResponse(
      updatedSettings,
      'Settings updated successfully',
      200
    );

  } catch (error) {
    console.error('Update settings error:', error.message);
    return errorResponse('Failed to update settings', 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    // Only owner or admin can delete settings
    if (!currentUser?.role || !['owner', 'admin'].includes(currentUser.role)) {
      return errorResponse(
        'Only owner or admin can delete settings',
        403
      );
    }

    const { id } = await params;

    // Fixed: Changed User to Settings
    const settings = await Settings.findById(id);
    if (!settings) {
      return errorResponse('Settings not found', 404);
    }

    // Fixed: Changed User to Settings
    await Settings.findByIdAndDelete(id);

    return successResponse(
      null,
      'Settings deleted successfully',
      200
    );

  } catch (error) {
    console.error('Delete settings error:', error.message);
    return errorResponse('Failed to delete settings', 500);
  }
}