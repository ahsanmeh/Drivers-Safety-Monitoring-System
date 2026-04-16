import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert as RNAlert, ActivityIndicator, Animated } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, Phone, AlertTriangle, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAlerts, Alert } from '../../lib/AlertsContext';
import { useAuth } from '../../lib/auth-context';
import { useTimeAgo } from '../../hooks/useTimeAgo';

// Swipeable Alert Item Component
const AlertItem: React.FC<{ alert: Alert; onDelete: (id: string) => void }> = ({ alert, onDelete }) => {
  const timeAgo = useTimeAgo(alert.timestamp);

  const getIcon = () => {
    switch (alert.type) {
      case 'smoke':
        return AlertTriangle;
      case 'drowsiness':
        return Eye;
      case 'distraction':
        return Phone;
      default:
        return AlertCircle;
    }
  };

  const getColor = () => {
    switch (alert.type) {
      case 'smoke':
        return '#EF4444';
      case 'drowsiness':
        return '#EF4444';
      case 'distraction':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getSeverityBackground = (severity: string) => {
    switch (severity) {
      case 'high': return 'rgba(239, 68, 68, 0.1)';
      case 'medium': return 'rgba(245, 158, 11, 0.1)';
      case 'low': return 'rgba(107, 114, 128, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };

  const IconComponent = getIcon();
  const iconColor = getColor();

  return (
    <View style={styles.alertCard}>
      <View style={[
        styles.alertIcon,
        { backgroundColor: getSeverityBackground(alert.severity) }
      ]}>
        <IconComponent size={20} color={iconColor} />
      </View>

      <View style={styles.alertContent}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(alert.severity) }
            ]}>
              <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              onPress={() => onDelete(alert.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ fontSize: 16, color: '#9CA3AF', fontWeight: '900' }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.alertMessage}>{alert.description}</Text>
        <Text style={styles.alertTime}>{timeAgo}</Text>
      </View>
    </View>
  );
};


export default function AlertsScreen() {
  const { user, token } = useAuth();
  const {
    alerts,
    clearNotifications,
    getTodayAlertsCount,
    getTotalAlertsCount,
    getWeekAlerts,
    isLoading,
    loadAlertsFromDB,
    deleteNotification,
    markAlertsAsRead
  } = useAlerts();

  // Load alerts if not already loaded
  useEffect(() => {
    if (user && token && user._id && alerts.length === 0) {
      console.log('📱 Alerts screen: Loading alerts from DB...');
      loadAlertsFromDB(token, user._id);
    }
  }, [user, token, loadAlertsFromDB, alerts.length]);

  // Mark alerts as read every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      markAlertsAsRead();
    }, [markAlertsAsRead])
  );

  // Get TOTAL counts for each type (all-time)
  const totalDrowsiness = getTotalAlertsCount('drowsiness');
  const totalDistraction = getTotalAlertsCount('distraction');
  const totalSmoke = getTotalAlertsCount('smoke');

  // Get today's count for header
  const totalTodayCount = getTodayAlertsCount();

  // Get alerts from the last 7 days for display
  const weekAlerts = getWeekAlerts();

  // Handle delete single notification
  const handleDeleteAlert = (id: string) => {
    if (token) {
      deleteNotification(id, token);
    }
  };

  // Handle Clear All with confirmation
  const handleClearAll = () => {
    RNAlert.alert(
      'Clear All Notifications',
      'Are you sure? This will clear all notifications but keep the alert counts.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearNotifications();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#111827', '#1f2937']}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Alerts</Text>
              {totalTodayCount > 0 && (
                <View style={styles.totalBadge}>
                  <Text style={styles.totalBadgeText}>{totalTodayCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerSubtitle}>
              {alerts.length > 0
                ? `${alerts.length} total alerts • ${totalTodayCount} today`
                : 'Safety notifications'}
            </Text>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Summary Cards - Shows TOTAL count of all alerts */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Eye size={24} color="#EF4444" />
              </View>
              <Text style={styles.summaryTitle}>Drowsiness</Text>
              <Text style={styles.summaryValue}>{totalDrowsiness}</Text>
              <Text style={styles.summaryCount}>total alerts</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Phone size={24} color="#F59E0B" />
              </View>
              <Text style={styles.summaryTitle}>Distraction</Text>
              <Text style={styles.summaryValue}>{totalDistraction}</Text>
              <Text style={styles.summaryCount}>total alerts</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <AlertTriangle size={24} color="#EF4444" />
              </View>
              <Text style={styles.summaryTitle}>Smoke</Text>
              <Text style={styles.summaryValue}>{totalSmoke}</Text>
              <Text style={styles.summaryCount}>total alerts</Text>
            </View>
          </View>



          {/* Alerts List */}
          <View style={styles.alertsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Alerts (7 days)</Text>
              {weekAlerts.length > 0 && (
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#EF4444" />
                <Text style={styles.loadingText}>Loading alerts...</Text>
              </View>
            ) : (
              <>
                {weekAlerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} onDelete={handleDeleteAlert} />
                ))}

                {weekAlerts.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      No alerts in the last 7 days. Drive safely!
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'column',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  totalBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 6,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  summaryCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  swipeHint: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  swipeHintText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
  },
  alertsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  severityBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertMessage: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#64748b',
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 12,
    borderRadius: 16,
    marginLeft: 8,
  },
  deleteContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
  },
});
