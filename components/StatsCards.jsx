// components/StatsCards.jsx
import React from 'react';

const StatsCards = ({ stats, columns = 4 }) => {
  // Determine grid columns class based on the columns prop
  const getGridClass = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-1';
      case 4:
        return 'grid-cols-4 sm:grid-cols-4 lg:grid-cols-4';
      case 5:
        return 'grid-cols-5 sm:grid-cols-5 lg:grid-cols-5';
      case 7:
        return 'grid-cols-7 sm:grid-cols-7';
      default:
        return 'grid-cols-4 sm:grid-cols-4 lg:grid-cols-4';
    }
  };

  return (
    <div className="max-w-7xl mx-auto mb-3 md:mb-5">
      <div className={`grid ${getGridClass()} gap-2 md:gap-3`}>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} columns={columns} />
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color = 'blue',
  columns 
}) => {
  // Color variants for different stat types
  const colorClasses = {
    blue: {
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700'
    },
    red: {
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-700'
    },
    green: {
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-700'
    },
    orange: {
      border: 'border-orange-200',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-700'
    },
    yellow: {
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-700'
    },
    purple: {
      border: 'border-purple-200',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-700'
    },
    gray: {
      border: 'border-gray-200',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      textColor: 'text-gray-700'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;
  const colSpan = columns === 7 ? 'col-span-1' : '';

  return (
    <div className={`bg-white/90 backdrop-blur border ${colors.border} rounded-lg md:rounded-xl p-2 md:p-3 shadow ${colSpan}`}>
      <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
        <div className={`${colors.iconBg} p-1 md:p-1.5 rounded-lg flex-shrink-0`}>
          <Icon className={`w-3 h-3 md:w-4 md:h-4 ${colors.iconColor}`} />
        </div>
        <p className="hidden md:block text-[10px] md:text-xs font-semibold text-gray-600">
          {label}
        </p>
      </div>
      <p className={`text-lg md:text-xl font-bold ${colors.textColor}`}>
        {value}
      </p>
    </div>
  );
};

export default StatsCards;