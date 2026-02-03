// models/Settings.js
import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    locationAddress: {
      type: String,
      required: [true, 'Location address is required'], // Added validation
      trim: true,
    },
    locationLongitude: {
      type: Number,
      required: [true, 'Location longitude is required'],
      min: -180,
      max: 180,
    },
    locationLatitude: {
      type: Number,
      required: [true, 'Location latitude is required'],
      min: -90,
      max: 90,
    },
    locationAccuracy: {
      type: Number,
      required: [true, 'Location accuracy is required'],
      min: 0,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    orderLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for faster queries
SettingsSchema.index({ isActive: 1 });

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);