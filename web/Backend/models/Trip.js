const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripNumber: {
    type: String,
    required: [true, 'Trip number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Driver assignment is required']
  },
  assignedVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
    // Not required — auto-sessions may not have a vehicle assigned
  },
  startLocation: {
    address: {
      type: String,
      trim: true,
      default: 'Unknown Start Location'
    },
    coordinates: {
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 }
    }
  },
  endLocation: {
    address: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  scheduledStartTime: {
    type: Date,
    default: Date.now
  },
  scheduledEndTime: {
    type: Date
    // Not required — auto-sessions have no scheduled end time
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'delayed'],
    default: 'scheduled'
  },
  isAutoSession: {
    type: Boolean,
    default: false
    // true = auto-created when driver goes online
  },
  distance: {
    type: Number,
    min: [0, 'Distance cannot be negative']
  },
  estimatedDuration: {
    type: Number // in minutes
  },
  actualDuration: {
    type: Number // in minutes
  },
  routeHistory: [{
    latitude: Number,
    longitude: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  currentPosition: {
    latitude: Number,
    longitude: Number,
    lastUpdated: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
tripSchema.index({ assignedDriver: 1 });
tripSchema.index({ assignedVehicle: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ scheduledStartTime: 1 });
tripSchema.index({ isAutoSession: 1 });

// Virtual for trip duration calculation
tripSchema.virtual('duration').get(function () {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // in minutes
  }
  return null;
});

module.exports = mongoose.model('Trip', tripSchema);
