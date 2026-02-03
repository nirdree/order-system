import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import Table from '@/models/Table';
import Order from '@/models/Order';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export const runtime = 'nodejs';

// GET - Fetch all sessions
export async function GET(req) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    // Only staff, manager, and owner can view sessions
    if (!['staff', 'manager', 'owner' , 'admin'].includes(currentUser.role)) {
      return errorResponse('You do not have access', 403);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const initiatedBy = searchParams.get('initiatedBy');
    const tableId = searchParams.get('tableId');

    let filter = {};

    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Filter by initiatedBy
    if (initiatedBy && initiatedBy !== 'all') {
      filter.initiatedBy = initiatedBy;
    }

    // Filter by table
    if (tableId) {
      filter.table = tableId;
    }

    const sessions = await Session.find(filter)
      .populate('table', 'tableNumber floorNumber')
      .populate('orders')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(
      sessions,
      'Sessions retrieved successfully',
      200
    );

  } catch (error) {
    console.error('Sessions fetch error:', error.message);
    return errorResponse('Failed to fetch sessions', 500);
  }
}

// POST - Create new session
export async function POST(req) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    // Only staff, manager, and owner can create sessions
    if (!['staff', 'manager', 'owner',,'admin'].includes(currentUser.role)) {
      return errorResponse('You do not have access to create sessions', 403);
    }

    const body = await req.json();
    const {
      tableId,
      customerCount = 1,
      customerName,
      customerPhone,
      notes
    } = body;

    // Validate required fields
    if (!tableId) {
      return errorResponse('Table ID is required', 400);
    }

    // Check if table exists
    const table = await Table.findById(tableId);
    if (!table) {
      return errorResponse('Table not found', 404);
    }

    // Check if table is available
    if (table.status === 'occupied') {
      return errorResponse('Table is already occupied', 400);
    }

    // Check if there's an active session for this table
    const existingSession = await Session.findOne({
      table: tableId,
      status: 'active'
    });

    if (existingSession) {
      return errorResponse('An active session already exists for this table', 400);
    }

    // Create session
    const session = await Session.create({
      table: tableId,
      tableNumber: table.tableNumber,
      customerCount,
      customerName,
      customerPhone,
      notes,
      createdBy: currentUser._id,
      initiatedBy: 'staff',
      isCustomerSelfService: false
    });

    // Update table status to occupied
    await Table.findByIdAndUpdate(tableId, { status: 'occupied' });

    const populatedSession = await Session.findById(session._id)
      .populate('table', 'tableNumber floorNumber')
      .populate('createdBy', 'name email');

    return successResponse(
      populatedSession,
      'Session created successfully',
      201
    );

  } catch (error) {
    console.error('Create session error:', error.message);
    return errorResponse('Failed to create session', 500);
  }
}