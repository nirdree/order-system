import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

// GET - Fetch all categories
export async function GET(req) {
  try {
    await connectDB();

    // Categories are public, no authentication required for viewing
    const categories = await Category.find({}).sort({ createdAt: -1 });

    return successResponse(
      categories,
      'Categories retrieved successfully',
      200
    );

  } catch (error) {
    console.error('Category fetch error:', error.message);
    return errorResponse('Failed to fetch categories', 500);
  }
}

// POST - Create new category
export async function POST(req) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    // Only owner and manager can create categories
    if (currentUser.role === 'staff') {
      return errorResponse('You do not have access to create categories', 403);
    }

    const body = await req.json();
    const {
      id,
      icon,
      imgURL = '',
      description,
    } = body;

    // Validate required fields
    if (!id || !icon) {
      return errorResponse('ID and icon are required', 400);
    }

    // Check for duplicate category ID
    const existingCategory = await Category.findOne({ id });
    if (existingCategory) {
      return errorResponse('Category ID already exists', 409);
    }

    // Create category
    const category = await Category.create({
      id,
      icon,
      imgURL,
      description,
    });

    return successResponse(
      category,
      'Category created successfully',
      201
    );

  } catch (error) {
    console.error('Create category error:', error.message);
    if (error.code === 11000) {
      return errorResponse('Category ID already exists', 409);
    }
    return errorResponse('Failed to create category', 500);
  }
}