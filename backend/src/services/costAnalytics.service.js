import Vehicle from '../models/Vehicle.model.js';
import Trip from '../models/Trip.model.js';
import FuelLog from '../models/FuelLog.model.js';
import Expense from '../models/Expense.model.js';
import MaintenanceLog from '../models/MaintenanceLog.model.js';

/**
 * Cost & efficiency analytics used by the Reports page.
 * ROI assumption: Trip.revenue is either entered directly on the trip, or
 * (if left at 0/unset) approximated as plannedDistance * RATE_PER_KM.
 * This assumption is intentionally explicit and documented, per the spec's
 * instruction to "state your assumption in a code comment" since the
 * original spec has no revenue field.
 */
const RATE_PER_KM_FALLBACK = 25; // currency units per km, used only if trip.revenue is 0

export async function getFleetUtilization() {
  const totalVehicles = await Vehicle.countDocuments({ status: { $ne: 'Retired' } });
  const onTrip = await Vehicle.countDocuments({ status: 'On Trip' });
  const utilizationPct = totalVehicles === 0 ? 0 : Math.round((onTrip / totalVehicles) * 1000) / 10;
  return { totalVehicles, onTrip, utilizationPct };
}

export async function getPerVehicleCostReport() {
  const vehicles = await Vehicle.find().lean();
  const report = [];

  for (const v of vehicles) {
    const trips = await Trip.find({ vehicleId: v._id, status: 'Completed' }).lean();
    const fuelLogs = await FuelLog.find({ vehicleId: v._id }).lean();
    const expenses = await Expense.find({ vehicleId: v._id }).lean();
    const maintenanceLogs = await MaintenanceLog.find({ vehicleId: v._id }).lean();

    const totalDistance = trips.reduce((sum, t) => sum + (t.plannedDistance || 0), 0);
    const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + (f.liters || 0), 0);
    const totalFuelCost = fuelLogs.reduce((sum, f) => sum + (f.cost || 0), 0);
    const totalMaintenanceCost = maintenanceLogs.reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalOtherExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalRevenue = trips.reduce((sum, t) => {
      return sum + (t.revenue > 0 ? t.revenue : t.plannedDistance * RATE_PER_KM_FALLBACK);
    }, 0);

    const operationalCost = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;
    const fuelEfficiency = totalFuelLiters > 0 ? Math.round((totalDistance / totalFuelLiters) * 100) / 100 : null;
    const roi = v.acquisitionCost > 0 ? Math.round(((totalRevenue - operationalCost) / v.acquisitionCost) * 1000) / 1000 : null;

    report.push({
      vehicleId: v._id,
      regNumber: v.regNumber,
      name: v.name,
      totalTrips: trips.length,
      totalDistance,
      totalFuelLiters,
      fuelEfficiencyKmPerL: fuelEfficiency,
      totalFuelCost,
      totalMaintenanceCost,
      totalOtherExpenses,
      operationalCost,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      roi,
    });
  }

  return report;
}
