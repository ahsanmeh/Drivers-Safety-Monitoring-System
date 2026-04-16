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
    ref: 'Vehicle',
    required: [true, 'Vehicle assignment is required']
  },
  startLocation: {
    address: {
      type: String,
      required: [true, 'Start address is required'],
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Start latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Start longitude is required']
      }
    }
  },
  endLocation: {
    address: {
      type: String,
      required: [true, 'End address is required'],
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'End latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'End longitude is required']
      }
    }
  },
  scheduledStartTime: {
    type: Date,
    required: [true, 'Scheduled start time is required']
  },
  scheduledEndTime: {
    type: Date,
    required: [true, 'Scheduled end time is required']
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
  distance: {
    type: Number,
    min: [0, 'Distance cannot be negative']
  },
  estimatedDuration: {
    type: Number, // in minutes
    min: [0, 'Duration cannot be negative']
  },
  actualDuration: {
    type: Number // in minutes
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

// Virtual for trip duration calculation
tripSchema.virtual('duration').get(function () {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // in minutes
  }
  return null;
});

module.exports = mongoose.model('Trip', tripSchema);
