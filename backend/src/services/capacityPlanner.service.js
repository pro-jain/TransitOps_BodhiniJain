import Trip from '../models/Trip.model.js';

/**
 * BINARY SEARCH ON THE ANSWER + GREEDY FEASIBILITY (bin-packing check)
 * -----------------------------------------------------------------
 * Problem: "With only K vehicles, what per-vehicle capacity is needed
 * to serve all of today's trips?"
 *
 * Approach: binary search over the capacity range
 *   lo = largest single trip's cargoWeight (must fit the biggest trip)
 *   hi = sum of all cargoWeights (one vehicle could carry everything)
 * For each candidate `mid` capacity, run a greedy feasibility check:
 * pack trips in order, start a new "vehicle" whenever the running load
 * would exceed `mid`. If the number of vehicles used <= K, `mid` is
 * sufficient, so search the lower half; otherwise search the upper half.
 *
 * Complexity: O(n log(sum(cargoWeight))) -- each of the O(log sum) binary
 * search iterations runs an O(n) feasibility pass.
 */
export async function computeMinimumCapacity(dateStr, vehicleCount) {
  const { startOfDay, endOfDay } = dayBounds(dateStr);

  const trips = await Trip.find({
    plannedStart: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'Cancelled' },
  })
    .sort({ plannedStart: 1 })
    .lean();

  const weights = trips.map((t) => t.cargoWeight);

  if (weights.length === 0) {
    return { date: dateStr, vehicleCount, minCapacity: 0, tripCount: 0 };
  }

  let lo = Math.max(...weights);
  let hi = weights.reduce((a, b) => a + b, 0);

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (isFeasible(weights, mid, vehicleCount)) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  return {
    date: dateStr,
    vehicleCount,
    tripCount: trips.length,
    minCapacity: lo,
  };
}

function isFeasible(weights, capacity, K) {
  let vehiclesUsed = 1;
  let currentLoad = 0;

  for (const w of weights) {
    if (w > capacity) return false; // no single vehicle of this capacity could take this trip
    if (currentLoad + w > capacity) {
      vehiclesUsed += 1;
      currentLoad = 0;
      if (vehiclesUsed > K) return false;
    }
    currentLoad += w;
  }
  return vehiclesUsed <= K;
}

function dayBounds(dateStr) {
  const startOfDay = new Date(dateStr);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
}
