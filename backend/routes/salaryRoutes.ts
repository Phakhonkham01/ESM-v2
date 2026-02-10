// salaryRoutes.ts
import express from 'express';
import {
  createSalary,
  getAllSalaries,
  getSalaryById,
  updateSalaryStatus,
  updateSalary,
  deleteSalary,
  getSalarySummary,
  getPrefillData,
  getOTSummaryByType, // เพิ่ม
  getAllOTByType // เพิ่ม
} from '../controller/salaryController';

const router = express.Router();

// Existing routes
router.post('/', createSalary);
router.get('/', getAllSalaries);
router.get('/summary', getSalarySummary);
router.get('/prefill/:userId', getPrefillData);
router.get('/:id', getSalaryById);
router.put('/:id/status', updateSalaryStatus);
router.put('/:id', updateSalary);
router.delete('/:id', deleteSalary);

// New routes for OT by type
router.get('/ot-summary/:userId', getOTSummaryByType);
router.get('/ot-by-type/:userId', getAllOTByType);

export default router;