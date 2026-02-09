// components/Toast.jsx - Toast notification component
'use client';

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';

const Toast = ({
  id,
  type = 'info',
  title,
  message,
  onClose,
  duration = 5000,
  icon: CustomIcon
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };

  const getIcon = () => {
    if (CustomIcon) {
      return <CustomIcon className={`w-5 h-5 ${getIconColor()}`} />;
    }

    switch (type) {
      case 'success':
        return <CheckCircle className={`w-5 h-5 ${getIconColor()}`} />;
      case 'error':
        return <AlertCircle className={`w-5 h-5 ${getIconColor()}`} />;
      case 'warning':
        return <AlertCircle className={`w-5 h-5 ${getIconColor()}`} />;
      case 'info':
      default:
        return <Bell className={`w-5 h-5 ${getIconColor()}`} />;
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 max-w-sm w-full
        border rounded-lg shadow-lg p-4
        flex items-start gap-3
        animate-slide-in
        ${getTypeStyles()}
      `}
      role="alert"
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm mb-1">{title}</h3>
        <p className="text-xs opacity-90">{message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="flex-shrink-0 ml-2 p-1 hover:opacity-75 transition"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Animation keyframes added globally */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Toast;
