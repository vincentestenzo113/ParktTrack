import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient'; // Ensure you have the correct import
import { Navigate } from 'react-router-dom';

// Protected Admin Route component
const ProtectedAdminRoute = ({ children }) => {
  const [session, setSession] = useState(null);

  // Fetch session on mount
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    getSession();
  }, []); // Empty dependency array ensures this runs once on component mount

  if (session === null) {
    // Return a loading state while fetching the session
    return <div>Loading...</div>;
  }

  // Check if user is an admin
  if (!session || session.user.email !== 'admin@gmail.com') {
    return <Navigate to="/AdminLogin" />;
  }

  return children; // Render children (protected components) if admin
};

export default ProtectedAdminRoute;
