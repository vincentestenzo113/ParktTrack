import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import IncidentReport from './components/IncidentReport';
import Admin from './components/Admin';
import Users from './components/Users'; // Ensure this is the correct path for the Users component
import Page1 from './components/Page1';
import Pending from './components/Complaints/Pending';
import OnProgress from './components/Complaints/OnProgress';
import Solved from './components/Complaints/Solved';
import AdminLogin from './components/AdminLogin'; // Admin Login component
import ProtectedRoute from './components/utils/ProtectedRoutes';
import { supabase } from './components/utils/supabaseClient'; // Adjust based on your actual import


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Admin Login Route */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Admin Route (admin-only) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <Admin />
            </ProtectedRoute>
          }
        />
        
        {/* Users Route - Admin only */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRole="admin">
              <Users />
            </ProtectedRoute>
          }
        />

        {/* Normal User Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Page1 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/incident-report"
          element={
            <ProtectedRoute>
              <IncidentReport />
            </ProtectedRoute>
          }
        />
        <Route
          path='/Pending'
          element={
            <ProtectedRoute>
              <Pending />
            </ProtectedRoute>
          }
        />
        <Route
          path='/OnProgress'
          element={
            <ProtectedRoute>
              <OnProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path='/Solved'
          element={
            <ProtectedRoute>
              <Solved />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
