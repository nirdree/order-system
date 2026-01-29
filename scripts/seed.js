// scripts/seed.js
// Run: node scripts/seed.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Import models
import User from '../models/User.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await MenuItem.deleteMany({});
    await Table.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Seed Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        _id: 'user-owner-1',
        name: 'Café Owner',
        email: 'owner@cafe.com',
        password: hashedPassword,
        role: 'owner',
        phone: '+91 9876543210',
        salary: 0,
        joiningDate: new Date('2024-01-01'),
        isActive: true
      },
      {
        _id: 'user-manager-1',
        name: 'Sarah Manager',
        email: 'manager@cafe.com',
        password: hashedPassword,
        role: 'manager',
        phone: '+91 9876543211',
        salary: 35000,
        joiningDate: new Date('2024-01-15'),
        isActive: true
      },
      {
        _id: 'user-manager-2',
        name: 'Rahul Sharma',
        email: 'rahul.manager@cafe.com',
        password: hashedPassword,
        role: 'manager',
        phone: '+91 9876543213',
        salary: 38000,
        joiningDate: new Date('2024-02-10'),
        isActive: true
      },
      {
        _id: 'user-staff-1',
        name: 'John Staff',
        email: 'staff@cafe.com',
        password: hashedPassword,
        role: 'staff',
        phone: '+91 9876543212',
        salary: 20000,
        joiningDate: new Date('2024-02-01'),
        isActive: true
      },
      {
        _id: 'user-staff-2',
        name: 'Priya Kumar',
        email: 'priya.staff@cafe.com',
        password: hashedPassword,
        role: 'staff',
        phone: '+91 9876543214',
        salary: 22000,
        joiningDate: new Date('2024-03-01'),
        isActive: true
      },
      {
        _id: 'user-staff-3',
        name: 'Amit Patel',
        email: 'amit.staff@cafe.com',
        password: hashedPassword,
        role: 'staff',
        phone: '+91 9876543215',
        salary: 21000,
        joiningDate: new Date('2024-03-15'),
        isActive: true
      }
    ];

    await User.insertMany(users);
    console.log('👥 Created users (password: password123)');

    // Seed Categories
    const categories = [
      {
        _id: 'cat-caught-by-cawa',
        name: 'Caught by Cawa',
        description: 'Signature Cawa beverages',
        isActive: true
      },
      {
        _id: 'cat-hot-trails',
        name: 'Hot Trails',
        description: 'Hot coffee beverages',
        isActive: true
      },
      {
        _id: 'cat-deewani-mastani',
        name: 'Deewani Mastani',
        description: 'Flavored Mastani drinks',
        isActive: true
      },
      {
        _id: 'cat-creamy-ice-cream',
        name: 'Creamy Ice-Cream',
        description: 'Delicious ice cream flavors',
        isActive: true
      },
      {
        _id: 'cat-sweet-sensation',
        name: 'Sweet Sensation',
        description: 'Cakes and brownies',
        isActive: true
      },
      {
        _id: 'cat-on-the-rock-ice-tea',
        name: 'On The Rock Ice-Tea',
        description: 'Refreshing iced teas',
        isActive: true
      },
      {
        _id: 'cat-mystic-mocktails',
        name: 'Mystic Mocktails',
        description: 'Creative mocktail beverages',
        isActive: true
      },
      {
        _id: 'cat-shake-it-up',
        name: 'Shake It Up',
        description: 'Thick creamy shakes',
        isActive: true
      },
      {
        _id: 'cat-magic-tea',
        name: 'Magic Tea',
        description: 'Special tea varieties',
        isActive: true
      },
      {
        _id: 'cat-sinful-chocolate',
        name: 'Sinful Chocolate',
        description: 'Chocolate delicacies',
        isActive: true
      }
    ];

    await Category.insertMany(categories);
    console.log('📂 Created categories');

    // Seed Menu Items
    const menuItems = [
      // Caught by Cawa
      {
        _id: 'item-cawa-1',
        categoryId: 'cat-caught-by-cawa',
        name: 'Cawa',
        description: 'Classic Cawa drink',
        price: 50,
        image: '/images/cawa.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-cawa-crush',
        categoryId: 'cat-caught-by-cawa',
        name: 'Cawa Crush',
        description: 'Refreshing Cawa crush',
        price: 60,
        image: '/images/cawa-crush.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-cawa-with-ice-cream',
        categoryId: 'cat-caught-by-cawa',
        name: 'Cawa with Ice Cream',
        description: 'Cawa topped with ice cream',
        price: 70,
        image: '/images/cawa-ice-cream.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-milky-cawa',
        categoryId: 'cat-caught-by-cawa',
        name: 'Cookies and Cawa / Milky Cawa',
        description: 'Cawa with cookies or milk',
        price: 80,
        image: '/images/milky-cawa.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-true-love-cawa',
        categoryId: 'cat-caught-by-cawa',
        name: 'True Love Cawa',
        description: 'Special Cawa blend',
        price: 80,
        image: '/images/true-love-cawa.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-irish-vanilla',
        categoryId: 'cat-caught-by-cawa',
        name: 'Irish Vanilla Caramel Cawa',
        description: 'Cawa with vanilla and caramel',
        price: 100,
        image: '/images/irish-vanilla.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-black-forest-cawa',
        categoryId: 'cat-caught-by-cawa',
        name: 'Black Forest Cawa',
        description: 'Chocolate cherry flavored Cawa',
        price: 110,
        image: '/images/black-forest-cawa.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-mocha-cawa',
        categoryId: 'cat-caught-by-cawa',
        name: 'Mocha Cawa with Ice Cream',
        description: 'Mocha Cawa with ice cream topping',
        price: 120,
        image: '/images/mocha-cawa.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-cawa-frappe',
        categoryId: 'cat-caught-by-cawa',
        name: 'Cawa Frappe',
        description: 'Blended iced Cawa',
        price: 140,
        image: '/images/cawa-frappe.jpg',
        availability: 'available',
        isActive: true
      },

      // Hot Trails
      {
        _id: 'item-hot-coffee',
        categoryId: 'cat-hot-trails',
        name: 'Hot Coffee',
        description: 'Classic hot coffee',
        price: 50,
        image: '/images/hot-coffee.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-extra-hot-coffee',
        categoryId: 'cat-hot-trails',
        name: 'Extra Hot Coffee',
        description: 'Extra strong hot coffee',
        price: 60,
        image: '/images/extra-hot-coffee.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-vanilla-caramel',
        categoryId: 'cat-hot-trails',
        name: 'Vanilla Caramel',
        description: 'Hot coffee with vanilla and caramel',
        price: 70,
        image: '/images/vanilla-caramel.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-hot-chocolate',
        categoryId: 'cat-hot-trails',
        name: 'Hot Chocolate',
        description: 'Rich hot chocolate',
        price: 80,
        image: '/images/hot-chocolate.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-cappuccino',
        categoryId: 'cat-hot-trails',
        name: 'Cappuccino',
        description: 'Classic Italian cappuccino',
        price: 110,
        image: '/images/cappuccino.jpg',
        availability: 'available',
        isActive: true
      },

      // Deewani Mastani
      {
        _id: 'item-strawberry-mastani',
        categoryId: 'cat-deewani-mastani',
        name: 'Strawberry',
        description: 'Strawberry Mastani',
        price: 110,
        image: '/images/strawberry-mastani.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-rose-mastani',
        categoryId: 'cat-deewani-mastani',
        name: 'Rose',
        description: 'Rose flavored Mastani',
        price: 120,
        image: '/images/rose-mastani.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-mango-mastani',
        categoryId: 'cat-deewani-mastani',
        name: 'Mango',
        description: 'Mango Mastani',
        price: 120,
        image: '/images/mango-mastani.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-chocolate-mastani',
        categoryId: 'cat-deewani-mastani',
        name: 'Chocolate',
        description: 'Chocolate Mastani',
        price: 130,
        image: '/images/chocolate-mastani.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-butterscotch-mastani',
        categoryId: 'cat-deewani-mastani',
        name: 'Butterscotch',
        description: 'Butterscotch Mastani',
        price: 130,
        image: '/images/butterscotch-mastani.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-kesar-pista-mastani',
        categoryId: 'cat-deewani-mastani',
        name: 'Kesar Pista',
        description: 'Saffron and pistachio Mastani',
        price: 150,
        image: '/images/kesar-pista-mastani.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-special-dry-fruits-mastani',
        categoryId: 'cat-deewani-mastani',
        name: 'Special Dry Fruits',
        description: 'Mixed dry fruits Mastani',
        price: 170,
        image: '/images/dry-fruits-mastani.jpg',
        availability: 'available',
        isActive: true
      },

      // Creamy Ice-Cream
      {
        _id: 'item-vanilla-ice-cream',
        categoryId: 'cat-creamy-ice-cream',
        name: 'Vanilla',
        description: 'Classic vanilla ice cream',
        price: 60,
        image: '/images/vanilla-ice-cream.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-strawberry-ice-cream',
        categoryId: 'cat-creamy-ice-cream',
        name: 'Strawberry',
        description: 'Fresh strawberry ice cream',
        price: 70,
        image: '/images/strawberry-ice-cream.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-mango-ice-cream',
        categoryId: 'cat-creamy-ice-cream',
        name: 'Mango',
        description: 'Mango ice cream',
        price: 70,
        image: '/images/mango-ice-cream.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-chocolate-ice-cream',
        categoryId: 'cat-creamy-ice-cream',
        name: 'Chocolate',
        description: 'Rich chocolate ice cream',
        price: 80,
        image: '/images/chocolate-ice-cream.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-butterscotch-ice-cream',
        categoryId: 'cat-creamy-ice-cream',
        name: 'Butterscotch',
        description: 'Butterscotch ice cream',
        price: 90,
        image: '/images/butterscotch-ice-cream.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-kesar-pista-ice-cream',
        categoryId: 'cat-creamy-ice-cream',
        name: 'Kesar Pista',
        description: 'Saffron pistachio ice cream',
        price: 100,
        image: '/images/kesar-pista-ice-cream.jpg',
        availability: 'available',
        isActive: true
      },

      // Sweet Sensation
      {
        _id: 'item-lawa-cake',
        categoryId: 'cat-sweet-sensation',
        name: 'Lawa Cake',
        description: 'Molten lava cake',
        price: 70,
        image: '/images/lawa-cake.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-mug-cake',
        categoryId: 'cat-sweet-sensation',
        name: 'Mug Cake',
        description: 'Quick mug cake',
        price: 80,
        image: '/images/mug-cake.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-sizzling-brownie',
        categoryId: 'cat-sweet-sensation',
        name: 'Sizzling Brownie',
        description: 'Hot sizzling brownie with ice cream',
        price: 170,
        image: '/images/sizzling-brownie.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-irish-brownie',
        categoryId: 'cat-sweet-sensation',
        name: 'Irish Brownie',
        description: 'Irish cream brownie',
        price: 180,
        image: '/images/irish-brownie.jpg',
        availability: 'available',
        isActive: true
      },

      // On The Rock Ice-Tea
      {
        _id: 'item-lemon-ice-tea',
        categoryId: 'cat-on-the-rock-ice-tea',
        name: 'Lemon Ice Tea',
        description: 'Refreshing lemon iced tea',
        price: 60,
        image: '/images/lemon-ice-tea.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-green-apple-ice-tea',
        categoryId: 'cat-on-the-rock-ice-tea',
        name: 'Green Apple',
        description: 'Green apple iced tea',
        price: 70,
        image: '/images/green-apple-tea.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-raspberry-ice-tea',
        categoryId: 'cat-on-the-rock-ice-tea',
        name: 'Raspberry',
        description: 'Raspberry iced tea',
        price: 70,
        image: '/images/raspberry-tea.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-lemon-mint-ice-tea',
        categoryId: 'cat-on-the-rock-ice-tea',
        name: 'Lemon Mint',
        description: 'Lemon mint iced tea',
        price: 80,
        image: '/images/lemon-mint-tea.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-watermelon-ice-tea',
        categoryId: 'cat-on-the-rock-ice-tea',
        name: 'Watermelon',
        description: 'Watermelon iced tea',
        price: 90,
        image: '/images/watermelon-tea.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-blue-ocean-ice-tea',
        categoryId: 'cat-on-the-rock-ice-tea',
        name: 'Blue Ocean',
        description: 'Blue ocean iced tea',
        price: 90,
        image: '/images/blue-ocean-tea.jpg',
        availability: 'available',
        isActive: true
      },

      // Mystic Mocktails
      {
        _id: 'item-mint-margarita',
        categoryId: 'cat-mystic-mocktails',
        name: 'Mint Margarita',
        description: 'Refreshing mint mocktail',
        price: 130,
        image: '/images/mint-margarita.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-green-apple-mocktail',
        categoryId: 'cat-mystic-mocktails',
        name: 'Green Apple',
        description: 'Green apple mocktail',
        price: 130,
        image: '/images/green-apple-mocktail.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-watermelon-mocktail',
        categoryId: 'cat-mystic-mocktails',
        name: 'Watermelon',
        description: 'Watermelon mocktail',
        price: 130,
        image: '/images/watermelon-mocktail.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-blue-ocean-mocktail',
        categoryId: 'cat-mystic-mocktails',
        name: 'Blue Ocean',
        description: 'Blue ocean mocktail',
        price: 140,
        image: '/images/blue-ocean-mocktail.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-kiwi-berry-mocktail',
        categoryId: 'cat-mystic-mocktails',
        name: 'Kiwi Berry',
        description: 'Kiwi and berry mocktail',
        price: 140,
        image: '/images/kiwi-berry.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-tml-banta-mocktail',
        categoryId: 'cat-mystic-mocktails',
        name: 'Tml Banta',
        description: 'Special Banta mocktail',
        price: 130,
        image: '/images/tml-banta.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-chilli-guava-mocktail',
        categoryId: 'cat-mystic-mocktails',
        name: 'Chilli Guava',
        description: 'Spicy guava mocktail',
        price: 130,
        image: '/images/chilli-guava.jpg',
        availability: 'available',
        isActive: true
      },

      // Shake It Up
      {
        _id: 'item-vanilla-shake',
        categoryId: 'cat-shake-it-up',
        name: 'Vanilla Shake',
        description: 'Classic vanilla shake',
        price: 70,
        image: '/images/vanilla-shake.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-strawberry-shake',
        categoryId: 'cat-shake-it-up',
        name: 'Strawberry Shake',
        description: 'Fresh strawberry shake',
        price: 70,
        image: '/images/strawberry-shake.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-pista-shake',
        categoryId: 'cat-shake-it-up',
        name: 'Pista Shake',
        description: 'Pistachio shake',
        price: 70,
        image: '/images/pista-shake.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-mango-shake',
        categoryId: 'cat-shake-it-up',
        name: 'Mango Shake',
        description: 'Mango shake',
        price: 80,
        image: '/images/mango-shake.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-chocolate-shake',
        categoryId: 'cat-shake-it-up',
        name: 'Chocolate Shake',
        description: 'Rich chocolate shake',
        price: 90,
        image: '/images/chocolate-shake.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-butterscotch-shake',
        categoryId: 'cat-shake-it-up',
        name: 'Butterscotch Shake',
        description: 'Butterscotch shake',
        price: 100,
        image: '/images/butterscotch-shake.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-oreo-shake',
        categoryId: 'cat-shake-it-up',
        name: 'Oreo Shake',
        description: 'Oreo cookie shake',
        price: 110,
        image: '/images/oreo-shake.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-kit-kat-shake',
        categoryId: 'cat-shake-it-up',
        name: 'Kit-Kat Shake',
        description: 'Kit-Kat chocolate shake',
        price: 130,
        image: '/images/kitkat-shake.jpg',
        availability: 'available',
        isActive: true
      },

      // Magic Tea
      {
        _id: 'item-black-tea',
        categoryId: 'cat-magic-tea',
        name: 'Black Tea',
        description: 'Classic black tea',
        price: 30,
        image: '/images/black-tea.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-lemon-black-tea',
        categoryId: 'cat-magic-tea',
        name: 'Lemon Black Tea',
        description: 'Black tea with lemon',
        price: 40,
        image: '/images/lemon-black-tea.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-lemon-adrak-tea',
        categoryId: 'cat-magic-tea',
        name: 'Lemon Adrak Tea',
        description: 'Lemon ginger tea',
        price: 50,
        image: '/images/lemon-adrak-tea.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-green-tea',
        categoryId: 'cat-magic-tea',
        name: 'Green Tea',
        description: 'Healthy green tea',
        price: 50,
        image: '/images/green-tea.jpg',
        availability: 'available',
        isActive: true
      },

      // Sinful Chocolate
      {
        _id: 'item-cad-b',
        categoryId: 'cat-sinful-chocolate',
        name: 'CAD- B',
        description: 'Cadbury chocolate variant',
        price: 120,
        image: '/images/cad-b.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-cad-m',
        categoryId: 'cat-sinful-chocolate',
        name: 'CAD- M',
        description: 'Cadbury chocolate variant',
        price: 130,
        image: '/images/cad-m.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-kit-kat-chocolaty',
        categoryId: 'cat-sinful-chocolate',
        name: 'Kit Kat Chocolaty',
        description: 'Kit-Kat chocolate drink',
        price: 150,
        image: '/images/kitkat-chocolaty.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-day-n-night',
        categoryId: 'cat-sinful-chocolate',
        name: 'Day n Night',
        description: 'Special chocolate blend',
        price: 170,
        image: '/images/day-n-night.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-oreo-chocolate',
        categoryId: 'cat-sinful-chocolate',
        name: 'Oreo Chocolate',
        description: 'Oreo chocolate drink',
        price: 180,
        image: '/images/oreo-chocolate.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-oreo-punch',
        categoryId: 'cat-sinful-chocolate',
        name: 'Oreo Punch',
        description: 'Oreo special punch',
        price: 190,
        image: '/images/oreo-punch.jpg',
        availability: 'available',
        isActive: true
      },
      {
        _id: 'item-dry-fruit-chocolaty',
        categoryId: 'cat-sinful-chocolate',
        name: 'Dry Fruit Chocolaty',
        description: 'Chocolate with dry fruits',
        price: 200,
        image: '/images/dry-fruit-chocolaty.jpg',
        availability: 'available',
        isActive: true
      }
    ];

    await MenuItem.insertMany(menuItems);
    console.log('🍕 Created menu items');

    // Seed Tables
    const tables = [];
    const locations = ['Main Hall', 'Window Side', 'Garden Area', 'Private Corner', 'Terrace'];
    
    for (let i = 1; i <= 20; i++) {
      tables.push({
        _id: `table-${i}`,
        tableNumber: i,
        capacity: i <= 10 ? 4 : (i <= 15 ? 2 : 6),
        status: 'available',
        qrCode: `QR-TABLE-${i}`,
        location: locations[Math.floor(Math.random() * locations.length)],
        isActive: true
      });
    }

    await Table.insertMany(tables);
    console.log('🪑 Created tables');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Menu Items: ${menuItems.length}`);
    console.log(`   - Tables: ${tables.length}`);
    console.log('\n📝 Login Credentials:');
    console.log('   Owner: owner@cafe.com / password123');
    console.log('   Manager: manager@cafe.com / password123');
    console.log('   Manager: rahul.manager@cafe.com / password123');
    console.log('   Staff: staff@cafe.com / password123');
    console.log('   Staff: priya.staff@cafe.com / password123');
    console.log('   Staff: amit.staff@cafe.com / password123');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();