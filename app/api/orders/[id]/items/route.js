import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import MenuItem from '@/models/MenuItem';
import Session from '@/models/Session';
import { authenticate } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

// POST - Add new item to existing order
export async function POST(req, { params }) {
  try {
    await connectDB();

    const currentUser = await authenticate(req);

    if (!currentUser?.role) {
      return errorResponse('Invalid user role', 403);
    }

    if (!['staff', 'manager', 'owner'].includes(currentUser.role)) {
      return errorResponse('You do not have access', 403);
    }

    const { id } = await params;
    const body = await req.json();
    const { menuItemId, quantity, specialInstructions } = body;

    // Validate input
    if (!menuItemId || !quantity || quantity < 1) {
      return errorResponse('Menu item ID and valid quantity are required', 400);
    }

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Cannot modify cancelled or completed orders
    if (['cancelled', 'completed'].includes(order.orderStatus)) {
      return errorResponse('Cannot modify completed or cancelled orders', 400);
    }

    // Find the menu item
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return errorResponse('Menu item not found', 404);
    }

    // Check if item already exists in order
    const existingItemIndex = order.items.findIndex(
      item => item.menuItem.equals(menuItem._id)
    );

    if (existingItemIndex !== -1) {
      // If item already exists, update quantity instead
      const oldQuantity = order.items[existingItemIndex].quantity;
      order.items[existingItemIndex].quantity += quantity;
      order.items[existingItemIndex].subtotal = 
        order.items[existingItemIndex].price * order.items[existingItemIndex].quantity;
      
      if (specialInstructions) {
        order.items[existingItemIndex].specialInstructions = specialInstructions;
      }
    } else {
      // Add new item to order
      const newItem = {
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: quantity,
        subtotal: menuItem.price * quantity,
        specialInstructions: specialInstructions || ''
      };

      order.items.push(newItem);
    }

    // Recalculate order amount
    order.orderAmount = order.items.reduce((sum, item) => sum + item.subtotal, 0);

    // Update estimated time based on menu items
    if (order.items.length > 0) {
      const preparationTimes = await Promise.all(
        order.items.map(async (item) => {
          const mItem = await MenuItem.findById(item.menuItem);
          return mItem?.preparationTime || 15;
        })
      );
      order.estimatedTime = Math.max(...preparationTimes);
    }

    await order.save();

    // Update session total if order belongs to a session
    if (order.session) {
      const session = await Session.findById(order.session);
      if (session) {
        const activeOrders = await Order.find({
          session: session._id,
          orderStatus: { $ne: 'cancelled' }
        });
        session.totalAmount = activeOrders.reduce((sum, o) => sum + o.orderAmount, 0);
        await session.save();
      }
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('session', 'sessionId tableNumber')
      .populate('table', 'tableNumber floorNumber')
      .populate('items.menuItem', 'name price imgURL category preparationTime')
      .populate('orderedBy', 'name email');

    return successResponse(
      updatedOrder,
      'Item added to order successfully',
      200
    );

  } catch (error) {
    console.error('Add order item error:', error.message);
    return errorResponse('Failed to add item to order', 500);
  }
}
