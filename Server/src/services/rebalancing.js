import LocationNode from '../models/LocationNode.js';
import Shipment from '../models/Shipment.js';

/**
 * Checks if a given node requires an inventory rebalancing.
 * If it does, automatically finds the nearest Node with surplus inventory
 * and generates a "Transfer Order" to redistribute stock.
 */
export const checkAndTriggerRebalance = async (nodeId) => {
  console.log(`[Rebalance Engine] Analyzing Node: ${nodeId}`);

  try {
    const node = await LocationNode.findById(nodeId);
    
    // 1. Check if Node actually needs rebalancing
    if (!node || node.inventory.current >= node.inventory.minThreshold) {
      console.log(`[Rebalance Engine] Node is healthy. Current: ${node?.inventory.current}, Threshold: ${node?.inventory.minThreshold}`);
      return; 
    }

    console.log(`[Rebalance Engine] BOTTLENECK DETECTED! Node ${node.name} dropped below minThreshold.`);
    
    // Calculate how much we need to get back to a safe level.
    // Let's target 50% capacity as the safe "restocked" level. 
    // Usually, the amount required = (Target StockLevel) - (Current StockLevel)
    const targetInventory = Math.floor(node.inventory.capacity * 0.5);
    let amountRequired = targetInventory - node.inventory.current;
    
    // Safety check just in case.
    if (amountRequired <= 0) amountRequired = 50; 

    // 2. We need to find the nearest surplus node using MongoDB Geospatial indexing ($near).
    // We want a node that has enough stock to give away without going under ITS OWN minThreshold.
    const [longitude, latitude] = node.location.coordinates;

    const surplusNodes = await LocationNode.find({
      _id: { $ne: node._id }, // Don't match the same node
      location: {
        $near: {
          $geometry: {
             type: "Point" ,
             coordinates: [longitude, latitude]
          },
          // $maxDistance: 1000000 // Can specify a max distance in meters (optional limit to 1000km)
        }
      }
    });

    // 3. Loop through nearest nodes and find the closest one that can fulfill the request
    let selectedDonatingNode = null;
    
    for (let potentialDonor of surplusNodes) {
      // Condition: the donor must be able to give "amountRequired" and still be above their own minThreshold
      if ((potentialDonor.inventory.current - amountRequired) > potentialDonor.inventory.minThreshold) {
         selectedDonatingNode = potentialDonor;
         break; // We found the closest one! (since they are sorted by distance implicitly by $near)
      }
    }

    if (!selectedDonatingNode) {
      console.warn(`[Rebalance Engine] ⚠️ CRITICAL! No regional node has sufficient surplus to refill ${node.name}. Triggering alert.`);
      return; // Could send email/slack notification here
    }

    console.log(`[Rebalance Engine] Solution found. Generating Transfer Order from ${selectedDonatingNode.name} to ${node.name}.`);

    // 4. Generate the Transfer Order (Internal Shipment)
    // Deduct from donor
    selectedDonatingNode.inventory.current -= amountRequired;
    await selectedDonatingNode.save();

    const transferShipment = new Shipment({
      origin: selectedDonatingNode._id,
      destination: node._id,
      current_node: selectedDonatingNode._id,
      status: 'PENDING', // Leaves PENDING so a worker can dispatch it, or we could set to IN_TRANSIT
      amount: amountRequired,
      isTransferOrder: true
    });

    await transferShipment.save();
    console.log(`[Rebalance Engine] ✅ Transfer Order Created! Shipment ID: ${transferShipment._id}`);

  } catch (error) {
    console.error(`[Rebalance Engine] Error computing rebalance for node ${nodeId}:`, error);
  }
};
