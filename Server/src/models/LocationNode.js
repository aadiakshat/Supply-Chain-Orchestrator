import mongoose from 'mongoose';

const locationNodeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['FACTORY', 'REGIONAL_WAREHOUSE', 'LOCAL_RETAILER'],
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    }
  },
  inventory: {
    current: {
      type: Number,
      required: true,
      default: 0
    },
    capacity: {
      type: Number,
      required: true,
    },
    minThreshold: {
      type: Number,
      required: true,
    }
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LocationNode',
    default: null
  }
}, {
  timestamps: true
});

// Create a geospatial index for queries
locationNodeSchema.index({ location: '2dsphere' });

const LocationNode = mongoose.model('LocationNode', locationNodeSchema);

export default LocationNode;
