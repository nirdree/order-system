'use client';
import React, { useEffect, useState } from 'react';
import { Coffee, Home, Search, ArrowLeft, Clock, MapPin } from 'lucide-react';

const NotFoundPage = () => {
  const [cupRotation, setCupRotation] = useState(0);
  const [steamOpacity, setSteamOpacity] = useState([1, 0.7, 0.4]);
  const [floatingBeans, setFloatingBeans] = useState([]);

  useEffect(() => {
    // Generate random positions for floating beans (client-side only)
    setFloatingBeans(
      [...Array(8)].map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: i * 0.5,
        duration: 3 + Math.random() * 2
      }))
    );

    const rotationInterval = setInterval(() => {
      setCupRotation(prev => (prev + 2) % 360);
    }, 50);

    const steamInterval = setInterval(() => {
      setSteamOpacity(prev => {
        const newOpacity = [...prev];
        newOpacity.push(newOpacity.shift());
        return newOpacity;
      });
    }, 500);

    return () => {
      clearInterval(rotationInterval);
      clearInterval(steamInterval);
    };
  }, []);

  const quickLinks = [
    { name: 'Our Menu', path: '#menu', icon: Coffee },
    { name: 'Order Now', path: '#order', icon: Search },
    { name: 'Contact Us', path: '#contact', icon: MapPin }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center px-6 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Coffee Beans */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingBeans.map((bean) => (
          <div
            key={bean.id}
            className="absolute animate-float"
            style={{
              left: `${bean.left}%`,
              top: `${bean.top}%`,
              animationDelay: `${bean.delay}s`,
              animationDuration: `${bean.duration}s`
            }}
          >
            <div className="w-3 h-3 bg-amber-800 rounded-full opacity-20"></div>
          </div>
        ))}
      </div>

      <div className="max-w-4xl w-full relative z-10">
        {/* Main Content */}
        <div className="text-center mb-12">
          {/* Animated Coffee Cup */}
          <div className="relative inline-block my-8 ">
            {/* Steam Animation */}
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute left-1/2 transform -translate-x-1/2"
                  style={{
                    opacity: steamOpacity[i],
                    animation: 'steam 3s ease-in-out infinite',
                    animationDelay: `${i * 0.5}s`
                  }}
                >
                  <svg width="40" height="60" viewBox="0 0 40 60" className="text-amber-400">
                    <path
                      d="M20,60 Q15,45 20,30 Q25,15 20,0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity={steamOpacity[i]}
                    />
                  </svg>
                </div>
              ))}
            </div>

            {/* Coffee Cup */}
            <div 
              className="relative"
              style={{ transform: `rotate(${cupRotation * 0.1}deg)` }}
            >
              <div className="w-32 h-32 bg-gradient-to-br from-amber-600 to-orange-700 rounded-3xl shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-500">
                <Coffee className="w-16 h-16 text-white animate-pulse" />
              </div>
              {/* Cup Handle */}
              <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-12 border-4 border-amber-600 rounded-r-full"></div>
            </div>

            {/* Spilled Coffee Effect */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="w-40 h-3 bg-gradient-to-r from-transparent via-amber-800/30 to-transparent rounded-full blur-sm"></div>
            </div>
          </div>

          {/* 404 Text */}
          <div className="mb-8">
            <h1 className="text-9xl md:text-[12rem] font-black mb-4 leading-none">
              <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent drop-shadow-2xl animate-gradient">
                404
              </span>
            </h1>
            <div className="relative inline-block">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                Oops! Coffee Spilled! ☕
              </h2>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full"></div>
            </div>
          </div>

          {/* Description */}
          <div className="max-w-2xl mx-auto mb-12">
            <p className="text-xl md:text-2xl text-gray-700 mb-4 font-medium">
              Looks like this page took a coffee break! ☕
            </p>
            <p className="text-lg text-gray-600">
              Don't worry, our <span className="font-bold text-amber-600">delicious menu</span> is still brewing. 
              Let's get you back to the good stuff!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <a
              href="/"
              className="group flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-5 rounded-full text-lg font-bold shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transition-all duration-300 hover:from-orange-600 hover:to-rose-600"
            >
              <Home className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Back to Home
            </a>
            <button
              onClick={() => window.history.back()}
              className="group flex items-center gap-3 bg-white text-gray-800 px-8 py-5 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-amber-300 hover:border-amber-500"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 mb-12 shadow-2xl border-2 border-amber-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
            <Search className="w-6 h-6 text-amber-600" />
            Looking for something?
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <a
                  key={index}
                  href={link.path}
                  className="group bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 hover:from-amber-100 hover:to-orange-100 transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-amber-400"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl group-hover:rotate-12 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-gray-800 font-bold text-lg">{link.name}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Fun Message */}
        {/* <div className=" text-center">
          <div className="inline-block bg-white/60 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg border-2 border-amber-200">
            <p className="text-gray-700 font-medium">
              <Clock className="inline w-5 h-5 mr-2 text-amber-600" />
              Meanwhile, our cafe is <span className="font-bold text-amber-600">OPEN</span> and ready to serve you! 🎉
            </p>
          </div>
        </div> */}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0) rotate(0deg);
            opacity: 0.2;
          }
          50% { 
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.5;
          }
        }
        
        @keyframes steam {
          0% {
            opacity: 0;
            transform: translateY(0) translateX(-50%) scale(1);
          }
          50% {
            opacity: 0.6;
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) translateX(-50%) scale(1.5);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
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
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;