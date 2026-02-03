'use client';
import React, { useState, useEffect } from 'react';
import { Coffee, IceCream, Droplets, Milk, Sparkles, MapPin, Phone, Clock, ExternalLink } from 'lucide-react';

const PokketCafeLanding = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

 const menuData = {
  caughtByCawa: [
    {
      name: 'Cawa',
      price: 50,
      available: true,
      mostSell: true,
      imgURL: '/images/cawa/cawa.jpg'
    },
    {
      name: 'Cawa Crush',
      price: 60,
      available: true,
      mostSell: false,
      imgURL: '/images/cawa/cawa-crush.jpg'
    },
    {
      name: 'Cawa with Ice cream',
      price: 70,
      available: true,
      mostSell: false,
      imgURL: '/images/cawa/cawa-icecream.jpg'
    },
    {
      name: 'Friendship Cawa/ Milky Cawa',
      price: 80,
      available: false,
      mostSell: false,
      imgURL: '/images/cawa/milky-cawa.jpg'
    },
    {
      name: 'True Love Cawa',
      price: 80,
      available: true,
      mostSell: true,
      imgURL: '/images/cawa/true-love.jpg'
    },
    {
      name: 'Irish/Vanilla/Caramel Cawa',
      price: 90,
      available: true,
      mostSell: false,
      imgURL: '/images/cawa/flavored.jpg'
    },
    {
      name: 'Black Forest Cawa',
      price: 110,
      available: true,
      mostSell: true,
      imgURL: '/images/cawa/black-forest.jpg'
    },
    {
      name: 'Mocha Cawa with Ice-Cream',
      price: 110,
      available: true,
      mostSell: false,
      imgURL: '/images/cawa/mocha.jpg'
    },
    {
      name: 'Cawa Frappe',
      price: 140,
      available: true,
      mostSell: true,
      imgURL: '/images/cawa/frappe.jpg'
    }
  ],

  sweetSensation: [
    {
      name: 'Lawa Cake',
      price: 70,
      available: true,
      mostSell: false,
      imgURL: '/images/dessert/lava-cake.jpg'
    },
    {
      name: 'Brownie',
      price: 150,
      available: true,
      mostSell: true,
      imgURL: '/images/dessert/brownie.jpg'
    },
    {
      name: 'Sizzling Brownie',
      price: 170,
      available: true,
      mostSell: true,
      imgURL: '/images/dessert/sizzling-brownie.jpg'
    },
    {
      name: 'Irish Brownie',
      price: 180,
      available: false,
      mostSell: false,
      imgURL: '/images/dessert/irish-brownie.jpg'
    },
    {
      name: 'Dry Fruit Brownie',
      price: 200,
      available: true,
      mostSell: false,
      imgURL: '/images/dessert/dryfruit-brownie.jpg'
    }
  ],

  hotTrails: [
    {
      name: 'Hot Coffee',
      price: 50,
      available: true,
      mostSell: true,
      imgURL: '/images/hot/hot-coffee.jpg'
    },
    {
      name: 'Irish Hot Coffee',
      price: 60,
      available: true,
      mostSell: false,
      imgURL: '/images/hot/irish-coffee.jpg'
    },
    {
      name: 'Vanilla/Caramel',
      price: 70,
      available: true,
      mostSell: false,
      imgURL: '/images/hot/vanilla-caramel.jpg'
    },
    {
      name: 'Hot Chocolate',
      price: 80,
      available: true,
      mostSell: true,
      imgURL: '/images/hot/hot-chocolate.jpg'
    },
    {
      name: 'Cappuccino',
      price: 110,
      available: true,
      mostSell: true,
      imgURL: '/images/hot/cappuccino.jpg'
    }
  ]
};
  const categories = [
    { id: 'all', name: 'All Items', icon: Sparkles },
    { id: 'caughtByCawa', name: 'Cawa Special', icon: Coffee },
    { id: 'sweetSensation', name: 'Sweet Treats', icon: Sparkles },
    { id: 'hotTrails', name: 'Hot Beverages', icon: Coffee },
    { id: 'deewaniMastani', name: 'Mastani', icon: IceCream },
    { id: 'creamyIceCream', name: 'Ice Cream', icon: IceCream },
    { id: 'onTheRockIceTea', name: 'Ice Tea', icon: Droplets },
    { id: 'mysticMocktails', name: 'Mocktails', icon: Droplets },
    { id: 'shakeItUp', name: 'Shakes', icon: Milk },
    { id: 'magicTea', name: 'Tea', icon: Coffee },
    { id: 'sinfulChocolate', name: 'Chocolate', icon: Sparkles }
  ];

  const getAllItems = () => {
    if (activeCategory === 'all') {
      return Object.entries(menuData).flatMap(([category, items]) =>
        items.map(item => ({ ...item, category }))
      );
    }
    return menuData[activeCategory]?.map(item => ({ ...item, category: activeCategory })) || [];
  };

  const CategoryCard = ({ category, items }) => {
    const Icon = categories.find(c => c.id === category)?.icon || Sparkles;
    const categoryName = categories.find(c => c.id === category)?.name || category;

    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-amber-200 hover:border-amber-400 group">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-amber-900">{categoryName}</h3>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-white/70 backdrop-blur-sm p-4 rounded-xl hover:bg-white transition-all duration-300 hover:translate-x-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-800 font-medium">{item.name}</span>
                {item.mostSell && (
                  <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                    Most Sell
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Floating Elements Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-64 h-64 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-white/95 backdrop-blur-lg shadow-xl py-4' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-2xl transform hover:rotate-12 transition-transform duration-300">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
                POKKET CAFE
              </h1>
              <p className="text-sm text-amber-600 font-medium">Celebrate with Us!</p>
            </div>
          </div>
          <div className="hidden md:flex gap-6 items-center">
            <a href="#menu" className="text-gray-700 hover:text-amber-600 font-semibold transition-colors">
              Menu
            </a>
            <a href="#order" className="text-gray-700 hover:text-amber-600 font-semibold transition-colors">
              Order Now
            </a>
            <a href="#contact" className="text-gray-700 hover:text-amber-600 font-semibold transition-colors">
              Contact
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-block mb-6 animate-bounce">
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 rounded-full shadow-2xl">
              <Coffee className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent drop-shadow-lg">
              Celebrate with Us!
            </span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-700 mb-8 font-semibold max-w-3xl mx-auto">
            Your favorite spot for <span className="text-amber-600">Cawa</span>, 
            <span className="text-orange-600"> Sweet Treats</span>, and 
            <span className="text-rose-600"> Delicious Beverages</span>
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
              <IceCream className="w-5 h-5 text-rose-600" />
              <span className="font-bold text-gray-800">Premium Quality</span>
            </div>
          </div>

          <a
            href="#order"
            className="inline-block bg-gradient-to-r from-amber-500 to-orange-600 text-white px-12 py-5 rounded-full text-xl font-bold shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transition-all duration-300 hover:from-orange-600 hover:to-rose-600"
          >
            Order Now
          </a>
        </div>

        {/* Decorative Coffee Drips */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-amber-900/20 to-transparent">
          <svg className="w-full h-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path
              d="M0,0 Q50,80 100,0 T200,0 T300,0 T400,0 T500,0 T600,0 T700,0 T800,0 T900,0 T1000,0 T1100,0 T1200,0 L1200,100 L0,100 Z"
              fill="url(#drip-gradient)"
            />
            <defs>
              <linearGradient id="drip-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#78350f" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* Category Filter */}
      <section id="menu" className="py-12 px-6 bg-white/50 backdrop-blur-sm sticky top-20 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <button
                  key={`${cat.id}-${idx}`}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all duration-300 ${
                    activeCategory === cat.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-amber-50 hover:text-amber-700 shadow'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Menu Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Our <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Delicious Menu</span>
            </h2>
            <p className="text-xl text-gray-600">Explore our wide range of beverages and treats</p>
          </div>

          {activeCategory === 'all' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(menuData).map(([category, items]) => (
                <CategoryCard key={category} category={category} items={items} />
              ))}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <CategoryCard category={activeCategory} items={menuData[activeCategory]} />
            </div>
          )}
        </div>
      </section>

      {/* Order Section */}
      <section id="order" className="py-20 px-6 bg-gradient-to-br from-amber-900 to-orange-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-4">
              Ready to Order?
            </h2>
            <p className="text-xl text-amber-100">Choose your preferred way to enjoy Pokket Cafe</p>
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
                <p className="text-sm text-gray-700 mb-2"><strong>Location:</strong> Find us at Pokket Cafe</p>
                <p className="text-sm text-gray-700"><strong>Hours:</strong> Open Daily</p>
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

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Call Us</h3>
                  <p className="text-gray-600">Reach out for inquiries</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-700">+91 XXXXX XXXXX</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-gradient-to-br from-orange-500 to-rose-600 p-4 rounded-2xl">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Opening Hours</h3>
                  <p className="text-gray-600">Visit us anytime</p>
                </div>
              </div>
              <p className="text-lg font-semibold text-gray-800">Open Daily</p>
              <p className="text-gray-600">9:00 AM - 11:00 PM</p>
            </div>
          </div>

          <div className="mt-8 text-center bg-white rounded-3xl p-8 shadow-xl">
            <p className="text-gray-700 mb-4">
              <strong>Social Media:</strong>
            </p>
            <div className="flex justify-center gap-4">
              <span className="text-amber-600 font-semibold">@pokketcafeakurdi</span>
              <span className="text-gray-400">|</span>
              <span className="text-rose-600 font-semibold">#pokketcafeakurdi</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-amber-900 to-orange-900 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="bg-white p-3 rounded-2xl">
              <Coffee className="w-8 h-8 text-amber-700" />
            </div>
            <h3 className="text-3xl font-black text-white">POKKET CAFE</h3>
          </div>
          <p className="text-amber-100 mb-4 text-lg">Celebrate with Us! ☕✨</p>
          <p className="text-amber-200 text-sm">
            © 2024 Pokket Cafe. All rights reserved. | Akurdi, Pune
          </p>
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
      `}</style>
    </div>
  );
};

export default PokketCafeLanding;