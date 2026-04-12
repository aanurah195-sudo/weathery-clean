import express from 'express';
import { getAlerts, getAllAlerts, createAlert, dismissAlert } from '../controllers/alertController.js';

const router = express.Router();

router.get('/', getAlerts);
router.get('/all', getAllAlerts);
router.post('/', createAlert);
router.patch('/:id/dismiss', dismissAlert);

export default router;