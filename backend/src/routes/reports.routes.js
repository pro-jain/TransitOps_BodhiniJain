import { Router } from 'express';
import { capacityPlanner, costReport, exportCostReportCsv } from '../controllers/reports.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post('/capacity-planner', capacityPlanner);
router.get('/cost-report', costReport);
router.get('/cost-report/export/csv', exportCostReportCsv);

export default router;
