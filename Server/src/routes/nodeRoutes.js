import express from 'express';
import { getAllNodes, createNode, getNodeById, updateNode, deleteNode } from '../controllers/nodeController.js';

const router = express.Router();

router.route('/').get(getAllNodes).post(createNode);
router.route('/:id').get(getNodeById).put(updateNode).delete(deleteNode);

export default router;
