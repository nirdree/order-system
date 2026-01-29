import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  categoryId: {
    type: String,
    ref: 'Category',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  image: {
    type: String,
    default: '/images/default-food.jpg'
  },
  availability: {
    type: String,
    enum: ['available', 'out_of_stock', 'seasonal'],
    default: 'available'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  _id: false
});

export default mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);