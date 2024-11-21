import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import IncidentReport from './components/IncidentReport';
import Admin from './components/Admin';
import Users from './components/Users'; // Ensure this is the correct path for the Users component
import Profile from './components/Profile';
import ViewComplaint from './components/ViewComplaint';
import Pending from './components/Complaints/Pending';
import OnProgress from './components/Complaints/OnProgress';
import Solved from './components/Complaints/Solved';
import AdminLogin from './components/AdminLogin'; // Admin Login component
import ProtectedRoute from './components/utils/ProtectedRoutes';
import { gsap } from 'gsap';

// PageTransition component to animate page changes
const PageTransition = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    const timeline = gsap.timeline();

    // Animate page content on transition: fade-in and slide
    timeline.fromTo(
      ".page", 
      { opacity: 0, scale: 0.9 }, 
      { opacity: 1, scale: 1, duration: 0.25 }
    );

    // Cleanup the timeline when the component unmounts
    return () => timeline.kill();
  }, [location]);

  return <div className="page-transition">{children}</div>;
};

function App() {
  return (
    <Router>
      <PageTransition> {/* Wrap Routes with PageTransition */}
        <Routes>
          <Route path="/" element={<div><Dashboard /></div>} />
          <Route path="/login" element={<div className="page"><Login /></div>} />
          <Route path="/register" element={<div className="page"><Register /></div>} />
          
          {/* Admin Login Route */}
          <Route path="/admin-login" element={<div className="page"><AdminLogin /></div>} />

          {/* Admin Route (admin-only) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <div className="page"><Admin /></div>
              </ProtectedRoute>
            }
          />
          
          {/* Users Route - Admin only */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRole="admin">
                <div className="page"><Users /></div>
              </ProtectedRoute>
            }
          />

          {/* Normal User Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div className="page"><Profile /></div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-complaints"
            element={
              <ProtectedRoute>
                <div className="page"><ViewComplaint /></div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/incident-report"
            element={
              <ProtectedRoute>
                <div className="page"><IncidentReport /></div>
              </ProtectedRoute>
            }
          />
          <Route
            path='/Pending'
            element={
              <ProtectedRoute>
                <div className="page"><Pending /></div>
              </ProtectedRoute>
            }
          />
          <Route
            path='/OnProgress'
            element={
              <ProtectedRoute>
                <div className="page"><OnProgress /></div>
              </ProtectedRoute>
            }
          />
          <Route
            path='/Solved'
            element={
              <ProtectedRoute>
                <div className="page"><Solved /></div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </PageTransition>
    </Router>
  );
}

export default App;
