import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: [true, 'Table number is required'],
    unique: true,
    min: [1, 'Table number must be positive']
  },
  floorNumber: {
    type: Number,
    required: [true, 'Floor number is required'],
    min: [1, 'Floor number must be positive']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  status: {
    type: String,
    enum: ['available', 'occupied'],
    default: 'available'
  },
  location: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
tableSchema.index({ tableNumber: 1 });
tableSchema.index({ floorNumber: 1 });
tableSchema.index({ status: 1 });

export default mongoose.models.Table || mongoose.model('Table', tableSchema);