import  connectDB  from '@/lib/mongodb';
import { authenticate } from '@/middleware/auth';
import ExplanationCategory from '@/models/ExplanationCategory';

export async function GET(req) {
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

    const categories = await ExplanationCategory.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return new Response(
      JSON.stringify({ success: true, data: categories }),
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
        { success: false, error: 'Forbidden - Only admin and owner can create categories' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { name, description, icon } = body;

    // Validation
    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Category name is required and cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if category already exists
    const existingCategory = await ExplanationCategory.findOne({ name: name.trim() });
    if (existingCategory) {
      return new Response(
        JSON.stringify({ success: false, error: 'Category with this name already exists' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const category = new ExplanationCategory({
      name,
      description,
      icon,
      createdBy: user.userId,
    });

    await category.save();
    await category.populate('createdBy', 'name email');

    return new Response(
      JSON.stringify({ success: true, data: category }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
