import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../controllers/rentRoll.controller';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const router = Router();

// List rent rolls for a deal
router.get('/:dealId/rent-roll', ctrl.listRentRolls);

// Latest rent roll
router.get('/:dealId/rent-roll/latest', ctrl.latestRentRoll);

// Upload rent roll (multipart)
router.post('/:dealId/rent-roll/upload', upload.single('file'), ctrl.uploadRentRoll);

// Units (paginated)
router.get('/:dealId/rent-roll/units', ctrl.getUnits);

// Unit mix
router.get('/:dealId/rent-roll/unit-mix', ctrl.getUnitMix);

// Rent roll by ID
router.get('/:dealId/rent-roll/:rrId', ctrl.getRentRoll);

// Delete rent roll
router.delete('/:dealId/rent-roll/:rrId', ctrl.deleteRentRoll);

// Column mapping
router.post('/:dealId/rent-roll/:rrId/mapping', ctrl.saveMapping);

// Floorplans
router.get('/:dealId/rent-roll/:rrId/floorplans', ctrl.getFloorplans);
router.put('/:dealId/rent-roll/:rrId/floorplans', ctrl.updateFloorplans);

// Occupancy
router.get('/:dealId/rent-roll/:rrId/occupancy', ctrl.getOccupancy);
router.put('/:dealId/rent-roll/:rrId/occupancy', ctrl.updateOccupancy);

// Charges
router.get('/:dealId/rent-roll/:rrId/charges', ctrl.getCharges);
router.put('/:dealId/rent-roll/:rrId/charges', ctrl.updateCharges);

// Renovations
router.put('/:dealId/rent-roll/:rrId/renovations', ctrl.updateRenovations);

// Affordability
router.put('/:dealId/rent-roll/:rrId/affordability', ctrl.updateAffordability);

// Finalize
router.post('/:dealId/rent-roll/:rrId/finalize', ctrl.finalizeRentRoll);

// Dashboard
router.get('/:dealId/rent-roll/:rrId/dashboard', ctrl.getDashboard);

// Floor plan summary
router.get('/:dealId/rent-roll/:rrId/floor-plan-summary', ctrl.getFloorPlanSummary);

export default router;
