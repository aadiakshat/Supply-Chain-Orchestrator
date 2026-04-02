import Shipment from '../models/Shipment.js';
import LocationNode from '../models/LocationNode.js';
import { checkAndTriggerRebalance } from '../services/rebalanceService.js';

// @desc    Get all shipments
// @route   GET /api/shipments
export const getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find({})
      .populate('origin', 'name location')
      .populate('destination', 'name location')
      .populate('current_node', 'name location');
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get shipment by ID
// @route   GET /api/shipments/:id
export const getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('origin')
      .populate('destination')
      .populate('current_node');
    if (shipment) res.json(shipment);
    else res.status(404).json({ message: 'Shipment not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new shipment
// @route   POST /api/shipments
export const createShipment = async (req, res) => {
  const { originId, destinationId, amount } = req.body;

  try {
    const origin = await LocationNode.findById(originId);
    const destination = await LocationNode.findById(destinationId);

    if (!origin || !destination) return res.status(404).json({ message: 'Origin or Destination not found' });

    if (origin.inventory.current < amount) return res.status(400).json({ message: 'Not enough inventory at origin' });

    // Deduct inventory from origin right when dispatched
    origin.inventory.current -= amount;
    await origin.save();

    const shipment = new Shipment({
      origin: originId,
      destination: destinationId,
      current_node: originId,
      amount,
      status: 'PENDING',
      isTransferOrder: false
    });

    const createdShipment = await shipment.save();

    res.status(201).json(createdShipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update Shipment Status
// @route   PUT /api/shipments/:id/status
export const updateShipmentStatus = async (req, res) => {
  const { status, current_node_id } = req.body;

  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    const previousStatus = shipment.status;
    shipment.status = status;
    if (current_node_id) shipment.current_node = current_node_id;

    // 🔥 This is the core logic requested: if DELIVERED -> increase inventory + rebalance check
    if (status === 'DELIVERED' && previousStatus !== 'DELIVERED') {
       const destination = await LocationNode.findById(shipment.destination);
       if (destination) {
         destination.inventory.current += shipment.amount;
         
         // Cap at capacity
         if(destination.inventory.current > destination.inventory.capacity) {
             destination.inventory.current = destination.inventory.capacity;
         }
         await destination.save();
         
         console.log(`📦 [Shipment Delivered]: Destination ${destination.name} received +${shipment.amount}. Triggering Rebalance engine...`);
         
         // Trigger Rebalance for destination immediately
         checkAndTriggerRebalance(destination._id).catch(err => console.error("Rebalancing err:", err));
       }
    }

    await shipment.save();
    res.json(shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
