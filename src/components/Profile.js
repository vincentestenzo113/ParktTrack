import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./utils/supabaseClient";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faFileAlt,
  faSignOutAlt,
  faUser,
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import favicon from "./public/profile-icon.png";
import logo from "./public/parktracklogo.png";
import logo2 from "./public/logosaparktrack.png";

const Profile = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [hasCooldown, setHasCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  const tips = [
    "Remember to submit proof for all complaints to increase processing speed.",
    "Check your cooldown status before submitting another report.",
    "Use clear descriptions for incidents to help the admin team understand the issue.",
    "Click on 'View Complaints' to check your complaint's status.",
  ];

  const [slotsLeft, setSlotsLeft] = useState(150); // Initial state

  // Function to fetch the current slots left from the Flask API
  const fetchSlotsLeft = async () => {
    try {
      const response = await fetch("http://192.168.1.12:5000/get_slots"); // Update with the Flask server URL
      if (!response.ok) {
        throw new Error("Failed to fetch slots");
      }
      const data = await response.json();
      setSlotsLeft(data.slots_left); // Update the state with the fetched slots
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  // Use `useEffect` to fetch slots when the component loads and every 5 seconds
  useEffect(() => {
    fetchSlotsLeft(); // Initial fetch
    const interval = setInterval(fetchSlotsLeft, 2000); // Fetch every 5 seconds
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error getting user:", userError.message);
        toast.error("Failed to get user data. Please log in again.");
        navigate("/login");
        return;
      }
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("student_id, name, email, plate_number")
          .eq("id", user.id)
          .single();
        if (error) {
          console.error("Error fetching user data:", error.message);
          toast.error("Error fetching user profile data.");
          return;
        }
        setUserInfo(data);
        checkReportCooldown(data.student_id);
      } else {
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate]);

  const checkReportCooldown = async (student_id) => {
    const { data: reports, error } = await supabase
      .from("incident_report")
      .select("submitted_at")
      .eq("student_id", student_id)
      .order("submitted_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching cooldown status:", error.message);
      toast.error("Failed to fetch cooldown status.");
      return;
    }

    if (reports.length > 0) {
      const lastSubmittedAt = new Date(reports[0].submitted_at);
      const currentTime = new Date();
      const timeDiff = currentTime - lastSubmittedAt;

      if (timeDiff < 86400000) {
        setHasCooldown(true);
        setCooldownTime(Math.floor((86400000 - timeDiff) / 1000));

        const countdown = setInterval(() => {
          setCooldownTime((prev) => {
            if (prev <= 1) {
              clearInterval(countdown);
              setHasCooldown(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const formatCooldownTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h:${minutes}m`;
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      toast.error("Error signing out. Please try again.");
      return;
    }
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="bottom-nav-container">
        <div className="bottom-nav">
          <button className="active">
            <FontAwesomeIcon icon={faUser} />
          </button>
          <button onClick={() => navigate("/view-complaints")}>
            <FontAwesomeIcon icon={faComments} />
          </button>
          <button onClick={() => navigate("/incident-report")}>
            <FontAwesomeIcon icon={faFileAlt} />
          </button>
        </div>
      </div>
      <div className="header-container">
        <div className="header-left">
          <img src={logo} className="logo1" alt="logo1" />
          <img src={logo2} className="logo2" alt="logo2" />
          <div className="logo-title">
            PARK <br /> TRACK
          </div>
        </div>
        <div className="header-right">
          <div>
            <FontAwesomeIcon icon={faBell} />
          </div>
          <div>{userInfo.name}</div>
        </div>
      </div>
      <div className="profile-sidebar">
        <div className="profile-icon-inner">
          <img src={favicon}></img>
        </div>
        <p>{userInfo.name}</p>
        <button className="profile-sidebar-button-active">
          <FontAwesomeIcon icon={faUser} /> Profile
        </button>
        <button
          className="profile-sidebar-button"
          onClick={() => navigate("/view-complaints")}
        >
          <FontAwesomeIcon icon={faComments} /> View Complaints
        </button>
        <button
          className="profile-sidebar-button"
          onClick={() => navigate("/incident-report")}
        >
          <FontAwesomeIcon icon={faFileAlt} /> Report Incident
        </button>
        <button className="profile-logout-button" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Logout
        </button>
      </div>
      <div className="profile-content">
        <div className="profile-welcome">
          <h1>Welcome to PARKTRACK, {userInfo.name}</h1>
        </div>
        <div className="profile-boxcontainer">
          <div className="profile-information">
            <h3>User Information</h3>
            <p>
              <strong>Email:</strong> {userInfo.email}
            </p>
            <p>
              <strong>Student ID:</strong> {userInfo.student_id}
            </p>
            <p>
              <strong>Plate Number:</strong> {userInfo.plate_number}
            </p>
          </div>
          <div className="profile-reportstatus">
            <div className="cooldown-container">
              <div className="cooldown-inner">
                <p>
                  {hasCooldown ? (
                    <>
                      <span className="cooldown-label">Cooldown</span>
                      <br />
                      <span className="cooldown-time">
                        {formatCooldownTime(cooldownTime)}
                      </span>
                    </>
                  ) : (
                    <span className="cooldown-text">1</span>
                  )}
                </p>
                <h3>Report Available</h3>
              </div>
            </div>
            <div className="cooldown-container">
              <div className="cooldown-inner">
                <p>
                  <span className="cooldown-text">{slotsLeft}</span>
                </p>
                <h3>Slot Left</h3>
              </div>
            </div>
          </div>
        </div>
        <div className="profile-boxcontainer">
          <div className="profile-tips">
            <h3>Helpful Tips:</h3>
            <ul>
              {tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
          <div className="profile-contactus">
            <h2>Contact Us:</h2>
            <p>support@parktrack.com</p>
            <p>2024 PARKTRACK INC Tel: +639355380789</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
