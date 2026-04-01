import express from 'express';
import { getAllNodes, createNode, getNodeById, updateNode, deleteNode } from '../controllers/nodeController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getAllNodes).post(protect, admin, createNode);
router.route('/:id').get(protect, getNodeById).put(protect, admin, updateNode).delete(protect, admin, deleteNode);

export default router;
