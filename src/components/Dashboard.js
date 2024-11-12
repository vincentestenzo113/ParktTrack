import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faExclamationCircle, faUserCog } from '@fortawesome/free-solid-svg-icons'; // Icons import
import logosaparktrack from '../components/public/logosaparktrack.png';

const Dashboard = () => {
  const [slotsLeft] = useState(150);
  const navigate = useNavigate();

  return (
    <div className="dashboard2-container">
      <header className="dashboard2-header">
      <h1>
    <img src={logosaparktrack} alt="USTP Parktrack Icon" className="dashboard2-parktracklogo" />
    PARKTRACK
</h1>

</header>
      <div className="dashboard2-content">
        <div className="dashboard2-slots-container">
          <p className="dashboard2-slots-text">SLOTS LEFT</p>
          <h2 className="dashboard2-slots-number">{slotsLeft}</h2>
        </div>

        <section className="dashboard2-slogan-section">
          <h2 className="dashboard2-slogan-text">"Parking Safety and Your Concerns: Our Top Priority"</h2>
        </section>
        <div className="dashboard2-get-started-container">
          <button className="dashboard2-get-started-button" onClick={() => navigate('/login')}>
            Get Started
          </button>
        </div>

        <section className="dashboard2-features-section">
          <h2 className="dashboard2-features-title">What Parktrack Offers</h2>
          <div className="dashboard2-features-container">

            <div className="dashboard2-feature-item">
              <FontAwesomeIcon icon={faTachometerAlt} size="3x" className="dashboard2-feature-icon" />
              <h3 className="dashboard2-feature-title">Real-time Availability</h3>
              <p className="dashboard2-feature-description">Check available parking slots in real-time.</p>
            </div>

            <div className="dashboard2-feature-item">
              <FontAwesomeIcon icon={faExclamationCircle} size="3x" className="dashboard2-feature-icon" />
              <h3 className="dashboard2-feature-title">Incident Report</h3>
              <p className="dashboard2-feature-description">Report any issues with parking and manage your reports.</p>
            </div>

            <div className="dashboard2-feature-item">
              <FontAwesomeIcon icon={faUserCog} size="3x" className="dashboard2-feature-icon" />
              <h3 className="dashboard2-feature-title">User Profile</h3>
              <p className="dashboard2-feature-description">Manage your profile, complaints history, and track complaint status.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;
