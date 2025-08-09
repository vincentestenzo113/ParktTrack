import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [loginPath, setLoginPath] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          setUser(null); 
        } else {
          setUser(data.user); 
          setLoginPath(window.location.pathname);
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

  if (!user) {
    navigate("/login");
    return null;
  }

  if (user) {
    if (loginPath === "/admin-login" && window.location.pathname === "/profile") {
      navigate("/admin");
      return null;
    }
    if (loginPath === "/login" && window.location.pathname === "/admin") {
      navigate("/profile");
      return null;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
