import connectDB from '@/lib/mongodb';
import MenuItem from '@/models/MenuItem';
import Category from '@/models/Category';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { deleteCloudinaryImage } from '@/lib/cloudinary';

export const runtime = 'nodejs';

// GET - Fetch single menu item
export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return errorResponse('Menu item not found', 404);
    }

    return successResponse(
      menuItem,
      'Menu item retrieved successfully',
      200
    );

  } catch (error) {
    console.error('Menu item fetch error:', error.message);
    return errorResponse('Failed to fetch menu item', 500);
  }
}

// PUT - Update menu item
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    // Only owner and manager can update menu items
    if (currentUser.role === 'staff') {
      return errorResponse('You do not have access to update menu items', 403);
    }

    const { id } = await params;

    const targetMenuItem = await MenuItem.findById(id);
    if (!targetMenuItem) {
      return errorResponse('Menu item not found', 404);
    }

    const body = await req.json();

    // Validate price if provided
    if (body.price !== undefined && body.price < 0) {
      return errorResponse('Price must be positive', 400);
    }

    // Check if category exists if category is being updated
    if (body.category) {
      const categoryExists = await Category.findOne({ id: body.category });
      if (!categoryExists) {
        return errorResponse('Category does not exist', 400);
      }
    }

    // If image URL is being changed, delete the old image from Cloudinary
    if (body.imgURL && body.imgURL !== targetMenuItem.imgURL) {
      if (targetMenuItem.imgURL && targetMenuItem.imgURL !== '/images/default-item.jpg') {
        await deleteCloudinaryImage(targetMenuItem.imgURL);
      }
    }

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    return successResponse(
      updatedMenuItem,
      'Menu item updated successfully',
      200
    );

  } catch (error) {
    console.error('Update menu item error:', error.message);
    return errorResponse('Failed to update menu item', 500);
  }
}

// DELETE - Delete menu item
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    // Only owner and manager can delete menu items
    if (currentUser.role === 'staff') {
      return errorResponse('You do not have access to delete menu items', 403);
    }

    const { id } = await params;

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return errorResponse('Menu item not found', 404);
    }

    // Delete image from Cloudinary if it's not the default image
    if (menuItem.imgURL && menuItem.imgURL !== '/images/default-item.jpg') {
      await deleteCloudinaryImage(menuItem.imgURL);
    }

    await MenuItem.findByIdAndDelete(id);

    return successResponse(
      null,
      'Menu item deleted successfully',
      200
    );

  } catch (error) {
    console.error('Delete menu item error:', error.message);
    return errorResponse('Failed to delete menu item', 500);
  }
}