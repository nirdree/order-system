'use client';
import React, { useState, useEffect } from 'react';
import {
  Coffee, Sparkles, MapPin, Phone, Clock, ExternalLink,
  Gift, PartyPopper, Cake, Users, Star, ChevronRight,
  Instagram, Facebook, Menu as MenuIcon, X, ArrowRight,
  UtensilsCrossed, Heart, Award, Loader
} from 'lucide-react';
import { menuItemsAPI, categoriesAPI } from '@/lib/api-client';
import Head from 'next/head';

const PocketBiteCafeLanding = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadCategories();
    loadMenuItems();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await categoriesAPI.getAllCategories();
      if (response.success) {
        // Filter out any 'all' category from API response to avoid duplicates
        const apiCategories = (response.data || []).filter(cat => cat.id !== 'all' && cat._id !== 'all');
        setCategories([
          { _id: 'all', id: 'all', description: 'All Items', imgURL: '' },
          ...apiCategories
        ]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      setIsLoadingMenu(true);
      const response = await menuItemsAPI.getAllMenuItems();
      if (response.success) {
        setMenuItems(response.data || []);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesCategory && item.available;
  });

  const CategoryCard = ({ category, items }) => {
    const categoryName = categories.find(c => c.id === category)?.description || category;

    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-amber-200 hover:border-amber-400 group">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-amber-900">{categoryName}</h3>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-white/70 backdrop-blur-sm p-4 rounded-xl hover:bg-white transition-all duration-300 hover:translate-x-2"
            >
              <div className="flex items-center gap-3">
                {item.imgURL && item.imgURL !== '/images/default-item.jpg' && (
                  <img src={item.imgURL} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div>
                  <span className="text-gray-800 font-medium block">{item.name}</span>
                  {item.description && (
                    <span className="text-xs text-gray-500">{item.description}</span>
                  )}
                </div>
                {item.mostSell && (
                  <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                    Popular
                  </span>
                )}
              </div>
              <span className="text-amber-700 font-bold text-lg">₹{item.price}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Pocket Bite Cafe - Best Cafe in Akurdi, Pune | Free Birthday Celebrations</title>
        <meta name="description" content="Welcome to Pocket Bite Cafe in Akurdi, Pune. Enjoy premium coffee, delicious treats, and free birthday celebrations! Order on Zomato & Swiggy. Visit us for the best cafe experience." />
        <meta name="keywords" content="Pocket Bite Cafe, cafe in Akurdi, Pune cafe, coffee shop, birthday celebration, free birthday party, Zomato, Swiggy, best cafe Pune" />
        <meta property="og:title" content="Pocket Bite Cafe - Celebrate with Us!" />
        <meta property="og:description" content="Premium cafe experience in Akurdi, Pune with free birthday celebrations. Order your favorites now!" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://pocketbitecafe.com" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        {/* Floating Elements Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-20 left-10 w-64 h-64 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-64 h-64 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Header */}
        <header
          className={`fixed top-0 left-0 right-0 z-60 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-lg shadow-xl py-4' : 'bg-transparent py-6'
            }`}
        >
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-2xl transform hover:rotate-12 transition-transform duration-300">
                <Coffee className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
                  POCKET BITE CAFE
                </h1>
                <p className="text-sm text-amber-600 font-medium">Celebrate Every Moment!</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex gap-6 items-center">
              <a href="#home" className="text-gray-700 hover:text-amber-600 font-semibold transition-colors">
                Home
              </a>
              <a href="#birthday-special" className="text-gray-700 hover:text-amber-600 font-semibold transition-colors">
                Birthday Special
              </a>
              <a href="#menu" className="text-gray-700 hover:text-amber-600 font-semibold transition-colors">
                Menu
              </a>
              <a href="#order" className="text-gray-700 hover:text-amber-600 font-semibold transition-colors">
                Order Now
              </a>
              <a href="#contact" className="text-gray-700 hover:text-amber-600 font-semibold transition-colors">
                Contact
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-amber-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t mt-4 shadow-lg">
              <nav className="flex flex-col px-6 py-4 space-y-3">
                <a href="#home" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:text-amber-600 font-semibold py-2">
                  Home
                </a>
                <a href="#birthday-special" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:text-amber-600 font-semibold py-2">
                  Birthday Special
                </a>
                <a href="#menu" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:text-amber-600 font-semibold py-2">
                  Menu
                </a>
                <a href="#order" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:text-amber-600 font-semibold py-2">
                  Order Now
                </a>
                <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 hover:text-amber-600 font-semibold py-2">
                  Contact
                </a>
              </nav>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section id="home" className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-block mb-6 animate-bounce">
              <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 rounded-full shadow-2xl">
                <Coffee className="w-16 h-16 text-white" />
              </div>
            </div>

            <h2 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent drop-shadow-lg">
                Celebrate Every Moment!
              </span>
            </h2>

            <p className="text-2xl md:text-3xl text-gray-700 mb-8 font-semibold max-w-3xl mx-auto">
              Your favorite spot in <span className="text-amber-600">Akurdi, Pune</span> for
              <span className="text-orange-600"> Premium Coffee</span>,
              <span className="text-rose-600"> Sweet Treats</span>, and
              <span className="text-pink-600"> Delicious Beverages</span>
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-gray-800">50+ Varieties</span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform">
                <Coffee className="w-5 h-5 text-orange-600" />
                <span className="font-bold text-gray-800">Fresh Daily</span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform">
                <Award className="w-5 h-5 text-rose-600" />
                <span className="font-bold text-gray-800">Premium Quality</span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform">
                <Gift className="w-5 h-5 text-pink-600" />
                <span className="font-bold text-gray-800">Free Birthday Celebrations</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="#birthday-special"
                className="inline-block bg-gradient-to-r from-pink-500 to-rose-600 text-white px-12 py-5 rounded-full text-xl font-bold shadow-2xl hover:shadow-pink-500/50 hover:scale-105 transition-all duration-300"
              >
                <PartyPopper className="w-6 h-6 inline mr-2" />
                Birthday Special
              </a>
              <a
                href="#order"
                className="inline-block bg-gradient-to-r from-amber-500 to-orange-600 text-white px-12 py-5 rounded-full text-xl font-bold shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transition-all duration-300"
              >
                Order Now
              </a>
            </div>
          </div>
        </section>

        {/* Birthday Special Section */}
        <section id="birthday-special" className="py-20 px-6 bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-6xl">🎂</div>
            <div className="absolute top-20 right-20 text-6xl">🎉</div>
            <div className="absolute bottom-10 left-1/4 text-6xl">🎈</div>
            <div className="absolute bottom-20 right-1/3 text-6xl">🎁</div>
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-block bg-gradient-to-r from-pink-500 to-rose-600 p-4 rounded-full mb-6">
                <Cake className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-4">
                <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  FREE Birthday Celebration!
                </span>
              </h2>
              <p className="text-2xl text-gray-700 font-semibold">Make Your Special Day Even More Special</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-pink-200 hover:border-pink-400 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-4 rounded-2xl">
                    <PartyPopper className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">What You Get</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Gift className="w-6 h-6 text-pink-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-gray-900">Free Birthday Decoration</p>
                      <p className="text-sm text-gray-600">Beautiful setup for your celebration</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Cake className="w-6 h-6 text-pink-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-gray-900">Complimentary Cake Cutting</p>
                      <p className="text-sm text-gray-600">Bring your own cake or order from us</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Users className="w-6 h-6 text-pink-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-gray-900">Perfect for Groups</p>
                      <p className="text-sm text-gray-600">Celebrate with friends and family</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Heart className="w-6 h-6 text-pink-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-gray-900">Special Atmosphere</p>
                      <p className="text-sm text-gray-600">Create unforgettable memories</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 shadow-2xl text-white transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">How It Works</h3>
                </div>
                <ol className="space-y-6">
                  <li className="flex items-start gap-4">
                    <div className="bg-white text-amber-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-lg">Order Food & Beverages</p>
                      <p className="text-white/90 text-sm">Simply place an order from our delicious menu</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="bg-white text-amber-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-lg">Book in Advance</p>
                      <p className="text-white/90 text-sm">Call us to reserve your celebration spot</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="bg-white text-amber-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-lg">Enjoy FREE Decoration</p>
                      <p className="text-white/90 text-sm">We'll set up everything for your special day!</p>
                    </div>
                  </li>
                </ol>
                <div className="mt-8 pt-6 border-t border-white/30">
                  <p className="text-center text-white/90 text-sm mb-4">Ready to celebrate?</p>
                  <a
                    href="#contact"
                    className="block w-full bg-white text-amber-600 px-6 py-4 rounded-full text-center font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Book Your Celebration Now
                    <ArrowRight className="w-5 h-5 inline ml-2" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 text-center border-2 border-pink-200">
              <p className="text-gray-700 text-lg">
                <span className="font-bold text-pink-600">💝 Special Offer:</span> Order anything from our menu and get <span className="font-bold text-amber-600">FREE birthday decoration and celebration setup!</span>
              </p>
            </div>
          </div>
        </section>

        {/* Category Filter & Menu Grid Container */}
        <section id="menu" className="bg-white/50 backdrop-blur-sm">
          {/* Sticky Category Filter */}
          <div className="py-12 px-6 sticky top-20 z-40 shadow-lg bg-white/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
                  Our <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Menu</span>
                </h2>
                <p className="text-gray-600">Explore our delicious offerings</p>
              </div>
              <div className="overflow-x-auto scrollbar-custom pb-4">
                <div className="flex gap-3 min-w-max px-2">
                  {isLoadingCategories ? (
                    <div className="flex justify-center w-full">
                      <Loader className="w-6 h-6 text-amber-600 animate-spin" />
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all duration-300 flex-shrink-0 ${activeCategory === cat.id
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg scale-105'
                            : 'bg-white text-gray-700 hover:bg-amber-50 hover:text-amber-700 shadow'
                          }`}
                      >
                        <UtensilsCrossed className="w-5 h-5" />
                        {cat.description}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Grid */}
          <section className="py-20 px-6">
            <div className="max-w-7xl mx-auto">
              {isLoadingMenu ? (
                <div className="flex justify-center py-20">
                  <Loader className="w-10 h-10 text-amber-600 animate-spin" />
                </div>
              ) : activeCategory === 'all' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {categories
                    .filter(c => c.id !== 'all')
                    .map((category) => {
                      const categoryItems = menuItems.filter(item => item.category === category.id && item.available);
                      if (categoryItems.length === 0) return null;
                      return (
                        <CategoryCard key={category._id} category={category.id} items={categoryItems} />
                      );
                    })}
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  {filteredMenuItems.length > 0 ? (
                    <CategoryCard category={activeCategory} items={filteredMenuItems} />
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl">
                      <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-xl">No items available in this category</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </section>

        {/* Order Section */}
        <section id="order" className="py-20 px-6 z-50 bg-gradient-to-br from-amber-900 to-orange-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black text-white mb-4">
                Ready to Order?
              </h2>
              <p className="text-xl text-amber-100">Choose your preferred way to enjoy Pocket Bite Cafe</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Visit Cafe */}
              <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 text-center shadow-2xl hover:scale-105 transition-all duration-300 group">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Visit Our Cafe</h3>
                <p className="text-gray-600 mb-6">Experience the cozy ambiance and fresh flavors in person</p>
                <div className="bg-amber-50 rounded-2xl p-4 text-left">
                  <p className="text-sm text-gray-700 mb-2"><strong>Location:</strong> shop no. 3, Sector no. 26, opp. Akurdi Railway Station Road, Pradhikaran, Akurdi, Pimpri-Chinchwad, Maharashtra 411044</p>
                  <p className="text-sm text-gray-700"><strong>Hours:</strong> 9:00 AM - 11:00 PM</p>
                </div>
              </div>

              {/* Zomato */}
              <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 text-center shadow-2xl hover:scale-105 transition-all duration-300 group">
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform">
                  <ExternalLink className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Order on Zomato</h3>
                <p className="text-gray-600 mb-6">Get your favorites delivered to your doorstep</p>
                <a
                  href="https://www.zomato.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gradient-to-r from-rose-500 to-pink-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-rose-500/50 transition-all duration-300"
                >
                  Order on Zomato
                </a>
              </div>

              {/* Swiggy */}
              <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 text-center shadow-2xl hover:scale-105 transition-all duration-300 group">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform">
                  <ExternalLink className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Order on Swiggy</h3>
                <p className="text-gray-600 mb-6">Quick delivery right to your location</p>
                <a
                  href="https://www.swiggy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-orange-500/50 transition-all duration-300"
                >
                  Order on Swiggy
                </a>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-amber-100 text-lg">
                💝 We accept online orders on <strong>ZOMATO</strong> and <strong>SWIGGY</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 px-6 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-black text-gray-900 mb-4">
                Get in <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Touch</span>
              </h2>
              <p className="text-xl text-gray-600">We'd love to hear from you!</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <a href="tel:+918412827361" className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Call Us</h3>
                    <p className="text-gray-600">For reservations & inquiries</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-amber-700 hover:text-orange-600">+91 8412827361</p>
              </a>

              <a href="https://maps.app.goo.gl/j3vdmv7tAus5Jsgg8" target="_blank" rel="noopener noreferrer" className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-rose-600 p-4 rounded-2xl">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Visit Us</h3>
                    <p className="text-gray-600">Get directions & navigate</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-800 hover:text-orange-600">Akurdi, Pune</p>
                <p className="text-gray-600">Open in Google Maps</p>
              </a>
            </div>

            <div className="grid md:grid-cols-1 gap-8 mb-8">
              <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Opening Hours</h3>
                    <p className="text-gray-600">Visit us anytime</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-800">Open Daily</p>
                <p className="text-gray-600">10:00 AM - 10:00 PM</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
              <p className="text-gray-700 mb-6 text-lg font-semibold">
                Follow Us on Social Media
              </p>
              <div className="flex justify-center gap-6 mb-6">
                <a href="https://www.instagram.com/pocket_bite_cafe?igsh=Zjc5N2ZqbDV3N3B5" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-br from-pink-500 to-rose-600 p-4 rounded-full hover:scale-110 transition-transform">
                  <Instagram className="w-6 h-6 text-white" />
                </a>

              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <span className="text-amber-600 font-semibold">@pocket_bite_cafe</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-amber-900 to-orange-900 py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center items-center gap-3 mb-6">
                <div className="bg-white p-3 rounded-2xl">
                  <button onClick={() => { window.location.href = '/login' }}>
                    <Coffee className="w-8 h-8 text-amber-700" />
                  </button>

                </div>
                <h3 className="text-3xl font-black text-white">POCKET BITE CAFE</h3>
              </div>
              <p className="text-amber-100 mb-4 text-lg">Celebrate Every Moment! ☕✨</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
              <div>
                <h4 className="text-white font-bold mb-3">Quick Links</h4>
                <div className="space-y-2">
                  <a href="#home" className="block text-amber-200 hover:text-white transition-colors">Home</a>
                  <a href="#birthday-special" className="block text-amber-200 hover:text-white transition-colors">Birthday Special</a>
                  <a href="#menu" className="block text-amber-200 hover:text-white transition-colors">Menu</a>
                  <a href="#order" className="block text-amber-200 hover:text-white transition-colors">Order Now</a>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold mb-3">Location</h4>
                <p className="text-amber-200">Shop no. 3, Sector no. 26,  </p>
                <p className="text-amber-200">opp. Akurdi Railway Station Road, Pradhikaran,</p>
                <p className="text-amber-200">Akurdi, Pimpri-Chinchwad, Maharashtra 411044</p>
              </div>

              <div>
                <h4 className="text-white font-bold mb-3">Hours</h4>
                <p className="text-amber-200">Monday - Sunday</p>
                <p className="text-amber-200">9:00 AM - 11:00 PM</p>
              </div>
            </div>

            <div className="border-t border-amber-700 pt-6 text-center">
              <p className="text-amber-200 text-sm">
                © 2024 Pocket Bite Cafe. All rights reserved. | Made with <Heart className="w-4 h-4 inline text-red-400" /> in Pune
              </p>
            </div>
          </div>
        </footer>

        <style jsx>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-custom::-webkit-scrollbar {
            height: 8px;
          }
          .scrollbar-custom::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .scrollbar-custom::-webkit-scrollbar-thumb {
            background: linear-gradient(to right, #f59e0b, #ea580c);
            border-radius: 10px;
          }
          .scrollbar-custom::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to right, #d97706, #dc2626);
          }
          .scrollbar-custom {
            scrollbar-width: thin;
            scrollbar-color: #f59e0b #f1f1f1;
          }
          html {
            scroll-behavior: smooth;
          }
        `}</style>
      </div>
    </>
  );
};

export default PocketBiteCafeLanding;