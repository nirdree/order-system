// import connectDB from '@/lib/mongodb';
// import Session from '@/models/Session';
// import Table from '@/models/Table';
// import { successResponse, errorResponse } from '@/lib/apiResponse';

// export const runtime = 'nodejs';

// // GET - Fetch active session for a table (Public - No authentication required)
// export async function GET(req, { params }) {
//   try {
//     await connectDB();

//     const { tableId } = await params;

//     // Verify table exists
//     const table = await Table.findById(tableId);
//     if (!table) {
//       return errorResponse('Table not found', 404);
//     }

//     // Get active session for this table
//     const session = await Session.findOne({
//       table: tableId,
//       status: 'active'
//     })
//       .populate('table', 'tableNumber floorNumber capacity')
//       .populate({
//         path: 'orders',
//         populate: {
//           path: 'items.menuItem',
//           select: 'name price imgURL preparationTime'
//         }
//       });

//     return successResponse(
//       session,
//       'Session retrieved successfully',
//       200
//     );

//   } catch (error) {
//     console.error('Session fetch error:', error.message);
//     return errorResponse('Failed to fetch session', 500);
//   }
// }


import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import Table from '@/models/Table';
import Order from '@/models/Order';
import MenuItem from '@/models/MenuItem';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

// GET - Fetch active session for a table (Public - No authentication required)
export async function GET(req, { params }) {
  try {
    await connectDB();

    const { tableId } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(tableId)) {
      return errorResponse('Invalid table ID format', 400);
    }

    // Verify table exists
    const table = await Table.findById(tableId);
    if (!table) {
      return errorResponse('Table not found', 404);
    }

    // Step 1: Get session with table populated
    let session = await Session.findOne({
      table: tableId,
      status: 'active'
    })
      .populate('table', 'tableNumber floorNumber capacity status')
      .lean();

    // If no session, return early
    if (!session) {
      return successResponse(
        null,
        'No active session found for this table',
        200
      );
    }

    // Step 2: Get orders for this session
    const orders = await Order.find({
      _id: { $in: session.orders },
      orderStatus: { $ne: 'cancelled' }
    })
      .populate('items.menuItem', 'name price imgURL preparationTime category available')
      .sort({ orderedAt: -1 })
      .lean();

    // Step 3: Attach populated orders to session
    session.orders = orders;

    return successResponse(
      session,
      'Session retrieved successfully',
      200
    );

  } catch (error) {
    console.error('Session fetch error:', error.message);
    console.error('Error stack:', error.stack);
    return errorResponse(`Failed to fetch session: ${error.message}`, 500);
  }
}