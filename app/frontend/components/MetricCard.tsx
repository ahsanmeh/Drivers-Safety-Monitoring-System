import { View, Text, StyleSheet } from 'react-native';
import { Shield as LucideIcon } from 'lucide-react-native';

interface MetricCardProps {
  icon: typeof LucideIcon;
  title: string;
  value: string;
  subtitle: string;
  valueColor?: string;
}

export function MetricCard({ icon: Icon, title, value, subtitle, valueColor }: MetricCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon size={20} color="#EF4444" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
});