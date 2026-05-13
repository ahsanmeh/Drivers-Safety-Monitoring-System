import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Linking, Image, Alert, Animated, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Phone, Clock, Shield, AtSign } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { API_ROOT, uploadProfileImage, updateProfile, getProfile } from '../../lib/api';
import { useAlerts } from '../../lib/AlertsContext';

export default function ProfileScreen() {
  const { user, logout, startTime, setAuth, token, setAlertTriggered } = useAuth();
  const { clearAlerts, getPaginatedAlerts, getTotalAlertsCount, setOnAlertAdded, deleteNotification, getSafetyScore } = useAlerts();
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form state for editing
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [rulesVisible, setRulesVisible] = useState(false);
  const [alertHistoryVisible, setAlertHistoryVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [drivingTimeDisplay, setDrivingTimeDisplay] = useState('0h 0m');
  const router = useRouter();

  // Animated values for slide-down gesture
  const translateY = React.useRef(new Animated.Value(0)).current;
  const backdropOpacity = React.useRef(new Animated.Value(1)).current;

  // Update driving time display every minute
  useEffect(() => {
    const updateTime = () => {
      const baseSeconds = user?.totalDrivingSeconds || 0;
      const currentSessionSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      const totalSeconds = baseSeconds + currentSessionSeconds;

      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      if (days > 0) {
        setDrivingTimeDisplay(`${days} d${days > 1 ? 's' : ''} ${hours} h${hours !== 1 ? 's' : ''}`);
      } else {
        setDrivingTimeDisplay(`${hours}h ${minutes}m`);
      }
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [user?.totalDrivingSeconds, startTime]);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  // Refresh profile data on mount to get admin info
  useEffect(() => {
    const refreshProfile = async () => {
      if (token) {
        try {
          const updatedUser = await getProfile(token);
          setAuth({ user: updatedUser, token });
        } catch (error) {
          console.error('Failed to refresh profile:', error);
        }
      }
    };
    refreshProfile();
  }, []);

  // Set up alert callback for safe trip tracking
  useEffect(() => {
    if (setAlertTriggered) {
      setOnAlertAdded(() => setAlertTriggered(true));
    }
  }, [setAlertTriggered, setOnAlertAdded]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled) {
        const uri = result.assets[0]?.uri;
        if (uri) {
          // Optimistic update
          setAvatarUri(uri);

          // Upload to server
          if (token) {
            const response = await uploadProfileImage(token, uri);
            // Update local user context with new image path
            setAuth({
              user: { ...user, profileImage: response.profileImage },
              token: token || ''
            });
            Alert.alert('Success', 'Profile picture updated');
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update profile picture');
      console.error(error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setIsUpdating(true);
      const updatedUser = await updateProfile(token, {
        name: editName,
        email: editEmail,
        phone: editPhone,
      });

      setAuth({
        user: {
          ...user,
          ...updatedUser,
          // Explicitly preserve profileImage to prevent it from being lost
          profileImage: updatedUser.profileImage || user?.profileImage
        },
        token: token || ''
      });

      setEditProfileVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  // Pan responder for slide-down gesture
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical gestures
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        // Set the initial values when gesture starts
        translateY.setOffset(0);
        backdropOpacity.setOffset(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          // Only allow downward movement
          translateY.setValue(gestureState.dy);
          // Smooth fade with better interpolation
          const progress = Math.min(gestureState.dy / 300, 1);
          const opacity = 1 - (progress * 0.7); // Fade to 30% at max
          backdropOpacity.setValue(opacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 120; // Lower threshold for easier dismissal
        const velocity = gestureState.vy;

        // Close if dragged beyond threshold or fast swipe
        if (gestureState.dy > threshold || velocity > 0.8) {
          // Animate out smoothly
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 600,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setAvatarPreviewVisible(false);
            // Reset values
            translateY.setValue(0);
            backdropOpacity.setValue(1);
          });
        } else {
          // Snap back with smooth easing
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#111827', '#1f2937']}
        style={styles.header}
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={() => setAvatarPreviewVisible(true)}>
              {(() => {
                const backendAvatarUrl = user?.profileImage ? `${API_ROOT}${user.profileImage}` : null;
                const sourceUri = avatarUri || backendAvatarUrl;
                console.log('Profile image URL:', sourceUri);
                if (sourceUri) {
                  return <Image source={{ uri: sourceUri }} style={styles.profileImage} />;
                }
                return (
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={styles.profileImage}
                  >
                    <User size={40} color="#fff" />
                  </LinearGradient>
                );
              })()}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={pickImage}
            >
              <Text style={{ fontSize: 12 }}>📷</Text>
            </TouchableOpacity>
          </View>


          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileRole}>
              {user?.driverId ? `Driver ID: ${user.driverId}` : 'Professional Driver'}
            </Text>
            <View style={styles.safetyScore}>
              <Shield size={16} color={getSafetyScore() < 50 ? '#EF4444' : '#10B981'} />
              <Text style={[styles.scoreText, { color: getSafetyScore() < 50 ? '#EF4444' : '#10B981' }]}>
                Safety Score: {getSafetyScore()}%
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Clock size={20} color="#10B981" />
            <Text style={styles.statValue}>{drivingTimeDisplay}</Text>
            <Text style={styles.statLabel}>Hours Driven</Text>
          </View>

          <View style={styles.statCard}>
            <Shield size={20} color="#F59E0B" />
            <Text style={styles.statValue}>{user?.safeTripCount || 0}</Text>
            <Text style={styles.statLabel}>Safe Trips</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <User size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <Shield size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <Phone size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user?.phone || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Shield size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Vehicle</Text>
                <Text style={styles.infoValue}>
                  {user?.vehicle ? `${user.vehicle.year} ${user.vehicle.make} ${user.vehicle.model}` : 'No Vehicle Assigned'}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <Shield size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>License Plate</Text>
                <Text style={styles.infoValue}>{user?.vehicle?.licensePlate || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <User size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Admin Name</Text>
                <Text style={styles.infoValue}>{user?.adminName || 'Company Admin'}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItem}>
              <AtSign size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Company Email</Text>
                <Text style={styles.infoValue}>{user?.adminEmail || 'support@company.com'}</Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.settingsButton} onPress={() => setSettingsVisible(true)}>
          <Shield size={20} color="#fff" />
          <Text style={styles.settingsText}>App Settings</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={avatarPreviewVisible}
        transparent
        onRequestClose={() => setAvatarPreviewVisible(false)}
      >
        <Animated.View
          style={[
            styles.modalBackdrop,
            { opacity: backdropOpacity }
          ]}
        >
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.modalTouchable,
              { transform: [{ translateY }] }
            ]}
          >
            {(() => {
              const backendAvatarUrl = user?.profileImage ? `${API_ROOT}${user.profileImage}` : null;
              const imageUri = avatarUri || backendAvatarUrl;

              return (
                <View style={styles.fullscreenContainer}>
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.fullImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.fullImage, { justifyContent: 'center', alignItems: 'center' }]}>
                      <User size={120} color="#6B7280" />
                    </View>
                  )}
                </View>
              );
            })()}
          </Animated.View>
        </Animated.View>
      </Modal>


      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setSettingsVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.sheet}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.sheetTitle}>App Settings</Text>
            <TouchableOpacity style={styles.sheetItem} onPress={() => { setSettingsVisible(false); setEditProfileVisible(true); }}>
              <User size={18} color="#e5e7eb" />
              <Text style={styles.sheetItemText}>Edit Personal Info</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={() => { setSettingsVisible(false); setAlertHistoryVisible(true); setCurrentPage(0); }}>
              <Clock size={18} color="#e5e7eb" />
              <Text style={styles.sheetItemText}>Alert History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={() => { setSettingsVisible(false); setRulesVisible(true); }}>
              <Shield size={18} color="#e5e7eb" />
              <Text style={styles.sheetItemText}>Driving Rules</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={() => Linking.openURL('mailto:feedback@driversafety.app?subject=App%20Feedback')}>
              <Shield size={18} color="#e5e7eb" />
              <Text style={styles.sheetItemText}>Feedback</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sheetItem, { marginTop: 8 }]} onPress={() => {
              setSettingsVisible(false);
              Alert.alert('Log out', 'Are you sure you want to log out?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Log out', style: 'destructive', onPress: () => {
                    logout();
                    clearAlerts();
                    router.replace('/face-login');
                  }
                },
              ]);
            }}>
              <Shield size={18} color="#ef4444" />
              <Text style={[styles.sheetItemText, { color: '#ef4444' }]}>Log out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetClose} onPress={() => setSettingsVisible(false)}>
              <Text style={styles.sheetCloseText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Rules popup - Centered and Backdrop Close */}
      <Modal
        visible={rulesVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRulesVisible(false)}
      >
        <TouchableOpacity
          style={[styles.modalBackdrop, { justifyContent: 'center', alignItems: 'center' }]}
          activeOpacity={1}
          onPress={() => setRulesVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.rulesCard, { width: '85%', maxHeight: '80%' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Shield size={40} color="#10B981" />
              <Text style={[styles.sectionTitle, { marginTop: 12, marginBottom: 0 }]}>Driving Rules</Text>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={[styles.infoValue, { color: '#10B981' }]}>1. Eyes on the Road</Text>
                  <Text style={[styles.infoSubvalue, { marginTop: 4 }]}>Always keep your attention on the road ahead. No phone use while the vehicle is in motion.</Text>
                </View>

                <View>
                  <Text style={[styles.infoValue, { color: '#10B981' }]}>2. Regular Breaks</Text>
                  <Text style={[styles.infoSubvalue, { marginTop: 4 }]}>Take a 15-minute break every 2 hours of continuous driving to prevent fatigue.</Text>
                </View>

                <View>
                  <Text style={[styles.infoValue, { color: '#10B981' }]}>3. Seatbelt Mandatory</Text>
                  <Text style={[styles.infoSubvalue, { marginTop: 4 }]}>Ensure all passengers are buckled up before starting the trip.</Text>
                </View>

                <View>
                  <Text style={[styles.infoValue, { color: '#10B981' }]}>4. Speed Limits</Text>
                  <Text style={[styles.infoSubvalue, { marginTop: 4 }]}>Adhere to posted speed limits and adjust for weather conditions.</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.settingsButton, { marginTop: 24 }]} onPress={() => setRulesVisible(false)}>
              <Text style={styles.settingsText}>I Understand</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileVisible}
        animationType="slide"
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.sectionTitle}>Edit Personal Info</Text>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <View style={{ gap: 20 }}>
              <View>
                <Text style={styles.infoLabel}>Full Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View>
                <Text style={styles.infoLabel}>Email</Text>
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View>
                <Text style={styles.infoLabel}>Phone</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  style={styles.input}
                  placeholder="Phone"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity
                  style={[styles.settingsButton, { backgroundColor: '#4B5563', flex: 1, marginTop: 0 }]}
                  onPress={() => setEditProfileVisible(false)}
                  disabled={isUpdating}
                >
                  <Text style={styles.settingsText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.settingsButton, { flex: 1, marginTop: 0 }]}
                  onPress={handleUpdateProfile}
                  disabled={isUpdating}
                >
                  <Text style={styles.settingsText}>{isUpdating ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Alert History Modal */}
      <Modal
        visible={alertHistoryVisible}
        animationType="slide"
        onRequestClose={() => setAlertHistoryVisible(false)}
      >
        <SafeAreaView style={styles.container}>
          <LinearGradient
            colors={['#111827', '#1f2937']}
            style={styles.header}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.sectionTitle}>Alert History</Text>
              <TouchableOpacity onPress={() => setAlertHistoryVisible(false)}>
                <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {(() => {
              const PAGE_SIZE = 25;
              const totalAlerts = getTotalAlertsCount();
              const displayedAlerts = getPaginatedAlerts(0, (currentPage + 1) * PAGE_SIZE);
              const hasMore = displayedAlerts.length < totalAlerts;

              // Helper to get icon and color for alert type
              const getAlertStyle = (type: string) => {
                switch (type) {
                  case 'smoke':
                    return { icon: '🚬', color: '#EF4444' };
                  case 'drowsiness':
                    return { icon: '😴', color: '#F59E0B' };
                  case 'distraction':
                    return { icon: '📱', color: '#3B82F6' };
                  default:
                    return { icon: '⚠️', color: '#6B7280' };
                }
              };

              // Format timestamp
              const formatTime = (timestamp: Date) => {
                const now = new Date();
                const diff = now.getTime() - new Date(timestamp).getTime();
                const minutes = Math.floor(diff / 60000);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);

                if (days > 0) return `${days}d ago`;
                if (hours > 0) return `${hours}h ago`;
                if (minutes > 0) return `${minutes}m ago`;
                return 'Just now';
              };

              return (
                <>
                  {displayedAlerts.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
                      <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
                      <Text style={{ fontSize: 18, color: '#9CA3AF', fontWeight: '600' }}>No Alerts Found</Text>
                      <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Your alert history will appear here</Text>
                    </View>
                  ) : (
                    <>
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                          Showing {displayedAlerts.length} of {totalAlerts} alerts
                        </Text>
                      </View>

                      {displayedAlerts.map((alert, index) => {
                        const style = getAlertStyle(alert.type);
                        return (
                          <View key={alert.id} style={styles.alertCard}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                              <View style={[styles.alertIconContainer, { backgroundColor: style.color + '20' }]}>
                                <Text style={{ fontSize: 24 }}>{style.icon}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                  <Text style={styles.alertTitle}>{alert.title}</Text>
                                  <View style={[styles.severityBadge, {
                                    backgroundColor: alert.severity === 'high' ? '#EF4444' :
                                      alert.severity === 'medium' ? '#F59E0B' : '#10B981'
                                  }]}>
                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                                      {alert.severity.toUpperCase()}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.alertDescription}>{alert.description}</Text>
                                <Text style={styles.alertTime}>{formatTime(alert.timestamp)}</Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}

                      {hasMore && (
                        <TouchableOpacity
                          style={[styles.settingsButton, { marginTop: 8 }]}
                          onPress={() => {
                            setLoadingMore(true);
                            setTimeout(() => {
                              setCurrentPage(prev => prev + 1);
                              setLoadingMore(false);
                            }, 300);
                          }}
                          disabled={loadingMore}
                        >
                          <Text style={styles.settingsText}>
                            {loadingMore ? 'Loading...' : 'View More'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </>
              );
            })()}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: '#374151',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 8,
  },
  safetyScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  infoSubvalue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginHorizontal: 32,
  },
  settingsButton: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  settingsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  editTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0b1220',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  modalText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111827',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 10,
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  sheetItemText: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
  },
  sheetClose: {
    alignSelf: 'center',
    marginTop: 8,
  },
  sheetCloseText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  rulesCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    width: '85%',
  },
  alertCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  alertDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});