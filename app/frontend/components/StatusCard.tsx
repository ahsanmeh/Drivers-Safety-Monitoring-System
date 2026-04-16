import { View, Text, StyleSheet } from 'react-native';
import { Video as LucideIcon } from 'lucide-react-native';

interface StatusCardProps {
  icon: typeof LucideIcon;
  title: string;
  value: string;
  status: 'good' | 'warning' | 'danger';
  description: string;
}

export function StatusCard({ icon: Icon, title, value, status, description }: StatusCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'danger': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBackground = () => {
    switch (status) {
      case 'good': return 'rgba(16, 185, 129, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      case 'danger': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getStatusBackground() }]}>
      <View style={styles.header}>
        <Icon size={20} color={getStatusColor()} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={[styles.value, { color: getStatusColor() }]}>{value}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
});