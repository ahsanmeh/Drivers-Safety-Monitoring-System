import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, Brain, Clock, Shield, AlertTriangle } from 'lucide-react-native';
import { StatusCard } from '../../components/StatusCard';
import { MetricCard } from '../../components/MetricCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { initializeSocket, getSocket, disconnectSocket, registerDriver } from '../../lib/socket';
import { useAlerts, Alert as AlertType } from '../../lib/AlertsContext';
import { useTimeAgo } from '../../hooks/useTimeAgo';
import * as Location from 'expo-location';
import { updateIncidentLocation } from '../../lib/api';
import { VisionCameraComponent } from '../../components/VisionCameraComponent';
import * as Haptics from 'expo-haptics';

import * as Speech from 'expo-speech';

const { width } = Dimensions.get('window');


// ActivityItem Component
interface ActivityItemProps {
  alert: AlertType;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ alert }) => {
  const timeAgo = useTimeAgo(alert.timestamp);

  const getDotColor = (type: string) => {
    switch (type) {
      case 'smoke':
        return '#EF4444';
      case 'drowsiness':
        return '#EF4444';
      case 'distraction':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  const getActivityText = (alert: AlertType) => {
    switch (alert.type) {
      case 'smoke':
        return 'Smoke detected';
      case 'drowsiness':
        return 'Drowsiness detected';
      case 'distraction':
        return 'Phone usage detected';
      default:
        return alert.title;
    }
  };

  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityDot, { backgroundColor: getDotColor(alert.type) }]} />
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>{getActivityText(alert)}</Text>
        <Text style={styles.activityTime}>{timeAgo}</Text>
      </View>
    </View>
  );
};


