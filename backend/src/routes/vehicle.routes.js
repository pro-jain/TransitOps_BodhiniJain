import { Router } from 'express';
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  exportVehiclesCsv,
} from '../controllers/vehicle.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listVehicles);
router.get('/export/csv', exportVehiclesCsv);
router.get('/:id', getVehicle);
router.post('/', requireRole(['FleetManager']), createVehicle);
router.put('/:id', requireRole(['FleetManager']), updateVehicle);
router.delete('/:id', requireRole(['FleetManager']), deleteVehicle);

export default router;