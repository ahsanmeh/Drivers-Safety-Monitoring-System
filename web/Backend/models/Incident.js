const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  incidentNumber: {
    type: String,
    required: [true, 'Incident number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Changed: Allow admin-only incidents
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Changed: Allow admin-only incidents
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: false // Changed: Allow test incidents without vehicle
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  incidentType: {
    type: String,
    required: [true, 'Incident type is required'],
    enum: [
      'smoke_detection',
      'phone_usage',
      'drowsiness',
      'yawning',
      'head_nodding',
      'overspeeding',
      'harsh_brake'
    ]
  },
  severity: {
    type: String,
    required: [true, 'Severity is required'],
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['reported', 'investigating', 'resolved', 'closed'],
    default: 'reported'
  },
  hiddenFromDriver: {
    type: Boolean,
    default: false
  },
  location: {
    address: {
      type: String,
      required: [true, 'Incident location is required'],
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required']
      }
    }
  },
  dateTime: {
    type: Date,
    required: [true, 'Incident date and time is required'],
    default: Date.now
  },
  description: {
    type: String,
    required: [true, 'Incident description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  witnessDetails: [{
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    statement: {
      type: String,
      trim: true
    }
  }],
  damageDetails: {
    vehicleDamage: {
      type: String,
      trim: true,
      maxlength: [500, 'Vehicle damage description cannot be more than 500 characters']
    },
    cargoDamage: {
      type: String,
      trim: true,
      maxlength: [500, 'Cargo damage description cannot be more than 500 characters']
    },
    estimatedCost: {
      type: Number,
      min: [0, 'Cost cannot be negative']
    }
  },
  policeReport: {
    reportNumber: {
      type: String,
      trim: true
    },
    officerName: {
      type: String,
      trim: true
    },
    station: {
      type: String,
      trim: true
    }
  },
  insurance: {
    claimNumber: {
      type: String,
      trim: true
    },
    adjusterName: {
      type: String,
      trim: true
    },
    adjusterPhone: {
      type: String,
      trim: true
    }
  },
  resolution: {
    type: String,
    trim: true,
    maxlength: [1000, 'Resolution cannot be more than 1000 characters']
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  questions: [{
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      maxlength: [500, 'Question cannot be more than 500 characters']
    },
    answer: {
      type: String,
      trim: true,
      maxlength: [1000, 'Answer cannot be more than 1000 characters']
    },
    answeredAt: {
      type: Date
    },
    isRequired: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
incidentSchema.index({ reportedBy: 1 });
incidentSchema.index({ driver: 1 });
incidentSchema.index({ vehicle: 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ incidentType: 1 });
incidentSchema.index({ dateTime: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
