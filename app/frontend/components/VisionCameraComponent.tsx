import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { getSocket } from '../lib/socket';
import { useAuth } from '../lib/auth-context';
import { monitorMobile } from '../lib/api';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';

import * as Haptics from 'expo-haptics';
// Conditional import for expo-audio/av/speech to prevent crash on old builds
let Audio: any;
let useAudioPlayer: any;
let Speech: any;
try {
    const expoAudio = require('expo-audio');
    Audio = expoAudio.Audio;
    useAudioPlayer = expoAudio.useAudioPlayer;
} catch (e) {
    try {
        Audio = require('expo-av').Audio;
    } catch (e2) {
        console.warn('Audio libraries not found in native build');
    }
}

try {
    Speech = require('expo-speech');
} catch (e) {
    console.warn('expo-speech not found in native build');
}


// Only import Vision Camera on native platforms
let Camera: any, useCameraDevice: any, useCameraPermission: any;
if (Platform.OS !== 'web') {
    const VisionCamera = require('react-native-vision-camera');
    Camera = VisionCamera.Camera;
    useCameraDevice = VisionCamera.useCameraDevice;
    useCameraPermission = VisionCamera.useCameraPermission;
}

interface VisionCameraComponentProps {
    isStreaming: boolean;
}

export const VisionCameraComponent: React.FC<VisionCameraComponentProps> = ({ isStreaming }) => {
    const { hasPermission, requestPermission } = useCameraPermission ? useCameraPermission() : { hasPermission: false, requestPermission: () => { } };
    const device = useCameraDevice ? useCameraDevice('front') : null;
    const cameraRef = useRef<any>(null);
    const { user, token } = useAuth();
    const socket = getSocket();

    const [isActive, setIsActive] = useState(true);
    const [activeAlert, setActiveAlert] = useState<string | null>(null);
    const isCapturing = useRef(false);
    const lastMLCheck = useRef(0);
    const locationRef = useRef<{ latitude: number; longitude: number } | undefined>(undefined);
    const soundRef = useRef<any>(null);

    // Initialize audio player if using expo-audio
    const audioPlayer = useAudioPlayer ? useAudioPlayer('https://www.soundjay.com/buttons/beep-01a.mp3') : null;


    // Load sound on mount
    useEffect(() => {
        return () => {
            if (soundRef.current) {
                console.log('Unloading Sound');
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const playAlertSound = async (type?: string) => {
        try {
            // Haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            // 1. Try Voice Alert (expo-speech) - This provides the "Voice Message" requested
            if (Speech) {
                let message = "Warning";
                if (type === 'MOBILE PHONE') message = "Warning: Mobile phone usage detected. Please focus on the road.";
                if (type === 'DROWSINESS') message = "Warning: Drowsiness detected. Please stay alert.";
                if (type === 'YAWNING') message = "Alert: You seem tired. Consider taking a break.";

                Speech.speak(message, {
                    pitch: 1.0,
                    rate: 0.9,
                });
                console.log('🗣️ Voice alert played:', message);
            }

            // 2. Try expo-audio beep (backup/simultaneous)
            if (audioPlayer) {
                audioPlayer.play();
                console.log('🔔 Alert beep played (expo-audio)');
                return;
            }

            // 3. Fallback to expo-av (old style)
            if (Audio && Audio.Sound) {
                if (soundRef.current) {
                    try { await soundRef.current.unloadAsync(); } catch (e) { }
                }
                const { sound } = await Audio.Sound.createAsync(
                    { uri: 'https://www.soundjay.com/buttons/beep-01a.mp3' },
                    { shouldPlay: true }
                );
                soundRef.current = sound;
                console.log('🔔 Alert beep played (expo-av fallback)');
                return;
            }

            console.log('⚠️ Audio skipped: No audio/speech libraries available');
        } catch (error) {
            console.log('Error playing sound/speech:', error);
        }
    };



    // Track location
    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        const startLocationTracking = async () => {
            try {
                const { status } = await Location.getForegroundPermissionsAsync();
                if (status === 'granted') {
                    // Get initial
                    const loc = await Location.getLastKnownPositionAsync();
                    if (loc) {
                        locationRef.current = {
                            latitude: loc.coords.latitude,
                            longitude: loc.coords.longitude
                        };
                    }

                    // Watch
                    subscription = await Location.watchPositionAsync(
                        {
                            accuracy: Location.Accuracy.Balanced,
                            timeInterval: 5000,
                            distanceInterval: 10
                        },
                        (newLoc) => {
                            locationRef.current = {
                                latitude: newLoc.coords.latitude,
                                longitude: newLoc.coords.longitude
                            };
                        }
                    );
                }
            } catch (e) {
                console.log('Location tracking error:', e);
            }
        };

        startLocationTracking();
        return () => {
            if (subscription) subscription.remove();
        };
    }, []);

    // Emit stream start/stop events
    useEffect(() => {
        if (isStreaming && user) {
            console.log('🎥 Vision Camera: Starting stream');
            socket?.emit('start_stream', user._id);
        }

        return () => {
            if (isStreaming && user) {
                console.log('🛑 Vision Camera: Stopping stream');
                socket?.emit('stop_stream', user._id);
            }
        };
    }, [isStreaming, user]);

    // Capture and process frames
    useEffect(() => {
        if (!device || !hasPermission || !user || !token) return;

        const processFrame = async () => {
            if (isCapturing.current || !cameraRef.current) return;

            isCapturing.current = true;
            try {
                // Take photo with Vision Camera (faster than expo-camera)
                const photo = await cameraRef.current.takePhoto({
                    flash: 'off',
                });

                if (photo?.path) {
                    // 1. Compress and Resize image for streaming (480p for better detection)
                    const manipulatedImage = await ImageManipulator.manipulateAsync(
                        `file://${photo.path}`,
                        [{ resize: { height: 480 } }], // 480p is the sweet spot for YOLO accuracy
                        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                    );
                    const base64 = manipulatedImage.base64;

                    // Send to web streaming if active
                    if (isStreaming && socket?.connected && base64) {
                        socket.emit('stream_data', {
                            driverId: user._id,
                            image: base64,
                        });
                    }

                    // Send to ML API (throttled to every 1.2 seconds for stability)
                    const now = Date.now();
                    if (now - lastMLCheck.current >= 1200 && base64) {
                        lastMLCheck.current = now;
                        lastMLCheck.current = now;
                        monitorMobile(token, base64, locationRef.current)
                            .then(result => {
                                if (result.detected) {
                                    console.log('📱 MOBILE DETECTED');
                                    setActiveAlert('MOBILE PHONE');
                                    playAlertSound('MOBILE PHONE');
                                    setTimeout(() => setActiveAlert(null), 3000);
                                } else if (result.drowsiness?.is_drowsy) {
                                    console.log('😴 DROWSINESS DETECTED');
                                    setActiveAlert('DROWSINESS');
                                    playAlertSound('DROWSINESS');
                                    setTimeout(() => setActiveAlert(null), 3000);
                                } else if (result.drowsiness?.is_yawning) {
                                    console.log('🥱 YAWNING DETECTED');
                                    setActiveAlert('YAWNING');
                                    playAlertSound('YAWNING');
                                    setTimeout(() => setActiveAlert(null), 3000);
                                }
                            })


                            .catch(() => {
                                // Silent fail
                            });
                    }
                }
            } catch (error) {
                console.warn('Frame capture error:', error);
            } finally {
                isCapturing.current = false;
            }
        };

        // Interval based on streaming state
        const interval = setInterval(processFrame, isStreaming ? 400 : 1200); // Safe frequency to prevent restriction

        return () => {
            clearInterval(interval);
        };
    }, [device, hasPermission, isStreaming, user, token]);

    if (!hasPermission) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.text}>Camera permission needed for live monitoring</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.button}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.text}>No camera device found</Text>
            </View>
        );
    }

    return (
        <View style={isStreaming ? styles.container : styles.backgroundContainer}>
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isActive}
                photo={true}
            />
            {activeAlert && (
                <View style={styles.alertOverlay}>
                    <Text style={styles.alertText}>{activeAlert} DETECTED!</Text>
                </View>
            )}
        </View>

    );
};

const styles = StyleSheet.create({
    container: {
        width: 1,
        height: 1,
        opacity: 0,
        position: 'absolute',
    },
    backgroundContainer: {
        width: 1,
        height: 1,
        opacity: 0,
        position: 'absolute',
    },
    alertOverlay: {
        display: 'none', // Hide alert overlay as requested
    },
    alertText: {
        display: 'none',
    },
    permissionContainer: {
        padding: 16,
        backgroundColor: '#1f2937',
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'center',
    },
    text: {
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    overlay: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    recordingIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        marginRight: 6,
    },
    recordingText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
