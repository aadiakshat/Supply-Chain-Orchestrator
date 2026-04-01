import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
  origin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LocationNode',
    required: true
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LocationNode',
    required: true
  },
  current_node: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LocationNode',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED'],
    default: 'PENDING'
  },
  amount: {
    type: Number,
    required: true
  },
  isTransferOrder: {
    type: Boolean,
    default: false // True if auto-triggered by the rebalancing algorithm
  }
}, {
  timestamps: true
});

const Shipment = mongoose.model('Shipment', shipmentSchema);

export default Shipment;
