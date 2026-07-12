import { Router } from 'express';
import {
  listMaintenanceLogs,
  createMaintenanceLog,
  closeMaintenanceLog,
} from '../controllers/maintenance.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listMaintenanceLogs);
router.post('/', requireRole(['FleetManager']), createMaintenanceLog);
router.post('/:id/close', requireRole(['FleetManager']), closeMaintenanceLog);

export default router;
