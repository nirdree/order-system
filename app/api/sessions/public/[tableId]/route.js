import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import Table from '@/models/Table';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

// GET - Fetch active session for a table (Public - No authentication required)
export async function GET(req, { params }) {
  try {
    await connectDB();

    const { tableId } = await params;

    // Verify table exists
    const table = await Table.findById(tableId);
    if (!table) {
      return errorResponse('Table not found', 404);
    }

    // Get active session for this table
    const session = await Session.findOne({
      table: tableId,
      status: 'active'
    })
      .populate('table', 'tableNumber floorNumber capacity')
      .populate({
        path: 'orders',
        populate: {
          path: 'items.menuItem',
          select: 'name price imgURL preparationTime'
        }
      });

    return successResponse(
      session,
      'Session retrieved successfully',
      200
    );

  } catch (error) {
    console.error('Session fetch error:', error.message);
    return errorResponse('Failed to fetch session', 500);
  }
}
