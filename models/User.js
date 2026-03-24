const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { 
      type: String, 
      required: [true, 'Username is required'], 
      unique: true,
      trim: true
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: { 
      type: String, 
      required: [true, 'Password hash is required'] 
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'pharmacist', 'cashier'],
      default: 'pharmacist',
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    profilePicture: { 
      type: String 
    },
    lastLogin: { 
      type: Date 
    },
  },
  { 
    timestamps: true 
  }
);

// Add index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);