'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, TrendingUp, DollarSign, 
  ShoppingCart, Package, LayoutDashboard, FileText, FolderOpen,
  IndianRupee, Filter
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ViewControls from '@/components/ViewControls';
import StatsCards from '@/components/StatsCards';

export default function SalesExplanationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const [activeTab, setActiveTab] = useState('sales');
  const [viewMode, setViewMode] = useState('table');
  const [gridColumns, setGridColumns] = useState(3);

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setStartDate(dateStr);
    setEndDate(dateStr);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
          page,
          limit
        });

        const response = await fetch(`/api/sales-explanations?${params}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error);
          return;
        }

        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, page, limit]);

  const handleDateChange = (field, value) => {
    if (field === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setStartDate(dateStr);
    setEndDate(dateStr);
    setPage(1);
  };

  const salesStats = data ? [
    {
      icon: ShoppingCart,
      label: 'Total Orders',
      value: data.sales.summary.totalOrders,
      color: 'blue'
    },
    {
      icon: IndianRupee,
      label: 'Total Revenue',
      value: `₹${data.sales.summary.totalRevenue.toLocaleString()}`,
      color: 'green'
    },
    {
      icon: TrendingUp,
      label: 'Avg Order Value',
      value: `₹${data.sales.summary.averageOrderValue.toLocaleString()}`,
      color: 'purple'
    },
    {
      icon: Package,
      label: 'Total Items Sold',
      value: data.sales.summary.totalItems,
      color: 'orange'
    }
  ] : [];

  const explanationStats = data ? [
    {
      icon: FileText,
      label: 'Total Expenses',
      value: data.explanations.summary.totalExplanations,
      color: 'blue'
    },
    {
      icon: IndianRupee,
      label: 'Total Amount',
      value: `₹${data.explanations.summary.totalExpense.toLocaleString()}`,
      color: 'orange'
    },
    {
      icon: TrendingUp,
      label: 'Average Expense',
      value: `₹${data.explanations.summary.averageExpense.toLocaleString()}`,
      color: 'purple'
    },
    {
      icon: FolderOpen,
      label: 'Categories',
      value: data.explanations.summary.byCategory.length,
      color: 'green'
    }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-2 sm:p-3 md:p-4">
      {/* Error Notification */}
      {error && (
        <div className="fixed top-3 right-3 z-50 animate-slide-in bg-red-500 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm max-w-sm">
          <span className="font-medium">⚠️ Error: {error}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        icon={LayoutDashboard}
        title="Sales & Expenses Report"
        subtitle="View detailed sales and expense information by date range"
      />

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-3 md:mb-4">
        <div className="bg-white rounded-xl p-1.5 md:p-2 shadow-md border border-amber-100 flex gap-1.5 md:gap-2">
          <button
            onClick={() => {
              setActiveTab('sales');
              setPage(1);
            }}
            className={`flex-1 flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition-all ${
              activeTab === 'sales'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Sales Report</span>
            <span className="sm:hidden">Sales</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('explanations');
              setPage(1);
            }}
            className={`flex-1 flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition-all ${
              activeTab === 'explanations'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Expenses</span>
            <span className="sm:hidden">Expenses</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl p-12 text-center shadow-md border border-amber-100">
            <div className="inline-flex items-center gap-2 text-amber-600 font-semibold">
              <div className="animate-spin text-2xl">⟳</div>
              Loading data...
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {data && !loading && (
        <>
          {/* SALES TAB */}
          {activeTab === 'sales' && (
            <>
              {/* Stats Cards */}
              <StatsCards stats={salesStats} columns={4} />

              {/* View Controls & Filters */}
              <ViewControls
                title="Sales Report"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                gridColumns={gridColumns}
                onGridColumnsChange={setGridColumns}
                availableColumns={[2, 3, 4]}
                filters={[
                  {
                    type: 'date',
                    icon: Calendar,
                    value: startDate,
                    onChange: (value) => handleDateChange('start', value),
                    placeholder: 'Start Date',
                    label: 'From'
                  },
                  {
                    type: 'date',
                    icon: Calendar,
                    value: endDate,
                    onChange: (value) => handleDateChange('end', value),
                    placeholder: 'End Date',
                    label: 'To'
                  },
                  {
                    type: 'select',
                    icon: Filter,
                    value: limit,
                    onChange: (value) => {
                      setLimit(parseInt(value));
                      setPage(1);
                    },
                    options: [
                      { value: 5, label: '5 Items' },
                      { value: 10, label: '10 Items' },
                      { value: 20, label: '20 Items' },
                      { value: 50, label: '50 Items' }
                    ],
                    label: 'Per Page'
                  }
                ]}
                onReset={handleResetFilters}
              />

              {/* Date Range Info */}
              <div className="max-w-7xl mx-auto mb-3 md:mb-4">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl p-3 md:p-4 text-xs md:text-sm">
                  <p className="text-gray-700">
                    📅 Showing data from <span className="font-bold text-amber-900">{data.dateRange.start}</span> to <span className="font-bold text-amber-900">{data.dateRange.end}</span>
                  </p>
                </div>
              </div>

              {/* Sales Display */}
              <div className="max-w-7xl mx-auto">
                {viewMode === 'grid' ? (
                  // Grid View
                  <div
                    className={`grid gap-2 md:gap-3 ${
                      gridColumns === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : gridColumns === 3
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    }`}
                  >
                    {data.sales.items.length === 0 ? (
                      <div className="col-span-full">
                        <div className="bg-white rounded-xl p-6 md:p-8 text-center shadow-md border border-amber-100">
                          <div className="bg-gray-100 p-3 md:p-4 rounded-full w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 flex items-center justify-center">
                            <Package className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600 font-semibold text-sm md:text-base mb-1">No sales found</p>
                          <p className="text-gray-500 text-xs md:text-sm">Try adjusting the date range</p>
                        </div>
                      </div>
                    ) : (
                      data.sales.items.map((item, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-md transition-all"
                        >
                          <div className="p-2.5 md:p-3 lg:p-4">
                            <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-2 line-clamp-2">
                              {item.name}
                            </h3>

                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500">Orders</span>
                                <div className="flex items-center gap-0.5">
                                  <ShoppingCart className="w-3 h-3 text-blue-600" />
                                  <span className="text-xs md:text-sm font-bold text-blue-600">
                                    {item.quantity}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500">Qty Sold</span>
                                <div className="flex items-center gap-0.5">
                                  <Package className="w-3 h-3 text-purple-600" />
                                  <span className="text-xs md:text-sm font-bold text-purple-600">
                                    {item.totalSold}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col pt-2 border-t border-gray-100">
                              <span className="text-[10px] text-gray-500 mb-0.5">Revenue</span>
                              <div className="flex items-center gap-0.5">
                                <IndianRupee className="w-4 h-4 text-green-600" />
                                <span className="text-sm md:text-base font-bold text-green-600">
                                  {item.revenue.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // Table View
                  <div className="bg-white rounded-xl shadow-md border border-amber-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                          <tr>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Item Name</th>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Orders</th>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Qty Sold</th>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-right text-xs md:text-sm font-bold text-gray-700">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {data.sales.items.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="px-4 py-8 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  <div className="bg-gray-100 p-3 md:p-4 rounded-full w-12 h-12 md:w-16 md:h-16 mb-3 flex items-center justify-center">
                                    <Package className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                                  </div>
                                  <p className="text-gray-600 font-semibold text-sm md:text-base mb-1">No sales found</p>
                                  <p className="text-gray-500 text-xs md:text-sm">Try adjusting the date range</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            data.sales.items.map((item, index) => (
                              <tr key={index} className="hover:bg-amber-50/50 transition-colors">
                                <td className="px-3 md:px-4 py-2 md:py-3">
                                  <span className="font-medium text-gray-900 text-xs md:text-sm">
                                    {item.name}
                                  </span>
                                </td>
                                <td className="px-3 md:px-4 py-2 md:py-3">
                                  <div className="flex items-center gap-1">
                                    <ShoppingCart className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600" />
                                    <span className="text-xs md:text-sm font-bold text-blue-600">
                                      {item.quantity}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 md:px-4 py-2 md:py-3">
                                  <div className="flex items-center gap-1">
                                    <Package className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-600" />
                                    <span className="text-xs md:text-sm font-bold text-purple-600">
                                      {item.totalSold}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 md:px-4 py-2 md:py-3 text-right">
                                  <div className="inline-flex items-center gap-0.5 md:gap-1">
                                    <IndianRupee className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                                    <span className="text-xs md:text-sm font-bold text-green-600">
                                      {item.revenue.toLocaleString()}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {data.sales.items.length > 0 && (
                      <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 p-3 md:p-4 border-t border-gray-200 bg-gray-50">
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={!data.sales.pagination.hasPrevPage}
                          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg font-semibold text-xs md:text-sm transition-colors disabled:cursor-not-allowed w-full md:w-auto justify-center"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Previous
                        </button>
                        <span className="text-xs md:text-sm font-semibold text-gray-700">
                          Page {data.sales.pagination.page} of {data.sales.pagination.pages}
                        </span>
                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={!data.sales.pagination.hasNextPage}
                          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg font-semibold text-xs md:text-sm transition-colors disabled:cursor-not-allowed w-full md:w-auto justify-center"
                        >
                          Next <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* EXPLANATIONS TAB */}
          {activeTab === 'explanations' && (
            <>
              {/* Stats Cards */}
              <StatsCards stats={explanationStats} columns={4} />

              {/* View Controls & Filters */}
              <ViewControls
                title="Expenses Report"
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                gridColumns={gridColumns}
                onGridColumnsChange={setGridColumns}
                availableColumns={[2, 3, 4]}
                filters={[
                  {
                    type: 'date',
                    icon: Calendar,
                    value: startDate,
                    onChange: (value) => handleDateChange('start', value),
                    placeholder: 'Start Date',
                    label: 'From'
                  },
                  {
                    type: 'date',
                    icon: Calendar,
                    value: endDate,
                    onChange: (value) => handleDateChange('end', value),
                    placeholder: 'End Date',
                    label: 'To'
                  },
                  {
                    type: 'select',
                    icon: Filter,
                    value: limit,
                    onChange: (value) => {
                      setLimit(parseInt(value));
                      setPage(1);
                    },
                    options: [
                      { value: 5, label: '5 Items' },
                      { value: 10, label: '10 Items' },
                      { value: 20, label: '20 Items' },
                      { value: 50, label: '50 Items' }
                    ],
                    label: 'Per Page'
                  }
                ]}
                onReset={handleResetFilters}
              />

              {/* Date Range Info */}
              <div className="max-w-7xl mx-auto mb-3 md:mb-4">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl p-3 md:p-4 text-xs md:text-sm">
                  <p className="text-gray-700">
                    📅 Showing data from <span className="font-bold text-amber-900">{data.dateRange.start}</span> to <span className="font-bold text-amber-900">{data.dateRange.end}</span>
                  </p>
                </div>
              </div>

              {/* Category Breakdown */}
              {data.explanations.summary.byCategory.length > 0 && (
                <div className="max-w-7xl mx-auto mb-3 md:mb-4">
                  <div className="bg-white rounded-xl shadow-md border border-amber-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-3 md:px-4 py-2.5 md:py-3 border-b border-amber-200">
                      <h2 className="text-sm md:text-base font-bold text-gray-900">Expense by Category</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 md:px-4 py-2 md:py-2.5 text-left text-xs md:text-sm font-bold text-gray-700">Category</th>
                            <th className="px-3 md:px-4 py-2 md:py-2.5 text-left text-xs md:text-sm font-bold text-gray-700">Count</th>
                            <th className="px-3 md:px-4 py-2 md:py-2.5 text-right text-xs md:text-sm font-bold text-gray-700">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {data.explanations.summary.byCategory.map((cat, index) => (
                            <tr key={index} className="hover:bg-amber-50/50 transition-colors">
                              <td className="px-3 md:px-4 py-2 md:py-2.5">
                                <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                                  <FolderOpen className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-600" />
                                  <span className="text-[10px] md:text-xs font-bold text-amber-700">
                                    {cat.categoryName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 md:px-4 py-2 md:py-2.5">
                                <span className="text-xs md:text-sm text-gray-700 font-medium">{cat.count}</span>
                              </td>
                              <td className="px-3 md:px-4 py-2 md:py-2.5 text-right">
                                <div className="inline-flex items-center gap-0.5 md:gap-1">
                                  <IndianRupee className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                                  <span className="text-xs md:text-sm font-bold text-red-600">
                                    {cat.totalAmount.toLocaleString()}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Explanations Display */}
              <div className="max-w-7xl mx-auto">
                {viewMode === 'grid' ? (
                  // Grid View
                  <div
                    className={`grid gap-2 md:gap-3 ${
                      gridColumns === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : gridColumns === 3
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    }`}
                  >
                    {data.explanations.items.length === 0 ? (
                      <div className="col-span-full">
                        <div className="bg-white rounded-xl p-6 md:p-8 text-center shadow-md border border-amber-100">
                          <div className="bg-gray-100 p-3 md:p-4 rounded-full w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 flex items-center justify-center">
                            <FileText className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600 font-semibold text-sm md:text-base mb-1">No expenses found</p>
                          <p className="text-gray-500 text-xs md:text-sm">Try adjusting the date range</p>
                        </div>
                      </div>
                    ) : (
                      data.explanations.items.map((exp, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-xl overflow-hidden shadow-sm border border-amber-100 hover:shadow-md transition-all"
                        >
                          <div className="p-2.5 md:p-3 lg:p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 line-clamp-2 flex-1">
                                {exp.description}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1.5 md:gap-2 mb-2">
                              <div className="bg-amber-50 border border-amber-200 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg flex items-center gap-1">
                                <FolderOpen className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-600" />
                                <span className="text-[10px] md:text-[11px] font-bold text-amber-700">
                                  {exp.category?.name || 'Uncategorized'}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col mb-2">
                              <span className="text-[10px] text-gray-500">Amount</span>
                              <div className="flex items-center gap-0.5">
                                <IndianRupee className="w-4 h-4 text-red-600" />
                                <span className="text-sm md:text-base font-bold text-red-600">
                                  {exp.totalAmountPaid.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg text-[10px] md:text-xs">
                                <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                {new Date(exp.explanationDate).toLocaleDateString()}
                              </div>
                              <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-purple-100 border border-purple-300 text-purple-700 text-[9px] md:text-[11px] rounded-lg font-semibold uppercase">
                                {exp.paymentMode}
                              </span>
                            </div>

                            {exp.createdBy?.name && (
                              <div className="pt-2 border-t border-gray-100">
                                <span className="text-[10px] text-gray-500">Created by: </span>
                                <span className="text-[10px] md:text-xs font-medium text-gray-700">{exp.createdBy.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // Table View
                  <div className="bg-white rounded-xl shadow-md border border-amber-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                          <tr>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Category</th>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Description</th>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Amount</th>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden md:table-cell">Payment</th>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden lg:table-cell">Date</th>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700 hidden lg:table-cell">Created By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {data.explanations.items.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="px-4 py-8 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  <div className="bg-gray-100 p-3 md:p-4 rounded-full w-12 h-12 md:w-16 md:h-16 mb-3 flex items-center justify-center">
                                    <FileText className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                                  </div>
                                  <p className="text-gray-600 font-semibold text-sm md:text-base mb-1">No expenses found</p>
                                  <p className="text-gray-500 text-xs md:text-sm">Try adjusting the date range</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            data.explanations.items.map((exp, index) => (
                              <tr key={index} className="hover:bg-amber-50/50 transition-colors">
                                <td className="px-3 md:px-4 py-2 md:py-3">
                                  <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                                    <FolderOpen className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-600" />
                                    <span className="text-[10px] md:text-xs font-bold text-amber-700">
                                      {exp.category?.name || 'Uncategorized'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 md:px-4 py-2 md:py-3">
                                  <span className="font-medium text-gray-900 text-xs md:text-sm line-clamp-2">
                                    {exp.description}
                                  </span>
                                </td>
                                <td className="px-3 md:px-4 py-2 md:py-3">
                                  <div className="flex items-center gap-0.5 md:gap-1">
                                    <IndianRupee className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                                    <span className="text-xs md:text-sm font-bold text-red-600">
                                      {exp.totalAmountPaid.toLocaleString()}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 md:px-4 py-2 md:py-3 hidden md:table-cell">
                                  <span className="inline-flex px-2 py-1 bg-purple-100 border border-purple-300 text-purple-700 text-[10px] rounded-lg font-semibold uppercase">
                                    {exp.paymentMode}
                                  </span>
                                </td>
                                <td className="px-3 md:px-4 py-2 md:py-3 hidden lg:table-cell">
                                  <div className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                    <Calendar className="w-3.5 h-3.5 text-gray-600" />
                                    <span className="text-xs text-gray-700">
                                      {new Date(exp.explanationDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 md:px-4 py-2 md:py-3 hidden lg:table-cell">
                                  <span className="text-xs text-gray-700">{exp.createdBy?.name || 'Unknown'}</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {data.explanations.items.length > 0 && (
                      <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 p-3 md:p-4 border-t border-gray-200 bg-gray-50">
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={!data.explanations.pagination.hasPrevPage}
                          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg font-semibold text-xs md:text-sm transition-colors disabled:cursor-not-allowed w-full md:w-auto justify-center"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Previous
                        </button>
                        <span className="text-xs md:text-sm font-semibold text-gray-700">
                          Page {data.explanations.pagination.page} of {data.explanations.pagination.pages}
                        </span>
                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={!data.explanations.pagination.hasNextPage}
                          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg font-semibold text-xs md:text-sm transition-colors disabled:cursor-not-allowed w-full md:w-auto justify-center"
                        >
                          Next <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}