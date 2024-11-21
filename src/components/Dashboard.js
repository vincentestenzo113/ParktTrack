import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faExclamationCircle, faUserCog } from '@fortawesome/free-solid-svg-icons'; // Icons import
import logosaparktrack from '../components/public/logosaparktrack.png';

const Dashboard = () => {
  const [slotsLeft, setSlotsLeft] = useState(150); // Initial state
  const navigate = useNavigate();

  // Function to fetch the current slots left from the Flask API
  const fetchSlotsLeft = async () => {
    try {
      const response = await fetch('http://192.168.1.12:5000/get_slots'); // Update with the Flask server URL
      if (!response.ok) {
        throw new Error('Failed to fetch slots');
      }
      const data = await response.json();
      setSlotsLeft(data.slots_left); // Update the state with the fetched slots
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  // Use `useEffect` to fetch slots when the component loads and every 5 seconds
  useEffect(() => {
    fetchSlotsLeft(); // Initial fetch
    const interval = setInterval(fetchSlotsLeft, 2000); // Fetch every 5 seconds
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

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
          <div className='dashboard2-slots-inner'>
          <h2 className="dashboard2-slots-number">{slotsLeft}</h2>
          <p className="dashboard2-slots-text">SLOTS LEFT</p>
          </div>
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