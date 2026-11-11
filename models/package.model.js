import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    features: {
      type: [String],
      default: [],
    },
    badge: {
      type: String,
      default: 'Standard',
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

const Package = mongoose.model('Package', packageSchema);
export default Package;

