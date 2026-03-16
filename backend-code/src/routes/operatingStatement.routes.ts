import { Router } from 'express';
import * as ctrl from '../controllers/operatingStatement.controller';

const router = Router();

router.get('/:dealId/operating-statement', ctrl.listStatements);
router.get('/:dealId/operating-statement/latest', ctrl.latestStatement);
router.get('/:dealId/operating-statement/noi-summary', ctrl.noiSummary);
router.get('/:dealId/operating-statement/:osId', ctrl.getStatement);

export default router;
