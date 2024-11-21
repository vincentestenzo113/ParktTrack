import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Make sure this path is correct

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get the user object
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Error fetching user:", error);
          setUser(null); // No user found
        } else {
          setUser(data.user); // Set the authenticated user
        }
      } catch (error) {
        console.error("Error during user check:", error);
        setUser(null); // No user found
      } finally {
        setLoading(false); // Set loading state to false once the check is complete
      }
    };

    checkUser();
  }, []);

  if (loading) {
    // Optionally, show a loading spinner or similar while checking the user
    return <div>Loading...</div>;
  }

  if (!user) {
    // If no user is found, redirect to the login page
    navigate('/login');
    return null;
  }

  return <>{children}</>; // Render protected content if the user is authenticated
};

export default ProtectedRoute;
