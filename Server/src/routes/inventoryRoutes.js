import express from 'express';
import { updateInventory, getInventoryByNode } from '../controllers/inventoryController.js';

const router = express.Router();

router.route('/update').post(updateInventory);
router.route('/:nodeId').get(getInventoryByNode);

export default router;
