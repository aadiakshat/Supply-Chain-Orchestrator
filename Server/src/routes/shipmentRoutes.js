import express from 'express';
import { getAllShipments, getShipmentById, createShipment, updateShipmentStatus } from '../controllers/shipmentController.js';

const router = express.Router();

router.route('/').get(getAllShipments).post(createShipment);
router.route('/:id').get(getShipmentById);
router.route('/:id/status').put(updateShipmentStatus);

export default router;
