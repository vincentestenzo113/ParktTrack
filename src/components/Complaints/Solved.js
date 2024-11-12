import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faClipboard, faClipboardCheck, faClipboardList, faUsers, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import adminlogo from '../public/parktracklogo.png'

const Solved = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewRemarks, setViewRemarks] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('incident_report')
        .select('id, student_id, description, submitted_at,completed_at, remarks, proof_of_incident')
        .eq('progress', 2) 
        .not('remarks', 'is', null); 
  
      if (error) {
        console.error('Error fetching reports:', error.message);
      } else {
        setReports(data);
      }
      setLoading(false);
    };
  
    fetchReports();
  }, []);
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
    } else {
      window.location.href = '/';
    }
  };

  const navigateToUsers = () => {
    navigate('/users');
  };

  const navigateToDashboard = () => {
    navigate('/Admin');
  };

  const openViewModal = (remarks) => {
    setViewRemarks(remarks || 'No remarks available');
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewRemarks('');
  };

  const openProofModal = (proofUrl) => {
    setProofUrl(proofUrl);
    setShowProofModal(true);
  };

  const closeProofModal = () => {
    setShowProofModal(false);
    setProofUrl('');
  };

  return (
    <div className='admin1-container'>
      <div className='admin1-sidebar'>
      <div className="admin1-logo">
    <img src={adminlogo} className="admin1-logo-image" alt="admin logo" />
    <span className="admin1-logo-text">PARK <br /> TRACK</span>
</div>
        <div className='admin1-dashboard'>
          <button onClick={navigateToDashboard} className="admin1-sidebar-button">
            <FontAwesomeIcon icon={faTachometerAlt} className="admin1-icon" />
            Dashboard
          </button>
          <button className="admin1-sidebar-button">
            <FontAwesomeIcon icon={faClipboard} className="admin1-icon" />
            Complaints
          </button>
          <div className='admin1-complaints'>
            <button className="admin1-sidebar-button" onClick={() => navigate('/Pending')}>
              <FontAwesomeIcon icon={faClipboardList} className="admin1-icon" />
              Pending
            </button>
            <button className="admin1-sidebar-button" onClick={() => navigate('/OnProgress')}>
              <FontAwesomeIcon icon={faClipboardCheck} className="admin1-icon" />
              On Progress
            </button>
            <button className="admin1-sidebar-button" onClick={() => navigate('/Solved')}>
              <FontAwesomeIcon icon={faClipboardCheck} className="admin1-icon" />
              Solved
            </button>
          </div>
          <button onClick={navigateToUsers} className="admin1-sidebar-button">
            <FontAwesomeIcon icon={faUsers} className="admin1-icon" />
            Registered Users
          </button>
          <button onClick={handleLogout} className="admin1-logout-button">
            <FontAwesomeIcon icon={faSignOutAlt} className="admin1-icon" />
            Logout
          </button>
        </div>
      </div>

      <div className="admin1-content">
        <div className='admin1-header-container'>
          <div className='admin1-table-title'>Solved Reports</div>
        </div>
        <div className="admin1-report-container">
          {loading ? (
            <p>Loading reports...</p>
          ) : reports.length > 0 ? (
<table className="admin1-solved-table">
  <thead>
    <tr>
      <th>Ticket #</th>
      <th>Student ID</th>
      <th>Date and Time Submitted</th>
      <th>Date and Time Solved</th> {/* New column */}
      <th>Description</th>
      <th>Remarks</th>
      <th>Proof</th>
    </tr>
  </thead>
  <tbody>
    {reports.map((report) => (
      <tr key={report.id}>
        <td>{report.id}</td>
        <td>{report.student_id}</td>
        <td>{new Date(report.submitted_at).toLocaleString()}</td>
        <td>{report.completed_at ? new Date(report.completed_at).toLocaleString() : 'Not solved yet'}</td> {/* New column */}
        <td>{report.description}</td>
        <td>
          <button onClick={() => openViewModal(report.remarks)} className="admin1-view-remarks-button">
            View Remarks
          </button>
        </td>
        <td>
          <button onClick={() => openProofModal(report.proof_of_incident)} className="admin1-view-proof-button">
            View Proof
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

          ) : (
            <p>No reports found.</p>
          )}
        </div>
      </div>

      {/* View Remarks Modal */}
      {showViewModal && (
        <div className="admin1-modal">
          <div className="admin1-modal-content">
            <h2>View Remarks</h2>
            <p>{viewRemarks}</p>
            <button onClick={closeViewModal} className="admin1-close-button">Close</button>
          </div>
        </div>
      )}

      {/* View Proof Modal */}
      {showProofModal && (
        <div className="admin1-modal">
          <div className="admin1-modal-content">
            <h2>Proof of Incident</h2>
            <img src={proofUrl} alt="Proof" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
            <button onClick={closeProofModal} className="admin1-close-button">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Solved;
