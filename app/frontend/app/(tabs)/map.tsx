import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, Linking, Platform, Keyboard } from "react-native";
import { useFocusEffect } from "expo-router";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";

type LocationType = {
  latitude: number;
  longitude: number;
};

export default function MapScreen() {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [query, setQuery] = useState("");
  const [destination, setDestination] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
      }

      setPermissionStatus(status);

      if (status !== "granted") {
        setErrorMessage("Location permission is required to show your position on the map.");
        setLoading(false);
        return;
      }

      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        setErrorMessage("Please enable location services in your device settings.");
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setErrorMessage(null);
    } catch (error: any) {
      console.error("Location error:", error);
      setErrorMessage(error.message || "Failed to get your location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Replace useEffect with useFocusEffect to refresh when tab is focused
  useFocusEffect(
    useCallback(() => {
      requestLocationPermission();
    }, [])
  );

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const getMapHtml = () => {
    if (!location) return "";

    const centerLat = destination ? (location.latitude + destination.latitude) / 2 : location.latitude;
    const centerLon = destination ? (location.longitude + destination.longitude) / 2 : location.longitude;
    const zoomLevel = destination ? 10 : 15;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
          <style>
            body { margin: 0; padding: 0; height: 100vh; width: 100vw; }
            #map { height: 100%; width: 100%; }
            .leaflet-routing-container { display: none; } /* Hide the turn-by-turn text box */
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([${centerLat}, ${centerLon}], ${zoomLevel});

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OSM'
            }).addTo(map);

            var userIcon = L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });

            var destIcon = L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });

            L.marker([${location.latitude}, ${location.longitude}], {icon: userIcon}).addTo(map)
              .bindPopup('Your Location')
              .openPopup();

            ${destination ? `
              L.marker([${destination.latitude}, ${destination.longitude}], {icon: destIcon}).addTo(map)
                .bindPopup('Destination');
              
              // Add Routing
              L.Routing.control({
                waypoints: [
                  L.latLng(${location.latitude}, ${location.longitude}),
                  L.latLng(${destination.latitude}, ${destination.longitude})
                ],
                lineOptions: {
                  styles: [{ color: '#EF4444', weight: 6 }]
                },
                createMarker: function() { return null; }, // Use our own markers
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: true,
                show: false
              }).addTo(map);
            ` : ''}
          </script>
        </body>
      </html>
    `;
  };

  if (errorMessage) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>📍</Text>
          <Text style={styles.errorTitle}>Location Access Needed</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={requestLocationPermission}>
            <Text style={styles.retryButtonText}>🔄 Try Again</Text>
          </TouchableOpacity>
          {permissionStatus === "denied" && (
            <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search destination"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.goButton}
          onPress={async () => {
            if (!query.trim()) return;
            try {
              setLoading(true);
              const results = await Location.geocodeAsync(query.trim());
              if (results && results[0]) {
                setDestination({
                  latitude: results[0].latitude,
                  longitude: results[0].longitude,
                });
              }
            } catch (e: any) {
              console.warn("Geocoding failed:", e.message);
              // Gracefully handle service availability error
              if (e.message?.includes("Service not Available") || e.message?.includes("Service not available")) {
                alert("Google Location Services are temporarily unavailable on this device. Please try selecting a location manually on the map.");
              } else {
                alert("Could not find that location. Please try a different search term.");
              }
            } finally { setLoading(false); }
          }}
        >
          <Text style={styles.goButtonText}>🧭 Go</Text>
        </TouchableOpacity>
      </View>

      <WebView
        originWhitelist={['*']}
        source={{ html: getMapHtml() }}
        style={styles.map}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.overlayLoading}>
            <ActivityIndicator size="large" color="#EF4444" />
          </View>
        )}
      />

      {loading && (
        <View style={styles.overlayLoading}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  searchBar: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(31,41,55,0.95)",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  errorCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  settingsButton: {
    marginTop: 12,
    paddingVertical: 12,
  },
  settingsButtonText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '500',
  },
  overlayLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
});
