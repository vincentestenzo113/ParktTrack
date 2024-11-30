import React, { useEffect, useState } from "react";
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
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import logo from "./public/parktracklogo.png";
import logo2 from "./public/logosaparktrack.png";

const Admin = () => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [onProgressCount, setOnProgressCount] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [currentTime, setCurrentTime] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [session, setSession] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [rfidTag, setRfidTag] = useState("");
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
          <button onClick={toggleModal}>
            <FontAwesomeIcon icon={faTicket} />
            <span>Assign RFID</span>
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
    </div>
  );
};

export default Admin;
