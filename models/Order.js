import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    default: () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null // null for counter orders
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    default: null // null for counter orders
  },
  orderType: {
    type: String,
    enum: ['dine-in', 'counter'],
    default: 'dine-in'
  },
  placedBy: {
    type: String,
    enum: ['staff', 'customer'],
    default: 'staff'
  },
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    subtotal: {
      type: Number,
      required: true
    },
    specialInstructions: {
      type: String,
      trim: true
    }
  }],
  orderStatus: {
    type: String,
    enum: ['pending', 'preparing', 'served', 'cancelled'],
    default: 'pending'
  },
  orderAmount: {
    type: Number,
    required: true,
    default: 0
  },
  orderedAt: {
    type: Date,
    default: Date.now
  },
  orderedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for customer orders
  },
  customerNotes: {
    type: String,
    trim: true
  },
  notifyCustomer: {
    type: Boolean,
    default: false
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 15
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'preparing', 'served', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
orderSchema.index({ orderId: 1 });
orderSchema.index({ session: 1 });
orderSchema.index({ table: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ orderType: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);