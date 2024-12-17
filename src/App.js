import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import IncidentReport from "./components/IncidentReport";
import Admin from "./components/Admin";
import Users from "./components/Users";
import Profile from "./components/Profile";
import ViewComplaint from "./components/ViewComplaint";
import Pending from "./components/Complaints/Pending";
import OnProgress from "./components/Complaints/OnProgress";
import Solved from "./components/Complaints/Solved";
import Unsolved from "./components/Complaints/Unsolved";
import AdminLogin from "./components/AdminLogin";
import ProtectedRoute from "./components/utils/ProtectedRoutes";
import { supabase } from "./components/utils/supabaseClient";
import ParkingData from "./components/ParkingData";
import Settings from "./components/Settings";
import ConfirmationPage from "./components/utils/ConfirmationPage";

function App() {
  const [authenticated, setAuthenticated] = useState(null);

  // Check if the user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthenticated(!!data.session); // Set true if a session exists
    };

    // Listen for session changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthenticated(!!session); // Update authenticated state based on session
      }
    );

    checkAuth(); // Initial check

    // Cleanup listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Show a loader until authentication status is determined
  if (authenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Default Route */}
        <Route
          path="/"
          element={
            authenticated ? (
              <Navigate to="/profile" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Login Route */}
        <Route
          path="/login"
          element={
            authenticated ? <Navigate to="/profile" replace /> : <Login />
          }
        />

        {/* Register Route */}
        <Route
          path="/register"
          element={
            authenticated ? <Navigate to="/profile" replace /> : <Register />
          }
        />

        {/* Admin Login Route */}
        <Route
          path="/admin-login"
          element={
            authenticated ? <Navigate to="/admin" replace /> : <AdminLogin />
          }
        />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            authenticated ? (
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            ) : (
              <Navigate to="/admin-login" replace />
            )
          }
        />

        {/* Users Route - Admin only */}
        <Route
          path="/users"
          element={
            authenticated ? (
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            ) : (
              <Navigate to="/admin-login" replace />
            )
          }
        />

        {/* User Routes */}
        <Route
          path="/profile"
          element={
            authenticated ? (
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/view-complaints"
          element={
            authenticated ? (
              <ProtectedRoute>
                <ViewComplaint />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/incident-report"
          element={
            authenticated ? (
              <ProtectedRoute>
                <IncidentReport />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/Pending"
          element={
            authenticated ? (
              <ProtectedRoute>
                <Pending />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/OnProgress"
          element={
            authenticated ? (
              <ProtectedRoute>
                <OnProgress />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/Solved"
          element={
            authenticated ? (
              <ProtectedRoute>
                <Solved />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/Unsolved"
          element={
            authenticated ? (
              <ProtectedRoute>
                <Unsolved />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/parking-data"
          element={
            <ProtectedRoute>
              <ParkingData />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<Settings />} />

        {/* Confirmation Page Route */}
        <Route path="/confirm-email" element={<ConfirmationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
