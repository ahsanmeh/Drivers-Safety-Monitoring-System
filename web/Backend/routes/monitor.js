const express = require('express');
console.log('📦 Monitor Route Loading...');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const logToDebug = (message) => {
    console.log(message);
};

const Incident = require('../models/Incident');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Trip = require('../models/Trip');
const { asyncHandler } = require('../utils/errorHandler');
const { protect } = require('../middlewares/auth');

// Helper to generate incident number
const generateIncidentNumber = async () => {
    const count = await Incident.countDocuments();
    return `INC${String(count + 1).padStart(6, '0')}`;
};

// Cache for last incident created per driver to prevent spamming
const lastIncidentTime = new Map();
const INCIDENT_COOLDOWN = 60000; // 1 minute cooldown

// Helper for reverse geocoding
const getAddressFromCoordinates = async (lat, lon) => {
    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
                lat,
                lon,
                format: 'jsonv2',
                zoom: 18,
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'SafeDriverApp/1.0'
            },
            timeout: 5000
        });
        return response.data.display_name;
    } catch (error) {
        logToDebug(`⚠️ Geocoding failed: ${error.message}`);
        return null;
    }
};

// @desc    Receive Mobile Detection Snapshot
// @route   POST /api/monitor/mobile
// @access  Protected (Driver)
router.post('/mobile', protect, asyncHandler(async (req, res) => {
    const { image } = req.body;
    const driverId = req.user._id;

    // The provided snippet had a malformed line `const    if (!image_b64) {`.
    // Assuming the intent was to add a check for `image_b64` if it were used,
    // but the current code uses `image`. The existing `if (!image)` check handles this.
    // I will only add the location logging as per the primary instruction.

    // DEBUG: Check location reception
    if (req.body.location) {
        logToDebug(`📍 Received Location from App: ${JSON.stringify(req.body.location)}`);
    } else {
        logToDebug(`⚠️ No Location received in request body.`);
    }

    logToDebug(`DEBUG: /api/monitor/mobile hit by driver ${req.user.name} (${driverId})`);

    if (!image) {
        logToDebug('DEBUG: No image in request body');
        return res.status(400).json({ success: false, message: 'Image is required' });
    }

    try {
        logToDebug(`DEBUG: Sending image to Python service (size: ${image.length})`);
        // 1. Send to Python Service for detection
        const pythonResponse = await axios.post('http://127.0.0.1:8000/detect-mobile', {
            image: image,
            driverId: driverId.toString()
        }, { timeout: 4000 }); // Slightly longer timeout for combined processing

        logToDebug(`DEBUG: Python Response: ${JSON.stringify(pythonResponse.data)}`);
        const { detected, confidence, drowsiness } = pythonResponse.data;

        // Process Detections
        const detectionsToRecord = [];

        // Check for Mobile
        if (detected) {
            detectionsToRecord.push({
                type: 'phone_usage',
                confidence: confidence,
                message: 'HIGH SEVERITY: Mobile Phone Usage Detected!',
                description: `📱 Mobile phone usage detected by AI monitoring system. Confidence: ${(confidence * 100).toFixed(1)}%.`
            });
        }

        // Check for Drowsiness
        if (drowsiness && drowsiness.is_drowsy) {
            detectionsToRecord.push({
                type: 'drowsiness',
                confidence: 1.0, // EAR logic is binary for alarm
                message: 'CRITICAL: Driver Drowsiness Detected!',
                description: `😴 Drowsiness detected (eyes closed). EAR: ${drowsiness.ear.toFixed(2)}.`
            });
        }

        // Check for Yawning
        if (drowsiness && drowsiness.is_yawning) {
            detectionsToRecord.push({
                type: 'yawning',
                confidence: 1.0,
                message: 'WARNING: Driver Yawning Detected!',
                description: `🥱 Yawning detected. MAR: ${drowsiness.mar.toFixed(2)}.`
            });
        }

        const now = Date.now();
        const results = [];

        for (const det of detectionsToRecord) {
            // Check cooldown per driver AND type
            const cooldownKey = `${driverId}_${det.type}`;
            const lastTime = lastIncidentTime.get(cooldownKey) || 0;

            if (now - lastTime > INCIDENT_COOLDOWN) {
                logToDebug(`🚨 Processing ${det.type} for driver ${req.user.name}`);

                // Find Active Trip or just fallback
                const activeTrip = await Trip.findOne({ driver: driverId, status: 'in_progress' }).populate('vehicle');
                const assignedVehicle = await Vehicle.findOne({ assignedDriver: driverId });
                const vehicleId = activeTrip ? activeTrip.vehicle._id : (assignedVehicle ? assignedVehicle._id : null);

                const incidentNumber = await generateIncidentNumber();
                let address = 'Detected by AI Monitor';
                let coords = { latitude: 0, longitude: 0 };

                if (req.body.location && req.body.location.latitude) {
                    coords = { latitude: req.body.location.latitude, longitude: req.body.location.longitude };
                    // Geocoding only if needed
                    const geoAddress = await getAddressFromCoordinates(coords.latitude, coords.longitude);
                    if (geoAddress) address = geoAddress;
                } else if (activeTrip && activeTrip.currentLocation) {
                    address = activeTrip.currentLocation.address || address;
                    coords = activeTrip.currentLocation.coordinates || coords;
                }

                const incident = await Incident.create({
                    incidentNumber,
                    reportedBy: driverId,
                    driver: driverId,
                    vehicle: vehicleId,
                    trip: activeTrip ? activeTrip._id : null,
                    incidentType: det.type,
                    severity: det.type === 'drowsiness' ? 'critical' : 'high',
                    status: 'reported',
                    location: { address, coordinates: coords },
                    dateTime: new Date(),
                    description: det.description,
                });

                lastIncidentTime.set(cooldownKey, now);
                results.push({ type: det.type, status: 'incident_created' });

                // Push Real-Time Alert to Specific Admin and Driver
                const io = req.app.get('io');
                if (io) {
                    const alertPayload = {
                        incidentId: incident._id,
                        incidentNumber: incidentNumber,
                        type: det.type,
                        driver: { _id: req.user._id, name: req.user.name },
                        vehicle: { licensePlate: (activeTrip?.vehicle?.licensePlate || assignedVehicle?.licensePlate || 'No Vehicle') },
                        message: det.message
                    };

                    // NEW: Alert the driver directly for mobile app feedback
                    io.to(`driver_${req.user._id}`).emit('mobile_alert', alertPayload);
                    logToDebug(`📱 Mobile alert sent to driver: ${req.user.name} (ID: ${req.user._id})`);

                    if (req.user.adminId) {
                        io.to(`admin_${req.user.adminId}`).emit('mobile_alert', alertPayload);
                        logToDebug(`🖥️ Targeted mobile_alert sent to Admin: ${req.user.adminId}`);
                    } else {
                        logToDebug('⚠️ Driver has no adminId, alert not broadcasted to admins.');
                    }
                }
            } else {
                results.push({ type: det.type, status: 'cooldown_active' });
            }
        }

        return res.json({
            success: true,
            results,
            detected: results.some(r => r.status === 'incident_created'),
            drowsiness: drowsiness // Pass back raw data for mobile UI
        });

    } catch (error) {
        logToDebug(`❌ Detection Relay Error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Detection service unavailable' });
    }
}));

module.exports = router;
