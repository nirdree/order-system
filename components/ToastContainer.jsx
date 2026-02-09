// components/ToastContainer.jsx - Container for all toasts
'use client';

import React from 'react';
import Toast from '@/components/Toast';
import { useSocket } from '@/context/SocketContext';

const ToastContainer = () => {
  const { notifications, removeNotification } = useSocket();

  return (
    <div className="fixed top-0 right-0 p-4 z-50 pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            id={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => removeNotification(notification.id)}
            duration={5000}
          />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
