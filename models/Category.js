import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  _id: false
});

export default mongoose.models.Category || mongoose.model('Category', categorySchema);