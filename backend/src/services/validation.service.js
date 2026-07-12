import Vehicle from '../models/Vehicle.model.js';
import Driver from '../models/Driver.model.js';
import Trip from '../models/Trip.model.js';

/**
 * Centralized business-rule validation. Every trip/vehicle/driver state
 * transition MUST go through here rather than being re-implemented
 * per-controller, per the spec's "single centralized validation service"
 * requirement. Each function throws an Error with a `.status` for the
 * error handler middleware, or returns silently if the rule passes.
 */

export async function assertVehicleRegNumberUnique(regNumber, excludeId = null) {
  const existing = await Vehicle.findOne({
    regNumber: regNumber.toUpperCase(),
    ...(excludeId && { _id: { $ne: excludeId } }),
  });
  if (existing) {
    const err = new Error(`Vehicle registration number '${regNumber}' is already in use`);
    err.status = 409;
    throw err;
  }
}

export async function assertVehicleDispatchable(vehicle) {
  if (!vehicle) {
    const err = new Error('Vehicle not found');
    err.status = 404;
    throw err;
  }
  if (['Retired', 'In Shop'].includes(vehicle.status)) {
    const err = new Error(`Vehicle ${vehicle.regNumber} is ${vehicle.status} and cannot be dispatched`);
    err.status = 400;
    throw err;
  }
  if (vehicle.status === 'On Trip') {
    const err = new Error(`Vehicle ${vehicle.regNumber} is already On Trip`);
    err.status = 400;
    throw err;
  }
}

export async function assertDriverDispatchable(driver) {
  if (!driver) {
    const err = new Error('Driver not found');
    err.status = 404;
    throw err;
  }
  if (driver.status === 'Suspended') {
    const err = new Error(`Driver ${driver.name} is Suspended and cannot be assigned`);
    err.status = 400;
    throw err;
  }
  if (new Date(driver.licenseExpiry) < new Date()) {
    const err = new Error(`Driver ${driver.name}'s license expired on ${new Date(driver.licenseExpiry).toDateString()}`);
    err.status = 400;
    throw err;
  }
  if (driver.status === 'On Trip') {
    const err = new Error(`Driver ${driver.name} is already On Trip`);
    err.status = 400;
    throw err;
  }
}

export function assertCargoWithinCapacity(cargoWeight, vehicle) {
  if (cargoWeight > vehicle.maxLoadCapacity) {
    const err = new Error(
      `Cargo weight ${cargoWeight}kg exceeds vehicle ${vehicle.regNumber}'s max capacity of ${vehicle.maxLoadCapacity}kg`
    );
    err.status = 400;
    throw err;
  }
}

export async function assertTripDispatchable(trip) {
  if (trip.status !== 'Draft') {
    const err = new Error(`Only Draft trips can be dispatched (current status: ${trip.status})`);
    err.status = 400;
    throw err;
  }
  const vehicle = await Vehicle.findById(trip.vehicleId);
  const driver = await Driver.findById(trip.driverId);
  await assertVehicleDispatchable(vehicle);
  await assertDriverDispatchable(driver);
  assertCargoWithinCapacity(trip.cargoWeight, vehicle);
  return { vehicle, driver };
}

export function assertTripCompletable(trip) {
  if (trip.status !== 'Dispatched') {
    const err = new Error(`Only Dispatched trips can be completed (current status: ${trip.status})`);
    err.status = 400;
    throw err;
  }
}

export function assertTripCancellable(trip) {
  if (!['Draft', 'Dispatched'].includes(trip.status)) {
    const err = new Error(`Trip in status '${trip.status}' cannot be cancelled`);
    err.status = 400;
    throw err;
  }
}

export function assertMaintenanceClosable(log) {
  if (!log.isActive) {
    const err = new Error('Maintenance record is already closed');
    err.status = 400;
    throw err;
  }
}
