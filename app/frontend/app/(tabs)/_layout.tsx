import { MaterialTopTabs } from '../../components/MaterialTopTabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Gauge, Map, AlertTriangle } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
import { useAlerts } from '../../lib/AlertsContext';
import { useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';

// Badge component for unread count
function TabBarIcon({ icon: Icon, size, color, badge }: { icon: any, size: number, color: string, badge?: number }) {
  return (
    <View style={styles.iconContainer}>
      <Icon size={size} color={color} />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { unreadCount, loadAlertsFromDB } = useAlerts();
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user?._id) {
      loadAlertsFromDB(token, user._id);
    }
  }, [token, user?._id]);

  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      screenOptions={{
        tabBarActiveTintColor: '#EF4444',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#1f2937',
          // height removed to let content define it
          paddingBottom: Math.max(insets.bottom, 10), // Ensure minimum padding
          paddingTop: 10,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarIndicatorStyle: {
          height: 0, // Hide the indicator line
          backgroundColor: 'transparent',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'none',
        },
        tabBarShowIcon: true,
        swipeEnabled: true,
        animationEnabled: true,
      }}>
      <MaterialTopTabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <TabBarIcon icon={Gauge} size={24} color={color} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <TabBarIcon icon={Map} size={24} color={color} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <TabBarIcon icon={AlertTriangle} size={24} color={color} badge={unreadCount} />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabBarIcon icon={User} size={24} color={color} />
          ),
        }}
      />
    </MaterialTopTabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});