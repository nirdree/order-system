import connectDB from '@/lib/mongodb';
import Table from '@/models/Table';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

export async function GET(req, { params }) {
  try {
    await connectDB();


    const { id } = await params;

    const table = await Table.findById(id);
    if (!table) {
      return errorResponse('Table not found', 404);
    }

    return successResponse(
      table,
      'Table fetched successfully',
      200
    );

  } catch (error) {
    console.error('Get table error:', error.message);
    return errorResponse('Failed to fetch table', 500);
  }
}

// PUT - Update table
export async function PUT(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    // Only owner and manager can update tables
    if (currentUser.role === 'staff') {
      return errorResponse('You do not have access to update tables', 403);
    }

    const { id } = await params;

    const targetTable = await Table.findById(id);
    if (!targetTable) {
      return errorResponse('Table not found', 404);
    }

    const body = await req.json();

    // If updating table number, check for duplicates
    if (body.tableNumber && body.tableNumber !== targetTable.tableNumber) {
      const duplicate = await Table.findOne({ 
        tableNumber: body.tableNumber,
        _id: { $ne: id }
      });
      if (duplicate) {
        return errorResponse('Table number already exists', 409);
      }
    }

    // Validate positive numbers if provided
    if (body.tableNumber && body.tableNumber < 1) {
      return errorResponse('Table number must be positive', 400);
    }
    if (body.floorNumber && body.floorNumber < 1) {
      return errorResponse('Floor number must be positive', 400);
    }
    if (body.capacity && body.capacity < 1) {
      return errorResponse('Capacity must be positive', 400);
    }

    // Validate status if provided
    if (body.status && !['available', 'occupied'].includes(body.status)) {
      return errorResponse('Invalid status', 400);
    }

    const updatedTable = await Table.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    return successResponse(
      updatedTable,
      'Table updated successfully',
      200
    );

  } catch (error) {
    console.error('Update table error:', error.message);
    if (error.code === 11000) {
      return errorResponse('Table number already exists', 409);
    }
    return errorResponse('Failed to update table', 500);
  }
}

// DELETE - Delete table
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    // Only owner and manager can delete tables
    if (currentUser.role === 'staff') {
      return errorResponse('You do not have access to delete tables', 403);
    }

    const { id } = await params;

    const table = await Table.findById(id);
    if (!table) {
      return errorResponse('Table not found', 404);
    }

    await Table.findByIdAndDelete(id);

    return successResponse(
      null,
      'Table deleted successfully',
      200
    );

  } catch (error) {
    console.error('Delete table error:', error.message);
    return errorResponse('Failed to delete table', 500);
  }
}