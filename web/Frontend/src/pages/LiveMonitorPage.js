import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { FiVideo, FiVideoOff, FiUsers, FiActivity, FiClock, FiAlertTriangle, FiTruck, FiDollarSign, FiUser } from 'react-icons/fi';
import { userAPI } from '../services/api';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const getBackendUrl = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL.replace(/\/api$/, '');
    }
    return `http://${window.location.hostname}:5000`;
};
const BACKEND_URL = getBackendUrl();

const LiveMonitorPage = () => {
    const [user, setUser] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [streamImage, setStreamImage] = useState(null);
    const [isStreamActive, setIsStreamActive] = useState(false);
    const [mobileAlerts, setMobileAlerts] = useState({}); // { driverId: { active: bool, confidence: float } }
    const [onlineDrivers, setOnlineDrivers] = useState(new Set()); // Track online drivers
    const socketRef = useRef(null);
    const selectedDriverRef = useRef(null);

    const navigationItems = [
        { name: 'Trips', icon: FiClock, path: '/dashboard/trips' },
        { name: 'Incidents', icon: FiAlertTriangle, path: '/dashboard/incidents' },
        { name: 'Vehicles', icon: FiTruck, path: '/dashboard/vehicles' },
        { name: 'Users', icon: FiUsers, path: '/dashboard/users' },
        { name: 'Reports', icon: FiDollarSign, path: '/dashboard/reports' },
        { name: 'Live Monitor', icon: FiVideo, path: '/dashboard/live' },
        { name: 'Profile', icon: FiUser, path: '/dashboard/profile' }
    ];

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchDrivers();

        // Connect socket once on mount
        socketRef.current = io(BACKEND_URL, {
            transports: ['websocket'],
            reconnection: true,
        });

        socketRef.current.on('connect', () => {
            console.log('✅ Live Monitor connected to Socket.io');
            socketRef.current.emit('get_online_drivers');
        });

        socketRef.current.on('online_drivers_update', (driversList) => {
            setOnlineDrivers(new Set(driversList));
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('❌ Socket Connection Error:', err);
        });

        socketRef.current.on('stream_frame', ({ driverId, image }) => {
            // console.log(`📡 Stream frame received for ${driverId}, length: ${image.length}`);
            // Use ref to check current selection to avoid closure staleness
            if (selectedDriverRef.current && driverId === selectedDriverRef.current._id) {
                setStreamImage(`data:image/jpeg;base64,${image}`);
                setIsStreamActive(true);
            }
        });

        socketRef.current.on('mobile_alert', (data) => {
            console.log('📱 Mobile Alert Received:', data);

            setMobileAlerts(prev => ({
                ...prev,
                [data.driver._id]: { active: true, timestamp: Date.now() }
            }));

            // Alert the admin regardless of whether they are watching the stream
            toast.error(`${data.driver.name}: MOBILE PHONE USAGE DETECTED!`, {
                duration: 5000,
                icon: '📱',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });

            // Auto-clear alert after 7 seconds if no renewal
            setTimeout(() => {
                setMobileAlerts(prev => {
                    const alert = prev[data.driver._id];
                    if (alert && Date.now() - alert.timestamp >= 6000) {
                        const newAlerts = { ...prev };
                        delete newAlerts[data.driver._id];
                        return newAlerts;
                    }
                    return prev;
                });
            }, 7000);
        });

        socketRef.current.on('stream_ended', ({ driverId }) => {
            if (selectedDriverRef.current && driverId === selectedDriverRef.current._id) {
                setIsStreamActive(false);
                setStreamImage(null);
                toast('Live stream ended by driver', { icon: '🛑' });
            }
            // Also clear mobile alert for this driver if any
            setMobileAlerts(prev => {
                const newAlerts = { ...prev };
                delete newAlerts[driverId];
                return newAlerts;
            });
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const fetchDrivers = async () => {
        try {
            const response = await userAPI.getAllDrivers();
            if (response.success) {
                // Filter to only show active (approved) drivers
                const activeDrivers = response.data.filter(driver => driver.isActive === true);
                setDrivers(activeDrivers);
            }
        } catch (error) {
            console.error('Failed to fetch drivers:', error);
            toast.error('Failed to load drivers list');
        }
    };

    const handleSelectDriver = (driver) => {
        if (selectedDriverRef.current) {
            socketRef.current.emit('leave_stream_view', selectedDriverRef.current._id);
        }

        setSelectedDriver(driver);
        selectedDriverRef.current = driver; // Update ref

        setStreamImage(null);
        setIsStreamActive(false);
        socketRef.current.emit('join_stream_view', driver._id);
    };

    return (
        <DashboardLayout user={user} activePage="Live Monitor" navigationItems={navigationItems}>
            <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FiActivity className="text-red-500" /> Live Monitoring
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
                    {/* Driver List */}
                    <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                                <FiUsers /> Drivers ({drivers.length}) <span className="text-xs text-green-600 font-normal">({onlineDrivers.size} Online)</span>
                            </h2>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {drivers.map(driver => (
                                <div
                                    key={driver._id}
                                    onClick={() => handleSelectDriver(driver)}
                                    className={`p-3 rounded-xl cursor-pointer transition-all ${selectedDriver?._id === driver._id
                                        ? 'bg-blue-50 border-blue-200 border shadow-sm'
                                        : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold overflow-hidden">
                                            {driver.profileImage ? (
                                                <img
                                                    src={
                                                        driver.profileImage.startsWith('http')
                                                            ? driver.profileImage
                                                            : driver.profileImage.startsWith('/')
                                                                ? `${BACKEND_URL}${driver.profileImage}`
                                                                : `${BACKEND_URL}/uploads/${driver.profileImage}`
                                                    }
                                                    alt={driver.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://via.placeholder.com/40?text=' + driver.name.charAt(0);
                                                    }}
                                                />
                                            ) : (
                                                driver.name.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800 flex items-center gap-2">
                                                {driver.name}
                                                {onlineDrivers.has(driver._id) && (
                                                    <span className="w-2 h-2 rounded-full bg-green-500" title="Online"></span>
                                                )}
                                            </p>
                                            {driver.driverId && <p className="text-xs text-gray-500">{driver.driverId}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Video Feed */}
                    <div className="lg:col-span-3 bg-black rounded-2xl shadow-lg overflow-hidden relative flex items-center justify-center">
                        {selectedDriver ? (
                            streamImage ? (
                                <div className="relative w-full h-full flex items-center justify-center bg-black">
                                    <img
                                        src={streamImage}
                                        alt="Live Stream"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse">
                                        <div className="w-2 h-2 bg-white rounded-full" /> LIVE
                                    </div>
                                    <div className="absolute bottom-4 left-4 text-white bg-black/50 px-3 py-1 rounded-lg">
                                        Monitoring: {selectedDriver.name}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 flex flex-col items-center">
                                    {selectedDriver.profileImage ? (
                                        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-gray-800">
                                            <img
                                                src={
                                                    selectedDriver.profileImage.startsWith('http')
                                                        ? selectedDriver.profileImage
                                                        : selectedDriver.profileImage.startsWith('/')
                                                            ? `${BACKEND_URL}${selectedDriver.profileImage}`
                                                            : `${BACKEND_URL}/uploads/${selectedDriver.profileImage}`
                                                }
                                                alt={selectedDriver.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-3xl font-bold text-gray-600 mb-4">
                                            {selectedDriver.name.charAt(0)}
                                        </div>
                                    )}
                                    <h3 className="text-xl font-semibold mb-2">Waiting for Stream</h3>
                                    <p>Waiting for {selectedDriver.name} to start streaming...</p>
                                </div>
                            )
                        ) : (
                            <div className="text-center text-gray-500">
                                <FiVideo className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-semibold mb-2">Select a Driver</h3>
                                <p>Choose a driver from the list to start monitoring</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LiveMonitorPage;
