import LocationNode from '../models/LocationNode.js';
import { checkAndTriggerRebalance } from '../services/rebalanceService.js';

// @desc    Update inventory logic for a specific node and trigger rebalance check
// @route   POST /api/inventory/update
export const updateInventory = async (req, res) => {
  const { nodeId, amount } = req.body; 

  try {
    const node = await LocationNode.findById(nodeId);

    if (node) {
      node.inventory.current += amount;
      
      // Ensure inventory doesn't exceed capacity or go below 0
      if (node.inventory.current > node.inventory.capacity) {
        node.inventory.current = node.inventory.capacity;
      }
      if (node.inventory.current < 0) {
        node.inventory.current = 0;
      }

      await node.save();
      
      // 🔥 The powerful automation hook requested by the user:
      console.log(`[Inventory] node ${node.name} updated. New amount: ${node.inventory.current}. Triggering checkAndTriggerRebalance...`);
      checkAndTriggerRebalance(node._id).catch(err => console.error("Rebalancing error:", err));

      res.json(node);
    } else {
      res.status(404).json({ message: 'Node not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get inventory by passing Node ID
// @route   GET /api/inventory/:nodeId
export const getInventoryByNode = async (req, res) => {
  try {
    const node = await LocationNode.findById(req.params.nodeId);
    if (!node) return res.status(404).json({ message: 'Node not found' });

    res.json(node.inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
