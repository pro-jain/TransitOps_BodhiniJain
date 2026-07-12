import Driver from '../models/Driver.model.js';
import Vehicle from '../models/Vehicle.model.js';
import MaintenanceLog from '../models/MaintenanceLog.model.js';
import { MinHeap } from '../utils/minHeap.js';

// Fixed interval (in days) used to project the next maintenance due date
// from the last closed maintenance log, when no explicit dueOdometer is set.
const MAINTENANCE_INTERVAL_DAYS = 90;

/**
 * MIN-HEAP BY DATE
 * -----------------------------------------------------------------
 * Problem: "What licenses expire next / what maintenance is due next?"
 *
 * Approach: build a min-heap keyed by date (license expiry, or projected
 * maintenance due date), then pop the top N. Rebuilt on read from current
 * data (cheap at hackathon scale; the heap here demonstrates the same
 * getNextN(k) pattern used for #1, and would be maintained incrementally
 * in a longer-lived deployment rather than rebuilt every request).
 *
 * Complexity: O(n log n) to build + pop N items; O(log n) per individual
 * push/pop if maintained incrementally.
 */
export async function getUpcomingLicenseExpirations(n = 5) {
  const drivers = await Driver.find({ status: { $ne: 'Suspended' } }).lean();

  const heap = new MinHeap((a, b) => a.expiryDate - b.expiryDate);
  for (const d of drivers) {
    heap.push({
      driverId: d._id,
      name: d.name,
      licenseNumber: d.licenseNumber,
      expiryDate: new Date(d.licenseExpiry).getTime(),
      isExpired: new Date(d.licenseExpiry) < new Date(),
    });
  }

  const results = [];
  for (let i = 0; i < n && !heap.isEmpty(); i++) {
    const item = heap.pop();
    results.push({ ...item, expiryDate: new Date(item.expiryDate) });
  }
  return results;
}

export async function getUpcomingMaintenance(n = 5) {
  const vehicles = await Vehicle.find({ status: { $ne: 'Retired' } }).lean();

  const heap = new MinHeap((a, b) => a.dueDate - b.dueDate);

  for (const v of vehicles) {
    const activeLog = await MaintenanceLog.findOne({ vehicleId: v._id, isActive: true }).lean();
    if (activeLog) {
      // Already in shop right now -- surface as "due now".
      heap.push({
        vehicleId: v._id,
        regNumber: v.regNumber,
        name: v.name,
        dueDate: Date.now(),
        reason: `Currently in shop (${activeLog.type})`,
      });
      continue;
    }

    const lastClosed = await MaintenanceLog.findOne({ vehicleId: v._id, isActive: false })
      .sort({ closedAt: -1 })
      .lean();

    const baseline = lastClosed?.closedAt ? new Date(lastClosed.closedAt) : new Date(v.createdAt || Date.now());
    const dueDate = new Date(baseline);
    dueDate.setDate(dueDate.getDate() + MAINTENANCE_INTERVAL_DAYS);

    heap.push({
      vehicleId: v._id,
      regNumber: v.regNumber,
      name: v.name,
      dueDate: dueDate.getTime(),
      reason: lastClosed ? 'Scheduled interval' : 'No maintenance history yet',
    });
  }

  const results = [];
  for (let i = 0; i < n && !heap.isEmpty(); i++) {
    const item = heap.pop();
    results.push({ ...item, dueDate: new Date(item.dueDate) });
  }
  return results;
}
