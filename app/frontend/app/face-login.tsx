import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, Animated, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { faceLogin, manualLogin } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';

// Only import Vision Camera on native platforms (frame processor disabled for stability)
let Camera: any, useCameraDevice: any, useCameraPermission: any;
if (Platform.OS !== 'web') {
  const VisionCamera = require('react-native-vision-camera');
  Camera = VisionCamera.Camera;
  useCameraDevice = VisionCamera.useCameraDevice;
  useCameraPermission = VisionCamera.useCameraPermission;
}

export default function FaceLoginScreen() {
  const { hasPermission, requestPermission } = useCameraPermission ? useCameraPermission() : { hasPermission: false, requestPermission: () => Promise.resolve(false) };
  const device = useCameraDevice ? useCameraDevice('front') : null;
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Keep ref in sync for async callbacks
  useEffect(() => {
    isModalOpenRef.current = showPasswordModal;
    if (showPasswordModal) {
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
      setIsCapturing(false);
    } else {
      // Reset state when returning from modal to allow auto-capture
      setHasAttempted(false);
      setScanStatus('Scanning your face...');
    }
  }, [showPasswordModal]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successUser, setSuccessUser] = useState<any>(null);
  const [scanStatus, setScanStatus] = useState('Initializing camera...');
  const [cameraReady, setCameraReady] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const cameraRef = useRef<any>(null);
  const retryTimerRef = useRef<any>(null);
  const isModalOpenRef = useRef(false);
  const router = useRouter();
  const { setAuth } = useAuth();
  const [faceDetected, setFaceDetected] = useState(false);
  const faceDetectedRef = useRef(false);
  const lastFaceDetectedTime = useRef(0);
  const isAutoCapturing = useRef(false);



  // Animation for scanning effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for frame
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => {
      pulse.stop();
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    };
  }, []);

  // Scan line animation - always running when not capturing
  useEffect(() => {
    if (!isCapturing) {
      const scanAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      scanAnimation.start();
      return () => scanAnimation.stop();
    }
  }, [isCapturing]);

  // Request camera permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    } else {
      setShowCamera(true);
    }
  }, [hasPermission]);

  // Auto-capture when camera is ready (NO CLICK REQUIRED)
  useEffect(() => {
    if (cameraReady && !hasAttempted && !isCapturing && !showPasswordModal) {
      // Give user 2.5 seconds to position their face
      setScanStatus('Position your face in the frame...');
      setFaceDetected(true); // Show green border immediately

      const timer = setTimeout(() => {
        setScanStatus('Capturing...');
        handleAutoCapture();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [cameraReady, hasAttempted, isCapturing, showPasswordModal]);

  // Set camera ready when device is available
  useEffect(() => {
    if (device && hasPermission) {
      console.log('📷 Camera device is ready');
      setCameraReady(true);
      setScanStatus('Scanning your face...');
    }
  }, [device, hasPermission]);



  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert('Camera permission required', 'Please allow camera access to use face login.');
      return;
    }
    setShowCamera(true);
  };

  const handleClose = () => {
    Alert.alert(
      'Close App',
      'Are you sure you want to close the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close', style: 'destructive', onPress: () => {
            setShowCamera(false);
          }
        },
      ]
    );
  };

  // Auto-capture and verify
  const handleAutoCapture = async () => {
    if (!cameraRef.current || isCapturing || isModalOpenRef.current) {
      return;
    }

    try {
      setIsCapturing(true);
      setHasAttempted(true);
      setScanStatus('Verifying identity...');

      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });

      const photoUri = `file://${photo.path}`;

      console.log('📸 Photo captured, sending to server...');
      const result = await faceLogin(photoUri);
      console.log('✅ Face login successful');

      // 🚫 Block admin access - app is for drivers only
      if (result.user?.role === 'admin') {
        Alert.alert(
          'Access Denied',
          'This app is for drivers only. Please use the web dashboard to manage your fleet.',
          [{ text: 'OK' }]
        );
        setIsCapturing(false);
        setHasAttempted(false);
        setScanStatus('Position your face in the frame...');
        return;
      }

      setAuth({ user: result.user, token: result.token });
      setSuccessUser(result.user);
      setShowSuccess(true);
      setShowCamera(false); // 🛑 Disable camera immediately after successful auth

      // 🔊 Voice welcome message
      const driverName = result.user?.name || 'Driver';
      Speech.speak(`Welcome back, ${driverName}. Drive safely!`, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
      });

      // Auto navigate after 3 seconds (longer to hear the voice)
      setTimeout(() => {
        setShowSuccess(false);
        router.replace('/(tabs)');
      }, 3000);
    } catch (err: any) {
      console.log('❌ Face auth failed:', err.message);
      setScanStatus('Face not recognized - retrying...');
      setIsCapturing(false);
      isAutoCapturing.current = false;
      faceDetectedRef.current = false;
      setFaceDetected(false);

      // Don't retry if modal is open
      if (isModalOpenRef.current) return;

      // AUTOMATIC RETRY after 3 seconds - NO CLICK REQUIRED
      setTimeout(() => {
        setScanStatus('Position your face in the frame...');
        setHasAttempted(false); // Reset so auto-capture triggers again
        setFaceDetected(true); // Show green border
      }, 3000);
    }
  };

  const handleRetry = () => {
    if (!isCapturing) {
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
      setHasAttempted(false);
      setCameraReady(false);
      setScanStatus('Scanning your face...');
      // Force camera ready again
      setTimeout(() => {
        setCameraReady(true);
      }, 300);
    }
  };

  const handleManualLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing information', 'Please enter both email and password.');
      return;
    }

    try {
      setIsManualSubmitting(true);
      const result = await manualLogin(email.trim().toLowerCase(), password);

      // 🚫 Block admin access - app is for drivers only
      if (result.user?.role === 'admin') {
        Alert.alert(
          'Access Denied',
          'This app is for drivers only. Please use the web dashboard to manage your fleet.',
          [{ text: 'OK' }]
        );
        setIsManualSubmitting(false);
        return;
      }

      setAuth({ user: result.user, token: result.token });
      setSuccessUser(result.user);
      setShowSuccess(true);
      setShowPasswordModal(false);

      // 🔊 Voice welcome message
      const driverName = result.user?.name || 'Driver';
      Speech.speak(`Welcome back, ${driverName}. Drive safely!`, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
      });

      // Auto navigate after 3 seconds (longer to hear the voice)
      setTimeout(() => {
        setShowSuccess(false);
        router.replace('/(tabs)');
      }, 3000);
    } catch (err: any) {
      Alert.alert('Login failed', err.message ?? 'Unable to sign in');
    } finally {
      setIsManualSubmitting(false);
    }
  };

  // Success screen with tick
  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successContent}>
          <View style={styles.tickContainer}>
            <View style={styles.tickCircle}>
              <Text style={styles.tick}>✓</Text>
            </View>
          </View>
          <Text style={styles.successTitle}>Welcome back!</Text>
          {successUser && (
            <Text style={styles.successSubtitle}>{successUser.name}</Text>
          )}
        </View>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.statusText}>Camera permission is required for face login</Text>
        <TouchableOpacity style={styles.passwordButton} onPress={requestPermission}>
          <Text style={styles.passwordButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.passwordButton, { marginTop: 16 }]} onPress={handleClose}>
          <Text style={styles.passwordButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (showCamera && hasPermission && device) {
    return (
      <>
        <View style={styles.cameraContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top', 'left']}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </SafeAreaView>

          <Camera
            style={StyleSheet.absoluteFill}
            ref={cameraRef}
            device={device}
            isActive={showCamera && !showPasswordModal}
            photo={true}
          />

          {/* Face detection overlay */}
          <TouchableOpacity
            style={styles.faceOverlay}
            onPress={handleRetry}
            activeOpacity={0.9}
          >
            <Animated.View
              style={[
                styles.faceFrame,
                {
                  transform: [{ scale: pulseAnim }],
                  borderColor: isCapturing ? '#F59E0B' : (faceDetected ? '#10B981' : '#6B7280'),
                  borderWidth: faceDetected ? 4 : 2,
                }
              ]}
            >
              {/* Scan line animation */}
              {!isCapturing && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [{
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 280],
                        })
                      }]
                    }
                  ]}
                />
              )}
            </Animated.View>
          </TouchableOpacity>

          <SafeAreaView style={styles.cameraOverlay} edges={['bottom', 'right']}>
            <View style={styles.overlayContent}>
              {/* Status text */}
              <View style={styles.statusContainer}>
                {isCapturing ? (
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                ) : (
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: '#10B981' }
                  ]} />
                )}
                <Text style={styles.statusText}>{scanStatus}</Text>
              </View>

              <Text style={styles.cameraTitle}>
                {isCapturing ? 'Please wait...' : 'Position your face in the frame'}
              </Text>

              <TouchableOpacity
                style={styles.passwordButton}
                onPress={() => {
                  if (retryTimerRef.current) clearInterval(retryTimerRef.current);
                  setShowPasswordModal(true);
                }}
              >
                <Text style={styles.passwordButtonText}>🔒 Use Password Instead</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Password Modal */}
        <Modal
          visible={showPasswordModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <KeyboardAvoidingView
              behavior="padding"
              style={{ flex: 1 }}
            >
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                <TouchableOpacity
                  style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }}
                  activeOpacity={1}
                  onPress={Keyboard.dismiss}
                >
                  <View
                    style={styles.modalContent}
                    onStartShouldSetResponder={() => true}
                    onTouchEnd={(e) => e.stopPropagation()}
                  >
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Enter Password</Text>
                      <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                        <Text style={styles.closeButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Email address"
                      placeholderTextColor="#6B7280"
                      style={styles.input}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoFocus
                    />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Password"
                      placeholderTextColor="#6B7280"
                      style={styles.input}
                      secureTextEntry
                    />

                    <TouchableOpacity
                      style={[styles.button, isManualSubmitting && styles.disabledButton]}
                      onPress={handleManualLogin}
                      disabled={isManualSubmitting}
                    >
                      {isManualSubmitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </>
    );
  }

  // Fallback if camera permission denied
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera Permission Required</Text>
      <TouchableOpacity style={styles.button} onPress={handleRequestPermission}>
        <Text style={styles.buttonText}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  faceOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  faceFrame: {
    width: 250,
    height: 320,
    borderWidth: 3,
    borderRadius: 150,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  overlayContent: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  passwordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    gap: 16,
  },
  tickContainer: {
    marginBottom: 8,
  },
  tickCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#34D399',
  },
  tick: {
    fontSize: 60,
    color: '#fff',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  successSubtitle: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  input: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    marginBottom: 12,
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
});
