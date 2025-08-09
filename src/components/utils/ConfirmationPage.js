import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useSearchParams } from "react-router-dom";

const ConfirmationPage = () => {
  const [status, setStatus] = useState("Verifying...");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("access_token");
      if (!token) {
        setStatus("Invalid confirmation link.");
        return;
      }

      
      const { error } = await supabase.auth.verifyOtp({
        type: "signup",
        token,
      });

      if (error) {
        setStatus("Email confirmation failed. Please try again.");
      } else {
        setStatus("Email confirmed successfully! You can now log in.");
      }
    };

    verifyToken();
  }, [searchParams]);

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h2>Email Confirmation</h2>
      <p>{status}</p>
    </div>
  );
};

export default ConfirmationPage;
