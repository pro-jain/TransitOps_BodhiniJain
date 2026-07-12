import Trip from '../models/Trip.model.js';
import Vehicle from '../models/Vehicle.model.js';
import Driver from '../models/Driver.model.js';
import FuelLog from '../models/FuelLog.model.js';
import {
  assertVehicleDispatchable,
  assertDriverDispatchable,
  assertCargoWithinCapacity,
  assertTripDispatchable,
  assertTripCompletable,
  assertTripCancellable,
} from '../services/validation.service.js';
import { suggestDispatch } from '../services/dispatchSuggestion.service.js';
import { checkOverlapCapacity } from '../services/fleetSizing.service.js';

export async function listTrips(req, res, next) {
  try {
    const { status, date } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.plannedStart = { $gte: start, $lte: end };
    }

    if (req.user?.role === 'Driver') {
      const driverProfile = await Driver.findOne({ userId: req.user.id });
      if (!driverProfile) {
        return res.json([]);
      }
      filter.driverId = driverProfile._id;
    }

    const trips = await Trip.find(filter)
      .populate('vehicleId', 'regNumber name')
      .populate('driverId', 'name licenseNumber')
      .sort({ plannedStart: -1 });
    res.json(trips);
  } catch (err) {
    next(err);
  }
}

export async function getTrip(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.id).populate('vehicleId').populate('driverId');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    next(err);
  }
}

// Create a trip in Draft status. Runs the capacity + dispatchability checks
// up front so users get instant feedback, but the authoritative check runs
// again at actual dispatch time (state may have changed in between).
export async function createTrip(req, res, next) {
  try {
    const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance, plannedStart, plannedEnd, revenue } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    let assignedDriverId = driverId;
    if (req.user?.role === 'Driver') {
      const driverProfile = await Driver.findOne({ userId: req.user.id });
      if (!driverProfile) return res.status(403).json({ message: 'Driver profile not found' });
      if (String(driverId) !== String(driverProfile._id)) {
        return res.status(403).json({ message: 'Driver users may only create trips for themselves' });
      }
      assignedDriverId = driverProfile._id;
    }

    const driver = await Driver.findById(assignedDriverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    assertCargoWithinCapacity(cargoWeight, vehicle);

    const trip = await Trip.create({
      source,
      destination,
      vehicleId,
      driverId: assignedDriverId,
      cargoWeight,
      plannedDistance,
      plannedStart,
      plannedEnd,
      revenue: revenue || 0,
      status: 'Draft',
      createdById: req.user?.id,
    });

    res.status(201).json(trip);
  } catch (err) {
    next(err);
  }
}

export async function suggestAssignment(req, res, next) {
  try {
    const { cargoWeight, plannedStart, plannedEnd, excludeTripId } = req.body;
    if (!cargoWeight || !plannedStart || !plannedEnd) {
      return res.status(400).json({ message: 'cargoWeight, plannedStart, and plannedEnd are required' });
    }
    const result = await suggestDispatch({ cargoWeight, plannedStart, plannedEnd, excludeTripId });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// NOTE: writes below are sequential. For PostgreSQL, these can be upgraded
// to a single Prisma transaction if stronger atomicity is required.
export async function dispatchTrip(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) throw notFound('Trip not found');

    const { vehicle, driver } = await assertTripDispatchable(trip);

    const overlapCheck = await checkOverlapCapacity({
      plannedStart: trip.plannedStart,
      plannedEnd: trip.plannedEnd,
      excludeTripId: trip._id,
      totalFleetSize: await Vehicle.countDocuments({ status: { $ne: 'Retired' } }),
    });

    const updatedTrip = await Trip.findByIdAndUpdate(req.params.id, { status: 'Dispatched' });
    await Vehicle.findByIdAndUpdate(vehicle.id, { status: 'On Trip' });
    await Driver.findByIdAndUpdate(driver.id, { status: 'On Trip' });

    res.json({ trip: updatedTrip, fleetWarning: overlapCheck.exceedsFleet ? overlapCheck : null });
  } catch (err) {
    next(err);
  }
}

export async function completeTrip(req, res, next) {
  try {
    const { actualOdometerEnd, fuelConsumed, fuelCost } = req.body;

    const trip = await Trip.findById(req.params.id);
    if (!trip) throw notFound('Trip not found');
    assertTripCompletable(trip);

    const vehicle = await Vehicle.findById(trip.vehicleId);
    const driver = await Driver.findById(trip.driverId);

    const updatedTrip = await Trip.findByIdAndUpdate(req.params.id, {
      status: 'Completed',
      actualOdometerEnd,
      fuelConsumed,
    });

    await Vehicle.findByIdAndUpdate(vehicle.id, {
      status: 'Available',
      ...(actualOdometerEnd && actualOdometerEnd > vehicle.odometer ? { odometer: actualOdometerEnd } : {}),
    });
    await Driver.findByIdAndUpdate(driver.id, { status: 'Available' });

    if (fuelConsumed) {
      await FuelLog.create({
        vehicleId: vehicle.id,
        tripId: updatedTrip.id,
        liters: fuelConsumed,
        cost: fuelCost || 0,
        date: new Date(),
      });
    }

    res.json({ trip: updatedTrip });
  } catch (err) {
    next(err);
  }
}

export async function cancelTrip(req, res, next) {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) throw notFound('Trip not found');
    assertTripCancellable(trip);

    const wasDispatched = trip.status === 'Dispatched';
    const updatedTrip = await Trip.findByIdAndUpdate(req.params.id, { status: 'Cancelled' });

    if (wasDispatched) {
      await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: 'Available' });
      await Driver.findByIdAndUpdate(trip.driverId, { status: 'Available' });
    }

    res.json({ trip: updatedTrip });
  } catch (err) {
    next(err);
  }
}

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}