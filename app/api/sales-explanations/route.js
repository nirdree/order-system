import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import MenuItem from '@/models/MenuItem';
import Explanation from '@/models/Explanation';
import ExplanationCategory from '@/models/ExplanationCategory';
import { authenticate } from '@/middleware/auth';

export async function GET(request) {
  try {
    // Verify user is authenticated and is owner/manager/admin
    let user;
    try {
      user = await authenticate(request);
    } catch (error) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.role !== 'owner' && user.role !== 'manager' && user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Only owner, manager or admin can access this' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Default to current date if not provided
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    const start = startDate ? new Date(startDate) : today;
    const end = endDate ? new Date(endDate) : endOfToday;

    // Set proper time boundaries
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // ============= SALES DATA =============
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end }
    })
      .select('orderStatus totalAmount items createdAt orderId orderType')
      .populate('items.menuItem', 'name price category')
      .lean()
      .exec();

    // Group items by menu item
    const itemMap = new Map();
    let totalSalesAmount = 0;
    let totalOrders = 0;

    orders.forEach(order => {
      totalSalesAmount += (order.totalAmount || 0);
      totalOrders += 1;

      order.items.forEach(item => {
        const itemId = item.menuItem?._id?.toString() || item.menuItem;
        const itemName = item.name || item.menuItem?.name || 'Unknown';
        const price = item.price || item.menuItem?.price || 0;
        const quantity = item.quantity || 0;
        
        if (!itemMap.has(itemId)) {
          itemMap.set(itemId, {
            name: itemName,
            quantity: 0,
            totalSold: 0,
            revenue: 0
          });
        }
        
        const current = itemMap.get(itemId);
        current.quantity += 1;
        current.totalSold += quantity;
        current.revenue += (price * quantity);
      });
    });

    // Convert to array and sort by revenue
    const salesItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue);

    // ============= EXPLANATIONS DATA =============
    const explanations = await Explanation.find({
      explanationDate: { $gte: start, $lte: end }
    })
      .select('category description amount totalAmountPaid paymentMode explanationDate createdBy')
      .populate('category', 'name')
      .populate('createdBy', 'name email')
      .lean()
      .exec();

    // Group explanations by category
    const explanationMap = new Map();
    let totalExpense = 0;
    let totalExplanationCount = 0;

    explanations.forEach(exp => {
      totalExpense += (exp.totalAmountPaid || 0);
      totalExplanationCount += 1;

      const categoryName = exp.category?.name || 'Uncategorized';
      const categoryId = exp.category?._id?.toString() || 'unknown';

      if (!explanationMap.has(categoryId)) {
        explanationMap.set(categoryId, {
          categoryName,
          count: 0,
          totalAmount: 0
        });
      }

      const current = explanationMap.get(categoryId);
      current.count += 1;
      current.totalAmount += (exp.totalAmountPaid || 0);
    });

    // Convert to array
    const explanationsByCategory = Array.from(explanationMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // ============= PAGINATION =============
    const skip = (page - 1) * limit;
    
    // Paginate sales items
    const totalSalesPages = Math.ceil(salesItems.length / limit);
    const paginatedSalesItems = salesItems.slice(skip, skip + limit);

    // Paginate explanations
    const totalExplanationPages = Math.ceil(explanations.length / limit);
    const paginatedExplanations = explanations.slice(skip, skip + limit);

    return Response.json({
      success: true,
      data: {
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        sales: {
          summary: {
            totalOrders,
            totalRevenue: Math.round(totalSalesAmount),
            averageOrderValue: totalOrders > 0 ? Math.round(totalSalesAmount / totalOrders) : 0,
            totalItems: salesItems.reduce((sum, item) => sum + item.totalSold, 0)
          },
          items: paginatedSalesItems,
          allItems: salesItems,
          pagination: {
            page,
            limit,
            total: salesItems.length,
            pages: totalSalesPages,
            hasNextPage: page < totalSalesPages,
            hasPrevPage: page > 1
          }
        },
        explanations: {
          summary: {
            totalExplanations: totalExplanationCount,
            totalExpense: Math.round(totalExpense),
            averageExpense: totalExplanationCount > 0 ? Math.round(totalExpense / totalExplanationCount) : 0,
            byCategory: explanationsByCategory
          },
          items: paginatedExplanations,
          allItems: explanations,
          pagination: {
            page,
            limit,
            total: explanations.length,
            pages: totalExplanationPages,
            hasNextPage: page < totalExplanationPages,
            hasPrevPage: page > 1
          }
        }
      }
    });
  } catch (error) {
    console.error('Sales explanations error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch sales and explanations data' },
      { status: 500 }
    );
  }
}
