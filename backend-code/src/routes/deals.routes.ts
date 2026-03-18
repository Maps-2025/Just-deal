import { Router } from 'express';
import * as ctrl from '../controllers/deals.controller';

const router = Router();

router.get('/stats', ctrl.getStats);
router.get('/status-categories', ctrl.getStatusCategories);

router.get('/', ctrl.listDeals);
router.get('/:id', ctrl.getDeal);
router.post('/', ctrl.createDeal);
router.put('/:id', ctrl.updateDeal);
router.delete('/:id', ctrl.deleteDeal);
router.patch('/:id/status', ctrl.updateStatus);
router.patch('/:id/star', ctrl.toggleStar);

export default router;
