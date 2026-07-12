import { Router } from 'express';
import {
  listFuelLogs,
  createFuelLog,
  listExpenses,
  createExpense,
} from '../controllers/fuelExpense.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/fuel', listFuelLogs);
router.post('/fuel', requireRole(['FleetManager', 'Driver']), createFuelLog);
router.get('/expenses', listExpenses);
router.post('/expenses', requireRole(['FleetManager', 'FinancialAnalyst']), createExpense);

export default router;
