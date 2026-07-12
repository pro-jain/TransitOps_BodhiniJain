import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    regNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true }, // e.g. Truck, Van, Pickup
    region: { type: String, default: 'Unassigned', trim: true },
    maxLoadCapacity: { type: Number, required: true, min: 0 }, // kg
    odometer: { type: Number, default: 0, min: 0 }, // km
    acquisitionCost: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Available', 'On Trip', 'In Shop', 'Retired'],
      default: 'Available',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Vehicle', vehicleSchema);