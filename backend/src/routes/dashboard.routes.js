import { Router } from 'express';
import { getKpis, getFleetSizing, getCompliance } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/kpis', getKpis);
router.get('/fleet-sizing', getFleetSizing);
router.get('/compliance', getCompliance);

export default router;
