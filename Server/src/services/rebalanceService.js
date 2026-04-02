import LocationNode from '../models/LocationNode.js';
import Shipment from '../models/Shipment.js';

// HELPER: Create a transfer shipment, deducting from the donor immediately
const createTransferShipment = async (fromNode, toNode, amount) => {
  fromNode.inventory.current -= amount;
  await fromNode.save();

  const shipment = new Shipment({
    origin: fromNode._id,
    destination: toNode._id,
    current_node: fromNode._id,
    status: 'IN_TRANSIT',
    amount,
    isTransferOrder: true
  });

  return await shipment.save();
};

// CORE FUNCTION
export const checkAndTriggerRebalance = async (nodeId) => {
  console.log(`[Rebalance Engine] Analyzing Node: ${nodeId}`);

  try {
    const node = await LocationNode.findById(nodeId);

    // Only act on nodes that are critically low
    if (!node || node.inventory.current > node.inventory.minThreshold) {
      console.log(`[Rebalance Engine] Node "${node?.name}" is healthy or not found. Skipping.`);
      return;
    }

    console.log(`[Rebalance Engine] 🚨 CRITICAL: "${node.name}" is at ${node.inventory.current} (threshold: ${node.inventory.minThreshold})`);

    // Block new shipment if one is already in flight — wait for it to be delivered first
    const inFlightCount = await Shipment.countDocuments({
      destination: node._id,
      status: { $in: ['IN_TRANSIT', 'PENDING'] }
    });

    if (inFlightCount > 0) {
      console.log(`[Rebalance Engine] "${node.name}" already has ${inFlightCount} shipment(s) in transit. Waiting for delivery before sending more.`);
      return;
    }

    // How much do we need to get to 50% capacity?
    const target = Math.floor(node.inventory.capacity * 0.5);
    const needed = Math.max(target - node.inventory.current, 1);

    console.log(`[Rebalance Engine] Need ${needed} units to bring "${node.name}" to 50% capacity (${target} units).`);

    // Find the nearest node that has enough surplus above its own threshold
    const [longitude, latitude] = node.location.coordinates;

    const candidates = await LocationNode.find({
      _id: { $ne: node._id },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] }
        }
      }
    });

    // Walk nearest → next nearest until we find one that can give
    let donor = null;
    let contribution = 0;

    for (const candidate of candidates) {
      const surplus = candidate.inventory.current - candidate.inventory.minThreshold;
      if (surplus > 0) {
        donor = candidate;
        contribution = Math.min(surplus, needed); // take only what it can spare
        break;
      }
      console.log(`[Rebalance Engine] "${candidate.name}" has no surplus (${candidate.inventory.current} / threshold: ${candidate.inventory.minThreshold}). Trying next nearest...`);
    }

    if (!donor) {
      console.warn(`[Rebalance Engine] ❌ No node in the network has surplus to refill "${node.name}".`);
      return;
    }

    const dist = Math.round(
      Math.sqrt(
        Math.pow(latitude - donor.location.coordinates[1], 2) +
        Math.pow(longitude - donor.location.coordinates[0], 2)
      ) * 111.32
    );

    console.log(`🧠 [Rebalance] Pulling ${contribution} units from "${donor.name}" (~${dist}km away, has ${donor.inventory.current}).`);

    const shipment = await createTransferShipment(donor, node, contribution);
    console.log(`✅ [Rebalance] Transfer order created. ID: ${shipment._id} | ${donor.name} → ${node.name} | ${contribution} units`);

  } catch (error) {
    console.error(`[Rebalance Engine] Error for node ${nodeId}:`, error);
  }
};
