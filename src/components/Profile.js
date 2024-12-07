import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./utils/supabaseClient";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faFileAlt,
  faSignOutAlt,
  faUser,
  faPaperPlane,
  faRightFromBracket,
  faCog,
  faCaretDown,
} from "@fortawesome/free-solid-svg-icons";
import favicon from "./public/profile-icon.png";
import logo from "./public/parktracklogo.png";
import logo2 from "./public/logosaparktrack.png";
import Settings from './Settings';

const Profile = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [hasCooldown, setHasCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [showChat, setShowChat] = useState(
    JSON.parse(localStorage.getItem("showChat")) || false
  );
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const tips = [
    "Remember to submit proof for all complaints to increase processing speed.",
    "Check your cooldown status before submitting another report.",
    "Use clear descriptions for incidents to help the admin team understand the issue.",
    "Click on 'View Complaints' to check your complaint's status.",
  ];

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user:", error.message);
        return;
      }

      // Check if the user is admin and logout
      if (user.email === "admin@gmail.com") {
        handleLogout();
        return;
      }

      // Fetch the user's profile from the profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("name, student_id, motorcycle_model, motorcycle_colorway, contact_number")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError.message);
        return;
      }

      setUserInfo({ ...user, ...profile });

      // Check cooldown status using student_id from profile
      if (profile && profile.student_id) {
        checkReportCooldown(profile.student_id);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userInfo) return;

      const { data: adminUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", "admin@gmail.com")
        .single();

      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(
          `and(sender_id.eq.${userInfo.id},receiver_id.eq.${adminUser.id}),and(sender_id.eq.${adminUser.id},receiver_id.eq.${userInfo.id})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }
      setMessages(data || []);
    };

    fetchMessages();
  }, [userInfo]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: adminUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", "admin@gmail.com")
        .single();

      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${adminUser.id}),and(sender_id.eq.${adminUser.id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }
      setMessages(data || []);
    };

    if (showChat) {
      fetchMessages(); // Initial fetch
      const interval = setInterval(fetchMessages, 2000); // Poll every 2 seconds

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [showChat]);

  const checkReportCooldown = async (student_id) => {
    console.log("Checking cooldown for student_id:", student_id);

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

    console.log("Found reports:", reports);

    if (reports && reports.length > 0) {
      const lastSubmittedAt = new Date(reports[0].submitted_at);
      const currentTime = new Date();
      const timeDiff = currentTime - lastSubmittedAt;
      console.log("Time difference:", timeDiff);

      if (timeDiff < 86400000) {
        setHasCooldown(true);
        setCooldownTime(Math.floor((86400000 - timeDiff) / 1000));

        // Clear any existing interval before setting a new one
        if (window.cooldownInterval) {
          clearInterval(window.cooldownInterval);
        }

        window.cooldownInterval = setInterval(() => {
          setCooldownTime((prev) => {
            if (prev <= 1) {
              clearInterval(window.cooldownInterval);
              setHasCooldown(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Cleanup interval when component unmounts
        return () => {
          if (window.cooldownInterval) {
            clearInterval(window.cooldownInterval);
          }
        };
      } else {
        setHasCooldown(false);
        setCooldownTime(0);
      }
    } else {
      setHasCooldown(false);
      setCooldownTime(0);
    }
  };

  const formatCooldownTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secondsLeft = seconds % 60;
    return `${hours}h:${minutes}m:${secondsLeft}s`;
  };

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      toast.error("Error signing out. Please try again.");
      return;
    }
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  }, [navigate]);

  const fetchMessages = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get admin ID
    const { data: adminUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "admin@gmail.com")
      .single();

    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${adminUser.id}),and(sender_id.eq.${adminUser.id},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }
    setMessages(data || []);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !message.trim()) return;

    const { data: adminUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "admin@gmail.com")
      .single();

    const { error } = await supabase
      .from("chats")
      .insert([
        {
          sender_id: user.id,
          receiver_id: adminUser.id,
          message: message.trim(),
          is_admin: false,
        },
      ]);

    if (error) {
      console.error("Error sending message:", error);
      return;
    }

    // Immediately update the state with the new message
    setMessages((current) => [
      ...current,
      {
        id: Date.now(), // Temporary ID until real-time update
        sender_id: user.id,
        receiver_id: adminUser.id,
        message: message.trim(),
        created_at: new Date().toISOString(),
        is_admin: false,
      },
    ]);

    setMessage(""); // Clear the input field after sending

    // Fetch the latest messages to ensure the chat is up-to-date
    await fetchMessages();

    scrollToBottom(); // Scroll to the bottom to show the new message
  };

  const toggleChat = () => {
    const newShowChat = !showChat;
    setShowChat(newShowChat);
    localStorage.setItem("showChat", JSON.stringify(newShowChat));
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
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
            <span>Profile</span>
          </button>
          <button onClick={() => navigate("/view-complaints")}>
            <FontAwesomeIcon icon={faComments} />
            <span>Complaints</span>
          </button>
          <button onClick={() => navigate("/incident-report")}>
            <FontAwesomeIcon icon={faFileAlt} />
            <span>Report</span>
          </button>
          <button onClick={toggleChat}>
            <FontAwesomeIcon icon={faComments} />
            <span>Chat</span>
          </button>
          <button style={{backgroundColor: "#FF0000"}} onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} />
            <span>Logout</span>
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
          <div className="user-info">
            <span>{userInfo?.name}</span>
            <button onClick={toggleDropdown} className="dropdown-button">
              <FontAwesomeIcon icon={faCaretDown} />
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button onClick={() => setIsSettingsOpen(true)}>
                  <FontAwesomeIcon icon={faCog} /> Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="profile-sidebar">
      <div className="logo-container">
          <img src={logo} className="logo1" alt="logo1" />
          <div className="logo-title">PARK <br /> TRACK</div>
        </div>
        <div className="profile-icon-inner">
          <img src={favicon}></img>
        </div>
        <p>{userInfo.name || "No name available"}</p>
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
        <button
          className="profile-sidebar-button"
          onClick={toggleChat}
        >
          <FontAwesomeIcon icon={faComments} /> Chat with Admin
        </button>
        <button
          className="profile-sidebar-button"
          onClick={() => setIsSettingsOpen(true)}
        >
          <FontAwesomeIcon icon={faCog} /> Settings
        </button>
        <button className="profile-logout-button" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Logout
        </button>
      </div>
      <div className="profile-content">
        <div className="profile-welcome">
          <span className="admin1-header-text">
            Welcome to PARKTRACK, {userInfo.name || "User"}
          </span>
        </div>
        <div className="profile-boxcontainer">
          <div className="profile-information">
            <h3>User Information</h3>
            <p>
              <strong>Email:</strong> {userInfo.email}
            </p>
            <p>
              <strong>Student ID:</strong> {userInfo.student_id || "No student ID available"}
            </p>
            <p>
              <strong>Motorcycle Details:</strong>
              {userInfo.motorcycle_model && userInfo.motorcycle_colorway
                ? `${userInfo.motorcycle_model} - ${userInfo.motorcycle_colorway}`
                : " No motorcycle inputted"}
            </p>
            <p>
              <strong>Contact Number:</strong>{" "}
              {userInfo.contact_number || "No contact number"}
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
                <h3>{hasCooldown ? "Cooldown Active" : "Report Available"}</h3>
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
          <div className="bottom-section">
          <footer className="admin1-footer">
            <p>
              &copy; 2024 PARKTRACK INC Tel: +639355380789 | Got bugs or errors?
              Contact us here: support@parktrack.com
            </p>
          </footer>
        </div>
        </div>
        {showChat && (
          <div className="chat-overlay">
            <div className="chat-container">
              <div className="chat-header">
                <h3>Chat with Admin</h3>
                <button onClick={toggleChat}>×</button>
              </div>
              <div className="chat-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className="message-wrapper">
                    <p className={`message-sender ${msg.sender_id === userInfo.id ? "right" : "left"}`}>
                      <strong>
                        {msg.sender_id === userInfo.id ? "You" : "Admin"}
                      </strong>
                    </p>
                    <div className={`message ${msg.sender_id === userInfo.id ? "user" : "admin"}`}>
                      <div className="message-content">
                        <p>{msg.message}</p>
                        <small>{new Date(msg.created_at).toLocaleTimeString()}</small>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="chat-input">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                />
                <button type="submit">
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      <Settings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

export default Profile;
