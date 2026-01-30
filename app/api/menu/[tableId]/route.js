import connectDB from '@/lib/mongodb';
import MenuItem from '@/models/MenuItem';
import Category from '@/models/Category';
import Table from '@/models/Table';
import Session from '@/models/Session';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

// GET - Fetch menu for customer viewing on a table
export async function GET(req, { params }) {
  try {
    await connectDB();

    const { tableId } = await params;

    // Verify table exists
    const table = await Table.findById(tableId);
    if (!table) {
      return errorResponse('Table not found', 404);
    }

    // Check if table has an active session
    let activeSession = null;
    if (table.status === 'occupied') {
      activeSession = await Session.findOne({ 
        table: tableId, 
        status: 'active' 
      }).populate({
        path: 'orders',
        populate: {
          path: 'items.menuItem',
          select: 'name price imgURL'
        }
      });
    }

    // Get all active categories
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });

    // Get all active menu items grouped by category
    const menuItems = await MenuItem.find({ isActive: true, available: true }).sort({ category: 1, name: 1 });

    // Group menu items by category
    const menuByCategory = categories.map(category => ({
      categoryId: category._id,
      categoryName: category.name,
      categoryDescription: category.description,
      items: menuItems.filter(item => item.category === category.name)
    })).filter(cat => cat.items.length > 0);

    const response = {
      table: {
        _id: table._id,
        tableNumber: table.tableNumber,
        floorNumber: table.floorNumber,
        capacity: table.capacity,
        status: table.status
      },
      session: activeSession ? {
        _id: activeSession._id,
        sessionId: activeSession.sessionId,
        status: activeSession.status,
        startTime: activeSession.startTime,
        totalAmount: activeSession.totalAmount,
        orders: activeSession.orders || [],
        customerName: activeSession.customerName
      } : null,
      menu: menuByCategory,
      totalItems: menuItems.length,
      timestamp: new Date()
    };

    return successResponse(
      response,
      'Menu retrieved successfully',
      200
    );

  } catch (error) {
    console.error('Menu fetch error:', error.message);
    return errorResponse('Failed to fetch menu', 500);
  }
}
