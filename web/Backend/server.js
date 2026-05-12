require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./utils/database');
const { errorHandler } = require('./utils/errorHandler');
const Trip = require('./models/Trip');
const User = require('./models/User');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e7, // 10MB
  cors: {
    origin: "*", // Allow all origins for now (App + Web)
    methods: ["GET", "POST"]
  }
});

// Make io accessible in routes
app.set('io', io);

// Track online drivers
const onlineDrivers = new Set();
app.set('onlineDrivers', onlineDrivers);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_vehicle', (vehicleId) => {
    socket.join(`vehicle_${vehicleId}`);
    console.log(`Socket ${socket.id} joined vehicle_${vehicleId}`);
  });

  socket.on('disconnecting', () => {
    const rooms = socket.rooms;
    rooms.forEach((room) => {
      if (room.startsWith('stream_view_')) {
        const driverId = room.split('stream_view_')[1];
        // Check if this is the last person (size will be 1, which is this socket)
        const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
        if (roomSize <= 1) {
          console.log(`🛑 Admin disconnected, no viewers left for driver ${driverId}`);
          io.to(`driver_${driverId}`).emit('stop_stream_request');
        }
      }
    });
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);

    if (socket.driverId) {
      console.log(`📱 Driver ${socket.driverId} disconnected`);
      onlineDrivers.delete(socket.driverId);
      io.emit('online_drivers_update', Array.from(onlineDrivers));

      // Auto-end the driver's active session trip
      try {
        const activeSession = await Trip.findOne({
          assignedDriver: socket.driverId,
          status: 'in_progress',
          isAutoSession: true
        });

        if (activeSession) {
          const endTime = new Date();
          const durationMinutes = Math.round(
            (endTime - activeSession.actualStartTime) / (1000 * 60)
          );

          // Get last known location from User model
          const driver = await User.findById(socket.driverId);
          const lastLoc = driver?.lastLocation;

          await Trip.findByIdAndUpdate(activeSession._id, {
            status: 'completed',
            actualEndTime: endTime,
            actualDuration: durationMinutes,
            ...(lastLoc && {
              endLocation: {
                address: `${lastLoc.latitude?.toFixed(4)}, ${lastLoc.longitude?.toFixed(4)}`,
                coordinates: { latitude: lastLoc.latitude, longitude: lastLoc.longitude }
              }
            })
          });

          console.log(`✅ Auto-session ${activeSession.tripNumber} completed for driver ${socket.driverId}`);

          // Notify web dashboard session ended
          io.emit('session_ended', {
            tripId: activeSession._id,
            tripNumber: activeSession.tripNumber,
            driverId: socket.driverId,
            duration: durationMinutes
          });
        }
      } catch (err) {
        console.error('Error ending auto-session:', err.message);
      }
    }

    if (socket.adminId) {
      console.log(`🖥️ Admin ${socket.adminId} disconnected`);
    }
  });

  // Targeted Alert Rooms
  socket.on('register_admin', (adminId) => {
    console.log(`🖥️ Admin ${adminId} registered for targeted alerts`);
    socket.join(`admin_${adminId}`);
    socket.adminId = adminId;
  });

  // Live Streaming Events
  // Live Streaming Events
  socket.on('register_driver', (driverId) => {
    console.log(`📱 Driver ${driverId} registered for streaming commands`);
    socket.join(`driver_${driverId}`);

    // Add to online set
    onlineDrivers.add(driverId);
    socket.driverId = driverId; // Tag socket for disconnect handling

    // Broadcast updated list
    io.emit('online_drivers_update', Array.from(onlineDrivers));
  });

  socket.on('get_online_drivers', () => {
    socket.emit('online_drivers_update', Array.from(onlineDrivers));
  });

  socket.on('start_stream', (driverId) => {
    console.log(`🎥 Driver ${driverId} started streaming`);
    socket.join(`stream_${driverId}`);
  });

  socket.on('stream_data', ({ driverId, image }) => {
    // Broadcast to admins watching this driver
    if (image && image.length > 0) {
      // console.log(`📡 Relaying frame for driver ${driverId}, size: ${Math.round(image.length / 1024)} KB`);
      io.to(`stream_view_${driverId}`).emit('stream_frame', { driverId, image });
    }
  });

  socket.on('join_stream_view', (driverId) => {
    console.log(`👀 Admin joined stream view for driver ${driverId}`);
    socket.join(`stream_view_${driverId}`);

    // Request driver to start streaming
    console.log(`🚀 Requesting driver ${driverId} to start stream`);
    io.to(`driver_${driverId}`).emit('request_stream');
  });

  socket.on('leave_stream_view', (driverId) => {
    console.log(`👋 Admin left stream view for driver ${driverId}`);
    socket.leave(`stream_view_${driverId}`);

    // Check if anyone is still watching
    const room = io.sockets.adapter.rooms.get(`stream_view_${driverId}`);
    if (!room || room.size === 0) {
      console.log(`🛑 No viewers left for driver ${driverId}, requesting stop`);
      io.to(`driver_${driverId}`).emit('stop_stream_request');
    }
  });

  socket.on('stop_stream', (driverId) => {
    console.log(`🛑 Driver ${driverId} stopped streaming`);
    socket.leave(`stream_${driverId}`);
    io.to(`stream_view_${driverId}`).emit('stream_ended', { driverId });
  });

  // GPS Tracking Events
  socket.on('join_trip_tracking', (tripId) => {
    console.log(`🗺️ Admin joined tracking for trip ${tripId}`);
    socket.join(`trip_tracking_${tripId}`);
  });

  socket.on('leave_trip_tracking', (tripId) => {
    console.log(`🗺️ Admin left tracking for trip ${tripId}`);
    socket.leave(`trip_tracking_${tripId}`);
  });

  socket.on('location_update', (data) => {
    const { driverId, tripId, latitude, longitude } = data;
    // console.log(`📍 Location update from driver ${driverId}: ${latitude}, ${longitude}`);

    // Relay to any admin watching this specific trip
    if (tripId) {
      io.to(`trip_tracking_${tripId}`).emit('trip_location_updated', {
        driverId,
        tripId,
        latitude,
        longitude,
        timestamp: new Date()
      });
    }

    // Relay to admins watching the general fleet map
    io.emit('driver_location_updated', {
      driverId,
      latitude,
      longitude,
      timestamp: new Date()
    });
  });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/sensors', require('./routes/sensors'));
app.use('/api/monitor', require('./routes/monitor'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to MERN Dashboard Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      vehicles: '/api/vehicles',
      trips: '/api/trips',
      incidents: '/api/incidents',
      reports: '/api/reports',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const { spawn } = require('child_process');

// Start Python Face Recognition Service
// const pythonProcess = spawn('python', ['face_server.py']);

// pythonProcess.stdout.on('data', (data) => {
//   console.log(`🐍 Python Service: ${data}`);
// });

// pythonProcess.stderr.on('data', (data) => {
//   console.error(`🐍 Python Error: ${data}`);
// });

// pythonProcess.on('close', (code) => {
//   console.log(`🐍 Python process exited with code ${code}`);
// });

// // Handle process termination to kill Python process
// process.on('SIGINT', () => {
//   console.log('🛑 Stopping Python Service...');
//   // pythonProcess.kill();
//   process.exit();
// });

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} - Alerts Dismissal Added 🔔`);
  console.log(`📊 Dashboard API available at http://localhost:${PORT}`);
  console.log(`🔍 Health check at http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});

module.exports = app;

// Restart trigger for sensitivity tuning 🚀 (Fixed V6 - Mobile-Only Filter)

