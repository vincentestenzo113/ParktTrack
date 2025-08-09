import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faFileAlt,
  faUser,
  faCog,
  faSignOutAlt,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import favicon from "./public/profile-icon.png";
import logo from "./public/parktracklogo.png";
import logo2 from "./public/logosaparktrack.png";
import Settings from './Settings';

const IncidentReport = () => {
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [isCooldown, setIsCooldown] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [showChat, setShowChat] = useState(
    JSON.parse(localStorage.getItem("showChat")) || false
  );
  const [messages, setMessages] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
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

      // Fetch the user's profile from the profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("name, student_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError.message);
        return;
      }

      setUserInfo({ ...user, ...profile });
      setStudentId(profile.student_id);
    };

    fetchUserData();
  }, []);

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

  useEffect(() => {
    if (showChat) {
      fetchMessages(); 
      const interval = setInterval(fetchMessages, 2000); 

      return () => clearInterval(interval); 
    }
  }, [showChat, userInfo]);

  useEffect(() => {
    const checkCooldown = async () => {
      if (!studentId) return;

      const { data: existingReports, error } = await supabase
        .from('incident_report')
        .select('submitted_at')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching existing reports:', error.message);
        return;
      }

      if (existingReports.length > 0) {
        const lastSubmittedAt = new Date(existingReports[0].submitted_at);
        const currentTime = new Date();
        const timeDiff = currentTime - lastSubmittedAt;

        if (timeDiff < 86400000) {
          setIsCooldown(true);
        }
      }
    };

    checkCooldown();
  }, [studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    
    if (!studentId) {
      setMessage('Student ID is not set. Please try again.');
      return;
    }
    if (!photo) {
      setMessage('Please upload a photo.');
      return;
    }
    if (isCooldown) {
      setMessage('You need to wait 24 hours before submitting another report.');
      return;
    }

    const filePath = `private/${studentId}/${photo.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('incident-report')
      .upload(filePath, photo);
    
    if (uploadError) {
      alert(`Failed to upload image: ${uploadError.message}`);
      return;
    }

    const publicUrl = `${supabase.storageUrl}/object/public/incident-report/${filePath}`;
    const reportData = {
      student_id: studentId, 
      description,
      proof_of_incident: publicUrl,
      incident_date: incidentDate,
      submitted_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('incident_report')
      .insert([reportData]);

    if (insertError) {
      alert(`Failed to submit report: ${insertError.message}`);
      return;
    }

    setShowNotification(true);
    setDescription('');
    setPhoto(null);
    setIncidentDate('');
    setMessage('');
    setTimeout(() => {
      navigate('/profile');
    }, 3000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault(); 

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

    
    setMessages((current) => [
      ...current,
      {
        id: Date.now(), 
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

  return (
    <div className="report1-page">
      <div className="profile-sidebar">
        <div className="logo-container">
          <img src={logo} className="logo1" alt="logo1" />
          <div className="logo-title">PARK <br /> TRACK</div>
        </div>
        <div className="profile-icon-inner">
          <img src={favicon}></img>
        </div>
        <span>{userInfo?.name}</span>
        <button className="profile-sidebar-button" onClick={() => navigate("/profile")}>
          <FontAwesomeIcon icon={faUser} /> Profile
        </button>
        <button className="profile-sidebar-button" onClick={() => navigate("/view-complaints")}>
          <FontAwesomeIcon icon={faComments} /> View Complaints
        </button>
        <button className="profile-sidebar-button-active" onClick={() => navigate("/incident-report")}>
          <FontAwesomeIcon icon={faFileAlt} /> Report Incident
        </button>
        <button className="profile-sidebar-button" onClick={toggleChat}>
          <FontAwesomeIcon icon={faComments} /> Chat with Admin
        </button>
        <button className="profile-sidebar-button" onClick={() => setIsSettingsOpen(true)}>
          <FontAwesomeIcon icon={faCog} /> Settings
        </button>
        <button className="profile-logout-button" onClick={() => {}}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Logout
        </button>
      </div>
      <div className="report1-container">
        <h2 className="section-header">Incident Report</h2>
        <form onSubmit={handleSubmit} className="report1-form">
          <div className="report1-form-group">
            <label className="report1-form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="report1-form-input"
              placeholder="Please provide a clear description of what happened."
            />
          </div>
          <div className="report1-form-group">
            <label className="report1-form-label">Incident Date</label>
            <input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              required
              className="report1-form-input"
            />
          </div>
          <div className="report1-form-group">
            <label className="report1-form-label">Upload Photo</label>
            <input
              type="file"
              onChange={(e) => setPhoto(e.target.files[0])}
              required
              className="report1-form-input"
            />
          </div>
          <div className="report1-button-group">
            <button
              type="button"
              className="report1-back-button"
              onClick={() => navigate('/profile')}
            >
              Back to Profile
            </button>
            <button
              type="submit"
              className="report1-submit-button"
              disabled={isCooldown}
            >
              Submit
            </button>
          </div>
        </form>
        {message && <p className="report1-message">{message}</p>}
      </div>
      {showNotification && (
        <div className="notification-overlay">
          <div className="notification-content">
            <h3>Report Submitted</h3>
            <p>Your report has been submitted successfully!</p>
          </div>
        </div>
      )}
      {showChat && (
        <div className="chat-overlay">
          <div className="chat-container">
            <div className="chat-header">
              <h3>Chat with Admin</h3>
              <button onClick={toggleChat}>×</button>
            </div>
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.sender_id === userInfo.id ? 'user' : 'admin'}`}>
                  <div className="message-content">
                    <p>{msg.message}</p>
                    <small>{new Date(msg.created_at).toLocaleString()}</small>
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
              <button type="submit" className="send-button">
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </form>
          </div>
        </div> 
      )}
      {isSettingsOpen && (
        <Settings 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
      <div className="bottom-section">
          <footer className="admin1-footer">
            <p>
              &copy; 2024 PARKTRACK INC Tel: +639355380789 | Got bugs or errors?
              Contact us here: support@parktrack.com
            </p>
          </footer>
        </div>
    </div>
  );
};

export default IncidentReport;
