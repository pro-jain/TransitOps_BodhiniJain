import Trip from '../models/Trip.model.js';
import { MinHeap } from '../utils/minHeap.js';

/**
 * INTERVAL PARTITIONING
 * -----------------------------------------------------------------
 * Problem: "Minimum vehicles needed to run today's trips without conflict."
 *
 * Approach: classic interval-partitioning / meeting-rooms algorithm.
 * Sort trips by plannedStart ascending. Maintain a min-heap of plannedEnd
 * times for vehicles "in use". For each trip, if the earliest-ending
 * vehicle is already free (its end <= this trip's start), reuse it
 * (pop + push new end time). Otherwise no existing vehicle is free,
 * so we need one more vehicle (push new end time without popping).
 *
 * Complexity: O(n log n) -- sort dominates, heap ops are O(log n) each.
 */
export async function computeMinimumVehiclesForDate(dateStr) {
  const { startOfDay, endOfDay } = dayBounds(dateStr);

  const trips = await Trip.find({
    plannedStart: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'Cancelled' },
  })
    .sort({ plannedStart: 1 })
    .lean();

  const heap = new MinHeap((a, b) => a - b); // stores plannedEnd as epoch ms
  let vehiclesNeeded = 0;

  for (const trip of trips) {
    const start = new Date(trip.plannedStart).getTime();
    const end = new Date(trip.plannedEnd).getTime();

    if (!heap.isEmpty() && heap.peek() <= start) {
      heap.pop(); // reuse the vehicle that's now free
    } else {
      vehiclesNeeded += 1; // no vehicle free yet, allocate a new one
    }
    heap.push(end);
  }

  return {
    date: dateStr,
    tripCount: trips.length,
    minimumVehiclesNeeded: vehiclesNeeded,
    peakConcurrentVehicles: heap.size(),
  };
}

/**
 * Live dispatch-time check reusing the same interval logic: counts how many
 * vehicles are simultaneously "in use" (by trips overlapping the proposed
 * window) and warns if adding this trip would exceed the available fleet.
 */
export async function checkOverlapCapacity({ plannedStart, plannedEnd, excludeTripId, totalFleetSize }) {
  const overlapping = await Trip.find({
    _id: { $ne: excludeTripId || null },
    status: { $in: ['Dispatched'] },
    plannedStart: { $lt: new Date(plannedEnd) },
    plannedEnd: { $gt: new Date(plannedStart) },
  }).countDocuments();

  const projectedInUse = overlapping + 1;
  return {
    currentlyOverlapping: overlapping,
    projectedInUse,
    exceedsFleet: totalFleetSize != null ? projectedInUse > totalFleetSize : null,
  };
}

function dayBounds(dateStr) {
  const startOfDay = new Date(dateStr);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
}
