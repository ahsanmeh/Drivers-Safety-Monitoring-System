import { io, Socket } from 'socket.io-client';

// Backend URL (MUST MATCH your api.ts!)
const BACKEND_URL = 'http://192.168.1.5:5000';

let socket: Socket | null = null;

export const initializeSocket = (vehicleId?: string) => {
    if (!socket) {
        socket = io(BACKEND_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket?.id);
            if (vehicleId) {
                socket?.emit('join_vehicle', vehicleId);
            }
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    return socket;
};

export const getSocket = () => socket;

export const registerDriver = (driverId: string) => {
    if (socket) {
        socket.emit('register_driver', driverId);
    }
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
