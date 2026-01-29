'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Coffee, ShoppingCart, ArrowLeft } from 'lucide-react';

/**
 * Menu Page Component
 * This page is accessed when customers scan the QR code on their table
 * URL format: /menu/[tableId]
 * 
 * Place this file at: /app/menu/[tableId]/page.jsx
 */
const MenuPage = () => {
  const params = useParams();
  const tableId = params?.tableId;
  
  const [tableInfo, setTableInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tableId) {
      loadTableInfo();
    }
  }, [tableId]);

  const loadTableInfo = async () => {
    try {
      setIsLoading(true);
      // Fetch table information
      const response = await fetch(`/api/tables/${tableId}`);
      if (response.ok) {
        const data = await response.json();
        setTableInfo(data.data);
      }
    } catch (error) {
      console.error('Error loading table info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Cafe Menu</h1>
              {tableInfo && (
                <p className="text-white/90 text-sm">
                  Table {tableInfo.tableNumber} - Floor {tableInfo.floorNumber}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <>
            {/* Table Info Card */}
            {tableInfo && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-lg border-2 border-amber-100">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Welcome to Table {tableInfo.tableNumber}!
                </h2>
                <p className="text-gray-600">
                  You're seated on Floor {tableInfo.floorNumber}
                  {tableInfo.location && ` - ${tableInfo.location}`}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Capacity: {tableInfo.capacity} people
                </p>
              </div>
            )}

            {/* Menu Section */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border-2 border-amber-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Menu</h2>
              
              {/* This is where you would display your actual menu items */}
              <div className="text-center py-12">
                <Coffee className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <p className="text-gray-600">Menu items will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">
                  Table ID: <code className="bg-gray-100 px-2 py-1 rounded">{tableId}</code>
                </p>
              </div>

              {/* Example: You could integrate with your menu API here */}
              {/* 
              <MenuItems tableId={tableId} />
              <CartButton tableId={tableId} />
              */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MenuPage;