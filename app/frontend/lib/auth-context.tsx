import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import { updateDrivingTime, incrementSafeTripCount } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: any | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  setAuth: (state: AuthState) => void;
  logout: () => Promise<void>;
  startTime: number | null;
  setAlertTriggered: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const START_TIME_KEY = '@driving_start_time';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [alertTriggered, setAlertTriggered] = useState(false);

  // Load persisted start time on mount
  useEffect(() => {
    AsyncStorage.getItem(START_TIME_KEY).then(time => {
      if (time) setStartTime(parseInt(time));
    });
  }, []);

  const setAuth = (state: AuthState) => {
    const isNewLogin = !user && state.user;
    setUser(state.user);
    setToken(state.token);

    // Start tracking if it's a new login OR if we don't have a startTime yet
    if (state.user && (isNewLogin || !startTime)) {
      const now = Date.now();
      setStartTime(now);
      AsyncStorage.setItem(START_TIME_KEY, now.toString());
      // Reset alert flag on login
      setAlertTriggered(false);
    }
  };

  const logout = async () => {
    if (user && token && startTime) {
      try {
        const now = Date.now();
        const durationSeconds = Math.floor((now - startTime) / 1000);

        // Save driving time
        if (durationSeconds > 0) {
          console.log(`🚗 Saving driving time: ${durationSeconds} seconds`);
          await updateDrivingTime(token, durationSeconds);
        }

        // Check for safe trip: no alerts AND minimum 5 minutes (300 seconds)
        const MIN_TRIP_DURATION = 300;
        if (!alertTriggered && durationSeconds >= MIN_TRIP_DURATION) {
          console.log(`✅ Safe trip completed! Incrementing count...`);
          try {
            const result = await incrementSafeTripCount(token);
            console.log(`✅ Safe trip count: ${result.safeTripCount}`);
          } catch (error) {
            console.error('Failed to increment safe trip count:', error);
          }
        } else {
          console.log(`ℹ️ Trip not counted as safe. Alert triggered: ${alertTriggered}, Duration: ${durationSeconds}s`);
        }
      } catch (error) {
        console.error('Failed to save driving time on logout:', error);
      }
    }

    setUser(null);
    setToken(null);
    setStartTime(null);
    setAlertTriggered(false);
    AsyncStorage.removeItem(START_TIME_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, setAuth, logout, startTime, setAlertTriggered }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
