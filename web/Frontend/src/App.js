import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import DriverDashboard from './pages/DriverDashboard';
import VehicleManagement from './pages/VehicleManagement';
import UsersPage from './pages/UsersPage';
import TripsPage from './pages/TripsPage';
import IncidentsPage from './pages/IncidentsPage';
import DriverTripsPage from './pages/DriverTripsPage';
import DriverIncidentsPage from './pages/DriverIncidentsPage';
import DriverVehiclesPage from './pages/DriverVehiclesPage';
import DriverReportsPage from './pages/DriverReportsPage';
import DriverLogsPage from './pages/DriverLogsPage';

import ReportsPage from './pages/ReportsPage';
import LiveMonitorPage from './pages/LiveMonitorPage';
import AdminProfile from './pages/AdminProfile';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Simulate 10-second loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 10000);

    // Check for existing user session
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    return () => clearTimeout(timer);
  }, []);

  const handleLoadingComplete = () => {
    setLoading(false);
  };

  // Update user state when it changes (after login/register)
  const updateUser = (userData) => {
    setUser(userData);
  };

  if (loading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e3a8a',
                color: '#fff',
                border: '1px solid #3b82f6',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={
                user ?
                  <Navigate to={user.role === 'admin' ? '/dashboard' : '/driver-dashboard'} /> :
                  <LoginPage updateUser={updateUser} />
              }
            />
            <Route
              path="/register"
              element={
                user ?
                  <Navigate to="/driver-dashboard" /> :
                  <RegisterPage updateUser={updateUser} />
              }
            />
            <Route
              path="/reset-password"
              element={<ResetPasswordPage updateUser={updateUser} />}
            />

            {/* Admin Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                user && user.role === 'admin' ?
                  <Navigate to="/dashboard/trips" /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/dashboard/vehicles"
              element={
                user && user.role === 'admin' ?
                  <VehicleManagement /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/dashboard/trips"
              element={
                user && user.role === 'admin' ?
                  <TripsPage /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/dashboard/incidents"
              element={
                user && user.role === 'admin' ?
                  <IncidentsPage /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/dashboard/users"
              element={
                user && user.role === 'admin' ?
                  <UsersPage /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/dashboard/reports"
              element={
                user && user.role === 'admin' ?
                  <ReportsPage /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/dashboard/live"
              element={
                user && user.role === 'admin' ?
                  <LiveMonitorPage /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                user && user.role === 'admin' ?
                  <AdminProfile /> :
                  <Navigate to="/login" />
              }
            />

            {/* Driver Dashboard Routes */}
            <Route
              path="/driver-dashboard"
              element={
                user ?
                  <Navigate to="/driver-dashboard/trips" /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/driver-dashboard/trips"
              element={
                user ?
                  <DriverTripsPage /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/driver-dashboard/incidents"
              element={
                user ?
                  <DriverIncidentsPage /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/driver-dashboard/vehicles"
              element={
                user ?
                  <DriverVehiclesPage /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/driver-dashboard/reports"
              element={
                user ?
                  <DriverReportsPage /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/driver-dashboard/logs"
              element={
                user ?
                  <DriverLogsPage /> :
                  <Navigate to="/login" />
              }
            />
            <Route
              path="/driver-dashboard/profile"
              element={
                user ?
                  <DriverDashboard /> :
                  <Navigate to="/login" />
              }
            />

            {/* Default redirect */}
            <Route
              path="*"
              element={
                user ?
                  <Navigate to={user.role === 'admin' ? '/dashboard' : '/driver-dashboard'} /> :
                  <Navigate to="/" />
              }
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
