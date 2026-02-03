import connectDB from '@/lib/mongodb';
import Table from '@/models/Table';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

// GET - Fetch all tables
export async function GET(req) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    // Use lean() for better performance and select only needed fields
    const tables = await Table.find({})
      .select('tableNumber floorNumber status capacity createdAt')
      .sort({ floorNumber: 1, tableNumber: 1 })
      .lean()
      .exec();

    return successResponse(
      tables,
      'Tables retrieved successfully',
      200
    );

  } catch (error) {
    console.error('Table fetch error:', error.message);
    return errorResponse('Failed to fetch tables', 500);
  }
}

// POST - Create new table
export async function POST(req) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }



    const body = await req.json();
    const {
      tableNumber,
      floorNumber,
      capacity,
      status = 'available',
      location,
      isActive = true
    } = body;

    // Validate required fields
    if (!tableNumber || !floorNumber || !capacity) {
      return errorResponse('Table number, floor number, and capacity are required', 400);
    }

    // Validate positive numbers
    if (tableNumber < 1 || floorNumber < 1 || capacity < 1) {
      return errorResponse('Table number, floor number, and capacity must be positive', 400);
    }

    // Check for duplicate table number
    const existingTable = await Table.findOne({ tableNumber });
    if (existingTable) {
      return errorResponse('Table number already exists', 409);
    }

    // Create table
    const table = await Table.create({
      tableNumber,
      floorNumber,
      capacity,
      status,
      location,
      isActive
    });

    return successResponse(
      table,
      'Table created successfully',
      201
    );

  } catch (error) {
    console.error('Create table error:', error.message);
    if (error.code === 11000) {
      return errorResponse('Table number already exists', 409);
    }
    return errorResponse('Failed to create table', 500);
  }
}