import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'Category ID is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  icon: {
    type: String,
    required: [true, 'Category icon is required'],
    trim: true
  },
  imgURL: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
categorySchema.index({ id: 1 });

export default mongoose.models.Category || mongoose.model('Category', categorySchema);