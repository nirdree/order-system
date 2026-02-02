'use client';
import React, { useState, useEffect } from 'react';
import { Printer, Download, X, Check, Plus, Minus } from 'lucide-react';

const BillComponent = ({ session, table, onPrint, onConfirm, onCancel, isLoading, hotelName = 'Our Cafe' }) => {
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('billFontSize') ? parseInt(localStorage.getItem('billFontSize')) : 11;
    }
    return 11;
  });

  const [paperWidth, setPaperWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('billPaperWidth') ? parseInt(localStorage.getItem('billPaperWidth')) : 80;
    }
    return 80;
  });

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('billFontSize', fontSize.toString());
      localStorage.setItem('billPaperWidth', paperWidth.toString());
    }
  }, [fontSize, paperWidth]);

  const activeOrders = session?.orders?.filter(o => o.orderStatus !== 'cancelled') || [];
  
  // Collect all items from all orders
  const allItems = [];
  activeOrders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        allItems.push({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal || (item.price * item.quantity)
        });
      });
    }
  });

  const totalAmount = allItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = allItems.reduce((sum, item) => sum + item.quantity, 0);
  const currentTime = new Date().toLocaleString();

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const billHTML = document.getElementById('bill-content').innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bill</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            background: white;
            padding: 0;
            width: ${paperWidth}mm;
          }
          
          @page {
            size: ${paperWidth}mm auto;
            margin: 0;
            padding: 0;
          }
          
          .max-w-md {
            width: 100%;
            margin: 0;
            background: white;
            padding: 3mm;
            font-size: ${fontSize}px;
            line-height: 1.3;
          }
          
          h1 {
            font-size: ${Math.round(fontSize * 1.5)}px;
            font-weight: bold;
            margin: 0;
            text-align: center;
          }
          
          p {
            font-size: ${fontSize - 1}px;
            margin: 2px 0;
            text-align: center;
          }
          
          .text-center {
            text-align: center;
          }
          
          .text-left {
            text-align: left;
          }
          
          .text-right {
            text-align: right;
          }
          
          .font-bold {
            font-weight: bold;
          }
          
          .border-b-2 {
            border-bottom: 2px dashed #333;
            padding-bottom: 2px;
            margin: 2px 0;
          }
          
          .border-b {
            border-bottom: 1px solid #333;
            padding-bottom: 1px;
            margin: 2px 0;
          }
          
          .border-t {
            border-top: 1px solid #333;
            padding-top: 2px;
            margin: 2px 0;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 2px 0;
            font-size: ${fontSize}px;
          }
          
          th {
            border-bottom: 1px solid #333;
            padding: 2px 0;
            font-weight: bold;
            text-align: left;
            font-size: ${fontSize}px;
          }
          
          td {
            padding: 1px 2px;
            border: none;
            margin: 0;
            font-size: ${fontSize}px;
          }
          
          .mb-3 {
            margin-bottom: 2px;
          }
          
          .pt-3 {
            padding-top: 2px;
          }
          
          .pb-3 {
            padding-bottom: 2px;
          }
          
          .text-xl {
            font-size: ${Math.round(fontSize * 1.3)}px;
          }
          
          .text-lg {
            font-size: ${Math.round(fontSize * 1.1)}px;
          }
          
          .text-xs {
            font-size: ${fontSize - 2}px;
          }
          
          .text-green-600 {
            color: #000;
            font-weight: bold;
          }
          
          .text-amber-700 {
            color: #333;
          }
          
          .text-gray-600 {
            color: #555;
          }
          
          .mt-1 {
            margin-top: 1px;
          }
          
          .mt-2 {
            margin-top: 2px;
          }
        </style>
      </head>
      <body>
        ${billHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
    
    onPrint?.();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg md:text-xl font-bold text-white">Bill</h2>
          <button 
            onClick={onCancel} 
            className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
        </div>

        {/* Bill Content - Printable Section */}
        <div id="bill-content" className="flex-1 overflow-y-auto p-2 md:p-3 bg-white" style={{ fontSize: `${fontSize}px` }}>
          {/* Bill Paper Style */}
          <div className="max-w-md mx-auto bg-white" style={{ width: `${paperWidth}mm` }}>
            {/* Hotel Header */}
            <div className="text-center border-b-2 border-dashed border-gray-400 pb-1 mb-1">
              <h1 className="text-base md:text-lg font-bold text-gray-900" style={{ fontSize: `${Math.round(fontSize * 1.5)}px` }}>{hotelName}</h1>
              <p className="text-gray-600 text-[9px] md:text-xs mt-0.5" style={{ fontSize: `${fontSize - 1}px` }}>Receipt</p>
            </div>

            {/* Table & Session Info */}
            <div className="text-center text-[9px] md:text-xs mb-1 pb-1 border-b border-gray-300">
              <p style={{ fontSize: `${fontSize - 1}px` }}><span className="font-semibold">Table:</span> {table?.tableNumber}</p>
              <p style={{ fontSize: `${fontSize - 1}px` }}><span className="font-semibold">Guests:</span> {session?.customerCount || 1}</p>
              <p className="text-gray-600 text-[8px] md:text-[9px] mt-0.5" style={{ fontSize: `${fontSize - 2}px` }}>{currentTime}</p>
            </div>

            {/* Items Section */}
            <div className="mb-1">
              <table className="w-full" style={{ fontSize: `${fontSize - 1}px` }}>
                <thead>
                  <tr className="border-b border-gray-400 pb-0.5">
                    <th className="text-left font-bold py-1">Item</th>
                    <th className="text-center font-bold py-1 w-8">Qty</th>
                    <th className="text-right font-bold py-1 w-12">Price</th>
                    <th className="text-right font-bold py-1 w-12">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.length > 0 ? (
                    allItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="py-0.5 text-left font-medium text-gray-800">{item.name}</td>
                        <td className="text-center text-gray-700">{item.quantity}</td>
                        <td className="text-right text-gray-700">₹{item.price.toFixed(0)}</td>
                        <td className="text-right font-semibold text-gray-900">₹{item.subtotal.toFixed(0)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-1 text-center text-gray-500 text-[8px]">No items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div className="border-t-2 border-dashed border-gray-400 pt-1 mb-1">
              <div className="flex justify-between mb-1" style={{ fontSize: `${fontSize - 1}px` }}>
                <span className="text-gray-700">Total Items:</span>
                <span className="font-semibold text-gray-900">{totalItems}</span>
              </div>
              <div className="flex justify-between font-bold" style={{ fontSize: `${Math.round(fontSize * 1.3)}px` }}>
                <span className="text-gray-900">Total:</span>
                <span className="text-green-600">₹{totalAmount.toFixed(0)}</span>
              </div>
            </div>

            {/* Sweet Message */}
            <div className="border-t border-gray-300 pt-1 text-center">
              <p className="font-semibold text-amber-700 mb-0.5" style={{ fontSize: `${fontSize - 2}px` }}>Thank You!</p>
              <p className="text-gray-600" style={{ fontSize: `${fontSize - 2}px` }}>Visit us again soon!</p>
              <p className="text-gray-500 mt-1" style={{ fontSize: `${fontSize - 3}px` }}>🎉 Enjoy! 🎉</p>
            </div>

            {/* Footer */}
            <div className="text-center text-gray-500 mt-1 pt-1 border-t border-gray-300" style={{ fontSize: `${fontSize - 2}px` }}>
              <p>Bill #{session?.sessionId}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 px-4 md:px-6 py-2 md:py-3 flex gap-2 md:gap-3 flex-shrink-0 bg-gray-50">
          {/* Settings Panel */}
          {showSettings && (
            <div className="absolute bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg p-4 border-2 border-amber-400 z-40">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Print Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-gray-200 rounded transition"
                  title="Close settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Paper Width */}
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-700 block mb-1">Paper Width: {paperWidth}mm</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaperWidth(Math.max(50, paperWidth - 5))}
                    className="p-1 bg-red-500 hover:bg-red-600 text-white rounded"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="range"
                    min="50"
                    max="210"
                    value={paperWidth}
                    onChange={(e) => setPaperWidth(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-300 rounded cursor-pointer"
                  />
                  <button
                    onClick={() => setPaperWidth(Math.min(210, paperWidth + 5))}
                    className="p-1 bg-green-500 hover:bg-green-600 text-white rounded"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[10px] text-gray-600 mt-1 flex justify-between">
                  <span>Thermal: 80mm</span>
                  <span>A4: 210mm</span>
                </div>
              </div>

              {/* Font Size */}
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-700 block mb-1">Font Size: {fontSize}px</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSize(Math.max(8, fontSize - 1))}
                    className="p-1 bg-red-500 hover:bg-red-600 text-white rounded"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="range"
                    min="8"
                    max="16"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-300 rounded cursor-pointer"
                  />
                  <button
                    onClick={() => setFontSize(Math.min(16, fontSize + 1))}
                    className="p-1 bg-green-500 hover:bg-green-600 text-white rounded"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-700 block mb-2">Quick Presets:</label>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <button
                    onClick={() => { setPaperWidth(80); setFontSize(11); }}
                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold"
                  >
                    80mm Thermal
                  </button>
                  <button
                    onClick={() => { setPaperWidth(58); setFontSize(10); }}
                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold"
                  >
                    58mm Thermal
                  </button>
                  <button
                    onClick={() => { setPaperWidth(210); setFontSize(12); }}
                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold"
                  >
                    A4 Paper
                  </button>
                  <button
                    onClick={() => { setPaperWidth(100); setFontSize(11); }}
                    className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold"
                  >
                    Custom
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 md:px-4 py-2 md:py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold text-xs md:text-sm transition"
          >
            ⚙️ Settings
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg font-semibold text-xs md:text-sm transition"
          >
            <Printer className="w-4 h-4 md:w-5 md:h-5" />
            Print Bill
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg font-semibold text-xs md:text-sm transition"
          >
            <Check className="w-4 h-4 md:w-5 md:h-5" />
            {isLoading ? 'Processing...' : 'Confirm & Close'}
          </button>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            /* Reset everything */
            body, html {
              margin: 0;
              padding: 0;
              background: white;
            }
            
            /* Hide the modal overlay and fixed positioning */
            body > div.fixed {
              position: static !important;
              background: white !important;
              backdrop-filter: none !important;
              display: block !important;
              width: 100% !important;
              height: auto !important;
            }
            
            /* Modal container */
            div.bg-white.rounded-xl {
              border-radius: 0 !important;
              box-shadow: none !important;
              max-width: 80mm !important;
              width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              display: flex !important;
              flex-direction: column !important;
            }
            
            /* Hide header */
            div.bg-gradient-to-r {
              display: none !important;
            }
            
            /* Show bill content */
            #bill-content {
              display: block !important;
              overflow: visible !important;
              max-height: none !important;
              padding: 5mm !important;
              margin: 0 !important;
              width: 100% !important;
              background: white !important;
            }
            
            /* Hide buttons footer */
            div.border-t.border-gray-200 {
              display: none !important;
            }
            
            /* Bill styling */
            .max-w-md {
              max-width: 100% !important;
              width: 100% !important;
              background: white !important;
              margin: 0 !important;
            }
            
            /* Ensure text is visible */
            * {
              color: #000 !important;
              background: transparent !important;
            }
            
            /* Page setup */
            @page {
              size: 80mm auto;
              margin: 0;
              padding: 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
            }
            
            th, td {
              padding: 3px 0;
              border: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default BillComponent;
