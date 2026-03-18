import { Router } from 'express';
import * as ctrl from '../controllers/properties.controller';

const router = Router();

router.get('/:dealId/property', ctrl.getProperty);
router.put('/:dealId/property', ctrl.upsertProperty);

export default router;
