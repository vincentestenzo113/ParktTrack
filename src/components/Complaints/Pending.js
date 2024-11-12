import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import adminlogo from '../public/parktracklogo.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faClipboard, faClipboardCheck, faClipboardList, faUsers, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const Pending = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState(null); // Store report ID
  const [remarksInput, setRemarksInput] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewRemarks, setViewRemarks] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [notification, setNotification] = useState({ visible: false, message: '', icon: '' });
  const navigate = useNavigate();

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('incident_report')
      .select('id, student_id, description, proof_of_incident, remarks, submitted_at')
      .eq('progress', 0)
      .is('remarks', null);

    if (error) {
      console.error('Error fetching reports:', error.message);
    } else {
      setReports(data);
    }
    setLoading(false);
  };

  useEffect(() => {
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

  const openSendModal = (reportId) => {
    setSelectedReportId(reportId);  // Store the selected report ID
    setShowSendModal(true);
  };

  const closeSendModal = () => {
    setShowSendModal(false);
    setRemarksInput('');
  };

  const sendRemarks = async () => {
    if (remarksInput && selectedReportId) {

      const { data, error } = await supabase
        .from('incident_report')
        .update({
          remarks: remarksInput,
          progress: 1
        })
        .eq('id', selectedReportId) // Use report ID to update the specific report
        .select('id, remarks');

      if (error) {
        console.error('Error sending remarks:', error);
        setNotification({ visible: true, message: `Error: ${error.message}`, icon: 'error' });
      } else {
        if (data.length > 0) {
          setNotification({ visible: true, message: 'Remarks sent successfully! The report will be On Progress.', icon: 'success' });
          await fetchReports();
        } else {
          setNotification({ visible: true, message: 'No data returned. Please check the report ID.', icon: 'error' });
        }
      }
      closeSendModal();

      setTimeout(() => {
        setNotification({ visible: false, message: '', icon: '' });
      }, 5000);
    } else {
      console.warn('Remarks input or selectedReportId is empty');
    }
  };

  const openViewModal = (remarks) => {
    setViewRemarks(remarks || 'No remarks available');
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewRemarks('');
  };

  const viewProof = (proofUrl) => {
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
          <button onClick={() => navigate('/Admin')} className="admin1-sidebar-button">
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
          <button className="admin1-sidebar-button" onClick={() => navigate('/users')}>
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
        <div className="admin1-report-container">
          <div className='admin1-table-title'>Pending</div>
          {loading ? (
            <p>Loading reports...</p>
          ) : reports.length > 0 ? (
            <table className="admin1-users-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Student ID</th>
                  <th>Date and Time Submitted</th> 
                  <th>Description</th>
                  <th>Proof</th>
                  <th>Remarks</th>
                  <th>Take Action</th>
                </tr>
              </thead>
              <tbody>
  {reports.map((report) => (
    <tr key={report.id}>
      <td>{report.id}</td> {/* Changed to show the actual report ID */}
      <td>{report.student_id}</td>
      <td>{new Date(report.submitted_at).toLocaleString()}</td>
      <td>{report.description}</td>
      <td className='admin1-send-button'>
        <button onClick={() => viewProof(report.proof_of_incident)} className="admin1-view-proof-button">
          View Proof
        </button>
      </td>
      <td>
        <button onClick={() => openViewModal(report.remarks)} className="admin1-view-remarks-button">
          View Remarks
        </button>
      </td>
      <td>
        <button onClick={() => openSendModal(report.id)} className="admin1-send-remarks-button">
          Send Remarks
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

      {/* Send Remarks Modal */}
      {showSendModal && (
        <div className="admin1-modal">
          <div className="admin1-modal-content">
            <h2>Send Remarks</h2>
            <textarea
              value={remarksInput}
              onChange={(e) => setRemarksInput(e.target.value)}
              placeholder="Enter remarks here..."
            />
            <button onClick={sendRemarks} className="admin1-send-button">Send</button>
            <button onClick={closeSendModal} className="admin1-cancel-button">Cancel</button>
          </div>
        </div>
      )}

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
            <h2>Proof</h2>
            <img src={proofUrl} alt="Proof" className="admin1-proof-img" />
            <button onClick={closeProofModal} className="admin1-close-button">Close</button>
          </div>
        </div>
      )}

{notification.visible && (
  <div className={`pending1-notification ${notification.icon}`}>
    <p>{notification.message}</p>
  </div>
)}
    </div>
  );
};

export default Pending;
