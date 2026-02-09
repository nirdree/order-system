import  connectDB  from '@/lib/mongodb';
import { authenticate } from '@/middleware/auth';
import ExplanationCategory from '@/models/ExplanationCategory';

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
        { success: false, error: 'Forbidden - Only admin and owner can view categories' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    
    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid category ID format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const category = await ExplanationCategory.findById(id)
      .populate('createdBy', 'name email');

    if (!category) {
      return new Response(
        JSON.stringify({ success: false, error: 'Category not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: category }),
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
        { success: false, error: 'Forbidden - Only admin and owner can update categories' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    
    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid category ID format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Validate update data
    if (body.name && !body.name.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Category name cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const category = await ExplanationCategory.findByIdAndUpdate(id, body, { new: true })
      .populate('createdBy', 'name email');

    if (!category) {
      return new Response(
        JSON.stringify({ success: false, error: 'Category not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: category }),
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
        { success: false, error: 'Forbidden - Only admin and owner can delete categories' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = await params;
    
    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid category ID format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const category = await ExplanationCategory.findByIdAndDelete(id);

    if (!category) {
      return new Response(
        JSON.stringify({ success: false, error: 'Category not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Category deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
