import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  tableNumber: {
    type: Number,
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  customerCount: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  initiatedBy: {
    type: String,
    enum: ['staff', 'customer'],
    default: 'staff'
  },
  customerName: {
    type: String,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  isCustomerSelfService: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'other'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  token:{
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries (sessionId has unique: true so no need for explicit index)
sessionSchema.index({ table: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ createdAt: -1 });

export default mongoose.models.Session || mongoose.model('Session', sessionSchema);