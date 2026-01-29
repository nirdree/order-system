import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['owner', 'manager', 'staff'],
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  salary: {
    type: Number,
    default: 0
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  _id: false
});

// Hash password before saving (CREATE)
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  this.password = await bcrypt.hash(this.password, 10);
});

// Hash password before updating (UPDATE)
userSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  
  // Check if password is being updated
  if (update.password) {
    update.password = await bcrypt.hash(update.password, 10);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);