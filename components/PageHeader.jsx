// components/PageHeader.jsx
import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

const PageHeader = ({
  icon: Icon,
  title,
  subtitle,
  showAddButton = false,
  addButtonText = 'Add',
  onAddClick,
  showRefreshButton = false,
  onRefreshClick,
  isRefreshing = false,
  customActions,
  showAddButtonCondition = true
}) => {
  return (
    <div className="max-w-7xl mx-auto mb-3 md:mb-4">
      <div className="bg-white rounded-xl p-3 md:p-4 shadow-md border border-amber-100">
        <div className="flex items-center justify-between gap-3">
          {/* Left side - Icon, Title, Subtitle */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 md:p-2.5 rounded-lg flex-shrink-0">
              <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-gray-600 hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            {showRefreshButton && (
              <button
                onClick={onRefreshClick}
                disabled={isRefreshing}
                className="p-2 md:p-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                aria-label="Refresh"
              >
                <RefreshCw 
                  className={`w-4 h-4 md:w-5 md:h-5 text-gray-600 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`} 
                />
              </button>
            )}

            {/* Add Button */}
            {showAddButton && showAddButtonCondition && (
              <button
                onClick={onAddClick}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-2 rounded-lg font-semibold text-sm flex-shrink-0 hover:from-amber-600 hover:to-orange-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{addButtonText}</span>
              </button>
            )}

            {/* Custom Actions */}
            {customActions}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;