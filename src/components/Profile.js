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
  faBell,
  faPaperPlane,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import favicon from "./public/profile-icon.png";
import logo from "./public/parktracklogo.png";
import logo2 from "./public/logosaparktrack.png";

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
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [slotsLeft, setSlotsLeft] = useState(150); // Initial state
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

  // Use `useEffect` to fetch slots when the component loads and every 2 seconds
  useEffect(() => {
    fetchSlotsLeft(); // Initial fetch
    const interval = setInterval(fetchSlotsLeft, 2000); // Fetch every 2 seconds
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user:", error.message);
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

  useEffect(() => {
    const fetchExistingNotifications = async () => {
      if (!userInfo?.student_id) return;

      const { data, error } = await supabase
        .from('incident_report')
        .select('*')
        .eq('student_id', userInfo.student_id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      if (data && data.length > 0) {
        const formattedNotifications = data.map(report => ({
          id: report.id,
          message: getNotificationMessage(report),
        }));
        setNotifications(formattedNotifications);
        setHasUnreadNotifications(true);
      }
    };

    fetchExistingNotifications();
  }, [userInfo]);

  const getNotificationMessage = (report) => {
    if (report.progress === 1 && report.remarks) {
      return `Your report #${report.id} has been updated`;
    } else if (report.progress === 2) {
      return `Your report #${report.id} has been solved`;
    } else if (report.progress === 0) {
      return `Your report #${report.id} is not solved`;
    }
    return '';
  };

  useEffect(() => {
    const subscribeToReportUpdates = () => {
      if (!userInfo?.student_id) return;

      const subscription = supabase
        .channel('report-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'incident_report',
            filter: `student_id=eq.${userInfo.student_id}`,
          },
          (payload) => {
            console.log('Received update payload:', payload);
            const { new: updatedReport } = payload;
            const notificationMessage = getNotificationMessage(updatedReport);

            if (notificationMessage) {
              setNotifications(prev => [
                { id: updatedReport.id, message: notificationMessage },
                ...prev
              ]);
              setHasUnreadNotifications(true);
            }
          }
        )
        .subscribe();

      return () => subscription.unsubscribe();
    };

    const unsubscribe = subscribeToReportUpdates();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userInfo]);

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

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
    if (!showNotifications) {
      setHasUnreadNotifications(false);
      // Mark notifications as read in the database
      notifications.forEach(async (notification) => {
        await supabase
          .from('incident_report')
          .update({ is_read: true })
          .eq('id', notification.id);
      });
    }
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
          <div onClick={toggleNotifications} style={{ position: "relative", cursor: "pointer" }}>
            <FontAwesomeIcon icon={faBell} />
            {hasUnreadNotifications && <span className="notification-badge">!</span>}
          </div>
          {showNotifications && (
            <div className="notification-bubble">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <p key={notification.id}>{notification.message}</p>
                ))
              ) : (
                <p>No notifications today</p>
              )}
            </div>
          )}
          <div>{userInfo?.name}</div>
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
    </div>
  );
};

export default Profile;