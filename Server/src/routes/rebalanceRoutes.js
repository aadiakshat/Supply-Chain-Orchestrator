import express from 'express';
import { checkAndTriggerRebalance } from '../services/rebalanceService.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// @desc    Manually trigger rebalance for a node
// @route   POST /api/rebalance/:nodeId
router.post('/:nodeId', protect, admin, async (req, res) => {
  try {
    await checkAndTriggerRebalance(req.params.nodeId);
    res.json({ message: `Rebalance requested for node ${req.params.nodeId}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
