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
    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'In Shop' });

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

    const updatedLog = await MaintenanceLog.findByIdAndUpdate(req.params.id, {
      isActive: false,
      closedAt: new Date(),
      ...(req.body.cost !== undefined ? { cost: req.body.cost } : {}),
    });

    const vehicle = await Vehicle.findById(updatedLog.vehicleId);
    if (vehicle && vehicle.status !== 'Retired') {
      await Vehicle.findByIdAndUpdate(vehicle.id, { status: 'Available' });
    }

    res.json({ log: updatedLog, vehicle });

    res.json({ log, vehicle });
  } catch (err) {
    next(err);
  }
}
