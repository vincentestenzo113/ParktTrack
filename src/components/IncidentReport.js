import React, { useEffect, useState } from 'react';
import { supabase } from './utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

const IncidentReport = () => {
  const [studentId, setStudentId] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [isCooldown, setIsCooldown] = useState(false);
  const [showNotification, setShowNotification] = useState(false); // State for notification
  const navigate = useNavigate();

  useEffect(() => {
    const checkCooldown = async () => {
      const { data: existingReports, error: fetchError } = await supabase
        .from('incident_report')
        .select('submitted_at')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })
        .limit(2); // Get the most recent report

      if (fetchError) {
        console.error('Error fetching existing reports:', fetchError.message);
        alert('An error occurred while checking your report limit. Please try again.');
        return;
      }

      if (existingReports.length > 0) {
        const lastSubmittedAt = new Date(existingReports[0].submitted_at);
        const currentTime = new Date();
        const timeDiff = currentTime - lastSubmittedAt; // Difference in milliseconds

        // Check if the difference is less than 24 hours (86400000 milliseconds)
        if (timeDiff < 86400000) {
          setIsCooldown(true);
        }
      }
    };

    if (studentId) {
      checkCooldown();
    }
  }, [studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!photo) {
      setMessage('Please upload a photo.');
      return;
    }

    if (isCooldown) {
      setMessage('You need to wait 24 hours before submitting another report.');
      return;
    }

    const filePath = `private/${studentId}/${photo.name}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('incident-report')
      .upload(filePath, photo);

    if (uploadError) {
      alert(`Failed to upload image: ${uploadError.message}`);
      console.error('Upload error:', uploadError);
      return;
    }

    const publicUrl = `${supabase.storageUrl}/object/public/incident-report/${filePath}`;

    const reportData = {
      student_id: studentId,
      description,
      proof_of_incident: publicUrl,
      submitted_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('incident_report')
      .insert([reportData]);

    if (insertError) {
      alert(`Failed to submit report: ${insertError.message}`);
      return;
    }

    setShowNotification(true); // Show the notification box
    // Clear form fields
    setStudentId('');
    setDescription('');
    setPhoto(null);
    setMessage('');

    // Automatically navigate back to profile after a short delay
    setTimeout(() => {
      navigate('/profile');
    }, 3000); // Adjust delay as needed
  };

  return (
    <div className="report1-page">
      <h1 className="parktrack-title1">PARKTRACK</h1>
      <div className="report1-container">
        <h2 className="section-header">Incident Report</h2>
        <form onSubmit={handleSubmit} className="report1-form">
          <div className="report1-form-group">
            <label className="report1-form-label">Student ID</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value) && value.length <= 10) setStudentId(value);
              }}
              maxLength="10"
              required
              className="report1-form-input"
              placeholder="Enter up to 10 digits only"
            />
          </div>
          <div className="report1-form-group">
            <label className="report1-form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="report1-form-input"
              placeholder='Please provide a clear description of what happened.'
            />
            <p className="report1-description-message">You can only submit a report twice a day.</p>
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
              type="submit" 
              className="report1-submit-button" 
              disabled={isCooldown}
            >
              Submit
            </button>
            <button className="report1-back-button" onClick={() => navigate('/profile')}>Back to Profile</button>
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
    </div>
  );
};

export default IncidentReport;
