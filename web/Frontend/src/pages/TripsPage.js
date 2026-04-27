import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import {
  FiMapPin, FiClock, FiUser, FiTruck, FiCheckCircle,
  FiActivity, FiCalendar, FiNavigation, FiList
} from 'react-icons/fi';
import { tripAPI, userAPI } from '../services/api';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom driver icon
const createDriverIcon = (isOnline) => L.divIcon({
  className: '',
  html: `<div style="
    background: ${isOnline ? '#10b981' : '#6b7280'};
    border: 3px solid white;
    border-radius: 50%;
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    font-size: 18px;
  ">🚗</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const BACKEND_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : `http://${window.location.hostname}:5000`;

const navigationItems = [
  { name: 'Trips', icon: FiClock, path: '/dashboard/trips' },
  { name: 'Incidents', icon: FiActivity, path: '/dashboard/incidents' },
  { name: 'Vehicles', icon: FiTruck, path: '/dashboard/vehicles' },
  { name: 'Users', icon: FiUser, path: '/dashboard/users' },
  { name: 'Reports', icon: FiList, path: '/dashboard/reports' },
  { name: 'Live Monitor', icon: FiNavigation, path: '/dashboard/live' },
  { name: 'Profile', icon: FiUser, path: '/dashboard/profile' }
];

const TripsPage = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'history'
  const [driverLocations, setDriverLocations] = useState({}); // { driverId: { lat, lng, name, tripId } }
  const [onlineDriverIds, setOnlineDriverIds] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const socketRef = useRef(null);
  const mapRef = useRef(null);

  // Load user profile
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Load all drivers for the sidebar
  useEffect(() => {
    userAPI.getAllDrivers().then(response => {
      setAllDrivers(response?.data || []);
    }).catch(() => {});
  }, []);

  // Load session history
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await tripAPI.getAllTrips({ limit: 50, sort: '-createdAt' });
      setSessionHistory(response?.data || []);
    } catch (e) {}
    setLoadingHistory(false);
  };


  useEffect(() => {
    fetchHistory();
  }, []);

  // Socket.io — real-time location + online status
  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('get_online_drivers');
    });

    // Receive updated online drivers list
    socket.on('online_drivers_update', (ids) => {
      setOnlineDriverIds(ids);
    });

    // Receive live location updates from any driver
    socket.on('driver_location_updated', ({ driverId, driverName, tripId, latitude, longitude }) => {
      setDriverLocations(prev => ({
        ...prev,
        [driverId]: { lat: latitude, lng: longitude, name: driverName, tripId }
      }));
    });

    // New auto-session started — refresh history
    socket.on('session_started', () => {
      fetchHistory();
    });

    // Session ended — refresh history
    socket.on('session_ended', () => {
      fetchHistory();
    });

    return () => socket.disconnect();
  }, []);

  // When a driver is selected, pan the map to their location
  useEffect(() => {
    if (selectedDriverId && driverLocations[selectedDriverId] && mapRef.current) {
      const { lat, lng } = driverLocations[selectedDriverId];
      mapRef.current.setView([lat, lng], 15);
    }
  }, [selectedDriverId, driverLocations]);

  const formatDuration = (minutes) => {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatTime = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // All driver markers currently on the map (only those who sent location)
  const driversOnMap = Object.entries(driverLocations);

  // Default map center (Islamabad, Pakistan — adjust to your region)
  const mapCenter = driversOnMap.length > 0
    ? [driversOnMap[0][1].lat, driversOnMap[0][1].lng]
    : [33.6844, 73.0479];

  if (!user) return <div>Loading...</div>;

  return (
    <DashboardLayout user={user} activePage="Trips" navigationItems={navigationItems}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Driver Sessions</h1>
          <p className="text-gray-500">Live locations update automatically when drivers are active</p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Online Now', value: onlineDriverIds.length, icon: FiActivity, color: 'bg-green-500' },
            { label: 'On Map', value: driversOnMap.length, icon: FiMapPin, color: 'bg-blue-500' },
            { label: 'Total Sessions', value: sessionHistory.length, icon: FiList, color: 'bg-purple-500' },
            { label: 'Completed Today', value: sessionHistory.filter(t => t.status === 'completed' && new Date(t.createdAt) > new Date(new Date().setHours(0,0,0,0))).length, icon: FiCheckCircle, color: 'bg-indigo-500' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white rounded-xl p-4 shadow flex items-center space-x-3">
              <div className={`${stat.color} text-white p-2 rounded-lg`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-4">
          <button onClick={() => setActiveTab('live')}
            className={`px-5 py-2 rounded-lg font-medium transition-all ${activeTab === 'live' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            🗺️ Live Fleet Map
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`px-5 py-2 rounded-lg font-medium transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            📋 Session History
          </button>
        </div>

        {/* ===== LIVE MAP TAB ===== */}
        {activeTab === 'live' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Driver List Sidebar */}
            <div className="bg-white rounded-2xl shadow p-4 lg:col-span-1 h-96 lg:h-auto overflow-y-auto">
              <h2 className="font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <FiUser className="w-4 h-4" /> <span>Drivers</span>
              </h2>
              {allDrivers.filter(d => onlineDriverIds.includes(d._id)).length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center italic">No drivers currently online</p>
              )}

              {allDrivers
                .filter(driver => onlineDriverIds.includes(driver._id))
                .sort((a, b) => {
                  const aOnline = onlineDriverIds.includes(a._id);
                  const bOnline = onlineDriverIds.includes(b._id);
                  return bOnline - aOnline;
                })
                .map(driver => {

                const isOnline = onlineDriverIds.includes(driver._id);
                const hasLocation = !!driverLocations[driver._id];
                const isSelected = selectedDriverId === driver._id;
                return (
                  <button key={driver._id}
                    onClick={() => { setSelectedDriverId(driver._id); setActiveTab('live'); }}
                    className={`w-full text-left p-3 rounded-xl mb-2 transition-all border-2 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="font-medium text-sm text-gray-800">{driver.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 pl-4">
                      {isOnline ? (hasLocation ? '📍 Location active' : '🟡 Online, awaiting GPS') : '⚫ Offline'}
                    </div>
                  </button>
                );
              })}

            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl shadow overflow-hidden lg:col-span-3 relative z-0" style={{ height: '520px' }}>
              {driversOnMap.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 rounded-2xl">
                  <span className="text-5xl mb-3">🗺️</span>
                  <p className="text-gray-500 font-medium">Waiting for drivers to go online...</p>
                  <p className="text-gray-400 text-sm mt-1">Driver locations will appear here automatically</p>
                </div>
              )}
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                whenCreated={map => { mapRef.current = map; }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {driversOnMap.map(([driverId, loc]) => (
                  <Marker
                    key={driverId}
                    position={[loc.lat, loc.lng]}
                    icon={createDriverIcon(onlineDriverIds.includes(driverId))}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>{loc.name || 'Driver'}</strong><br />
                        📍 {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}<br />
                        <span className={onlineDriverIds.includes(driverId) ? 'text-green-600' : 'text-gray-500'}>
                          {onlineDriverIds.includes(driverId) ? '🟢 Online' : '⚫ Offline'}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </motion.div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">All Sessions</h2>
              <p className="text-sm text-gray-500">Auto-created when drivers go online. Completed when they log out.</p>
            </div>
            {loadingHistory ? (
              <div className="p-8 text-center text-gray-400">Loading sessions...</div>
            ) : sessionHistory.length === 0 ? (
              <div className="p-8 text-center">
                <span className="text-5xl">📋</span>
                <p className="text-gray-500 mt-3">No sessions yet. Sessions are created automatically when a driver goes online.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Session ID', 'Driver', 'Date', 'Start Time', 'End Time', 'Duration', 'Status', 'Type'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sessionHistory.map((trip, i) => (
                      <motion.tr key={trip._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">{trip.tripNumber}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <FiUser className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-700">{trip.assignedDriver?.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(trip.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatTime(trip.actualStartTime || trip.scheduledStartTime)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatTime(trip.actualEndTime)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDuration(trip.actualDuration)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            trip.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            trip.status === 'completed' ? 'bg-green-100 text-green-700' :
                            trip.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {trip.status === 'in_progress' ? '🟢 Active' :
                             trip.status === 'completed' ? '✅ Done' :
                             trip.status === 'scheduled' ? '📅 Scheduled' : trip.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${trip.isAutoSession ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                            {trip.isAutoSession ? '🤖 Auto' : '👤 Manual'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TripsPage;
