'use client';
import React, { useState, useEffect } from 'react';
import {
  Plus, ChevronDown, Clock, CheckCircle, AlertCircle, Loader,
  Eye, TrendingUp, Users, IndianRupee, UtensilsCrossed, X,
  ShoppingBag, Trash2, Package, Utensils, Minus, ShoppingCart,
  Send, Receipt, Edit2, MapPin, Search, LayoutGrid, List
} from 'lucide-react';
import { sessionsAPI, ordersAPI, tablesAPI, menuItemsAPI, customerAPI, categoriesAPI } from '@/lib/api-client';
import { useParams } from 'next/navigation';

const CustomerSelfOrderManagementPage = () => {
  const params = useParams();
  const tableId = params?.tableId;

  // Main states
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  // Location states
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Session & Order states
  const [session, setSession] = useState(null);

  // Menu & Cart states
  const [showMenuView, setShowMenuView] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState({});
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // View Mode States for Menu (NEW)
  const [menuViewMode, setMenuViewMode] = useState('grid'); // 'grid' or 'table'
  const [menuGridColumns, setMenuGridColumns] = useState(3); // 2, 3, or 4 columns for menu
  const [menuSearchTerm, setMenuSearchTerm] = useState(''); // search for menu items

  useEffect(() => {
    loadTableData();
  }, [tableId]);

  useEffect(() => {
    if (selectedTable) {
      if (selectedTable.status === 'occupied') {
        loadSession();
        setShowMenuView(false);
      } else {
        setShowMenuView(true);
        loadCategories();
        loadMenuItems();
      }
    } else {
      setSession(null);
      setCart({});
      setShowMenuView(false);
    }
  }, [selectedTable]);

  const loadTableData = async () => {
    try {
      setIsLoading(true);
      const tabledata = await tablesAPI.getTableById(tableId);
      if (tabledata.success) setSelectedTable(tabledata.data);
    } catch (error) {
      console.error('Error loading table data:', error);
      showNotification('error', 'Failed to load table data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async () => {
    try {
      setIsLoading(true);
      const response = await sessionsAPI.getSessionByTableId(selectedTable._id);

      if (response.success) {
        setSession(response.data);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      showNotification('error', 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await categoriesAPI.getAllCategories();

      if (response.success) {
        setCategories([{ _id: 'all', id: 'all', icon: 'list', imgURL: '', description: 'All Items' }, ...(response.data || [])]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      setIsLoadingMenuItems(true);
      const response = await menuItemsAPI.getAllMenuItems();

      if (response.success) {
        setMenuItems(response.data || []);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setIsLoadingMenuItems(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
  };

  const requestLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      setIsGettingLocation(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setUserLocation(location);
          setLocationError(null);
          setIsGettingLocation(false);
          resolve(location);
        },
        (error) => {
          setIsGettingLocation(false);
          let errorMessage = '';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions to place an order.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'An unknown error occurred while getting location.';
          }

          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const handleAddToCart = (itemId) => {
    setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) newCart[itemId] -= 1;
      else delete newCart[itemId];
      return newCart;
    });
  };

  const handlePlaceOrderClick = async () => {
    if (Object.keys(cart).length === 0) {
      showNotification('error', 'Please add at least one item to cart');
      return;
    }

    // Check if we already have location
    if (userLocation) {
      await placeOrderWithLocation(userLocation);
    } else {
      // Show location modal
      setShowLocationModal(true);
    }
  };

  const handleRequestLocationAndOrder = async () => {
    try {
      const location = await requestLocation();
      setShowLocationModal(false);
      await placeOrderWithLocation(location);
    } catch (error) {
      console.error('Location error:', error);
      // Modal stays open to show error and retry option
    }
  };

  const placeOrderWithLocation = async (location) => {
    try {
      setIsLoading(true);

      const items = Object.entries(cart).map(([itemId, quantity]) => ({
        menuItemId: itemId,
        quantity
      }));
      const token = localStorage.getItem('token') || '';

      const orderResponse = await customerAPI.placeOrder({
        tableId: selectedTable._id,
        items,
        customerName: '',
        customerPhone: '',
        customerNotes: '',
        token,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        }
      });

      if (orderResponse.success) {
        showNotification('success', 'Order placed successfully');
        setCart({});
        setShowMenuView(false);
        const newToken = orderResponse?.data?.token;
        if (newToken) {
          localStorage.setItem('token', newToken);
        }
        await loadTableData();
        await loadSession();
      } else {
        showNotification('error', orderResponse.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showNotification('error', 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  const activeOrders = session?.orders?.filter(o => o.orderStatus !== 'cancelled') || [];
  const sessionTotal = activeOrders.reduce((sum, order) => sum + (order.orderAmount || 0), 0);
  const cartTotal = Object.entries(cart).reduce((sum, [itemId, qty]) => {
    const item = menuItems.find(m => m._id === itemId);
    return sum + ((item?.price || 0) * qty);
  }, 0);
  const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  
  // Updated filtering logic with search
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(menuSearchTerm.toLowerCase()) || 
                          item.description?.toLowerCase().includes(menuSearchTerm.toLowerCase());
    return matchesCategory && item.available && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-3 right-3 z-[10000] animate-slide-in ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white px-3 md:px-4 py-2 md:py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs md:text-sm max-w-sm`}>
          {notification.type === 'success' ? <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Location Permission Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[10001] bg-black/50 flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6 animate-scale-in">
            <div className="text-center mb-3 md:mb-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <MapPin className="w-6 h-6 md:w-8 md:h-8 text-amber-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Location Required</h3>
              <p className="text-gray-600 text-xs md:text-sm">
                We need your location to process your order and ensure accurate delivery to your table.
              </p>
            </div>

            {locationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 text-xs md:text-sm font-medium mb-1">Access Denied</p>
                    <p className="text-red-700 text-[10px] md:text-xs">{locationError}</p>
                    <p className="text-red-600 text-[10px] md:text-xs mt-2">
                      Please enable location permissions in your browser settings and try again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 md:space-y-3">
              <button
                onClick={handleRequestLocationAndOrder}
                disabled={isGettingLocation}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGettingLocation ? (
                  <>
                    <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                    {locationError ? 'Try Again' : 'Allow Location'}
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setShowLocationModal(false);
                  setLocationError(null);
                }}
                disabled={isGettingLocation}
                className="w-full border-2 border-gray-300 text-gray-700 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            <p className="text-[10px] md:text-xs text-gray-500 text-center mt-3 md:mt-4">
              Your location will only be used for this order and won't be stored.
            </p>
          </div>
        </div>
      )}

      {/* Main Content - Full Screen */}
      <div className="w-full h-full bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-3 md:px-5 py-3 md:py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">Table {selectedTable?.tableNumber}</h2>
            <p className="text-white/90 text-xs md:text-sm">Floor {selectedTable?.floorNumber} • {selectedTable?.capacity} seats</p>
          </div>
        </div>

        {showMenuView ? (
          /* MENU VIEW */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Category Bar */}
            <div className="border-b border-gray-200 flex-shrink-0 bg-white sticky top-0 z-10">
              <div className="overflow-x-auto scrollbar-thin">
                <div className="flex gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 min-w-max">
                  {isLoadingCategories ? (
                    <Loader className="w-4 h-4 md:w-5 md:h-5 text-amber-600 animate-spin" />
                  ) : (
                    categories.map(cat => (
                      <button
                        key={cat._id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className="flex-shrink-0 flex flex-col items-center gap-1 md:gap-1.5 transition-transform hover:scale-105"
                      >
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 transition ${selectedCategory === cat.id ? 'border-amber-500 shadow-md' : 'border-gray-200'
                          }`}>
                          {cat.imgURL ? (
                            <img src={cat.imgURL} alt={cat.id} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-base md:text-xl">
                              {cat.id === 'all' ? '🍽️' : '✨'}
                            </div>
                          )}
                        </div>
                        <p className={`text-[10px] md:text-xs font-semibold max-w-[60px] text-center truncate ${selectedCategory === cat.id ? 'text-amber-600' : 'text-gray-700'
                          }`}>
                          {cat.description || cat.id}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* View Controls */}
              <div className="border-b border-gray-200 flex-shrink-0 bg-white sticky top-0 z-10 px-3 md:px-4 py-2 md:py-3 space-y-2 md:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm md:text-base font-bold text-gray-900">Menu Items ({filteredMenuItems.length})</h3>
                  
                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setMenuViewMode('grid')}
                        className={`p-1.5 md:p-2 rounded transition-all ${menuViewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                        title="Grid view"
                      >
                        <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => setMenuViewMode('table')}
                        className={`p-1.5 md:p-2 rounded transition-all ${menuViewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                        title="Table view"
                      >
                        <List className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-700" />
                      </button>
                    </div>

                    {/* Grid Column Selector - Only show in grid mode */}
                    {menuViewMode === 'grid' && (
                      <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                          onClick={() => setMenuGridColumns(2)}
                          className={`p-1.5 rounded transition-all ${menuGridColumns === 2 ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                          title="2 columns"
                        >
                          <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="2" y="3" width="9" height="6" strokeWidth="2" />
                            <rect x="13" y="3" width="9" height="6" strokeWidth="2" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setMenuGridColumns(3)}
                          className={`p-1.5 rounded transition-all ${menuGridColumns === 3 ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                          title="3 columns"
                        >
                          <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="2" y="3" width="5.5" height="6" strokeWidth="2" />
                            <rect x="9.25" y="3" width="5.5" height="6" strokeWidth="2" />
                            <rect x="16.5" y="3" width="5.5" height="6" strokeWidth="2" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setMenuGridColumns(4)}
                          className={`p-1.5 rounded transition-all ${menuGridColumns === 4 ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                          title="4 columns"
                        >
                          <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="1.5" y="3" width="4" height="6" strokeWidth="2" />
                            <rect x="7" y="3" width="4" height="6" strokeWidth="2" />
                            <rect x="12.5" y="3" width="4" height="6" strokeWidth="2" />
                            <rect x="18" y="3" width="4" height="6" strokeWidth="2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={menuSearchTerm}
                    onChange={(e) => setMenuSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Menu Items Content */}
              <div className="flex-1 overflow-y-auto p-3 md:p-4">
                {isLoadingMenuItems ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader className="w-6 h-6 md:w-7 md:h-7 text-amber-600 animate-spin" />
                  </div>
                ) : filteredMenuItems.length === 0 ? (
                  <div className="text-center py-10">
                    <Utensils className="w-10 h-10 md:w-12 md:h-12 text-amber-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm md:text-base">No items available</p>
                  </div>
                ) : menuViewMode === 'grid' ? (
                  <div className={`grid gap-2 md:gap-3 ${menuGridColumns === 2 ? 'grid-cols-2 md:grid-cols-2' :
                    menuGridColumns === 3 ? 'grid-cols-2 md:grid-cols-3' :
                      'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                    }`}>
                    {filteredMenuItems.map((item) => (
                      <div key={item._id} className="bg-white rounded-xl overflow-hidden shadow border border-gray-200 hover:shadow-lg transition">
                        <div className="relative h-28 md:h-32 bg-gray-100">
                          {item.imgURL && item.imgURL !== '/images/default-item.jpg' ? (
                            <img src={item.imgURL} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                              <Utensils className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
                            </div>
                          )}
                          {item.mostSell && (
                            <div className="absolute top-1.5 md:top-2 right-1.5 md:right-2 bg-red-500 text-white px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold">
                              🔥
                            </div>
                          )}
                        </div>
                        <div className="p-2 md:p-3">
                          <h3 className="font-bold text-xs md:text-sm text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                          <div className="flex items-center justify-between mb-1.5 md:mb-2">
                            <span className="text-base md:text-lg font-bold text-amber-600">₹{item.price?.toFixed(0)}</span>
                            {item.preparationTime && (
                              <span className="text-[10px] md:text-xs bg-amber-50 text-amber-700 px-1 md:px-1.5 py-0.5 rounded">
                                {item.preparationTime}m
                              </span>
                            )}
                          </div>
                          {cart[item._id] ? (
                            <div className="flex items-center gap-1 md:gap-1.5 bg-amber-500 rounded-lg p-1 md:p-1.5">
                              <button onClick={() => handleRemoveFromCart(item._id)} className="text-white hover:bg-amber-600 p-0.5 md:p-1 rounded">
                                <Minus className="w-3 h-3 md:w-4 md:h-4" />
                              </button>
                              <span className="flex-1 text-center text-white font-bold text-xs md:text-sm">{cart[item._id]}</span>
                              <button onClick={() => handleAddToCart(item._id)} className="text-white hover:bg-amber-600 p-0.5 md:p-1 rounded">
                                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(item._id)}
                              className="w-full py-1 md:py-1.5 px-2 rounded-lg font-semibold text-xs md:text-sm flex items-center justify-center gap-1 md:gap-1.5 bg-amber-500 text-white hover:bg-amber-600"
                            >
                              <Plus className="w-3 h-3 md:w-4 md:h-4" />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Table View for Menu Items
                  <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                          <tr>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-left text-xs md:text-sm font-bold text-gray-700">Item</th>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700">Price</th>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700 hidden sm:table-cell">Time</th>
                            <th className="px-3 md:px-4 py-2.5 md:py-3 text-center text-xs md:text-sm font-bold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredMenuItems.map((item) => (
                            <tr key={item._id} className="hover:bg-amber-50/50 transition-colors">
                              <td className="px-3 md:px-4 py-2 md:py-3">
                                <div className="flex items-center gap-2">
                                  {item.imgURL && item.imgURL !== '/images/default-item.jpg' ? (
                                    <img src={item.imgURL} alt={item.name} className="w-8 h-8 md:w-10 md:h-10 rounded object-cover" />
                                  ) : (
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                                      <Utensils className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-semibold text-gray-900 text-xs md:text-sm">{item.name}</p>
                                    {item.mostSell && <span className="text-[10px] text-red-500 font-bold">🔥 Popular</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 md:px-4 py-2 md:py-3 text-center">
                                <span className="font-bold text-amber-600 text-sm md:text-base">₹{item.price?.toFixed(0)}</span>
                              </td>
                              <td className="px-3 md:px-4 py-2 md:py-3 text-center hidden sm:table-cell">
                                {item.preparationTime && (
                                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">
                                    {item.preparationTime}m
                                  </span>
                                )}
                              </td>
                              <td className="px-3 md:px-4 py-2 md:py-3">
                                <div className="flex items-center justify-center gap-1 md:gap-2">
                                  {cart[item._id] ? (
                                    <div className="flex items-center gap-0.5 md:gap-1 bg-amber-500 rounded-lg p-0.5 md:p-1">
                                      <button onClick={() => handleRemoveFromCart(item._id)} className="text-white hover:bg-amber-600 p-0.5 rounded">
                                        <Minus className="w-3 h-3 md:w-4 md:h-4" />
                                      </button>
                                      <span className="text-white font-bold text-xs md:text-sm px-1">{cart[item._id]}</span>
                                      <button onClick={() => handleAddToCart(item._id)} className="text-white hover:bg-amber-600 p-0.5 rounded">
                                        <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleAddToCart(item._id)}
                                      className="py-1 md:py-1.5 px-2 md:px-3 rounded-lg font-semibold text-xs md:text-sm bg-amber-500 text-white hover:bg-amber-600"
                                    >
                                      <Plus className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                                      Add
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Footer */}
            <div className="border-t-2 border-amber-500 bg-white p-3 md:p-4 flex-shrink-0 shadow-lg">
              {cartItemsCount > 0 ? (
                <div className="mb-2 md:mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-gray-600 text-[10px] md:text-xs">Items: {cartItemsCount}</p>
                      <p className="text-xl md:text-2xl font-bold text-amber-600">₹{cartTotal}</p>
                    </div>
                    <button onClick={() => setCart({})} className="text-xs text-red-600 font-semibold px-2 md:px-3 py-1 md:py-1.5 bg-red-50 rounded-lg">
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1 max-h-16 overflow-y-auto bg-amber-50 p-1.5 md:p-2 rounded-lg">
                    {Object.entries(cart).map(([itemId, qty]) => {
                      const item = menuItems.find(m => m._id === itemId);
                      return (
                        <div key={itemId} className="flex justify-between text-[10px] md:text-xs">
                          <span className="text-gray-700">{item?.name} × {qty}</span>
                          <span className="font-bold text-gray-900">₹{((item?.price || 0) * qty).toFixed(0)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 md:py-3 mb-2 md:mb-3">
                  <p className="text-gray-500 text-xs md:text-sm">Cart is empty</p>
                </div>
              )}
              <div className="flex gap-2">
                {session && (
                  <button
                    onClick={() => setShowMenuView(false)}
                    className="flex-1 px-3 md:px-4 py-2 md:py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-xs md:text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handlePlaceOrderClick}
                  disabled={isLoading || cartItemsCount === 0}
                  className="flex-1 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-bold text-xs md:text-sm disabled:opacity-50 flex items-center justify-center gap-1.5 md:gap-2"
                >
                  {isLoading ? <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : (
                    <><Send className="w-3.5 h-3.5 md:w-4 md:h-4" />Place Order</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* SESSION VIEW */
          <div className="flex-1 overflow-y-auto p-3 md:p-5">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader className="w-6 h-6 md:w-7 md:h-7 text-amber-600 animate-spin" />
              </div>
            ) : session ? (
              <>
                {/* Session Info */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 md:p-4 mb-3 md:mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm">
                    <div>
                      <p className="text-gray-600 text-[10px] md:text-xs mb-0.5">Session ID</p>
                      <p className="font-bold text-gray-900 text-xs md:text-sm truncate">{session.sessionId}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-[10px] md:text-xs mb-0.5">Orders</p>
                      <p className="font-bold text-gray-900">{activeOrders.length}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-gray-600 text-[10px] md:text-xs mb-0.5">Total</p>
                      <p className="font-bold text-amber-600 text-base md:text-lg">₹{sessionTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Orders Section */}
                <div className="mb-3 md:mb-4">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                    Orders ({activeOrders.length})
                  </h3>
                  {activeOrders.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl">
                      <Package className="w-8 h-8 md:w-10 md:h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-xs md:text-sm">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3">
                      {activeOrders.map((order) => (
                        <div key={order._id} className="bg-white border border-gray-200 rounded-xl p-3 md:p-4">
                          <div className="flex items-start justify-between mb-2 md:mb-3">
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm md:text-base">{order.orderId}</h4>
                              <p className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                {new Date(order.orderedAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 md:gap-1.5">
                              <p className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold border ${order.orderStatus === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                  order.orderStatus === 'preparing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-green-50 text-green-700 border-green-200'
                                }`}>{order.orderStatus}</p>
                            </div>
                          </div>

                          {/* Order Items Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs md:text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left py-1.5 md:py-2 px-1.5 md:px-2 text-[10px] md:text-xs font-semibold text-gray-700">Item</th>
                                  <th className="text-center py-1.5 md:py-2 px-1.5 md:px-2 text-[10px] md:text-xs font-semibold text-gray-700">Qty</th>
                                  <th className="text-right py-1.5 md:py-2 px-1.5 md:px-2 text-[10px] md:text-xs font-semibold text-gray-700">Price</th>
                                  <th className="text-right py-1.5 md:py-2 px-1.5 md:px-2 text-[10px] md:text-xs font-semibold text-gray-700">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {order.items.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="py-1.5 md:py-2 px-1.5 md:px-2">
                                      <div className="flex items-center gap-1.5 md:gap-2">
                                        {item.menuItem?.imgURL && item.menuItem.imgURL !== '/images/default-item.jpg' ? (
                                          <img src={item.menuItem.imgURL} alt={item.name} className="w-6 h-6 md:w-8 md:h-8 rounded object-cover" />
                                        ) : (
                                          <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                                            <Utensils className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                                          </div>
                                        )}
                                        <span className="font-medium text-gray-900 text-[10px] md:text-xs">{item.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-1.5 md:py-2 px-1.5 md:px-2 text-center font-semibold text-gray-700">{item.quantity}</td>
                                    <td className="py-1.5 md:py-2 px-1.5 md:px-2 text-right text-gray-600">₹{item.price}</td>
                                    <td className="py-1.5 md:py-2 px-1.5 md:px-2 text-right font-bold text-amber-600">₹{item.subtotal.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="pt-2 md:pt-3 mt-2 md:mt-3 border-t border-gray-200 flex items-center justify-between">
                            <span className="flex items-center gap-1 bg-blue-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium text-blue-700">
                              <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />{order.estimatedTime} mins
                            </span>
                            <div className="text-right">
                              <p className="text-[10px] md:text-xs text-gray-500 mb-0.5">Order Total</p>
                              <span className="text-lg md:text-xl font-bold text-amber-600">₹{order.orderAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowMenuView(true);
                      if (!menuItems.length) loadMenuItems();
                      if (!categories.length) loadCategories();
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />New Order
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-red-500 mx-auto mb-3" />
                <p className="text-gray-600 text-sm md:text-base">No active session</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar { height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #f1f1f1; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #fbbf24; border-radius: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.3s; }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.2s; }
      `}</style>
    </div>
  );
};

export default CustomerSelfOrderManagementPage;