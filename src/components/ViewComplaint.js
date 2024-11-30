import React, { useState, useEffect } from "react";
import { supabase } from "./utils/supabaseClient";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faFileAlt,
  faSignOutAlt,
  faUser,
  faBell,
  faCaretDown,
} from "@fortawesome/free-solid-svg-icons";
import favicon from "./public/profile-icon.png";
import logo from "./public/parktracklogo.png";
import logo2 from "./public/logosaparktrack.png";

const ViewComplaint = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cooldownState, setCooldownState] = useState({
    hasCooldown: false,
    cooldownTime: 0,
  });
  const [proofUrl, setProofUrl] = useState("");
  const [selectedRemarks, setSelectedRemarks] = useState([]);

  // Fetch logged-in user data and complaints
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error getting user:", userError.message);
        toast.error("Failed to get user data. Please log in again.");
        navigate("/login");
        return;
      }
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("student_id, name, email")
          .eq("id", user.id)
          .single();
        if (error) {
          console.error("Error fetching user data:", error.message);
          toast.error("Error fetching user profile data.");
          return;
        }
        setUserInfo(data);
        checkReportCooldown(data.student_id);
      } else {
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate]);

  // Fetch complaints and check cooldown after user data is loaded
  useEffect(() => {
    if (userInfo) {
      fetchComplaints();
      checkReportCooldown(userInfo.student_id);
    }
  }, [userInfo]);

  // Get status for each complaint
  const getStatus = (complaint) => {
    if (!complaint.remarks && complaint.progress === 0)
      return { text: "PENDING", color: "red" };
    if (complaint.remarks && complaint.progress === 1)
      return { text: "ON PROGRESS", color: "orange" };
    if (complaint.remarks && complaint.progress === 2)
      return { text: "SOLVED", color: "green" };
    return { text: "UNKNOWN", color: "gray" };
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      toast.error("Error signing out. Please try again.");
      return;
    }
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  // Check if the user is on cooldown
  const checkReportCooldown = async (student_id) => {
    const { data: reports, error } = await supabase
      .from("incident_report")
      .select("submitted_at")
      .eq("student_id", student_id)
      .order("submitted_at", { ascending: false })
      .limit(2);

    if (error) {
      toast.error("Failed to fetch cooldown status.");
      return;
    }

    if (reports.length > 0) {
      const lastSubmittedAt = new Date(reports[0].submitted_at);
      const timeDiff = new Date() - lastSubmittedAt;

      if (timeDiff < 86400000) {
        const remainingTime = Math.floor((86400000 - timeDiff) / 1000);
        setCooldownState({ hasCooldown: true, cooldownTime: remainingTime });

        const countdown = setInterval(() => {
          setCooldownState((prev) => {
            if (prev.cooldownTime <= 1) {
              clearInterval(countdown);
              return { hasCooldown: false, cooldownTime: 0 };
            }
            return { ...prev, cooldownTime: prev.cooldownTime - 1 };
          });
        }, 1000);
      }
    }
  };

  // Fetch complaints for the logged-in user
  const fetchComplaints = async () => {
    if (!userInfo) return;
    const { data, error } = await supabase
      .from("incident_report")
      .select(
        "id, student_id, submitted_at, completed_at, description, proof_of_incident, remarks, progress"
      )
      .eq("student_id", userInfo.student_id);

    if (error) {
      toast.error("Error fetching complaints. Please try again.");
      return;
    }

    const mappedComplaints = data.map((complaint) => ({
      ...complaint,
      submission_date: new Date(complaint.submitted_at).toLocaleString(),
      completed_at: complaint.completed_at
        ? new Date(complaint.completed_at).toLocaleString()
        : "Not solved yet",
      status: getStatus(complaint),
    }));

    setComplaints(mappedComplaints);
  };

  // Modal handlers
  const handleShowProof = (proofUrl) => {
    setProofUrl(proofUrl);
    setIsProofModalOpen(true);
  };

  const closeProofModal = () => {
    setIsProofModalOpen(false);
    setProofUrl("");
  };

  const handleShowRemarks = (remarks) => {
    setSelectedRemarks(remarks ? remarks.split(";") : []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-container">
        <div className="bottom-nav-container">
        <div className="bottom-nav">
          <button onClick={() => navigate("/profile")}>
            <FontAwesomeIcon icon={faUser} />
          </button>
          <button className="active" onClick={() => navigate("/view-complaints")}>
            <FontAwesomeIcon icon={faComments} />
          </button>
          <button onClick={() => navigate("/incident-report")}>
            <FontAwesomeIcon icon={faFileAlt} />
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
          <div>
            <FontAwesomeIcon icon={faBell} />
          </div>
          <div>{userInfo.name}</div>
        </div>
      </div>
      <div className="profile-sidebar">
        <div className="profile-icon-inner">
          <img src={favicon}></img>
        </div>
        <p>{userInfo.name}</p>
        <button className="profile-sidebar-button" onClick={() => navigate("/profile")}>
          <FontAwesomeIcon icon={faUser} /> Profile
        </button>
        <button
          className="profile-sidebar-button-active"
          onClick={() => navigate("/view-complaints")}
        >
          <FontAwesomeIcon icon={faComments} /> View Complaints
        </button>
        <button
          className="profile-sidebar-button"
          onClick={() => navigate("/incident-report")}
        >
          <FontAwesomeIcon icon={faFileAlt} /> Report Incident
        </button>
        <button className="profile-logout-button" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Logout
        </button>
      </div>
      <div className="profile-content">
        <h3>Your Complaints:</h3>
        {complaints.length > 0 ? (
          <div className="profile-complaints-table">
            <table>
              <thead>
                <tr>
                  <th className="ticket-column">Ticket #</th>
                  <th>Student ID</th>
                  <th>Date Submitted</th>
                  <th>Date Solved</th>
                  <th className="description-column">Description</th>
                  <th>Proof of Incident</th>
                  <th>Admin's Remark</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint.id}>
                    <td className="ticket-column">{complaint.id}</td>
                    <td>{complaint.student_id}</td>
                    <td>{complaint.submission_date}</td>
                    <td>{complaint.completed_at}</td>
                    <td className="description-column" >{complaint.description}</td>
                    <td className="admin1-send-button-column">
                      <button
                        onClick={() =>
                          handleShowProof(complaint.proof_of_incident)
                        }
                        className="admin1-view-proof-button"
                      >
                        <span className="view-button2"><FontAwesomeIcon icon={faCaretDown}/></span>
                        <p className="view-button">View Proof</p>
                      </button>
                    </td>
                    <td className="admin1-send-button-column">
                      <button
                        onClick={() => handleShowRemarks(complaint.remarks)}
                        className="admin1-view-remarks-button"
                      >
                        <span className="view-button2"><FontAwesomeIcon icon={faCaretDown}/></span>
                        <p className="view-button">View Remarks</p>
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

        {isProofModalOpen && (
          <div className="profile-modal">
            <div className="admin1-modal-content">
              <img
                src={proofUrl}
                alt="Proof of Incident"
                className="profile-modal-image"
              />
                   <button class="admin1-close-button" onClick={closeProofModal}>Close</button>
            </div>
       
          </div>
        )}
        {isModalOpen && (
          <div className="profile-modal">
            <div className="profile-modal-content">
              <h3>Remarks:</h3>
              <ul>
                {selectedRemarks.length > 0 ? (
                  selectedRemarks.map((remark, index) => (
                    <li key={index}>{remark}</li>
                  ))
                ) : (
                  <li>No remarks available.</li>
                )}
              </ul>
              <button class="admin1-close-button" onClick={closeModal}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewComplaint;
