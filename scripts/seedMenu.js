import mongoose from 'mongoose';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management';

/* ===== FIXED IMAGE URLS ===== */
const CATEGORY_IMG =
  'https://res.cloudinary.com/dj4je0ouh/image/upload/v1769721090/images_pj6p7v.jpg';

const MENU_IMG =
  'https://res.cloudinary.com/dj4je0ouh/image/upload/v1769721210/download_sl9uqr.jpg';

/* ===== MENU DATA ===== */
const menuData = {
  caughtbycawa: [
    { name: 'Cawa', price: 50, available: true, mostSell: true },
    { name: 'Cawa Crush', price: 60, available: true, mostSell: false },
    { name: 'Cawa with Ice cream', price: 70, available: true, mostSell: false },
    { name: 'Friendship Cawa/ Milky Cawa', price: 80, available: false, mostSell: false },
    { name: 'True Love Cawa', price: 80, available: true, mostSell: true },
    { name: 'Irish/Vanilla/Caramel Cawa', price: 90, available: true, mostSell: false },
    { name: 'Black Forest Cawa', price: 110, available: true, mostSell: true },
    { name: 'Mocha Cawa with Ice-Cream', price: 110, available: true, mostSell: false },
    { name: 'Cawa Frappe', price: 140, available: true, mostSell: true }
  ],

  sweetsensation: [
    { name: 'Lawa Cake', price: 70, available: true, mostSell: false },
    { name: 'Brownie', price: 150, available: true, mostSell: true },
    { name: 'Sizzling Brownie', price: 170, available: true, mostSell: true },
    { name: 'Irish Brownie', price: 180, available: false, mostSell: false },
    { name: 'Dry Fruit Brownie', price: 200, available: true, mostSell: false }
  ],

  hottrails: [
    { name: 'Hot Coffee', price: 50, available: true, mostSell: true },
    { name: 'Irish Hot Coffee', price: 60, available: true, mostSell: false },
    { name: 'Vanilla/Caramel', price: 70, available: true, mostSell: false },
    { name: 'Hot Chocolate', price: 80, available: true, mostSell: true },
    { name: 'Cappuccino', price: 110, available: true, mostSell: true }
  ]
};

/* ===== CATEGORY LIST ===== */
const categories = [
  { id: 'all', description: 'All Items' },
  { id: 'caughtbycawa', description: 'Cawa Special' },
  { id: 'sweetsensation', description: 'Sweet Treats' },
  { id: 'hottrails', description: 'Hot Beverages' },
  { id: 'deewanimastani', description: 'Mastani' },
  { id: 'creamyicecream', description: 'Ice Cream' },
  { id: 'ontherockicetea', description: 'Ice Tea' },
  { id: 'mysticmocktails', description: 'Mocktails' },
  { id: 'shakeitup', description: 'Shakes' },
  { id: 'magictea', description: 'Tea' },
  { id: 'sinfulchocolate', description: 'Chocolate' }
];

/* ===== SEED FUNCTION ===== */
async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Clear old data
    await Category.deleteMany();
    await MenuItem.deleteMany();

    /* ===== INSERT CATEGORIES ===== */
    await Category.insertMany(
      categories.map(cat => ({
        id: cat.id,
        icon: 'default-icon',
        imgURL: CATEGORY_IMG,
        description: cat.description
      }))
    );

    console.log('✅ Categories inserted');

    /* ===== INSERT MENU ITEMS ===== */
    const menuItems = [];

    Object.entries(menuData).forEach(([category, items]) => {
      items.forEach(item => {
        menuItems.push({
          name: item.name,
          price: item.price,
          category,
          description: `${item.name} - Special`,
          imgURL: MENU_IMG,
          available: item.available,
          mostSell: item.mostSell,
          isActive: true,
          preparationTime: 15
        });
      });
    });

    await MenuItem.insertMany(menuItems);
    console.log('✅ Menu items inserted');

    process.exit();
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
