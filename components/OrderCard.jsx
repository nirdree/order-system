'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  User,
  DollarSign,
  Trash2
} from 'lucide-react';
import {
  STATUS_COLORS,
  formatDate,
  formatDuration,
  formatCurrency,
  getStatusBadgeData,
  canUpdateStatus,
  canCancelOrder
} from '@/lib/orderUtils';

export default function OrderCard({
  order,
  onStatusChange,
  onCancel,
  isUpdating = false
}) {
  const [expanded, setExpanded] = useState(false);

  if (!order) return null;

  const statusBadge = getStatusBadgeData(order.orderStatus);
  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const duration = formatDuration(order.createdAt, 
    order.orderStatus === 'served' ? order.updatedAt : null
  );

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-800">
                {order.orderId}
              </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                {statusBadge.icon} {statusBadge.label}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-600 hover:text-gray-900 transition p-2"
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Quick Info - Always Visible */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <Clock size={16} className="text-blue-500" />
          <div>
            <p className="text-gray-600">Duration</p>
            <p className="font-semibold text-gray-900">{duration}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle size={16} className="text-orange-500" />
          <div>
            <p className="text-gray-600">Items</p>
            <p className="font-semibold text-gray-900">{totalItems}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign size={16} className="text-green-500" />
          <div>
            <p className="text-gray-600">Total</p>
            <p className="font-semibold text-gray-900">{formatCurrency(order.orderAmount)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User size={16} className="text-purple-500" />
          <div>
            <p className="text-gray-600">Type</p>
            <p className="font-semibold text-gray-900 capitalize">{order.orderType}</p>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {expanded && (
        <>
          {/* Order Details */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-start p-2 bg-white rounded border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Qty: <span className="font-semibold">{item.quantity}</span>
                    </p>
                    {item.specialInstructions && (
                      <p className="text-sm text-amber-600 italic mt-1">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(item.subtotal)}
                    </p>
                    <p className="text-sm text-gray-600">
                      @ {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Notes */}
            {order.customerNotes && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-900">
                  <strong>Customer Notes:</strong> {order.customerNotes}
                </p>
              </div>
            )}
          </div>

          {/* Table/Session Info */}
          <div className="p-4 border-b border-gray-200 grid grid-cols-2 gap-4 bg-gray-50">
            {order.table && (
              <div>
                <p className="text-sm text-gray-600">Table</p>
                <p className="font-semibold text-gray-900">
                  #{order.table.tableNumber}
                  {order.table.floorNumber && ` - Floor ${order.table.floorNumber}`}
                </p>
              </div>
            )}
            {order.session && (
              <div>
                <p className="text-sm text-gray-600">Session</p>
                <p className="font-semibold text-gray-900">
                  {order.session.sessionId}
                </p>
              </div>
            )}
            {order.orderedBy && (
              <div>
                <p className="text-sm text-gray-600">Ordered By</p>
                <p className="font-semibold text-gray-900">
                  {order.orderedBy.name}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Placed By</p>
              <p className="font-semibold text-gray-900 capitalize">
                {order.placedBy}
              </p>
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h4 className="font-semibold text-gray-800 mb-3">Status History</h4>
              <div className="space-y-2 text-sm">
                {[...order.statusHistory].reverse().map((history, idx) => (
                  <div key={idx} className="flex justify-between text-gray-700">
                    <span className="capitalize">{history.status}</span>
                    <span className="text-gray-600">
                      {formatDate(history.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 bg-gray-50 flex gap-2">
            {canUpdateStatus(order.orderStatus) && (
              <button
                onClick={() => onStatusChange(order._id, 
                  order.orderStatus === 'pending' ? 'preparing' : 'served'
                )}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {isUpdating ? '⏳ Updating...' : '✓ Update Status'}
              </button>
            )}

            {canCancelOrder(order.orderStatus) && (
              <button
                onClick={() => onCancel(order._id)}
                disabled={isUpdating}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Cancel
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
