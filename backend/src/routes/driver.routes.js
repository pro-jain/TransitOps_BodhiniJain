import { Router } from 'express';
import {
  listDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  exportDriversCsv,
} from '../controllers/driver.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listDrivers);
router.get('/export/csv', exportDriversCsv);
router.get('/:id', getDriver);
router.post('/', requireRole(['FleetManager', 'SafetyOfficer']), createDriver);
router.put('/:id', requireRole(['FleetManager', 'SafetyOfficer']), updateDriver);
router.delete('/:id', requireRole(['FleetManager']), deleteDriver);

export default router;