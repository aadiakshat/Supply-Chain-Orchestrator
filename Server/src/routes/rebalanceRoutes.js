import express from 'express';
import { checkAndTriggerRebalance, runGlobalRebalance } from '../services/rebalanceService.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// @desc    Run global rebalance across the entire network
// @route   POST /api/rebalance
router.post('/', protect, admin, async (req, res) => {
  try {
    const logs = await runGlobalRebalance();
    res.json({ message: 'Global rebalance complete', logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Manually trigger rebalance for a single node (legacy / auto-trigger)
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
