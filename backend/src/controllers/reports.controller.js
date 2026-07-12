import { computeMinimumCapacity } from '../services/capacityPlanner.service.js';
import { getPerVehicleCostReport } from '../services/costAnalytics.service.js';
import { sendCsv } from '../utils/csvExport.js';

export async function capacityPlanner(req, res, next) {
  try {
    const { date, vehicleCount } = req.body;
    if (!date || !vehicleCount || vehicleCount < 1) {
      return res.status(400).json({ message: 'date and a positive vehicleCount are required' });
    }
    const result = await computeMinimumCapacity(date, Number(vehicleCount));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function costReport(req, res, next) {
  try {
    const report = await getPerVehicleCostReport();
    res.json(report);
  } catch (err) {
    next(err);
  }
}

export async function exportCostReportCsv(req, res, next) {
  try {
    const report = await getPerVehicleCostReport();
    const rows = report.map((r) => ({
      regNumber: r.regNumber,
      name: r.name,
      totalTrips: r.totalTrips,
      totalDistance: r.totalDistance,
      fuelEfficiencyKmPerL: r.fuelEfficiencyKmPerL ?? '',
      totalFuelCost: r.totalFuelCost,
      totalMaintenanceCost: r.totalMaintenanceCost,
      totalOtherExpenses: r.totalOtherExpenses,
      operationalCost: r.operationalCost,
      totalRevenue: r.totalRevenue,
      roi: r.roi ?? '',
    }));
    sendCsv(res, 'cost-report.csv', rows);
  } catch (err) {
    next(err);
  }
}
