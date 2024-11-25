import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './utils/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faClipboardList, faUsers, faSignOutAlt, faExclamationCircle, faSpinner, faCheckCircle, faUser } from '@fortawesome/free-solid-svg-icons';
import adminlogo from './public/parktracklogo.png';

const Admin = () => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [onProgressCount, setOnProgressCount] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [session, setSession] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [rfidTag, setRfidTag] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession(); // Fetch current session
      setSession(sessionData);
    };

    checkSession();
    const fetchReportCounts = async () => {
      try {
        const { data: pendingReports } = await supabase
          .from('incident_report')
          .select('*')
          .eq('progress', 0)
          .is('remarks', null);
        setPendingCount(pendingReports.length);

        const { data: onProgressReports } = await supabase
          .from('incident_report')
          .select('*')
          .eq('progress', 1)
          .not('remarks', 'is', null);
        setOnProgressCount(onProgressReports.length);

        const { data: solvedReports } = await supabase
          .from('incident_report')
          .select('*')
          .eq('progress', 2)
          .not('remarks', 'is', null);
        setSolvedCount(solvedReports.length);
      } catch (error) {
        console.error('Error fetching report counts:', error);
      }
    };

    fetchReportCounts();

    const today = new Date();
    setCurrentDate(
      today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isAuthenticated');
    navigate('/admin-login');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Trim inputs to prevent leading/trailing spaces
    const trimmedStudentId = studentId.trim();
    const trimmedRfidTag = rfidTag.trim();

    // Check if inputs are valid
    if (!trimmedStudentId || !trimmedRfidTag) {
        setMessage('Please provide both Student ID and RFID Tag.');
        return;
    }

    console.log('Submitting with:', { studentId: trimmedStudentId, rfidTag: trimmedRfidTag });

    try {
        // Update rfid_tag for the matching student_id
        const { data, error } = await supabase
            .from('profiles')
            .update({ rfid_tag: trimmedRfidTag })
            .eq('student_id', trimmedStudentId)
            .select(); // Select the updated data to check

        if (error) {
            console.error('Supabase Update Error:', error.message);
            setMessage('Failed to assign RFID tag. Please try again.');
        } else {
            console.log('Supabase Update Response:', data);
            if (data && data.length > 0) {
                setMessage('RFID tag assigned successfully!');
            } else {
                setMessage('No matching student found for the provided Student ID.');
            }
        }
    } catch (error) {
        console.error('Error during form submission:', error);
        setMessage('An error occurred. Please try again.');
    }

    // Reset form fields
    setStudentId('');
    setRfidTag('');
};

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="admin1-container">
      <div className="admin1-sidebar">
        <div className="admin1-logo">
          <img src={adminlogo} className="admin1-logo-image" alt="admin logo" />
          <span className="admin1-logo-text">PARK <br /> TRACK</span>
        </div>
        <div className="admin1-dashboard">
          <button className="admin1-sidebar-button" onClick={() => navigate('/Admin')}>
            <FontAwesomeIcon icon={faHome} className="admin1-icon" />
            Dashboard
          </button>
          <button className="admin1-sidebar-button" onClick={() => navigate('/Pending')}>
            <FontAwesomeIcon icon={faClipboardList} className="admin1-icon" />
            Complaints
          </button>
          <button className="admin1-sidebar-button" onClick={() => navigate('/users')}>
            <FontAwesomeIcon icon={faUsers} className="admin1-icon" />
            Registered Users
          </button>
          <div className="rfid-form">
          <h3 className='form-title'>Assign RFID to Student</h3>
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
            <button type="submit" className="admin1-submit-button">Assign</button>
          </form>
          {message && <p className="admin1-message">{message}</p>}
        </div>
          <button className="admin1-logout-button" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} className="admin1-icon" />
            Logout
          </button>
        </div>
      </div>

      <div className="admin1-content">
        <div className="admin1-header">
          <div className="admin1-dashboard-title">
            <FontAwesomeIcon icon={faHome} className="admin1-header-icon" />
            <span className="admin1-header-text">DASHBOARD</span>
          </div>
          <div className="admin1-profile">
            <div className="admin1-profile-name">
              <span>Office of Student Affairs</span>
              <br />
              <span>Admin</span>
            </div>
            <FontAwesomeIcon icon={faUser} className="admin1-profile-icon" />
          </div>
        </div>
        <div className="admin1-no-edge-box">
          <div className="admin1-parktrack-title">PARKTRACK</div>
          <div className="admin1-reports-title">COMPLAINTS PROGRESS</div>
          <div className="dashboard-content"></div>
          <div className="admin1-progress-container">
            <div className="admin1-pending" onClick={() => navigate('/Pending')}>
              <section className="admin1-icon pending-icon">
                <FontAwesomeIcon icon={faExclamationCircle} size="1x" />
              </section>
              <section className="count">{pendingCount}</section>
              <section className="label">Pending</section>
            </div>
            <div className="admin1-onprogress" onClick={() => navigate('/OnProgress')}>
              <section className="admin1-icon onprogress-icon">
                <FontAwesomeIcon icon={faSpinner} size="1x" />
              </section>
              <section className="count">{onProgressCount}</section>
              <section className="label">On Progress</section>
            </div>
            <div className="admin1-solved" onClick={() => navigate('/Solved')}>
              <section className="admin1-icon solved-icon">
                <FontAwesomeIcon icon={faCheckCircle} size="1x" />
              </section>
              <section className="count">{solvedCount}</section>
              <section className="label">Solved</section>
            </div>
          </div>
        </div>
        <div className="bottom-section">
          <div className="date-container">
            <h3>Today's Date</h3>
            <p>{currentDate}</p>
          </div>
          <div className="digital-clock-container">
            <h3>Current Time</h3>
            <div className="clock-box">
              <p>{currentTime}</p>
            </div>
          </div>
          <footer className="admin1-footer">
            <p>&copy; 2024 PARKTRACK INC Tel: +639355380789 | Got bugs or errors? Contact us here: support@parktrack.com</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Admin;
