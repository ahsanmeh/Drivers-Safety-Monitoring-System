import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map centering when coordinates change
const ChangeView = ({ center }) => {
  const map = useMap();
  if (center) {
    map.setView(center);
  }
  return null;
};

const TripTrackingMap = ({ trip, backendUrl }) => {
  const [currentPos, setCurrentPos] = useState(null);
  const [route, setRoute] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Set initial position if available
    if (trip?.currentPosition?.latitude && trip?.currentPosition?.longitude) {
      const pos = [trip.currentPosition.latitude, trip.currentPosition.longitude];
      setCurrentPos(pos);
    } else if (trip?.startLocation?.coordinates) {
      const pos = [trip.startLocation.coordinates.latitude, trip.startLocation.coordinates.longitude];
      setCurrentPos(pos);
    }

    // Set initial route from history
    if (trip?.routeHistory?.length > 0) {
      const path = trip.routeHistory.map(pt => [pt.latitude, pt.longitude]);
      setRoute(path);
    }

    // Connect to socket
    const socket = io(backendUrl.replace(/\/api$/, ''), {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Tracking Map connected to Socket');
      socket.emit('join_trip_tracking', trip._id);
    });

    socket.on('trip_location_updated', (data) => {
      if (data.tripId === trip._id) {
        const newPos = [data.latitude, data.longitude];
        setCurrentPos(newPos);
        setRoute(prev => [...prev, newPos]);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_trip_tracking', trip._id);
        socketRef.current.disconnect();
      }
    };
  }, [trip, backendUrl]);

  const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', // Truck icon
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  if (!currentPos) {
    return (
      <div className="h-[400px] bg-gray-100 flex items-center justify-center rounded-xl">
        <p className="text-gray-500">Waiting for location data...</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-inner border border-gray-200">
      <MapContainer 
        center={currentPos} 
        zoom={15} 
        scrollWheelZoom={true}
        style={{ h: '100%', w: '100%' }}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Current Position Marker */}
        <Marker position={currentPos} icon={truckIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-bold">{trip.assignedDriver?.name}</p>
              <p className="text-xs">{trip.tripNumber}</p>
            </div>
          </Popup>
        </Marker>

        {/* Route History Line */}
        <Polyline positions={route} color="blue" weight={4} opacity={0.6} />
        
        {/* Auto-center map */}
        <ChangeView center={currentPos} />
      </MapContainer>
    </div>
  );
};

export default TripTrackingMap;
