import connectDB from '@/lib/mongodb';
import MenuItem from '@/models/MenuItem';
import Category from '@/models/Category';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

// GET - Fetch all menu items
export async function GET(req) {
  try {
    await connectDB();

    // Menu items are public, no authentication required for viewing
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const available = searchParams.get('available');
    const mostSell = searchParams.get('mostSell');

    let filter = {};

    // Filter by category
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Filter by availability
    if (available !== null && available !== undefined) {
      filter.available = available === 'true';
    }

    // Filter by most selling
    if (mostSell === 'true') {
      filter.mostSell = true;
    }

    const menuItems = await MenuItem.find(filter).sort({ category: 1, name: 1 });

    return successResponse(
      menuItems,
      'Menu items retrieved successfully',
      200
    );

  } catch (error) {
    console.error('Menu items fetch error:', error.message);
    return errorResponse('Failed to fetch menu items', 500);
  }
}

// POST - Create new menu item
export async function POST(req) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    // Only owner and manager can create menu items
    if (currentUser.role === 'staff') {
      return errorResponse('You do not have access to create menu items', 403);
    }

    const body = await req.json();
    const {
      name,
      price,
      category,
      description,
      imgURL = '/images/default-item.jpg',
      available = true,
      mostSell = false,
      isActive = true,
      tags = [],
      preparationTime = 15
    } = body;

    // Validate required fields
    if (!name || !price || !category) {
      return errorResponse('Name, price, and category are required', 400);
    }

    // Validate price
    if (price < 0) {
      return errorResponse('Price must be positive', 400);
    }

    // Check if category exists
    const categoryExists = await Category.findOne({ id: category });
    if (!categoryExists) {
      return errorResponse('Category does not exist', 400);
    }

    // Create menu item
    const menuItem = await MenuItem.create({
      name,
      price,
      category,
      description,
      imgURL,
      available,
      mostSell,
      isActive,
      tags,
      preparationTime
    });

    return successResponse(
      menuItem,
      'Menu item created successfully',
      201
    );

  } catch (error) {
    console.error('Create menu item error:', error.message);
    return errorResponse('Failed to create menu item', 500);
  }
}