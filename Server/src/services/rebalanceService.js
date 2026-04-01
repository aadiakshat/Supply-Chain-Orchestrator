import LocationNode from '../models/LocationNode.js';
import Shipment from '../models/Shipment.js';

// Helper: Calculate standard Euclidean distance (or wrap the haversine formula here if not importing)
const calcApproxDistance = (lat1, lon1, lat2, lon2) => {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2)) * 111.32; // Approx km
};

// HELPER: Find the best donor
const findBestDonor = async (node, amountRequired) => {
  const [longitude, latitude] = node.location.coordinates;

  const surplusNodes = await LocationNode.find({
    _id: { $ne: node._id },
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [longitude, latitude] }
      }
    }
  });

  let selectedDonatingNode = null;

  for (let potentialDonor of surplusNodes) {
    if ((potentialDonor.inventory.current - amountRequired) > potentialDonor.inventory.minThreshold) {
      selectedDonatingNode = potentialDonor;

      // Hidden Power Move: Intelligent logging
      const dist = calcApproxDistance(latitude, longitude, potentialDonor.location.coordinates[1], potentialDonor.location.coordinates[0]);
      console.log(`🧠 [Rebalance Intelligence] Selected donor ${potentialDonor.name} because distance is approx ${Math.round(dist)}km and stock is ${potentialDonor.inventory.current}`);

      break;
    }
  }
  return selectedDonatingNode;
};

// HELPER: Create Transfer Shipment
const createTransferShipment = async (fromNode, toNode, amount) => {
  fromNode.inventory.current -= amount;
  await fromNode.save();

  const transferShipment = new Shipment({
    origin: fromNode._id,
    destination: toNode._id,
    current_node: fromNode._id,
    status: 'IN_TRANSIT',
    amount: amount,
    isTransferOrder: true
  });

  return await transferShipment.save();
};

// CORE FUNCTION
export const checkAndTriggerRebalance = async (nodeId) => {
  console.log(`[Rebalance Engine] Analyzing Node: ${nodeId}`);

  try {
    const node = await LocationNode.findById(nodeId);

    if (!node || node.inventory.current >= node.inventory.minThreshold) {
      console.log(`[Rebalance Engine] Node healthy. Current: ${node?.inventory.current}, Threshold: ${node?.inventory.minThreshold}`);
      return;
    }

    console.log(`[Rebalance Engine]  BOTTLENECK DETECTED! Node ${node.name}.`);

    const targetInventory = Math.floor(node.inventory.capacity * 0.5);
    let amountRequired = targetInventory - node.inventory.current;
    if (amountRequired <= 0) amountRequired = 50;

    const donor = await findBestDonor(node, amountRequired);

    if (!donor) {
      console.warn(`[Rebalance Engine]  CRITICAL! No regional node has sufficient surplus to refill ${node.name}.`);
      return;
    }

    console.log(`[Rebalance Engine] Solution found. Requesting Transfer Order from ${donor.name} to ${node.name}.`);

    const transferOrder = await createTransferShipment(donor, node, amountRequired);
    console.log(`[Rebalance Engine] Auto-Rebalance Complete! Transfer Order ID: ${transferOrder._id}`);

  } catch (error) {
    console.error(`[Rebalance Engine] Error computing rebalance for node ${nodeId}:`, error);
  }
};
