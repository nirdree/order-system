import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => `oi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  itemId: {
    type: String,
    ref: 'MenuItem',
    required: true
  },
  name: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  tableId: {
    type: String,
    ref: 'Table',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'served', 'completed', 'cancelled'],
    default: 'pending'
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  createdBy: {
    type: String,
    ref: 'User'
  },
  customerName: {
    type: String,
    trim: true
  },
  specialInstructions: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  _id: false
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.models.Order.countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.models.Order || mongoose.model('Order', orderSchema);