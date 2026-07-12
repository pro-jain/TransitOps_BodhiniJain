import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    cargoWeight: { type: Number, required: true, min: 0 },
    plannedDistance: { type: Number, required: true, min: 0 },
    plannedStart: { type: Date, required: true },
    plannedEnd: { type: Date, required: true },
    actualOdometerEnd: { type: Number },
    fuelConsumed: { type: Number }, // liters
    revenue: { type: Number, default: 0 }, // used for ROI calc; assumption noted in service
    status: {
      type: String,
      enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
      default: 'Draft',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Trip', tripSchema);
