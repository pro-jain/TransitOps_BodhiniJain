import FuelLog from '../models/FuelLog.model.js';
import Expense from '../models/Expense.model.js';

export async function listFuelLogs(req, res, next) {
  try {
    const { vehicleId } = req.query;
    const filter = vehicleId ? { vehicleId } : {};
    const logs = await FuelLog.find(filter).populate('vehicleId', 'regNumber name').sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

export async function createFuelLog(req, res, next) {
  try {
    const log = await FuelLog.create(req.body);
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

export async function listExpenses(req, res, next) {
  try {
    const { vehicleId } = req.query;
    const filter = vehicleId ? { vehicleId } : {};
    const expenses = await Expense.find(filter).populate('vehicleId', 'regNumber name').sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    next(err);
  }
}

export async function createExpense(req, res, next) {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
}
EOF

cat > /home/claude/transitops/backend/src/controllers/dashboard.controller.js << 'EOF'
import Vehicle from '../models/Vehicle.model.js';
import Driver from '../models/Driver.model.js';
import Trip from '../models/Trip.model.js';
import { computeMinimumVehiclesForDate } from '../services/fleetSizing.service.js';
import { getUpcomingLicenseExpirations, getUpcomingMaintenance } from '../services/complianceQueue.service.js';
import { getFleetUtilization } from '../services/costAnalytics.service.js';

export async function getKpis(req, res, next) {
  try {
    const [activeVehicles, availableVehicles, vehiclesInMaintenance, activeTrips, pendingTrips, driversOnDuty, utilization] =
      await Promise.all([
        Vehicle.countDocuments({ status: { $ne: 'Retired' } }),
        Vehicle.countDocuments({ status: 'Available' }),
        Vehicle.countDocuments({ status: 'In Shop' }),
        Trip.countDocuments({ status: 'Dispatched' }),
        Trip.countDocuments({ status: 'Draft' }),
        Driver.countDocuments({ status: 'On Trip' }),
        getFleetUtilization(),
      ]);

    res.json({
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilizationPct: utilization.utilizationPct,
    });
  } catch (err) {
    next(err);
  }
}

export async function getFleetSizing(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const result = await computeMinimumVehiclesForDate(date);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getCompliance(req, res, next) {
  try {
    const n = parseInt(req.query.n, 10) || 5;
    const [licenses, maintenance] = await Promise.all([
      getUpcomingLicenseExpirations(n),
      getUpcomingMaintenance(n),
    ]);
    res.json({ upcomingLicenseExpirations: licenses, upcomingMaintenance: maintenance });
  } catch (err) {
    next(err);
  }
}
