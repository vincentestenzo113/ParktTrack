import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import IncidentReport from "./components/IncidentReport";
import Admin from "./components/Admin";
import Users from "./components/Users"; // Ensure this is the correct path for the Users component
import Profile from "./components/Profile";
import ViewComplaint from "./components/ViewComplaint";
import Pending from "./components/Complaints/Pending";
import OnProgress from "./components/Complaints/OnProgress";
import Solved from "./components/Complaints/Solved";
import AdminLogin from "./components/AdminLogin"; // Admin Login component
import ProtectedRoute from "./components/utils/ProtectedRoutes";
import { gsap } from "gsap";

// PageTransition component to animate page changes

function App() {
  return (
    <Router>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <Dashboard />
              </div>
            }
          />
          <Route
            path="/login"
            element={
              <div>
                <Login />
              </div>
            }
          />
          <Route
            path="/register"
            element={
              <div>
                <Register />
              </div>
            }
          />

          {/* Admin Login Route */}
          <Route
            path="/admin-login"
            element={
              <div>
                <AdminLogin />
              </div>
            }
          />

          {/* Admin Route (admin-only) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <div>
                  <Admin />
                </div>
              </ProtectedRoute>
            }
          />

          {/* Users Route - Admin only */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRole="admin">
                <div>
                  <Users />
                </div>
              </ProtectedRoute>
            }
          />

          {/* Normal User Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>
                  <Profile />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-complaints"
            element={
              <ProtectedRoute>
                <div>
                  <ViewComplaint />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/incident-report"
            element={
              <ProtectedRoute>
                <div>
                  <IncidentReport />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/Pending"
            element={
              <ProtectedRoute>
                <div>
                  <Pending />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/OnProgress"
            element={
              <ProtectedRoute>
                <div>
                  <OnProgress />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/Solved"
            element={
              <ProtectedRoute>
                <div>
                  <Solved />
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
    </Router>
  );
}

export default App;
