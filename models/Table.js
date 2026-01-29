import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  tableNumber: {
    type: Number,
    required: [true, 'Table number is required'],
    unique: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 1
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved'],
    default: 'available'
  },
  qrCode: {
    type: String
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
  timestamps: true,
  _id: false
});

export default mongoose.models.Table || mongoose.model('Table', tableSchema);