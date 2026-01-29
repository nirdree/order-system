import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  orderId: {
    type: String,
    ref: 'Order',
    required: true
  },
  billNumber: {
    type: String,
    unique: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'online'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paidAt: {
    type: Date
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true,
  _id: false
});

// Generate bill number before saving
billSchema.pre('save', async function(next) {
  if (!this.billNumber) {
    const count = await mongoose.models.Bill.countDocuments();
    this.billNumber = `BILL-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.models.Bill || mongoose.model('Bill', billSchema);