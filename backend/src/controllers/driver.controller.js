import Driver from '../models/Driver.model.js';
import { sendCsv } from '../utils/csvExport.js';

export async function listDrivers(req, res, next) {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    if (req.user?.role === 'Driver') {
      const driverProfile = await Driver.findOne({ userId: req.user.id });
      if (!driverProfile) {
        return res.json([]);
      }
      return res.json([driverProfile]);
    }

    const drivers = await Driver.find(filter).sort({ createdAt: -1 });
    res.json(drivers);
  } catch (err) {
    next(err);
  }
}

export async function getDriver(req, res, next) {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    next(err);
  }
}

export async function createDriver(req, res, next) {
  try {
    const driver = await Driver.create(req.body);
    res.status(201).json(driver);
  } catch (err) {
    next(err);
  }
}

export async function updateDriver(req, res, next) {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    next(err);
  }
}

export async function deleteDriver(req, res, next) {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    next(err);
  }
}

export async function exportDriversCsv(req, res, next) {
  try {
    const drivers = await Driver.find().lean();
    const rows = drivers.map((d) => ({
      name: d.name,
      licenseNumber: d.licenseNumber,
      licenseCategory: d.licenseCategory,
      licenseExpiry: new Date(d.licenseExpiry).toISOString().slice(0, 10),
      contact: d.contact,
      safetyScore: d.safetyScore,
      status: d.status,
    }));
    sendCsv(res, 'drivers.csv', rows);
  } catch (err) {
    next(err);
  }
}
