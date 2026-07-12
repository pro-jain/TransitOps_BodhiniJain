/**
 * Demo data generator. Run with: npm run seed (from /backend)
 * Produces:
 *  - 4 users (one per role), all with password: password123
 *  - 10 vehicles (varied types/status/region)
 *  - 8 drivers (including 1 expired license, 1 Suspended)
 *  - 15 trips spanning today across Draft/Dispatched/Completed,
 *    a few overlapping in time so Fleet Sizing is non-trivial
 *  - Fuel logs + expenses for completed trips
 *  - One open maintenance log
 */
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { prisma } from '../src/prisma/client.js';

dotenv.config();

function todayAt(hour, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function seed() {
  await prisma.$connect();
  console.log('[seed] connected to PostgreSQL');

  await prisma.$transaction([
    prisma.fuelLog.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.maintenanceLog.deleteMany(),
    prisma.trip.deleteMany(),
    prisma.driver.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log('[seed] cleared existing rows');

  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [];
  for (const userData of [
    { name: 'Fatima (Fleet Manager)', email: 'fleetmanager@transitops.com', role: 'FleetManager' },
    { name: 'Alex (Driver)', email: 'driver@transitops.com', role: 'Driver' },
    { name: 'Priya (Safety Officer)', email: 'safety@transitops.com', role: 'SafetyOfficer' },
    { name: 'Rohan (Financial Analyst)', email: 'finance@transitops.com', role: 'FinancialAnalyst' },
  ]) {
    users.push(
      await prisma.user.create({
        data: { ...userData, passwordHash },
      })
    );
  }

  const vehicles = [];
  for (const vehicleData of [
    { regNumber: 'VAN-05', name: 'Van-05', type: 'Van', region: 'North', maxLoadCapacity: 500, odometer: 12000, acquisitionCost: 900000, status: 'Available' },
    { regNumber: 'TRK-11', name: 'Truck-11', type: 'Truck', region: 'North', maxLoadCapacity: 3000, odometer: 45000, acquisitionCost: 2400000, status: 'Available' },
    { regNumber: 'TRK-12', name: 'Truck-12', type: 'Truck', region: 'South', maxLoadCapacity: 3000, odometer: 38000, acquisitionCost: 2400000, status: 'Available' },
    { regNumber: 'PKP-03', name: 'Pickup-03', type: 'Pickup', region: 'South', maxLoadCapacity: 800, odometer: 21000, acquisitionCost: 1100000, status: 'Available' },
    { regNumber: 'PKP-04', name: 'Pickup-04', type: 'Pickup', region: 'East', maxLoadCapacity: 800, odometer: 19500, acquisitionCost: 1100000, status: 'Available' },
    { regNumber: 'VAN-06', name: 'Van-06', type: 'Van', region: 'East', maxLoadCapacity: 500, odometer: 8000, acquisitionCost: 950000, status: 'Available' },
    { regNumber: 'TRK-13', name: 'Truck-13', type: 'Truck', region: 'West', maxLoadCapacity: 4000, odometer: 61000, acquisitionCost: 2600000, status: 'In Shop' },
    { regNumber: 'VAN-07', name: 'Van-07', type: 'Van', region: 'West', maxLoadCapacity: 600, odometer: 15000, acquisitionCost: 970000, status: 'Available' },
    { regNumber: 'PKP-05', name: 'Pickup-05', type: 'Pickup', region: 'North', maxLoadCapacity: 900, odometer: 27000, acquisitionCost: 1150000, status: 'Available' },
    { regNumber: 'TRK-14', name: 'Truck-14', type: 'Truck', region: 'South', maxLoadCapacity: 3500, odometer: 5000, acquisitionCost: 2500000, status: 'Retired' },
  ]) {
    vehicles.push(await prisma.vehicle.create({ data: vehicleData }));
  }
  console.log(`[seed] created ${vehicles.length} vehicles`);
  const v = Object.fromEntries(vehicles.map((x) => [x.regNumber, x]));

  const drivers = [];
  for (const driverData of [
    { userId: users[1].id, name: 'Alex Carter', licenseNumber: 'DL-1001', licenseCategory: 'LMV', licenseExpiry: daysFromNow(400), contact: '9990001', safetyScore: 92, status: 'Available' },
    { name: 'Meera Nair', licenseNumber: 'DL-1002', licenseCategory: 'HMV', licenseExpiry: daysFromNow(20), contact: '9990002', safetyScore: 88, status: 'Available' },
    { name: 'Sanjay Rao', licenseNumber: 'DL-1003', licenseCategory: 'HMV', licenseExpiry: daysFromNow(-10), contact: '9990003', safetyScore: 75, status: 'Available' },
    { name: 'Divya Kapoor', licenseNumber: 'DL-1004', licenseCategory: 'LMV', licenseExpiry: daysFromNow(200), contact: '9990004', safetyScore: 95, status: 'Available' },
    { name: 'Karan Mehta', licenseNumber: 'DL-1005', licenseCategory: 'LMV', licenseExpiry: daysFromNow(365), contact: '9990005', safetyScore: 60, status: 'Suspended' },
    { name: 'Farah Sheikh', licenseNumber: 'DL-1006', licenseCategory: 'HMV', licenseExpiry: daysFromNow(90), contact: '9990006', safetyScore: 85, status: 'Available' },
    { name: 'Vikram Sethi', licenseNumber: 'DL-1007', licenseCategory: 'LMV', licenseExpiry: daysFromNow(500), contact: '9990007', safetyScore: 90, status: 'Available' },
    { name: 'Ananya Iyer', licenseNumber: 'DL-1008', licenseCategory: 'HMV', licenseExpiry: daysFromNow(45), contact: '9990008', safetyScore: 82, status: 'Available' },
  ]) {
    drivers.push(await prisma.driver.create({ data: driverData }));
  }
  console.log(`[seed] created ${drivers.length} drivers (1 expired license, 1 Suspended)`);
  const d = Object.fromEntries(drivers.map((x) => [x.licenseNumber, x]));

  const trips = [];
  for (const tripData of [
    { source: 'Warehouse A', destination: 'Client 1', vehicleId: v['VAN-05'].id, driverId: d['DL-1001'].id, cargoWeight: 450, plannedDistance: 40, plannedStart: todayAt(8), plannedEnd: todayAt(10), status: 'Completed', actualOdometerEnd: 12040, fuelConsumed: 6, revenue: 1200 },
    { source: 'Warehouse A', destination: 'Client 2', vehicleId: v['TRK-11'].id, driverId: d['DL-1002'].id, cargoWeight: 2500, plannedDistance: 120, plannedStart: todayAt(8, 30), plannedEnd: todayAt(11), status: 'Completed', actualOdometerEnd: 45120, fuelConsumed: 30, revenue: 4500 },
    { source: 'Warehouse B', destination: 'Client 3', vehicleId: v['PKP-03'].id, driverId: d['DL-1004'].id, cargoWeight: 700, plannedDistance: 60, plannedStart: todayAt(9), plannedEnd: todayAt(10, 30), status: 'Completed', actualOdometerEnd: 21060, fuelConsumed: 8, revenue: 1600 },
    { source: 'Warehouse B', destination: 'Client 4', vehicleId: v['VAN-06'].id, driverId: d['DL-1006'].id, cargoWeight: 300, plannedDistance: 25, plannedStart: todayAt(9, 15), plannedEnd: todayAt(10, 15), status: 'Dispatched' },
    { source: 'Warehouse A', destination: 'Client 5', vehicleId: v['TRK-12'].id, driverId: d['DL-1007'].id, cargoWeight: 2800, plannedDistance: 200, plannedStart: todayAt(9, 30), plannedEnd: todayAt(13), status: 'Dispatched' },
    { source: 'Depot C', destination: 'Client 6', vehicleId: v['PKP-04'].id, driverId: d['DL-1008'].id, cargoWeight: 500, plannedDistance: 35, plannedStart: todayAt(10), plannedEnd: todayAt(11), status: 'Draft' },
    { source: 'Depot C', destination: 'Client 7', vehicleId: v['VAN-07'].id, driverId: d['DL-1001'].id, cargoWeight: 400, plannedDistance: 30, plannedStart: todayAt(10, 30), plannedEnd: todayAt(12), status: 'Draft' },
    { source: 'Warehouse A', destination: 'Client 8', vehicleId: v['PKP-05'].id, driverId: d['DL-1004'].id, cargoWeight: 850, plannedDistance: 70, plannedStart: todayAt(11), plannedEnd: todayAt(12, 30), status: 'Draft' },
    { source: 'Warehouse B', destination: 'Client 9', vehicleId: v['VAN-05'].id, driverId: d['DL-1002'].id, cargoWeight: 480, plannedDistance: 42, plannedStart: todayAt(11, 30), plannedEnd: todayAt(13), status: 'Draft' },
    { source: 'Depot C', destination: 'Client 10', vehicleId: v['TRK-11'].id, driverId: d['DL-1006'].id, cargoWeight: 2200, plannedDistance: 150, plannedStart: todayAt(12), plannedEnd: todayAt(15), status: 'Draft' },
    { source: 'Warehouse A', destination: 'Client 11', vehicleId: v['PKP-03'].id, driverId: d['DL-1007'].id, cargoWeight: 600, plannedDistance: 55, plannedStart: todayAt(13), plannedEnd: todayAt(14, 30), status: 'Draft' },
    { source: 'Warehouse B', destination: 'Client 12', vehicleId: v['VAN-06'].id, driverId: d['DL-1008'].id, cargoWeight: 350, plannedDistance: 28, plannedStart: todayAt(13, 30), plannedEnd: todayAt(14, 30), status: 'Draft' },
    { source: 'Depot C', destination: 'Client 13', vehicleId: v['TRK-12'].id, driverId: d['DL-1001'].id, cargoWeight: 2600, plannedDistance: 180, plannedStart: todayAt(14), plannedEnd: todayAt(17), status: 'Draft' },
    { source: 'Warehouse A', destination: 'Client 14', vehicleId: v['PKP-04'].id, driverId: d['DL-1004'].id, cargoWeight: 550, plannedDistance: 45, plannedStart: todayAt(14, 30), plannedEnd: todayAt(16), status: 'Draft' },
    { source: 'Warehouse B', destination: 'Client 15', vehicleId: v['VAN-07'].id, driverId: d['DL-1002'].id, cargoWeight: 420, plannedDistance: 33, plannedStart: todayAt(15), plannedEnd: todayAt(16, 30), status: 'Draft' },
  ]) {
    trips.push(await prisma.trip.create({ data: tripData }));
  }
  console.log(`[seed] created ${trips.length} trips (some overlapping, spanning Draft/Dispatched/Completed)`);

  await prisma.vehicle.update({ where: { id: v['VAN-06'].id }, data: { status: 'On Trip' } });
  await prisma.driver.update({ where: { id: d['DL-1006'].id }, data: { status: 'On Trip' } });
  await prisma.vehicle.update({ where: { id: v['TRK-12'].id }, data: { status: 'On Trip' } });
  await prisma.driver.update({ where: { id: d['DL-1007'].id }, data: { status: 'On Trip' } });

  const completed = trips.filter((t) => t.status === 'Completed');
  for (const t of completed) {
    await prisma.fuelLog.create({ data: { vehicleId: t.vehicleId, tripId: t.id, liters: t.fuelConsumed, cost: t.fuelConsumed * 95, date: t.plannedEnd } });
  }
  await prisma.expense.create({ data: { vehicleId: v['TRK-11'].id, category: 'Toll', amount: 350, date: todayAt(11), note: 'Highway toll' } });
  await prisma.expense.create({ data: { vehicleId: v['VAN-05'].id, category: 'Fine', amount: 500, date: todayAt(10), note: 'Parking violation' } });

  await prisma.maintenanceLog.create({ data: { vehicleId: v['TRK-13'].id, type: 'Engine Overhaul', cost: 45000, isActive: true, openedAt: daysFromNow(-2) } });
  await prisma.maintenanceLog.create({ data: { vehicleId: v['VAN-05'].id, type: 'Oil Change', cost: 2200, isActive: false, openedAt: daysFromNow(-95), closedAt: daysFromNow(-93) } });

  console.log('[seed] fuel logs, expenses, and maintenance logs created');
  console.log('\n[seed] DONE. Login with any of:');
  console.log('  fleetmanager@transitops.com / password123 (FleetManager)');
  console.log('  driver@transitops.com / password123 (Driver)');
  console.log('  safety@transitops.com / password123 (SafetyOfficer)');
  console.log('  finance@transitops.com / password123 (FinancialAnalyst)');

  await prisma.$disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  prisma.$disconnect().finally(() => process.exit(1));
});
