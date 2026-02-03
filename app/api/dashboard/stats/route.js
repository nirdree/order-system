import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import MenuItem from '@/models/MenuItem';
import User from '@/models/User';
import Session from '@/models/Session';
import Table from '@/models/Table';
import { authenticate } from '@/middleware/auth';

export async function GET(request) {
  try {
    // Verify user is authenticated and is owner/manager
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
        { success: false, error: 'Only owner or manager can access dashboard' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Default to last 30 days if not provided
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const start = startDate ? new Date(startDate) : thirtyDaysAgo;
    const end = endDate ? new Date(endDate) : today;

    // ============= ORDERS METRICS =============
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end }
    }).populate('items.menuItem');

    const orderMetrics = {
      total: orders.length,
      pending: orders.filter(o => o.orderStatus === 'pending').length,
      preparing: orders.filter(o => o.orderStatus === 'preparing').length,
      ready: orders.filter(o => o.orderStatus === 'ready').length,
      served: orders.filter(o => o.orderStatus === 'served').length,
      completed: orders.filter(o => o.orderStatus === 'completed').length,
      cancelled: orders.filter(o => o.orderStatus === 'cancelled').length
    };

    // ============= REVENUE METRICS =============
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const completedRevenue = orders
      .filter(o => o.orderStatus === 'completed' || o.orderStatus === 'served')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

    // ============= POPULAR ITEMS =============
    const itemMap = new Map();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemId = item.menuItem?._id?.toString() || item.menuItem;
        const itemName = item.name || item.menuItem?.name || 'Unknown';
        const price = item.price || item.menuItem?.price || 0;
        const quantity = item.quantity || 0;
        
        if (!itemMap.has(itemId)) {
          itemMap.set(itemId, {
            name: itemName,
            orders: 0,
            quantity: 0,
            revenue: 0
          });
        }
        
        const current = itemMap.get(itemId);
        current.orders += 1;
        current.quantity += quantity;
        current.revenue += (price * quantity);
      });
    });

    const popularItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // ============= WEEKLY BREAKDOWN =============
    const weeklyData = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize week
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      const dateStr = date.toISOString().split('T')[0];
      
      if (!weeklyData[dayName]) {
        weeklyData[dayName] = { day: dayName, orders: 0, revenue: 0 };
      }
    }

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dayName = days[orderDate.getDay()];
      
      if (weeklyData[dayName]) {
        weeklyData[dayName].orders += 1;
        weeklyData[dayName].revenue += (order.totalAmount || 0);
      }
    });

    const weeklyRevenue = Object.values(weeklyData).reverse();

    // ============= MONTHLY TREND =============
    const monthlyData = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthName = monthNames[date.getMonth()];
      
      monthlyData[monthName] = { month: monthName, revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const monthName = monthNames[orderDate.getMonth()];
      
      if (monthlyData[monthName]) {
        monthlyData[monthName].revenue += (order.totalAmount || 0);
        monthlyData[monthName].orders += 1;
      }
    });

    const monthlyTrend = Object.values(monthlyData).reverse();

    // ============= CATEGORY BREAKDOWN =============
    const categoryMap = new Map();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.menuItem?.category || 'Uncategorized';
        const quantity = item.quantity || 0;
        
        if (!categoryMap.has(category)) {
          categoryMap.set(category, 0);
        }
        categoryMap.set(category, categoryMap.get(category) + quantity);
      });
    });

    const totalItems = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        percentage: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0,
        count
      }))
      .sort((a, b) => b.count - a.count);

    // ============= TABLE & SESSION METRICS =============
    const activeSessions = await Session.countDocuments({
      status: 'active',
      createdAt: { $gte: start, $lte: end }
    });

    const tables = await Table.countDocuments();
    const occupiedTables = await Table.countDocuments({ status: 'occupied' });

    // ============= STAFF METRICS =============
    const staffCount = await User.countDocuments({ role: 'staff' });
    const managerCount = await User.countDocuments({ role: 'manager' });

    return Response.json({
      success: true,
      data: {
        orderMetrics,
        revenue: {
          total: Math.round(totalRevenue),
          completed: Math.round(completedRevenue),
          avgOrderValue,
          growth: 12.5 // You can calculate this based on previous period
        },
        popularItems,
        weeklyRevenue,
        monthlyTrend,
        categoryBreakdown,
        tables: {
          total: tables,
          occupied: occupiedTables,
          available: tables - occupiedTables
        },
        sessions: {
          active: activeSessions
        },
        staff: {
          total: staffCount,
          managers: managerCount
        },
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
