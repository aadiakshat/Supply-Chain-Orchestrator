import express from 'express';
import { getAllShipments, getShipmentById, createShipment, updateShipmentStatus } from '../controllers/shipmentController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getAllShipments).post(protect, admin, createShipment);
router.route('/:id').get(protect, getShipmentById);
router.route('/:id/status').put(protect, admin, updateShipmentStatus);

export default router;
