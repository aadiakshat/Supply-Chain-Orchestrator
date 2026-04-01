import LocationNode from '../models/LocationNode.js';

// @desc    Get all nodes
// @route   GET /api/nodes
export const getAllNodes = async (req, res) => {
  try {
    const nodes = await LocationNode.find({}).populate('parent', 'name type');
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get node by ID
// @route   GET /api/nodes/:id
export const getNodeById = async (req, res) => {
  try {
    const node = await LocationNode.findById(req.params.id).populate('parent', 'name type');
    if (node) {
      res.json(node);
    } else {
      res.status(404).json({ message: 'Node not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new node
// @route   POST /api/nodes
export const createNode = async (req, res) => {
  const { name, type, coordinates, capacity, minThreshold, initialInventory, parent } = req.body;

  try {
    const node = new LocationNode({
      name,
      type,
      location: {
        type: 'Point',
        coordinates // [longitude, latitude]
      },
      inventory: {
        current: initialInventory || 0,
        capacity,
        minThreshold
      },
      parent: parent || null
    });

    const createdNode = await node.save();
    res.status(201).json(createdNode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a node
// @route   PUT /api/nodes/:id
export const updateNode = async (req, res) => {
  try {
    const node = await LocationNode.findById(req.params.id);
    if (!node) return res.status(404).json({ message: 'Node not found' });
    
    // Simple update logic
    if(req.body.name) node.name = req.body.name;
    if(req.body.capacity) node.inventory.capacity = req.body.capacity;
    
    const updatedNode = await node.save();
    res.json(updatedNode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a node
// @route   DELETE /api/nodes/:id
export const deleteNode = async (req, res) => {
  try {
    const node = await LocationNode.findById(req.params.id);
    if (!node) return res.status(404).json({ message: 'Node not found' });
    
    await node.deleteOne();
    res.json({ message: 'Node removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
