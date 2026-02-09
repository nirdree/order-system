import  connectDB  from '@/lib/mongodb';
import Explanation from '@/models/Explanation';
import { authenticate } from '@/middleware/auth';

export async function GET(req, { params }) {
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

    const { id } = await params;
    
    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid explanation ID format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const explanation = await Explanation.findById(id)
      .populate('category')
      .populate('createdBy', 'name email');

    if (!explanation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Explanation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: explanation }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(req, { params }) {
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
        { success: false, error: 'Forbidden - Only admin and owner can update explanations' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    
    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid explanation ID format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Validate update data
    if (body.amount && (isNaN(parseFloat(body.amount)) || parseFloat(body.amount) <= 0)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Amount must be a valid positive number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (body.totalAmountPaid && (isNaN(parseFloat(body.totalAmountPaid)) || parseFloat(body.totalAmountPaid) < 0)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Total amount paid must be a valid non-negative number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const explanation = await Explanation.findByIdAndUpdate(id, body, { new: true })
      .populate('category')
      .populate('createdBy', 'name email');

    if (!explanation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Explanation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: explanation }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(req, { params }) {
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
        { success: false, error: 'Forbidden - Only admin and owner can delete explanations' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    
    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid explanation ID format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const explanation = await Explanation.findByIdAndDelete(id);

    if (!explanation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Explanation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Explanation deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
