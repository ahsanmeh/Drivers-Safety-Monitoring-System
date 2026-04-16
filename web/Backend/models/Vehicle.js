const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true,
    maxlength: [50, 'Make cannot be more than 50 characters']
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true,
    maxlength: [50, 'Model cannot be more than 50 characters']
  },
  year: {
    type: Number,
    required: [true, 'Vehicle year is required'],
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'License plate cannot be more than 20 characters']
  },
  vin: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true,
    uppercase: true,
    maxlength: [17, 'VIN must be exactly 17 characters']
  },
  color: {
    type: String,
    trim: true,
    maxlength: [30, 'Color cannot be more than 30 characters']
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for backward compatibility, enforced in controller
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'retired'],
    default: 'active'
  },
  mileage: {
    type: Number,
    default: 0,
    min: [0, 'Mileage cannot be negative']
  },
  lastServiceDate: {
    type: Date
  },
  nextServiceDate: {
    type: Date
  },
  insuranceExpiry: {
    type: Date
  },
  registrationExpiry: {
    type: Date
  },
  sensorMacAddress: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true, // Allows multiple null values if not all vehicles have sensors
    maxlength: [17, 'MAC address must be in format AA:BB:CC:DD:EE:FF']
  }
}, {
  timestamps: true
});

// Index for better query performance
vehicleSchema.index({ assignedDriver: 1 });
vehicleSchema.index({ status: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
