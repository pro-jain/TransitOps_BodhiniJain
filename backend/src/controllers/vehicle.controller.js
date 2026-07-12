import Vehicle from '../models/Vehicle.model.js';
import { assertVehicleRegNumberUnique } from '../services/validation.service.js';
import { sendCsv } from '../utils/csvExport.js';

export async function listVehicles(req, res, next) {
  try {
    const { type, status, region } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (region) filter.region = region;
    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (err) {
    next(err);
  }
}

export async function getVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    next(err);
  }
}

export async function createVehicle(req, res, next) {
  try {
    const { regNumber, name, type, region, maxLoadCapacity, odometer, acquisitionCost, status } = req.body;
    await assertVehicleRegNumberUnique(regNumber);
    const vehicle = await Vehicle.create({
      regNumber,
      name,
      type,
      region,
      maxLoadCapacity,
      odometer: odometer || 0,
      acquisitionCost,
      status: status || 'Available',
    });
    res.status(201).json(vehicle);
  } catch (err) {
    next(err);
  }
}

export async function updateVehicle(req, res, next) {
  try {
    const { regNumber } = req.body;
    if (regNumber) {
      await assertVehicleRegNumberUnique(regNumber, req.params.id);
    }
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    next(err);
  }
}

export async function deleteVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    next(err);
  }
}

export async function exportVehiclesCsv(req, res, next) {
  try {
    const vehicles = await Vehicle.find().lean();
    const rows = vehicles.map((v) => ({
      regNumber: v.regNumber,
      name: v.name,
      type: v.type,
      region: v.region,
      maxLoadCapacity: v.maxLoadCapacity,
      odometer: v.odometer,
      acquisitionCost: v.acquisitionCost,
      status: v.status,
    }));
    sendCsv(res, 'vehicles.csv', rows);
  } catch (err) {
    next(err);
  }
}
