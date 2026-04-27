const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'driver'],
    default: 'driver'
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
    // Note: Optional for backward compatibility with existing drivers
    // New registrations will require this via controller validation
  },
  driverId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [15, 'Phone number cannot be more than 15 characters']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot be more than 200 characters']
  },
  licenseNumber: {
    type: String,
    trim: true,
    maxlength: [20, 'License number cannot be more than 20 characters']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: 'prefer_not_to_say'
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalDrivingSeconds: {
    type: Number,
    default: 0
  },
  safeTripCount: {
    type: Number,
    default: 0
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department cannot be more than 100 characters']
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  settings: {
    notifications: {
      pushNotifications: {
        type: Boolean,
        default: true
      },
      emailAlerts: {
        type: Boolean,
        default: true
      },
      smsAlerts: {
        type: Boolean,
        default: false
      }
    },
    system: {
      faceDetectionSensitivity: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
      },
      phoneDetectionSensitivity: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'High'
      },
      smokeDetectionSensitivity: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
      },
      speedThreshold: {
        type: Number,
        default: 70,
        min: [0, 'Speed threshold must be positive']
      },
      alertDelay: {
        type: Number,
        default: 3,
        min: [0, 'Alert delay must be positive']
      },
      dataRetentionDays: {
        type: Number,
        default: 90,
        min: [1, 'Data retention must be at least 1 day']
      },
      videoQuality: {
        type: String,
        enum: ['Low (720p)', 'Medium (1080p)', 'High (1080p)'],
        default: 'High (1080p)'
      },
      autoIncidentReporting: {
        type: Boolean,
        default: false
      }
    },
    notificationAlerts: {
      realTimeAlerts: {
        type: Boolean,
        default: true
      },
      incidentNotifications: {
        type: Boolean,
        default: true
      },
      maintenanceReminders: {
        type: Boolean,
        default: false
      },
      reportGeneration: {
        type: Boolean,
        default: true
      },
      systemUpdates: {
        type: Boolean,
        default: false
      },
      emergencyAlerts: {
        type: Boolean,
        default: true
      }
    },
    notificationChannels: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    security: {
      twoFactorEnabled: {
        type: Boolean,
        default: false
      },
      sessionTimeoutMinutes: {
        type: Number,
        default: 30,
        min: [1, 'Session timeout must be at least 1 minute']
      },
      maxLoginAttempts: {
        type: Number,
        default: 5,
        min: [1, 'Max login attempts must be at least 1']
      },
      passwordExpiryDays: {
        type: Number,
        default: 90,
        min: [1, 'Password expiry must be at least 1 day']
      },
      accountLockDurationMinutes: {
        type: Number,
        default: 15,
        min: [1, 'Account lock duration must be at least 1 minute']
      }
    }
  },
  lastLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Hash password before saving and assign driverId for drivers
userSchema.pre('save', async function (next) {
  // Auto-generate driverId for driver role on first save
  if (this.isNew && this.role === 'driver' && !this.driverId) {
    const suffix = this._id.toString().slice(-6).toUpperCase();
    this.driverId = `DRV-${suffix}`;
  }

  // Set passwordChangedAt for new users if not set
  if (this.isNew && !this.passwordChangedAt) {
    this.passwordChangedAt = Date.now();
  }

  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // Update passwordChangedAt when password is changed
  if (!this.isNew) {
    this.passwordChangedAt = Date.now();
  }

  next();
});

// Check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

// Increment login attempts and lock if needed
userSchema.methods.incLoginAttempts = async function () {
  // If previous lock has expired, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.resetLoginAttempts();
  }

  const maxAttempts = this.settings?.security?.maxLoginAttempts || 5;
  const lockDurationMinutes = this.settings?.security?.accountLockDurationMinutes || 15;
  const lockTime = lockDurationMinutes * 60 * 1000; // Convert minutes to milliseconds

  this.loginAttempts += 1;

  // Lock account if max attempts reached
  if (this.loginAttempts >= maxAttempts && !this.isLocked()) {
    this.lockUntil = Date.now() + lockTime;
  }

  await this.save();
};

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
