import  connectDB  from '@/lib/mongodb';
import Explanation from '@/models/Explanation';
import { authenticate, authMiddleware } from '@/middleware/auth';

export async function GET(req, res) {
  try {
    // Authenticate user
    let user;
    try {
      user = await authenticate(req);
    } catch (error) {
      return Response.json(
        { success: false, error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Authorize - only admin and owner
    if (user.role !== 'owner' && user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Forbidden - Only admin and owner can view explanations' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const explanations = await Explanation.find()
      .populate('category')
      .populate('createdBy', 'name email')
      .sort({ explanationDate: -1 });

    return new Response(
      JSON.stringify({ success: true, data: explanations }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(req) {
  try {
    let user;
    try {
      user = await authenticate(req);
    } catch (error) {
      return Response.json(
        { success: false, error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Authorize - only admin and owner
    if (user.role !== 'owner' && user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Forbidden - Only admin and owner can create explanations' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { category, description, amount, totalAmountPaid, paymentMode, explanationDate, notes } = body;

    // Validation
    if (!category || !category.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Category is required and cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!description || !description.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Description is required and cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Amount must be a valid positive number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!totalAmountPaid || isNaN(parseFloat(totalAmountPaid)) || parseFloat(totalAmountPaid) < 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Total amount paid must be a valid non-negative number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!paymentMode || !paymentMode.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Payment mode is required and cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!explanationDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'Explanation date is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const explanation = new Explanation({
      category,
      description,
      amount,
      totalAmountPaid,
      paymentMode,
      explanationDate,
      createdBy: user.userId,
      notes,
    });

    await explanation.save();
    await explanation.populate('category');
    await explanation.populate('createdBy', 'name email');

    return new Response(
      JSON.stringify({ success: true, data: explanation }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
