'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, DollarSign, ShoppingCart, Package } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function SalesExplanationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const [activeTab, setActiveTab] = useState('sales');

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

  return (
    <div className="min-h-screen bg-amber-50 p-3 md:p-6">
      {/* <PageHeader 
        title="Sales & Explanations Report" 
        description="View detailed sales and expense information by date range"
      /> */}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 border-l-4 border-amber-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
            <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
              <Calendar className="w-4 h-4 text-amber-600" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="bg-transparent outline-none text-sm font-medium text-gray-700 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
            <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
              <Calendar className="w-4 h-4 text-amber-600" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="bg-transparent outline-none text-sm font-medium text-gray-700 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Items per Page</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setPage(1);
              }}
              className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value={5}>5 Items</option>
              <option value={10}>10 Items</option>
              <option value={20}>20 Items</option>
              <option value={50}>50 Items</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 text-red-700 font-medium">
          ⚠️ Error: {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="inline-flex items-center gap-2 text-amber-600 font-semibold">
            <div className="animate-spin">⟳</div>
            Loading data...
          </div>
        </div>
      )}

      {/* Main Content */}
      {data && (
        <>
          {/* Date Range Info */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4 md:p-5 mb-6 text-sm md:text-base">
            <p className="text-gray-700">
              📅 Showing data from <span className="font-bold text-amber-900">{data.dateRange.start}</span> to <span className="font-bold text-amber-900">{data.dateRange.end}</span>
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-3 mb-6 border-b-2 border-gray-200">
            <button
              onClick={() => {
                setActiveTab('sales');
                setPage(1);
              }}
              className={`px-4 md:px-6 py-3 text-sm md:text-base font-semibold transition-all border-b-4 ${
                activeTab === 'sales'
                  ? 'border-amber-500 text-amber-600 bg-amber-50'
                  : 'border-transparent text-gray-600 hover:text-amber-600'
              }`}
            >
              📊 Sales Report
            </button>
            <button
              onClick={() => {
                setActiveTab('explanations');
                setPage(1);
              }}
              className={`px-4 md:px-6 py-3 text-sm md:text-base font-semibold transition-all border-b-4 ${
                activeTab === 'explanations'
                  ? 'border-amber-500 text-amber-600 bg-amber-50'
                  : 'border-transparent text-gray-600 hover:text-amber-600'
              }`}
            >
              💰 Expenses
            </button>
          </div>

          {/* SALES TAB */}
          {activeTab === 'sales' && (
            <div className="animate-fadeIn">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase tracking-wide">Total Orders</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{data.sales.summary.totalOrders}</p>
                    </div>
                    <ShoppingCart className="w-10 h-10 text-blue-500 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase tracking-wide">Total Revenue</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">₹{data.sales.summary.totalRevenue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-10 h-10 text-green-500 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md border-l-4 border-purple-500 p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase tracking-wide">Average Order Value</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">₹{data.sales.summary.averageOrderValue.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-purple-500 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md border-l-4 border-orange-500 p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase tracking-wide">Total Items Sold</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{data.sales.summary.totalItems}</p>
                    </div>
                    <Package className="w-10 h-10 text-orange-500 opacity-20" />
                  </div>
                </div>
              </div>

              {/* Sales Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="border-b-2 border-gray-200 p-4 md:p-5 bg-gradient-to-r from-amber-50 to-orange-50">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Item-wise Sales Breakdown</h2>
                </div>
                
                {data.sales.items.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b-2 border-gray-200">
                          <tr>
                            <th className="px-4 md:px-6 py-3 text-left font-bold text-gray-700">Item Name</th>
                            <th className="px-4 md:px-6 py-3 text-left font-bold text-gray-700">Orders Count</th>
                            <th className="px-4 md:px-6 py-3 text-left font-bold text-gray-700">Quantity Sold</th>
                            <th className="px-4 md:px-6 py-3 text-right font-bold text-gray-700">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.sales.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-amber-50 transition-colors">
                              <td className="px-4 md:px-6 py-3 text-gray-900 font-medium">{item.name}</td>
                              <td className="px-4 md:px-6 py-3 text-gray-700">{item.quantity}</td>
                              <td className="px-4 md:px-6 py-3 text-gray-700">{item.totalSold}</td>
                              <td className="px-4 md:px-6 py-3 text-right font-bold text-green-600">₹{item.revenue.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:p-5 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={!data.sales.pagination.hasPrevPage}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </button>
                      <span className="text-sm md:text-base font-semibold text-gray-700">
                        Page {data.sales.pagination.page} of {data.sales.pagination.pages}
                      </span>
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!data.sales.pagination.hasNextPage}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No sales data for the selected date range</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXPLANATIONS TAB */}
          {activeTab === 'explanations' && (
            <div className="animate-fadeIn">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase tracking-wide">Total Expenses</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{data.explanations.summary.totalExplanations}</p>
                    </div>
                    <ShoppingCart className="w-10 h-10 text-blue-500 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md border-l-4 border-red-500 p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase tracking-wide">Total Amount</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">₹{data.explanations.summary.totalExpense.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-10 h-10 text-red-500 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md border-l-4 border-yellow-500 p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase tracking-wide">Average Expense</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">₹{data.explanations.summary.averageExpense.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-yellow-500 opacity-20" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase tracking-wide">Categories</p>
                      <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{data.explanations.summary.byCategory.length}</p>
                    </div>
                    <Package className="w-10 h-10 text-green-500 opacity-20" />
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="border-b-2 border-gray-200 p-4 md:p-5 bg-gradient-to-r from-amber-50 to-orange-50">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Expense by Category</h2>
                </div>
                
                {data.explanations.summary.byCategory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-4 md:px-6 py-3 text-left font-bold text-gray-700">Category</th>
                          <th className="px-4 md:px-6 py-3 text-left font-bold text-gray-700">Count</th>
                          <th className="px-4 md:px-6 py-3 text-right font-bold text-gray-700">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.explanations.summary.byCategory.map((cat, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-amber-50 transition-colors">
                            <td className="px-4 md:px-6 py-3 text-gray-900 font-medium">{cat.categoryName}</td>
                            <td className="px-4 md:px-6 py-3 text-gray-700">{cat.count}</td>
                            <td className="px-4 md:px-6 py-3 text-right font-bold text-red-600">₹{cat.totalAmount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No expense categories</p>
                  </div>
                )}
              </div>

              {/* Detailed Explanations */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="border-b-2 border-gray-200 p-4 md:p-5 bg-gradient-to-r from-amber-50 to-orange-50">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Detailed Expenses</h2>
                </div>
                
                {data.explanations.items.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b-2 border-gray-200">
                          <tr>
                            <th className="px-4 md:px-6 py-3 text-left font-bold text-gray-700">Category</th>
                            <th className="px-4 md:px-6 py-3 text-left font-bold text-gray-700">Description</th>
                            <th className="px-4 md:px-6 py-3 text-left font-bold text-gray-700">Amount</th>
                            <th className="px-4 md:px-6 py-3 text-left font-bold text-gray-700">Payment Mode</th>
                            <th className="px-4 md:px-6 py-3 text-left font-bold text-gray-700">Date</th>
                            <th className="px-4 md:px-6 py-3 text-left font-bold text-gray-700">Created By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.explanations.items.map((exp, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-amber-50 transition-colors">
                              <td className="px-4 md:px-6 py-3 text-gray-900 font-medium">{exp.category?.name || 'Uncategorized'}</td>
                              <td className="px-4 md:px-6 py-3 text-gray-700">{exp.description}</td>
                              <td className="px-4 md:px-6 py-3 font-bold text-red-600">₹{exp.totalAmountPaid.toLocaleString()}</td>
                              <td className="px-4 md:px-6 py-3 text-gray-700">
                                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                                  {exp.paymentMode}
                                </span>
                              </td>
                              <td className="px-4 md:px-6 py-3 text-gray-700">{new Date(exp.explanationDate).toLocaleDateString()}</td>
                              <td className="px-4 md:px-6 py-3 text-gray-700">{exp.createdBy?.name || 'Unknown'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:p-5 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={!data.explanations.pagination.hasPrevPage}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </button>
                      <span className="text-sm md:text-base font-semibold text-gray-700">
                        Page {data.explanations.pagination.page} of {data.explanations.pagination.pages}
                      </span>
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!data.explanations.pagination.hasNextPage}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No expenses for the selected date range</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