export default function DashboardScreen() {
  const { user, token } = useAuth();
  const { addAlert, alerts, getTodayAlertsCount, get24HourAlerts, loadAlertsFromDB, getSafetyScore, isLoading } = useAlerts();
  const [isStreaming, setIsStreaming] = useState(false);

  // Get counts
  const smokeCount = getTodayAlertsCount('smoke');
  const drowsinessCount = getTodayAlertsCount('drowsiness');
  const distractionCount = getTodayAlertsCount('distraction');

  const playVoiceAlert = (message: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (Speech) {
        Speech.speak(message, {
          pitch: 1.0,
          rate: 0.9,
        });
        console.log('🗣️ Dashboard Voice Alert:', message);
      }
    } catch (error) {
      console.log('Error playing voice alert:', error);
    }
  };

  // Get recent alerts within 24 hours for activity
  const recentAlerts = get24HourAlerts().slice(0, 5);

  // Load alerts from database on mount when user is authenticated
  useEffect(() => {
    console.log('👤 Dashboard Auth State:', {
      hasUser: !!user,
      hasToken: !!token,
      userId: user?._id,
      userName: user?.name
    });
    if (user && token && user._id) {
      loadAlertsFromDB(token, user._id);
    }
  }, [user, token, loadAlertsFromDB]);

  useEffect(() => {
    const socket = initializeSocket();

    socket.on('connect', () => {
      if (user?._id) registerDriver(user._id);
      if (user?.vehicle?._id) {
        console.log(`🚗 Joining vehicle room: ${user.vehicle._id}`);
        socket.emit('join_vehicle', user.vehicle._id);
      }
    });

    if (socket.connected && user?._id) {
      registerDriver(user._id);
      if (user?.vehicle?._id) {
        socket.emit('join_vehicle', user.vehicle._id);
      }
    }

    socket.on('request_stream', () => {
      console.log('🚀 Received stream request');
      setIsStreaming(true);
    });

    socket.on('stop_stream_request', () => {
      console.log('🛑 Received stop stream request');
      setIsStreaming(false);
    });

    socket.on('smoke_alert', async (data: any) => {
      console.log('🔥 SMOKE ALERT RECEIVED:', data);
      playVoiceAlert("Critical Alert: Smoke detected in the vehicle. Please stop and check for fire.");

      addAlert({
        type: 'smoke',
        severity: 'high',
        title: 'Smoke Detected',
        description: 'High smoke level detected inside the vehicle.',
        value: data.value,
        vehicleId: data.vehicle?._id,
      });

      // Update incident location
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted' && token && data.incidentId) {
          const location = await Location.getCurrentPositionAsync({});
          let address = 'Updated from Driver App';

          try {
            const geocode = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            });

            if (geocode && geocode.length > 0) {
              const g = geocode[0];
              // Construct address from available fields
              const parts = [
                g.street,
                g.name !== g.street ? g.name : null,
                g.city,
                g.region,
                g.country
              ].filter(Boolean);

              if (parts.length > 0) {
                address = parts.join(', ');
              }
            }
          } catch (geoError) {
            console.log('Reverse geocoding failed:', geoError);
          }

          await updateIncidentLocation(token, data.incidentId, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address: address
          });
          console.log('📍 Incident location updated');
        }
      } catch (err) {
        console.error('Failed to update incident location:', err);
      }
    });

    socket.on('mobile_alert', (data: any) => {
      console.log('📱 ALERT RECEIVED FROM SOCKET:', data);

      let voiceMsg = "Safety violation detected.";
      if (data.type === 'phone_usage') voiceMsg = "Warning: Mobile phone usage detected.";
      if (data.type === 'drowsiness') voiceMsg = "Warning: Drowsiness detected. Please stay alert.";
      if (data.type === 'yawning') voiceMsg = "Alert: You seem tired. Consider taking a break.";

      playVoiceAlert(voiceMsg);

      const alertType = data.type || 'distraction';

      let title = 'Violation Detected';
      let description = 'A safety violation was detected.';
      let type: 'distraction' | 'drowsiness' | 'yawning' | 'smoke' = 'distraction';

      if (alertType === 'phone_usage') {
        type = 'distraction';
        title = 'Phone Usage Detected';
        description = 'Using a phone while driving is strictly prohibited.';
      } else if (alertType === 'drowsiness') {
        type = 'drowsiness';
        title = 'Drowsiness Detected';
        description = 'Driver appears drowsy. Please take a break.';
      } else if (alertType === 'yawning') {
        type = 'yawning';
        title = 'Yawning Detected';
        description = 'Increased yawning detected. Stay alert.';
      }

      addAlert({
        type: type,
        severity: 'high',
        title: title,
        description: description,
        value: data.confidence || 1.0,
        vehicleId: data.vehicle?._id,
      });
    });

    return () => {
      disconnectSocket();
    };
  }, [addAlert, token, user]);


  const safetyScore = getSafetyScore();
  const yawningCount = getTodayAlertsCount('yawning');

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#111827', '#1f2937', '#374151']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Driver Safety Monitor</Text>
        <Text style={styles.headerSubtitle}>
          {user ? `Welcome, ${user.name}` : 'Welcome'}
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Live Stream Control */}
        <VisionCameraComponent isStreaming={isStreaming} />

        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Today's Safety Metrics</Text>

          <View style={styles.metricsGrid}>
            <MetricCard
              icon={Shield}
              title="Safety Score"
              value={`${safetyScore}%`}
              subtitle={safetyScore > 85 ? 'Excellent' : safetyScore > 70 ? 'Good' : 'Needs Care'}
              valueColor={safetyScore < 50 ? '#EF4444' : '#10B981'}
            />
            <MetricCard
              icon={AlertTriangle}
              title="Smoke Events"
              value={smokeCount.toString()}
              subtitle={smokeCount === 0 ? 'No incidents' : 'Critical'}
            />
          </View>

          <View style={styles.metricsGrid}>
            <MetricCard
              icon={Eye}
              title="Drowsiness"
              value={(drowsinessCount + yawningCount).toString()}
              subtitle={`Fatigue: ${drowsinessCount} drowsy, ${yawningCount} yawning`}
            />
            <MetricCard
              icon={Brain}
              title="Distraction"
              value={distractionCount.toString()}
              subtitle={distractionCount === 0 ? 'No incidents' : 'Minor incidents'}
            />
          </View>
        </View>

        <View style={styles.alertsPreview}>
          <Text style={styles.sectionTitle}>Recent Activity (24 hours)</Text>
          <View style={styles.activityList}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#EF4444" />
                <Text style={styles.loadingText}>Loading alerts...</Text>
              </View>
            ) : recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <ActivityItem key={alert.id} alert={alert} />
              ))
            ) : (
              <Text style={styles.emptyText}>No recent activity in the last 24 hours</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  content: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  alertsPreview: {
    marginTop: 24,
  },
  activityList: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  activityTime: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  streamSection: {
    marginBottom: 24,
  },
  streamStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  streamStatusText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 14,
  },
  streamIndicatorActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
});