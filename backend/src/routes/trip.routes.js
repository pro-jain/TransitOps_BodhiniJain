import { Router } from 'express';
import {
  listTrips,
  getTrip,
  createTrip,
  suggestAssignment,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} from '../controllers/trip.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', listTrips);
router.post('/suggest', suggestAssignment);
router.get('/:id', getTrip);
router.post('/', requireRole(['Driver', 'FleetManager']), createTrip);
router.post('/:id/dispatch', requireRole(['Driver', 'FleetManager']), dispatchTrip);
router.post('/:id/complete', requireRole(['Driver', 'FleetManager']), completeTrip);
router.post('/:id/cancel', requireRole(['Driver', 'FleetManager']), cancelTrip);

export default router;
