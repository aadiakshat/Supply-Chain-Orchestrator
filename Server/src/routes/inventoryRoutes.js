import express from 'express';
import { updateInventory, getInventoryByNode } from '../controllers/inventoryController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/update').post(protect, admin, updateInventory);
router.route('/:nodeId').get(protect, getInventoryByNode);

export default router;
