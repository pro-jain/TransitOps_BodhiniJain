import Vehicle from '../models/Vehicle.model.js';
import Driver from '../models/Driver.model.js';
import Trip from '../models/Trip.model.js';

/**
 * GREEDY MATCHING
 * -----------------------------------------------------------------
 * Problem: "Best vehicle + driver to auto-suggest for a new trip."
 *
 * Approach: filter every vehicle/driver against the mandatory business
 * rules (status, license validity, capacity), then greedily rank the
 * survivors:
 *   - Vehicles: sort by capacityHeadroom ascending (maxLoadCapacity -
 *     cargoWeight), so we suggest the tightest reasonable fit instead of
 *     wasting a 2-ton truck on a 50kg parcel. Tie-break by lowest
 *     odometer to spread wear evenly across the fleet.
 *   - Drivers: sort by highest safetyScore, tie-break by soonest license
 *     expiry being furthest away (more safety margin).
 * We then pair the top vehicle/driver candidates positionally to return
 * up to 3 suggested (vehicle, driver) pairs.
 *
 * Complexity: O(n log n) for the sort; filtering is O(n).
 */
export async function suggestDispatch({ cargoWeight, plannedStart, plannedEnd, excludeTripId }) {
  const now = new Date();

  const overlappingTrips = await Trip.find({
    _id: { $ne: excludeTripId || null },
    status: 'Dispatched',
    plannedStart: { $lt: new Date(plannedEnd) },
    plannedEnd: { $gt: new Date(plannedStart) },
  }).lean();

  const busyVehicleIds = new Set(overlappingTrips.map((t) => String(t.vehicleId)));
  const busyDriverIds = new Set(overlappingTrips.map((t) => String(t.driverId)));

  const vehicles = await Vehicle.find({
    status: { $nin: ['Retired', 'In Shop'] },
    maxLoadCapacity: { $gte: cargoWeight },
  }).lean();

  const eligibleVehicles = vehicles
    .filter((v) => v.status !== 'On Trip' && !busyVehicleIds.has(String(v._id)))
    .map((v) => ({ ...v, capacityHeadroom: v.maxLoadCapacity - cargoWeight }))
    .sort((a, b) => a.capacityHeadroom - b.capacityHeadroom || a.odometer - b.odometer);

  const drivers = await Driver.find({
    status: { $nin: ['Suspended'] },
    licenseExpiry: { $gt: now },
  }).lean();

  const eligibleDrivers = drivers
    .filter((d) => d.status !== 'On Trip' && !busyDriverIds.has(String(d._id)))
    .sort((a, b) => b.safetyScore - a.safetyScore || new Date(b.licenseExpiry) - new Date(a.licenseExpiry));

  const pairCount = Math.min(3, eligibleVehicles.length, eligibleDrivers.length);
  const suggestions = [];
  for (let i = 0; i < pairCount; i++) {
    suggestions.push({
      vehicle: eligibleVehicles[i],
      driver: eligibleDrivers[i],
      rank: i + 1,
    });
  }

  return {
    suggestions,
    eligibleVehicleCount: eligibleVehicles.length,
    eligibleDriverCount: eligibleDrivers.length,
  };
}
