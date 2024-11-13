import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './utils/supabaseClient';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faComments, faFileAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import favicon from './public/profile-icon.png';

const Page1 = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [showComplaints, setShowComplaints] = useState(false);
  const [selectedRemarks, setSelectedRemarks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [hasCooldown, setHasCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  const tips = [
    "Remember to submit proof for all complaints to increase processing speed.",
    "Check your cooldown status before submitting another report.",
    "Use clear descriptions for incidents to help the admin team understand the issue.",
    "Click on 'View Remarks' to see feedback from the admin team."
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError.message);
        toast.error('Failed to get user data. Please log in again.');
        navigate('/login');
        return;
      }
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('student_id, name, email')
          .eq('id', user.id)
          .single();
        if (error) {
          console.error('Error fetching user data:', error.message);
          toast.error('Error fetching user profile data.');
          return;
        }
        setUserInfo(data);
      } else {
        navigate('/login');
      }
    };
    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    if (userInfo) {
      checkReportCooldown();
    }
  }, [userInfo]);

  const checkReportCooldown = async () => {
    const { data: reports, error } = await supabase
      .from('incident_report')
      .select('submitted_at')
      .eq('student_id', userInfo.student_id)
      .order('submitted_at', { ascending: false })
      .limit(2);

    if (error) {
      console.error('Error fetching cooldown status:', error.message);
      toast.error('Failed to fetch cooldown status.');
      return;
    }

    if (reports.length > 0) {
      const lastSubmittedAt = new Date(reports[0].submitted_at);
      const currentTime = new Date();
      const timeDiff = currentTime - lastSubmittedAt;

      if (timeDiff < 86400000) {
        setHasCooldown(true);
        setCooldownTime(Math.floor((86400000 - timeDiff) / 1000));

        const countdown = setInterval(() => {
          setCooldownTime((prev) => {
            if (prev <= 1) {
              clearInterval(countdown);
              setHasCooldown(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const formatCooldownTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h:${minutes}m`;
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      toast.error('Error signing out. Please try again.');
      return;
    }
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const fetchComplaints = async () => {
    if (!userInfo) return;
    const { data, error } = await supabase
      .from('incident_report')
      .select('id, student_id, submitted_at,completed_at, description, proof_of_incident, remarks, progress')
      .eq('student_id', userInfo.student_id);
    if (error) {
      console.error('Error fetching complaints:', error.message);
      toast.error('Error fetching complaints. Please try again.');
      return;
    }
    const mappedComplaints = data.map(complaint => ({
      ...complaint,
      submission_date: new Date(complaint.submitted_at).toLocaleString(),
      completed_at: complaint.completed_at ? new Date(complaint.completed_at).toLocaleString() : 'Not solved yet',
      status: getStatus(complaint),
    }));
    setComplaints(mappedComplaints);
    setShowComplaints(true);
  };
  
  const getStatus = (complaint) => {
    if (!complaint.remarks && complaint.progress === 0) {
      return { text: 'PENDING', color: 'red' };
    } else if (complaint.remarks && complaint.progress === 1) {
      return { text: 'ON PROGRESS', color: 'orange' };
    } else if (complaint.remarks && complaint.progress === 2) {
      return { text: 'SOLVED', color: 'green' };
    }

    return { text: 'UNKNOWN', color: 'gray' };
  };

  const toggleComplaints = () => {
    if (!showComplaints) fetchComplaints();
    setShowComplaints(!showComplaints);
  };

  const handleShowProof = (proofUrl) => {
    setProofUrl(proofUrl);
    setIsProofModalOpen(true);
  };

  const closeProofModal = () => {
    setIsProofModalOpen(false);
    setProofUrl('');
  };

  const handleShowRemarks = (remarks) => {
    setSelectedRemarks(remarks ? remarks.split(';') : []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="page1-container">
      <div className="page1-sidebar">
        <img src={favicon} alt="Logo" className="sidebar-logo" />
        <button className="page1-sidebar-button" onClick={() => setShowComplaints(false)}>
          <FontAwesomeIcon icon={faUser} /> Profile
        </button>
        <button className="page1-sidebar-button" onClick={toggleComplaints}>
          <FontAwesomeIcon icon={faComments} /> {showComplaints ? 'Hide Complaints' : 'View Complaints'}
        </button>
        <button
          className="page1-sidebar-button"
          onClick={() => navigate('/incident-report')}
        >
          <FontAwesomeIcon icon={faFileAlt} /> Report Incident
        </button>
        <button className="page1-logout-button" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Logout
        </button>
      </div>
      <div className="page1-content">
        <div className="page1-no-edge-box">
          <h1 className="page1-parktrack-title">PARKTRACK</h1>
          {showComplaints ? (
            <>
              <h3>Your Complaints:</h3>
              {complaints.length > 0 ? (
              <div className="page1-complaints-table">
              <table>
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Student ID</th>
                    <th>Date and Time Submitted</th>
                    <th>Date and Time Solved</th>
                    <th>Description</th>
                    <th>Proof of Incident</th>
                    <th>Admin's Remark</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((complaint, index) => (
                 <tr key={index}>
                 <td>{complaint.id}</td>
                 <td>{complaint.student_id}</td>
                 <td>{complaint.submission_date}</td>
                 <td>
                   {complaint.completed_at && complaint.completed_at !== 'null' 
                     ? new Date(complaint.completed_at).toLocaleString() 
                     : 'Not solved yet'}
                 </td>
                 <td>{complaint.description}</td>
                 <td>
                   <button
                     className="page1-view-proof-button"
                     onClick={() => handleShowProof(complaint.proof_of_incident)}
                   >
                     View Proof
                   </button>
                 </td>
                 <td>
                   <button
                     className="page1-view-remarks-button"
                     onClick={() => handleShowRemarks(complaint.remarks)}
                   >
                     View Remarks
                   </button>
                 </td>
                 <td style={{ backgroundColor: complaint.status.color }}>
                   {complaint.status.text}
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     ) : (
       <p>No complaints found.</p>
     )}
   </>
 ) : (
   <>
     <h3>Your Profile:</h3>
     <div className="page1-profile">
       <p><strong>Name:</strong> {userInfo.name}</p>
       <p><strong>Email:</strong> {userInfo.email}</p>
       <p><strong>Student ID:</strong> {userInfo.student_id}</p>
       <p>
         <strong>Cooldown Status:</strong>
         {hasCooldown
           ? ` If you submitted 2 reports today, you can submit another 2 reports after ${formatCooldownTime(cooldownTime)}.`
           : ' You can submit 2 reports today.'}
       </p>
     </div>
     <div className="page1-tips">
       <h4>Helpful Tips:</h4>
       <ul>
         {tips.map((tip, index) => (
           <li key={index}>{tip}</li>
         ))}
       </ul>
     </div>
   </>
 )}
 </div>
</div>

{isProofModalOpen && (
 <div className="page1-modal">
   <div className="page1-modal-content">
     <span className="page1-modal-close" onClick={closeProofModal}>
       &times;
     </span>
     <img src={proofUrl} alt="Proof of Incident" className="page1-modal-image" />
   </div>
 </div>
)}

{isModalOpen && (
 <div className="page1-modal">
   <div className="page1-modal-content">
     <span className="page1-modal-close" onClick={closeModal}>
       &times;
     </span>
     <h3>Remarks:</h3>
     <ul>
       {selectedRemarks.length > 0
         ? selectedRemarks.map((remark, index) => (
             <li key={index}>{remark}</li>
           ))
         : <li>No remarks available.</li>}
     </ul>
   </div>
 </div>
)}
     <footer className="page1-footer">
        <p>&copy; 2024 PARKTRACK INC Tel: +639355380789 | Got bugs or errors? Contact us here: support@parktrack.com</p>
      </footer>
</div>
);
};

export default Page1;
