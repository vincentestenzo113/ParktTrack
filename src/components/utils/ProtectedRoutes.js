import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          setUser(null); // No user logged in
        } else {
          setUser(data.user); // User logged in
        }
      } catch (error) {
        console.error("Error during user check:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // If there is no user, and they try to access protected pages, redirect to /login
  if (!user) {
    navigate("/login");
    return null;
  }

  // If the user is logged in and tries to access /admin, check if the email is admin@gmail.com
  if (user && window.location.pathname === "/admin") {
    if (user.email !== "admin@gmail.com") {
      // If the user is not admin, redirect them to /profile or another page
      navigate("/profile");
      return null;
    }
  }

  // If the user is logged in and tries to access /admin-login or /login, redirect them to /profile
  if (user && (window.location.pathname === "/admin-login" || window.location.pathname === "/login")) {
    navigate("/profile");
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
