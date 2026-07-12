import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    category: { type: String, required: true, trim: true }, // e.g. Toll, Fine, Parking, Insurance
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Expense', expenseSchema);
