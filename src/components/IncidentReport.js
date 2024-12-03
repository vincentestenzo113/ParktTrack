import React, { useEffect, useState } from 'react';
import { supabase } from './utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

const IncidentReport = () => {
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [isCooldown, setIsCooldown] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [incidentDate, setIncidentDate] = useState(''); // State for incident date
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentId = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error fetching user:', userError.message);
        return;
      }

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('student_id')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError.message);
          return;
        }

        setStudentId(profile?.student_id || '');
      }
    };

    fetchStudentId();
  }, []);

  useEffect(() => {
    const checkCooldown = async () => {
      if (!studentId) return;

      const { data: existingReports, error } = await supabase
        .from('incident_report')
        .select('submitted_at')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching existing reports:', error.message);
        return;
      }

      if (existingReports.length > 0) {
        const lastSubmittedAt = new Date(existingReports[0].submitted_at);
        const currentTime = new Date();
        const timeDiff = currentTime - lastSubmittedAt;

        if (timeDiff < 86400000) {
          setIsCooldown(true);
        }
      }
    };

    checkCooldown();
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
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('incident-report')
      .upload(filePath, photo);

    if (uploadError) {
      alert(`Failed to upload image: ${uploadError.message}`);
      return;
    }

    const publicUrl = `${supabase.storageUrl}/object/public/incident-report/${filePath}`;

    const reportData = {
      student_id: studentId,
      description,
      proof_of_incident: publicUrl,
      incident_date: incidentDate, // Include the selected date
      submitted_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('incident_report')
      .insert([reportData]);

    if (insertError) {
      alert(`Failed to submit report: ${insertError.message}`);
      return;
    }

    setShowNotification(true);
    setDescription('');
    setPhoto(null);
    setIncidentDate(''); // Clear the date
    setMessage('');

    setTimeout(() => {
      navigate('/profile');
    }, 3000);
  };

  return (
    <div className="report1-page">
      <h1 className="parktrack-title1">PARKTRACK</h1>
      <div className="report1-container">
        <h2 className="section-header">Incident Report</h2>
        <form onSubmit={handleSubmit} className="report1-form">
          <div className="report1-form-group">
            <label className="report1-form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="report1-form-input"
              placeholder="Please provide a clear description of what happened."
            />
          </div>
          <div className="report1-form-group">
            <label className="report1-form-label">Incident Date</label>
            <input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              required
              className="report1-form-input"
            />
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
              type="button"
              className="report1-back-button"
              onClick={() => navigate('/profile')}
            >
              Back to Profile
            </button>
            <button
              type="submit"
              className="report1-submit-button"
              disabled={isCooldown}
            >
              Submit
            </button>
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
