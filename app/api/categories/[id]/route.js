import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import MenuItem from '@/models/MenuItem';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { deleteCloudinaryImage } from '@/lib/cloudinary';

export const runtime = 'nodejs';

// PUT - Update category
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    // Only owner and manager can update categories
    if (currentUser.role === 'staff') {
      return errorResponse('You do not have access to update categories', 403);
    }

    const { id } = await params;

    const targetCategory = await Category.findById(id);
    if (!targetCategory) {
      return errorResponse('Category not found', 404);
    }

    const body = await req.json();

    // If updating category ID, check for duplicates
    if (body.id && body.id !== targetCategory.id) {
      const duplicate = await Category.findOne({ 
        id: body.id,
        _id: { $ne: id }
      });
      if (duplicate) {
        return errorResponse('Category ID already exists', 409);
      }

      // Update all menu items that use this category
      await MenuItem.updateMany(
        { category: targetCategory.id },
        { category: body.id }
      );
    }

    // If image URL is being changed, delete the old image from Cloudinary
    if (body.imgURL && body.imgURL !== targetCategory.imgURL) {
      if (targetCategory.imgURL) {
        await deleteCloudinaryImage(targetCategory.imgURL);
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    return successResponse(
      updatedCategory,
      'Category updated successfully',
      200
    );

  } catch (error) {
    console.error('Update category error:', error.message);
    if (error.code === 11000) {
      return errorResponse('Category ID already exists', 409);
    }
    return errorResponse('Failed to update category', 500);
  }
}

// DELETE - Delete category
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    // Only owner and manager can delete categories
    if (currentUser.role === 'staff') {
      return errorResponse('You do not have access to delete categories', 403);
    }

    const { id } = await params;

    const category = await Category.findById(id);
    if (!category) {
      return errorResponse('Category not found', 404);
    }

    // Check if category has menu items
    const itemCount = await MenuItem.countDocuments({ category: category.id });
    if (itemCount > 0) {
      return errorResponse(
        `Cannot delete category with ${itemCount} menu items. Please delete or reassign the items first.`,
        400
      );
    }

    // Delete image from Cloudinary
    if (category.imgURL) {
      await deleteCloudinaryImage(category.imgURL);
    }

    await Category.findByIdAndDelete(id);

    return successResponse(
      null,
      'Category deleted successfully',
      200
    );

  } catch (error) {
    console.error('Delete category error:', error.message);
    return errorResponse('Failed to delete category', 500);
  }
}