import MaintenanceLog from '../models/MaintenanceLog.model.js';
import Vehicle from '../models/Vehicle.model.js';
import { assertMaintenanceClosable } from '../services/validation.service.js';

export async function listMaintenanceLogs(req, res, next) {
  try {
    const { vehicleId, isActive } = req.query;
    const filter = {};
    if (vehicleId) filter.vehicleId = vehicleId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const logs = await MaintenanceLog.find(filter).populate('vehicleId', 'regNumber name').sort({ openedAt: -1 });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

// Creating an active maintenance log automatically sets vehicle status to "In Shop".
export async function createMaintenanceLog(req, res, next) {
  try {
    const { vehicleId, type, cost } = req.body;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ message: 'Cannot open maintenance on a vehicle that is currently On Trip' });
    }

    const log = await MaintenanceLog.create({ vehicleId, type, cost: cost || 0, isActive: true });
    vehicle.status = 'In Shop';
    await vehicle.save();

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

// Closing a maintenance log restores the vehicle to Available, unless it's Retired.
export async function closeMaintenanceLog(req, res, next) {
  try {
    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Maintenance log not found' });
    assertMaintenanceClosable(log);

    log.isActive = false;
    log.closedAt = new Date();
    if (req.body.cost !== undefined) log.cost = req.body.cost;
    await log.save();

    const vehicle = await Vehicle.findById(log.vehicleId);
    if (vehicle && vehicle.status !== 'Retired') {
      vehicle.status = 'Available';
      await vehicle.save();
    }

    res.json({ log, vehicle });
  } catch (err) {
    next(err);
  }
}
