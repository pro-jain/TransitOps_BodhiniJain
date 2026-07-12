import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    licenseCategory: { type: String, required: true, trim: true },
    licenseExpiry: { type: Date, required: true },
    contact: { type: String, required: true, trim: true },
    safetyScore: { type: Number, default: 80, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
      default: 'Available',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Driver', driverSchema);
