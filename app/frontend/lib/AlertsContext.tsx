import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDriverIncidents, dismissIncident } from './api';
import { useAuth } from './auth-context';

export interface Alert {
    id: string;
    type: 'drowsiness' | 'distraction' | 'smoke' | 'system' | 'yawning' | 'head_nodding';
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    timestamp: Date;
    icon?: any;
    color?: string;
    value?: number;
    vehicleId?: string;
    hiddenFromDriver?: boolean;
}

interface AlertsContextType {
    alerts: Alert[];
    notifications: Alert[];
    isLoading: boolean;
    unreadCount: number;
    addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
    clearAlerts: () => void;
    clearNotifications: () => void;
    deleteNotification: (id: string, token: string) => Promise<void>;
    markAlertsAsRead: () => void;
    loadAlertsFromDB: (token: string, driverId: string) => Promise<void>;
    getAlertsByType: (type: string) => Alert[];
    getTodayAlertsCount: (type?: string) => number;
    getTotalAlertsCount: (type?: string) => number;
    getSafetyScore: () => number;
    get24HourAlerts: () => Alert[];
    getWeekAlerts: () => Alert[];
    getPaginatedAlerts: (page: number, pageSize: number) => Alert[];
    setOnAlertAdded: (callback: () => void) => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

const UNREAD_COUNT_KEY = '@alerts_unread_count';
const LAST_VIEWED_KEY = '@alerts_last_viewed';

// Map incident type from backend to frontend alert type
const mapIncidentType = (incidentType: string): 'drowsiness' | 'distraction' | 'smoke' | 'system' | 'yawning' | 'head_nodding' => {
    switch (incidentType) {
        case 'smoke_detection':
            return 'smoke';
        case 'drowsiness':
            return 'drowsiness';
        case 'yawning':
            return 'yawning';
        case 'head_nodding':
            return 'head_nodding';
        case 'phone_usage':
            return 'distraction';
        default:
            return 'system';
    }
};

// Map severity from backend to frontend
const mapSeverity = (severity: string): 'high' | 'medium' | 'low' => {
    switch (severity) {
        case 'critical':
        case 'high':
            return 'high';
        case 'medium':
            return 'medium';
        default:
            return 'low';
    }
};

// Get title based on incident type
const getAlertTitle = (incidentType: string): string => {
    switch (incidentType) {
        case 'smoke_detection':
            return 'Smoke Detected';
        case 'drowsiness':
            return 'Drowsiness Detected';
        case 'yawning':
            return 'Yawning Detected';
        case 'head_nodding':
            return 'Head Nodding Detected';
        case 'phone_usage':
            return 'Phone Usage Detected';
        case 'overspeeding':
            return 'Overspeeding Alert';
        case 'harsh_brake':
            return 'Harsh Braking Detected';
        default:
            return 'System Alert';
    }
};

export const AlertsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [notifications, setNotifications] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastViewedTime, setLastViewedTime] = useState<number>(0);
    const lastViewedTimeRef = useRef<number>(0);
    const [onAlertAddedCallback, setOnAlertAddedCallback] = useState<(() => void) | null>(null);

    // Sync ref with state
    useEffect(() => {
        lastViewedTimeRef.current = lastViewedTime;
    }, [lastViewedTime]);

    // Load persisted unread count and last viewed time on mount
    useEffect(() => {
        const loadPersistedData = async () => {
            try {
                const storedCount = await AsyncStorage.getItem(UNREAD_COUNT_KEY);
                const storedLastViewed = await AsyncStorage.getItem(LAST_VIEWED_KEY);

                if (storedCount !== null) {
                    setUnreadCount(parseInt(storedCount, 10));
                }
                if (storedLastViewed !== null) {
                    const time = parseInt(storedLastViewed, 10);
                    setLastViewedTime(time);
                    lastViewedTimeRef.current = time;
                }
            } catch (error) {
                console.error('Failed to load persisted alert data:', error);
            }
        };
        loadPersistedData();
    }, []);

    // Persist unread count whenever it changes
    useEffect(() => {
        const persistUnreadCount = async () => {
            try {
                await AsyncStorage.setItem(UNREAD_COUNT_KEY, unreadCount.toString());
            } catch (error) {
                console.error('Failed to persist unread count:', error);
            }
        };
        persistUnreadCount();
    }, [unreadCount]);

    const addAlert = useCallback((alert: Omit<Alert, 'id' | 'timestamp'>) => {
        const newAlert: Alert = {
            ...alert,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
        };

        setAlerts((prev) => [newAlert, ...prev]);
        setNotifications((prev) => [newAlert, ...prev]);
        setUnreadCount((prev) => prev + 1); // Increment unread count for new alerts
        console.log('✅ Alert added:', newAlert);

        // Trigger callback if set (for safe trip tracking)
        if (onAlertAddedCallback) {
            onAlertAddedCallback();
        }
    }, [onAlertAddedCallback]);

    const setOnAlertAdded = useCallback((callback: () => void) => {
        setOnAlertAddedCallback(() => callback);
    }, []);

    const loadAlertsFromDB = useCallback(async (token: string, driverId: string) => {
        setIsLoading(true);
        try {
            console.log('📡 Loading alerts from database...');
            const response = await fetchDriverIncidents(token, driverId);

            const loadedAlerts: Alert[] = response.incidents.map((incident: any) => ({
                id: incident._id,
                type: mapIncidentType(incident.incidentType),
                severity: mapSeverity(incident.severity),
                title: getAlertTitle(incident.incidentType),
                description: incident.description,
                timestamp: new Date(incident.dateTime),
                vehicleId: incident.vehicle?._id || incident.vehicle,
                hiddenFromDriver: incident.hiddenFromDriver || false,
            }));

            // Sort by timestamp descending (newest first)
            loadedAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

            setAlerts(loadedAlerts);
            setNotifications(loadedAlerts.filter(a => !a.hiddenFromDriver));

            // Calculate unread count based on last viewed time (use current ref to avoid dependency)
            const newAlertsSinceLastView = loadedAlerts.filter(
                alert => alert.timestamp.getTime() > lastViewedTimeRef.current
            ).length;

            setUnreadCount(newAlertsSinceLastView);
            console.log(`✅ Loaded ${loadedAlerts.length} alerts, ${newAlertsSinceLastView} unread`);
        } catch (error) {
            console.error('❌ Failed to load alerts from database:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearAlerts = () => {
        setAlerts([]);
        setNotifications([]);
        setUnreadCount(0);
    };

    const clearNotifications = () => {
        setNotifications([]);
        console.log('🗑️ Notifications cleared (counts preserved)');
    };

    const deleteNotification = useCallback(async (id: string, token: string) => {
        // Optimistic update - only remove from notifications (Recent), keep in alerts (History)
        setNotifications((prev) => prev.filter((alert) => alert.id !== id));
        // setAlerts((prev) => prev.filter((alert) => alert.id !== id));

        try {
            if (token) {
                await dismissIncident(token, id);
                console.log('🗑️ Notification dismissed permanently:', id);
            }
        } catch (error) {
            console.error('Failed to dismiss notification on server:', error);
            // Optionally revert state here if critical, but for dismissal sticking with optimistic is better UX
        }
    }, []);

    const markAlertsAsRead = useCallback(async () => {
        const now = Date.now();
        setUnreadCount(0);
        setLastViewedTime(now);

        try {
            await AsyncStorage.setItem(LAST_VIEWED_KEY, now.toString());
            await AsyncStorage.setItem(UNREAD_COUNT_KEY, '0');
            console.log('✅ Alerts marked as read');
        } catch (error) {
            console.error('Failed to persist last viewed time:', error);
        }
    }, []);

    const getAlertsByType = (type: string) => {
        return alerts.filter((alert) => alert.type === type);
    };

    const getTodayAlertsCount = (type?: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayAlerts = alerts.filter((alert) => {
            const alertDate = new Date(alert.timestamp);
            alertDate.setHours(0, 0, 0, 0);
            return alertDate.getTime() === today.getTime();
        });

        if (type) {
            return todayAlerts.filter((alert) => alert.type === type).length;
        }

        return todayAlerts.length;
    };

    const getTotalAlertsCount = (type?: string) => {
        if (type) {
            return alerts.filter((alert) => alert.type === type).length;
        }
        return alerts.length;
    };

    const getSafetyScore = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayAlerts = alerts.filter((alert) => {
            const alertDate = new Date(alert.timestamp);
            alertDate.setHours(0, 0, 0, 0);
            return alertDate.getTime() === today.getTime();
        });

        let score = 100;

        // Add Safe Trip Bonus (Reward persistent safe driving)
        const safeTripCount = user?.safeTripCount || 0;
        score += (safeTripCount * 2);

        // Subtract Violations
        todayAlerts.forEach(alert => {
            if (alert.type === 'smoke') score -= 30;
            if (alert.type === 'drowsiness') score -= 5; // Reduced to 5%
            if (alert.type === 'distraction') score -= 15;
            if (alert.type === 'yawning') score -= 5;    // Reduced to 5%
            if (alert.type === 'head_nodding') score -= 10;
        });

        // Ensure score is within [0, 100]
        return Math.min(100, Math.max(0, score));
    }, [alerts, user?.safeTripCount]);

    const get24HourAlerts = () => {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        return alerts.filter((alert) => {
            const alertDate = new Date(alert.timestamp);
            return alertDate >= twentyFourHoursAgo;
        });
    };

    const getWeekAlerts = () => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        return notifications.filter((alert) => {
            const alertDate = new Date(alert.timestamp);
            return alertDate >= weekAgo;
        });
    };

    const getPaginatedAlerts = (page: number, pageSize: number) => {
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        return alerts.slice(startIndex, endIndex);
    };

    return (
        <AlertsContext.Provider
            value={{
                alerts,
                notifications,
                isLoading,
                unreadCount,
                addAlert,
                clearAlerts,
                clearNotifications,
                deleteNotification,
                markAlertsAsRead,
                loadAlertsFromDB,
                getAlertsByType,
                getTodayAlertsCount,
                getTotalAlertsCount,
                getSafetyScore,
                get24HourAlerts,
                getWeekAlerts,
                getPaginatedAlerts,
                setOnAlertAdded,
            }}
        >
            {children}
        </AlertsContext.Provider>
    );
};

export const useAlerts = () => {
    const context = useContext(AlertsContext);
    if (!context) {
        throw new Error('useAlerts must be used within AlertsProvider');
    }
    return context;
};
