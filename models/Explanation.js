import mongoose from 'mongoose';

const explanationSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExplanationCategory',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    totalAmountPaid: {
      type: Number,
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Check'],
      required: true,
    },
    explanationDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Explanation || mongoose.model('Explanation', explanationSchema);
