import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    userId: {
      type: String,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    purchasedPackage: {
      packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package',
      },
      name: { type: String },
      price: { type: Number },
      purchasedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Method to check if referral link can be shared
userSchema.methods.canRefer = function () {
  return this.status === 'active';
};

const User = mongoose.model('User', userSchema);
export default User;

