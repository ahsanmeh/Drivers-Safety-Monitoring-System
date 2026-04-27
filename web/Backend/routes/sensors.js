const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Trip = require('../models/Trip');
const { asyncHandler } = require('../utils/errorHandler');

// Helper to generate incident number (with random suffix to prevent duplicates)
const generateIncidentNumber = async () => {
    const count = await Incident.countDocuments();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `INC${String(count + 1).padStart(6, '0')}-${randomSuffix}`;
};

// @desc    Receive Smoke Sensor Data
// @route   POST /api/sensors/smoke
// @access  Public (ESP32)
router.post('/smoke', asyncHandler(async (req, res) => {
    const { sensorMac, value, location } = req.body;

    console.log(`🔥 Smoke Alert Received! MAC: ${sensorMac}, Value: ${value}`);

    // 1. Find all vehicles with this MAC (handle duplicate MAC hardware assignment)
    const vehicles = await Vehicle.find({ sensorMacAddress: sensorMac.toUpperCase() })
        .populate('assignedDriver');

    if (!vehicles || vehicles.length === 0) {
        console.log('❌ No vehicle found for this sensor MAC');
        return res.status(404).json({
            success: false,
            message: 'Sensor not registered. Please add this MAC to a vehicle in the admin panel.',
            sensorMac: sensorMac
        });
    }

    const onlineDrivers = req.app.get('onlineDrivers');
    let vehicle = vehicles[0];
    let targetDriver = null;
    let alertTier = 'none';
    let activeTrip = null;

    console.log(`🔍 Searching ${vehicles.length} vehicle(s) for online driver...`);

    // 2. Multi-Tier Driver Detection across all matching vehicles
    // TIER 0: Check specifically for an ONLINE driver (Socket Connected)
    if (onlineDrivers) {
        const onlineVehicle = vehicles.find(v =>
            v.assignedDriver && onlineDrivers.has(v.assignedDriver._id.toString())
        );
        if (onlineVehicle) {
            vehicle = onlineVehicle;
            targetDriver = onlineVehicle.assignedDriver;
            alertTier = 'online_driver';
            console.log(`✅ TIER 0: Found ONLINE connected driver - ${targetDriver.name} on ${vehicle.licensePlate}`);
        }
    }

    // TIER 1: Check for Active Trip if TIER 0 (online) didn't find a direct match
    if (!targetDriver) {
        for (const v of vehicles) {
            const trip = await Trip.findOne({
                vehicle: v._id,
                status: 'in_progress'
            }).populate('driver');

            if (trip && trip.driver) {
                vehicle = v;
                activeTrip = trip;
                targetDriver = trip.driver;
                alertTier = 'active_trip';
                console.log(`✅ TIER 1: Found active trip for driver ${targetDriver.name} on ${vehicle.licensePlate}`);
                break;
            }
        }
    }

    // TIER 2: Fallback to Assigned Driver if no online driver or active trip found
    if (!targetDriver) {
        const withAssigned = vehicles.find(v => v.assignedDriver);
        if (withAssigned) {
            vehicle = withAssigned;
            targetDriver = withAssigned.assignedDriver;
            alertTier = 'assigned_driver';
            console.log(`⚠️ TIER 2: No active/online driver - Using ASSIGNED DRIVER ${targetDriver.name} on ${vehicle.licensePlate}`);
        } else {
            // TIER 3: No driver found anywhere
            alertTier = 'admin_only';
            console.log(`⚠️ TIER 3: No driver found for any matching vehicle - ADMIN ONLY alert`);
        }
    }

    // 3. Create Incident
    const incidentNumber = await generateIncidentNumber();

    const incidentLocation = location || {
        address: 'Detected by Onboard Sensor',
        coordinates: { latitude: 0, longitude: 0 }
    };

    const incidentData = {
        incidentNumber,
        reportedBy: targetDriver?._id || vehicle.assignedDriver, // Use fallback
        driver: targetDriver?._id,
        vehicle: vehicle._id,
        trip: activeTrip?._id,
        incidentType: 'smoke_detection',
        severity: 'critical',
        status: 'reported',
        location: incidentLocation,
        dateTime: new Date(),
        description: `🔥 Smoke detected by sensor (MAC: ${sensorMac}). Value: ${value}. Alert Tier: ${alertTier}.`,
        damageDetails: {
            vehicleDamage: 'Potential fire damage due to smoke detection',
            estimatedCost: 0
        }
    };

    // Handle edge case: no driver exists at all
    if (!targetDriver && !vehicle.assignedDriver) {
        delete incidentData.reportedBy;
        delete incidentData.driver;
    }

    const incident = await Incident.create(incidentData);
    console.log(`✅ Incident Created: ${incidentNumber} (Tier: ${alertTier})`);

    // 4. Trigger Real-Time Notifications
    const io = req.app.get('io');
    if (io) {
        const alertData = {
            incidentId: incident._id,
            incidentNumber: incidentNumber,
            vehicle: {
                _id: vehicle._id,
                licensePlate: vehicle.licensePlate,
                make: vehicle.make,
                model: vehicle.model
            },
            driver: targetDriver ? {
                _id: targetDriver._id,
                name: targetDriver.name,
                email: targetDriver.email
            } : null,
            value: value,
            location: incidentLocation,
            alertTier: alertTier,
            message: 'CRITICAL: Smoke Detected!'
        };

        // Alert specific driver (Mobile App) if found
        if (targetDriver) {
            io.to(`driver_${targetDriver._id}`).emit('smoke_alert', {
                ...alertData,
                title: '🔥 SMOKE DETECTED!',
                body: 'Stop the vehicle immediately and check for fire.',
                severity: 'critical'
            });
            console.log(`📱 Mobile alert sent to driver: ${targetDriver.name} (Room: driver_${targetDriver._id})`);
        }

        // Target the specific Admin (Web Dashboard)
        if (vehicle.adminId) {
            io.to(`admin_${vehicle.adminId}`).emit('smoke_alert', alertData);
            console.log(`🖥️ Targeted smoke alert sent to Admin: ${vehicle.adminId}`);
        } else {
            console.log('⚠️ No specific adminId found for vehicle, alert not broadcasted.');
        }
    }

    res.status(201).json({
        success: true,
        message: 'Smoke alert processed successfully',
        incidentId: incident._id,
        incidentNumber: incidentNumber,
        alertTier: alertTier,
        driver: targetDriver?.name || 'None assigned'
    });
}));

module.exports = router;
