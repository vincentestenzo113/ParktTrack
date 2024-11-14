import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './utils/supabaseClient'; // Ensure the correct supabase client is initialized
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
  const [session, setSession] = useState(null); // State for storing session

  useEffect(() => {
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession(); // Fetch current session
      setSession(sessionData);
    };

    // Check session on component mount
    checkSession();

    // Fetch report counts
    const fetchReportCounts = async () => {
      try {
        const { data: pendingReports, error: pendingError } = await supabase
          .from('incident_report')
          .select('*')
          .eq('progress', 0)
          .is('remarks', null);
        if (pendingError) throw pendingError;
        setPendingCount(pendingReports.length);

        const { data: onProgressReports, error: onProgressError } = await supabase
          .from('incident_report')
          .select('*')
          .eq('progress', 1)
          .not('remarks', 'is', null);
        if (onProgressError) throw onProgressError;
        setOnProgressCount(onProgressReports.length);

        const { data: solvedReports, error: solvedError } = await supabase
          .from('incident_report')
          .select('*')
          .eq('progress', 2)
          .not('remarks', 'is', null);
        if (solvedError) throw solvedError;
        setSolvedCount(solvedReports.length);
      } catch (error) {
        console.error('Error fetching report counts:', error);
      }
    };

    fetchReportCounts();

    // Set the current date and time
    const today = new Date();
    setCurrentDate(today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer); // Clean up timer
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut(); // Log out from Supabase
    localStorage.removeItem('isAuthenticated'); // Clear authentication state
    navigate('/admin-login'); // Redirect to login page
  };

  if (!session) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className='admin1-container'>
      <div className='admin1-sidebar'>
        <div className="admin1-logo">
          <img src={adminlogo} className="admin1-logo-image" alt="admin logo" />
          <span className="admin1-logo-text">PARK <br /> TRACK</span>
        </div>
        <div className='admin1-dashboard'>
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
          <div className='admin1-reports-title'>COMPLAINTS PROGRESS</div>
          <div className="dashboard-content">
            {/* Add any additional content here if needed */}
          </div>

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
          {/* Date Section */}
          <div className="date-container">
            <h3>Today's Date</h3>
            <p>{currentDate}</p>
          </div>

          {/* Clock Section */}
          <div className="digital-clock-container">
            <h3>Current Time</h3>
            <div className="clock-box">
              <p>{currentTime}</p>
            </div>
          </div>

          {/* Footer */}
          <footer className="admin1-footer">
            <p>&copy; 2024 PARKTRACK INC Tel: +639355380789 | Got bugs or errors? Contact us here: support@parktrack.com</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Admin;
