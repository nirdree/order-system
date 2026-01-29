import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imgURL: {
    type: String,
    trim: true,
    default: '/images/default-item.jpg'
  },
  available: {
    type: Boolean,
    default: true
  },
  mostSell: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: {
    type: [String],
    default: []
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  }
}, {
  timestamps: true
});

// Index for faster queries
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ available: 1 });
menuItemSchema.index({ mostSell: 1 });
menuItemSchema.index({ isActive: 1 });
menuItemSchema.index({ name: 'text' }); // Text search index

export default mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);