import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./utils/supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import favicon from "./public/profile-icon.png";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDays, isWeekend } from "date-fns";
import {
  faHome,
  faClipboardList,
  faUsers,
  faSignOutAlt,
  faExclamationCircle,
  faSpinner,
  faCheckCircle,
  faUser,
  faSquareParking,
  faTicket,
  faPaperPlane,
  faInbox,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import logo from "./public/parktracklogo.png";
import logo2 from "./public/logosaparktrack.png";

const Admin = () => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [onProgressCount, setOnProgressCount] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [session, setSession] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [rfidTag, setRfidTag] = useState("");
  const [message, setMessage] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setSession(sessionData);

      if (sessionData?.session?.user?.email !== "admin@gmail.com") {
        navigate("/profile");
      }
    };

    checkSession();
    const fetchReportCounts = async () => {
      try {
        const { data: pendingReports } = await supabase
          .from("incident_report")
          .select("*")
          .eq("progress", 0)
          .is("remarks", null);
        setPendingCount(pendingReports.length);

        const { data: onProgressReports } = await supabase
          .from("incident_report")
          .select("*")
          .eq("progress", 1)
          .not("remarks", "is", null);
        setOnProgressCount(onProgressReports.length);

        const { data: solvedReports } = await supabase
          .from("incident_report")
          .select("*")
          .eq("progress", 2)
          .not("remarks", "is", null);
        setSolvedCount(solvedReports.length);
      } catch (error) {
        console.error("Error fetching report counts:", error);
      }
    };

    fetchReportCounts();

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let subscription;

    const fetchMessages = async () => {
      if (!selectedStudent) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .or(`and(sender_id.eq.${selectedStudent.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${selectedStudent.id})`)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      setMessages(data || []);
    };

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      subscription = supabase
        .channel('any_channel_name')
        .on(
          'postgres_changes',
          { 
            event: '*',  // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public', 
            table: 'chats'
          },
          async (payload) => {
            if (payload.new && 
                ((payload.new.sender_id === selectedStudent?.id && payload.new.receiver_id === user.id) ||
                 (payload.new.sender_id === user.id && payload.new.receiver_id === selectedStudent?.id))) {
              setMessages((currentMessages) => [...currentMessages, payload.new]); // Add new message to state
              scrollToBottom();
            }
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status); // Debug log
        });
    };

    setupSubscription(); // Set up real-time updates on component mount

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [selectedStudent]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedStudent) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .or(`and(sender_id.eq.${selectedStudent.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${selectedStudent.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      setMessages(data || []);
    };

    if (showChat && selectedStudent) {
      fetchMessages(); // Initial fetch
      const interval = setInterval(fetchMessages, 2000); // Poll every 2 seconds

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [showChat, selectedStudent]);

  useEffect(() => {
    const fetchConversations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, student_id, name')
        .not('student_id', 'is', null);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Get the latest message and unread count for each student
      const conversationsWithLastMessage = await Promise.all(
        profiles.map(async (profile) => {
          const { data: messages, error: messagesError } = await supabase
            .from('chats')
            .select('*')
            .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${profile.id})`)
            .order('created_at', { ascending: false })
            .limit(1);

          const { count: unreadCount } = await supabase
            .from('chats')
            .select('*', { count: 'exact' })
            .eq('receiver_id', user.id)
            .eq('sender_id', profile.id)
            .eq('is_read', false);

          return {
            ...profile,
            lastMessage: messages?.[0],
            unreadCount: unreadCount || 0
          };
        })
      );

      // Sort conversations by the timestamp of the last message
      conversationsWithLastMessage.sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.created_at) : new Date(0);
        const dateB = b.lastMessage ? new Date(b.lastMessage.created_at) : new Date(0);
        return dateB - dateA;
      });

      setConversations(conversationsWithLastMessage);
    };

    if (session?.session) {
      fetchConversations();
      
      // Subscribe to new messages
      const subscription = supabase
        .channel('chats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
          fetchConversations();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [session?.session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("isAuthenticated");
    navigate("/admin-login");
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const isWeekendDay = (date) => {
    return !isWeekend(date);
  };

  const filterWeekends = (date) => {
    return isWeekend(date);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Trim inputs to prevent leading/trailing spaces
    const trimmedStudentId = studentId.trim();
    const trimmedRfidTag = rfidTag.trim();

    // Check if inputs are valid
    if (!trimmedStudentId || !trimmedRfidTag) {
      setMessage("Please provide both Student ID and RFID Tag.");
      return;
    }

    console.log("Submitting with:", {
      studentId: trimmedStudentId,
      rfidTag: trimmedRfidTag,
    });

    try {
      // Update rfid_tag for the matching student_id
      const { data, error } = await supabase
        .from("profiles")
        .update({ rfid_tag: trimmedRfidTag })
        .eq("student_id", trimmedStudentId)
        .select(); // Select the updated data to check

      if (error) {
        console.error("Supabase Update Error:", error.message);
        setMessage("Failed to assign RFID tag. Please try again.");
      } else {
        console.log("Supabase Update Response:", data);
        if (data && data.length > 0) {
          setMessage("RFID tag assigned successfully!");
        } else {
          setMessage("No matching student found for the provided Student ID.");
        }
      }
    } catch (error) {
      console.error("Error during form submission:", error);
      setMessage("An error occurred. Please try again.");
    }

    // Reset form fields
    setStudentId("");
    setRfidTag("");
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedStudent) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('chats')
      .insert([
        {
          sender_id: user.id,
          receiver_id: selectedStudent.id,
          message: chatMessage.trim(),
          is_admin: true,
          student_id: selectedStudent.student_id
        }
      ]);

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    // Immediately update the state with the new message
    setMessages((current) => [
      ...current,
      {
        id: Date.now(), // Temporary ID until real-time update
        sender_id: user.id,
        receiver_id: selectedStudent.id,
        message: chatMessage.trim(),
        created_at: new Date().toISOString(),
        is_admin: true,
      },
    ]);

    setChatMessage(''); // Clear the input field after sending
    scrollToBottom(); // Scroll to the bottom to show the new message
  };

  const handleSelectConversation = async (student) => {
    setSelectedStudent(student);
    setShowChat(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: messages, error } = await supabase
      .from('chats')
      .select('*')
      .or(`and(sender_id.eq.${student.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${student.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(messages);

    // Mark messages as read
    const { error: updateError } = await supabase
      .from('chats')
      .update({ is_read: true })
      .eq('sender_id', student.id)
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    if (updateError) {
      console.error('Error updating message read status:', updateError);
    }

    // Clear unread notifications
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.student_id === student.student_id
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  };

  const toggleChat = () => {
    const newShowChat = !showChat;
    setShowChat(newShowChat);
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="bottom-nav-container">
        <div className="bottom-nav">
          <button className="active">
            <FontAwesomeIcon icon={faHome} />
            <span>Home</span>
          </button>
          <button onClick={() => navigate("/Pending")}>
            <FontAwesomeIcon icon={faClipboardList} />
            <span>Complaints</span>
          </button>
          <button onClick={() => navigate("/users")}>
            <FontAwesomeIcon icon={faUsers} />
            <span>Users</span>
          </button>
          <button onClick={() => navigate("/parking-data")}>
            <FontAwesomeIcon icon={faSquareParking} />
            <span>Park Data</span>
          </button>
          <button
            onClick={() => {
              setShowChat(true);
              setSelectedStudent(null);
            }}
          >
            <FontAwesomeIcon icon={faInbox} /> Inbox
            {conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0) > 0 && (
              <span className="inbox-badge">
                {conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)}
              </span>
            )}
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
          <div className="admin1-header">
            <div className="admin1-profile">
              <div className="admin1-profile-name">
                <span>Office of Student Affairs</span>
                <br />
                <span>Admin</span>
              </div>
              <FontAwesomeIcon icon={faUser} className="admin1-profile-icon" />
            </div>
          </div>
        </div>
      </div>
      <div className="profile-sidebar">
        <div className="logo-container">
          <img src={logo} className="logo1" alt="logo1" />
          <div className="logo-title">PARK <br /> TRACK</div>
        </div>
        <button className="admin1-sidebar-button-active">
          <FontAwesomeIcon icon={faHome} /> Dashboard
        </button>
        <button
          className="admin1-sidebar-button"
          onClick={() => navigate("/Pending")}
        >
          <FontAwesomeIcon icon={faClipboardList} /> Complaints
        </button>
        <button
          className="admin1-sidebar-button"
          onClick={() => navigate("/users")}
        >
          <FontAwesomeIcon icon={faUsers} /> Registered Users
        </button>
        <button
          className="admin1-sidebar-button"
          onClick={() => navigate("/parking-data")}
        >
          <FontAwesomeIcon icon={faClipboardList} /> Parking Data
        </button>
        <button
          className="admin1-sidebar-button"
          onClick={() => {
            setShowChat(true);
            setSelectedStudent(null);
          }}
        >
          <FontAwesomeIcon icon={faInbox} /> Inbox
          {conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0) > 0 && (
            <span className="inbox-badge">
              {conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0)}
            </span>
          )}
        </button>
        <button className="profile-logout-button" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Logout
        </button>
      </div>

      {/* Modal for RFID Form */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="rfid-form">
              <h3 className="form-title">Assign RFID to Student</h3>
              <form onSubmit={handleFormSubmit} className="admin1-rfid-form">
                <label className="admin1-form-label">Student ID:</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="admin1-form-input"
                  placeholder="Enter Student ID"
                />
                <label className="admin1-form-label">RFID Tag:</label>
                <input
                  type="text"
                  value={rfidTag}
                  onChange={(e) => setRfidTag(e.target.value)}
                  className="admin1-form-input"
                  placeholder="Enter RFID Tag"
                />
                <button type="submit" className="admin1-submit-button">
                  Assign
                </button>
              </form>
              {message && <p className="admin1-message">{message}</p>}
              <button onClick={toggleModal} className="close-modal-button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-content">
        <div className="profile-welcome">
          <FontAwesomeIcon icon={faHome} className="admin1-header-icon" />
          <span className="admin1-header-text">DASHBOARD</span>
          <span className="current-time">
          {currentTime}</span>
        </div>
        <div className="admin1-no-edge-box">
          <div className="admin1-parktrack-title">PARKTRACK</div>
          <div className="admin1-reports-title">COMPLAINTS PROGRESS</div>
          <div className="dashboard-content"></div>
          <div className="admin1-progress-container">
            <div
              className="admin1-pending"
              onClick={() => navigate("/Pending")}
            >
              <section className="admin1-icon pending-icon">
                <FontAwesomeIcon icon={faExclamationCircle} size="1x" />
              </section>
              <section className="count">{pendingCount}</section>
              <section className="label">Pending</section>
            </div>
            <div
              className="admin1-onprogress"
              onClick={() => navigate("/OnProgress")}
            >
              <section className="admin1-icon onprogress-icon">
                <FontAwesomeIcon icon={faSpinner} size="1x" />
              </section>
              <section className="count">{onProgressCount}</section>
              <section className="label">On Progress</section>
            </div>
            <div className="admin1-solved" onClick={() => navigate("/Solved")}>
              <section className="admin1-icon solved-icon">
                <FontAwesomeIcon icon={faCheckCircle} size="1x" />
              </section>
              <section className="count">{solvedCount}</section>
              <section className="label">Solved</section>
            </div>

            <div className="date-container">
              <div className="date-content">
                <DatePicker
                  inline
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="MM/dd/yyyy"
                />
              </div>
              <div className="rfid-form">
                <h3 className="form-title">Assign RFID to Student</h3>
                <form onSubmit={handleFormSubmit} className="admin1-rfid-form">
                  <label className="admin1-form-label">Student ID:</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="admin1-form-input"
                    placeholder="Enter Student ID"
                  />
                  <label className="admin1-form-label">RFID Tag:</label>
                  <input
                    type="text"
                    value={rfidTag}
                    onChange={(e) => setRfidTag(e.target.value)}
                    className="admin1-form-input"
                    placeholder="Enter RFID Tag"
                  />
                  <button type="submit" className="admin1-submit-button">
                    Assign
                  </button>
                </form>
                {message && <p className="admin1-message">{message}</p>}
              </div>
            </div>
          </div>
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
        <div className="chat-overlay admin-chat">
          <div className="chat-container">
            <div className="chat-header">
              <h3>
                {selectedStudent
                  ? `Chat with student ${selectedStudent.student_id}`
                  : "Inbox"}
              </h3>
              {selectedStudent && (
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                  }}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
              )}
              <button
                onClick={() => {
                  setShowChat(false);
                  setSelectedStudent(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="chat-body">
              {!selectedStudent ? (
                <div className="conversations-list">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="conversation-item"
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div className="conversation-info">
                        <span className="student-id">Student ID: {conv.student_id}</span>
                        {conv.unreadCount > 0 && (
                          <span className="unread-badge">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <div className="last-message">
                          {conv.lastMessage.message.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="chat-messages">
                    {messages.map((msg) => (
                      <div key={msg.id} className="message-wrapper">
                        <p className={`message-sender ${msg.sender_id === selectedStudent.id ? "left" : "right"}`}>
                          <strong>
                            {msg.sender_id === selectedStudent.id ? `Student: ${selectedStudent.student_id}` : "You" }
                          </strong>
                        </p>
                        <div className={`messageadmin ${msg.sender_id === selectedStudent.id ? "user" : "admin"}`}>
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
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type your message..."
                    />
                    <button type="submit">
                      <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
