// components/ViewControls.jsx
import React from 'react';
import { 
  LayoutGrid, List, Search, Filter, 
  ChevronDown, RotateCcw 
} from 'lucide-react';

const ViewControls = ({
  // Title
  title,
  itemCount,
  
  // View mode
  viewMode = 'grid',
  onViewModeChange,
  showViewToggle = true,
  
  // Grid columns
  gridColumns = 3,
  onGridColumnsChange,
  availableColumns = [2, 3, 4 ,5], // columns available for selection
  
  // Search
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = true,
  searchColSpan = 1, // for responsive grid
  
  // Filters
  filters = [], // array of filter objects
  
  // Reset
  onReset,
  showReset = true,
  
  // Custom content
  customFilters,
}) => {
  const [showFilterPanel, setShowFilterPanel] = React.useState(false);
  // Grid column SVG icons mapping
  const columnIcons = {
    1: (
      <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="6" strokeWidth="2" />
      </svg>
    ),
    2: (
      <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="2" y="3" width="9" height="6" strokeWidth="2" />
        <rect x="13" y="3" width="9" height="6" strokeWidth="2" />
      </svg>
    ),
    3: (
      <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="2" y="3" width="5.5" height="5.5" strokeWidth="2" />
        <rect x="9.25" y="3" width="5.5" height="5.5" strokeWidth="2" />
        <rect x="16.5" y="3" width="5.5" height="5.5" strokeWidth="2" />
      </svg>
    ),
    4: (
      <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="2" y="3" width="4" height="4" strokeWidth="2" />
        <rect x="8" y="3" width="4" height="4" strokeWidth="2" />
        <rect x="14" y="3" width="4" height="4" strokeWidth="2" />
        <rect x="20" y="3" width="2" height="4" strokeWidth="2" />
      </svg>
    ),
    5: (
      <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="2" y="4" width="3" height="3" strokeWidth="2" />
        <rect x="6.5" y="4" width="3" height="3" strokeWidth="2" />
        <rect x="11" y="4" width="3" height="3" strokeWidth="2" />
        <rect x="15.5" y="4" width="3" height="3" strokeWidth="2" />
        <rect x="20" y="4" width="2" height="3" strokeWidth="2" />
      </svg>
    ),
    6: (
      <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="2" y="4" width="2.5" height="2.5" strokeWidth="2" />
        <rect x="5.5" y="4" width="2.5" height="2.5" strokeWidth="2" />
        <rect x="9" y="4" width="2.5" height="2.5" strokeWidth="2" />
        <rect x="12.5" y="4" width="2.5" height="2.5" strokeWidth="2" />
        <rect x="16" y="4" width="2.5" height="2.5" strokeWidth="2" />
        <rect x="19.5" y="4" width="2.5" height="2.5" strokeWidth="2" />
      </svg>
    ),
  };

  return (
    <div className="max-w-7xl mx-auto mb-3 md:mb-5">
      <div className="bg-white/90 backdrop-blur rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg border border-amber-100 space-y-3">
        
        {/* Top Row: Title & View Controls */}
        <div className="flex justify-between items-center gap-2 sm:gap-3">
          {/* Title - Left side */}
          <h2 className="text-sm md:text-base font-bold text-gray-900 flex-1">
            {title} {itemCount !== undefined && `(${itemCount})`}
          </h2>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* View Controls - Always visible */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              {showViewToggle && (
                <>
                  <button
                    onClick={() => onViewModeChange?.('grid')}
                    className={`p-1.5 md:p-2 rounded transition-all ${
                      viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                    title="Grid view"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => onViewModeChange?.('table')}
                    className={`p-1.5 md:p-2 rounded transition-all ${
                      viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                    title="Table view"
                  >
                    <List className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-700" />
                  </button>
                </>
              )}
            </div>

            {/* Grid Column Selector - Only show in grid mode on desktop */}
            {viewMode === 'grid' && availableColumns.length > 0 && (
              <div className="hidden lg:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                {availableColumns.map((cols) => (
                  <button
                    key={cols}
                    onClick={() => onGridColumnsChange?.(cols)}
                    className={`p-1.5 rounded transition-all ${
                      gridColumns === cols ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                    title={`${cols} column${cols > 1 ? 's' : ''}`}
                  >
                    {columnIcons[cols]}
                  </button>
                ))}
              </div>
            )}

            {/* Filter Toggle Button - Mobile only */}
            {(showSearch || filters.length > 0 || customFilters) && (
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="md:hidden p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                title="Toggle filters"
              >
                <Filter className="w-4 h-4 text-gray-700" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: Filters - Collapsible on mobile */}
        {(showSearch || filters.length > 0 || customFilters) && (
          <div className={`${showFilterPanel ? 'block' : 'hidden'} md:block transition-all`}>
            <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-2">
            
            {/* Search Input */}
            {showSearch && (
              <div className={`relative flex-1`}>
                <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue ?? ''}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full pl-8 md:pl-9 pr-2.5 md:pr-3 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
              </div>
            )}

            {/* Dynamic Filters */}
            {filters.map((filter, index) => (
              <FilterInput key={`filter-${index}-${filter.value || ''}`} {...filter} />
            ))}

            {/* Custom Filters */}
            {customFilters}

            {/* Reset Button */}
            {showReset && onReset && (
              <button
                onClick={onReset}
                className="px-3 py-2 md:py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-1.5 transition text-xs md:text-sm text-gray-700 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Reset
              </button>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Filter Input Component
const FilterInput = ({ 
  type = 'select', // 'select', 'text', or 'date'
  icon: Icon = Filter,
  placeholder = 'Filter...',
  value,
  onChange,
  options = [], // for select type: [{ value: 'all', label: 'All Items' }]
}) => {
  if (type === 'text') {
    return (
      <div className="relative">
        <Icon className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4 pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full pl-8 md:pl-9 pr-2.5 md:pr-3 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </div>
    );
  }

  if (type === 'date') {
    return (
      <div className="relative">
        <Icon className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4 pointer-events-none z-0" />
        <input
          type="date"
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full pl-8 md:pl-9 pr-2.5 md:pr-3 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 relative z-10"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <Icon className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4 pointer-events-none" />
      <select
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full pl-8 md:pl-9 pr-8 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 cursor-pointer"
      >
        {options.map((option, idx) => (
          <option key={`${option.value}-${idx}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
    </div>
  );
};

export default ViewControls;