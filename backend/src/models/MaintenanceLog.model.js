import mongoose from 'mongoose';

const maintenanceLogSchema = new mongoose.Schema(
  {
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    type: { type: String, required: true, trim: true }, // e.g. Oil Change, Tire Rotation
    cost: { type: Number, default: 0, min: 0 },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('MaintenanceLog', maintenanceLogSchema);
