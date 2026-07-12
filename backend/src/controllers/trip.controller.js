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
    const driver = await Driver.findById(driverId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    assertCargoWithinCapacity(cargoWeight, vehicle);

    const trip = await Trip.create({
      source,
      destination,
      vehicleId,
      driverId,
      cargoWeight,
      plannedDistance,
      plannedStart,
      plannedEnd,
      revenue: revenue || 0,
      status: 'Draft',
      createdBy: req.user?.id,
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

// NOTE: writes below are sequential (not wrapped in a Mongo multi-document
// transaction) so this works against a standalone MongoDB instance, which
// hackathon/demo environments typically use (transactions require a
// replica set). If you deploy against a replica set / Atlas, wrapping
// these in a session.withTransaction() block is a straightforward upgrade.
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

    trip.status = 'Dispatched';
    vehicle.status = 'On Trip';
    driver.status = 'On Trip';

    await trip.save();
    await vehicle.save();
    await driver.save();

    res.json({ trip, fleetWarning: overlapCheck.exceedsFleet ? overlapCheck : null });
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

    trip.status = 'Completed';
    trip.actualOdometerEnd = actualOdometerEnd;
    trip.fuelConsumed = fuelConsumed;

    vehicle.status = 'Available';
    if (actualOdometerEnd && actualOdometerEnd > vehicle.odometer) {
      vehicle.odometer = actualOdometerEnd;
    }
    driver.status = 'Available';

    await trip.save();
    await vehicle.save();
    await driver.save();

    if (fuelConsumed) {
      await FuelLog.create({
        vehicleId: vehicle._id,
        tripId: trip._id,
        liters: fuelConsumed,
        cost: fuelCost || 0,
        date: new Date(),
      });
    }

    res.json({ trip });
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
    trip.status = 'Cancelled';
    await trip.save();

    if (wasDispatched) {
      await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: 'Available' });
      await Driver.findByIdAndUpdate(trip.driverId, { status: 'Available' });
    }

    res.json({ trip });
  } catch (err) {
    next(err);
  }
}

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}