import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import adminlogo from "../public/parktracklogo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faClipboard,
  faClipboardCheck,
  faClipboardList,
  faUsers,
  faSignOutAlt,
  faExclamationCircle,
  faSpinner,
  faHome,
  faSquareParking,
} from "@fortawesome/free-solid-svg-icons";

const OnProgress = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId] = useState(null);
  const [remarksInput, setRemarksInput] = useState("");
  const [showSendModal, setShowSendModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewRemarks, setViewRemarks] = useState("");
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    icon: "",
  });
  const [showUnsolvedModal, setShowUnsolvedModal] = useState(false);
  const [unsolvedReason, setUnsolvedReason] = useState("");
  const [selectedReportId, setSelectedReportId] = useState(null);
  const navigate = useNavigate();

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("incident_report")
      .select(
        "id, student_id, description, proof_of_incident, remarks, submitted_at, incident_date"
      )
      .eq("progress", 1);

    if (error) {
      console.error("Error fetching reports:", error.message);
    } else {
      setReports(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from("incident_report")
        .select(
          "id, student_id, description, submitted_at, completed_at, remarks, proof_of_incident, incident_date"
        )
        .eq("progress", 1); // Only solved reports

      if (error) {
        console.error("Error fetching reports:", error.message);
      } else {
        // Sort reports by submitted_at in descending order (latest first)
        const sortedReports = data.sort(
          (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)
        );
        setReports(sortedReports);
      }
      setLoading(false);
    };

    fetchReports();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
    } else {
      window.location.href = "/";
    }
  };

  const closeSendModal = () => {
    setShowSendModal(false);
    setRemarksInput("");
  };

  const sendRemarks = async () => {
    if (remarksInput && selectedStudentId) {
      const { data, error } = await supabase
        .from("incident_report")
        .update({
          remarks: remarksInput,
          progress: 1,
        })
        .eq("id", selectedStudentId) // Use the 'id' (primary key) here
        .select("id, remarks"); // Select the updated report's 'id' and 'remarks'

      if (error) {
        console.error("Error sending remarks:", error);
        alert(`Error: ${error.message}`);
      } else {
        if (data.length > 0) {
          setNotification({
            visible: true,
            message: "REMARKS SENT",
            icon: "success",
          });
          setTimeout(() => {
            setNotification({ visible: false, message: "", icon: "" });
          }, 4000);
          await fetchReports();
        } else {
          alert("No data returned. Please check if the report ID is correct.");
        }
      }
      closeSendModal();
    } else {
      console.warn("Remarks input or selectedReportId is empty");
    }
  };

  const handleSolve = async (reportId) => {
    const { error } = await supabase
      .from("incident_report")
      .update({
        progress: 2,
        completed_at: new Date().toISOString(), // Set current timestamp when solved
      })
      .eq("id", reportId); // Use 'id' here
    if (error) {
      console.error("Error marking as solved:", error.message);
      alert(`Error: ${error.message}`);
    } else {
      triggerNotification("Report Solved!", "solved");
      fetchReports();
    }
  };

  const handleUnsolve = async (reportId) => {
    const { error } = await supabase
      .from("incident_report")
      .update({
        progress: 3,
        remarks: null,
      })
      .eq("id", reportId); // Use 'id' here

    if (error) {
      console.error("Error marking as unsolved:", error.message);
      alert(`Error: ${error.message}`);
    } else {
      triggerNotification(
        "unsolved"
      );
      fetchReports();
    }
  };

  const openViewModal = (remarks) => {
    setViewRemarks(remarks || "No remarks available");
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewRemarks("");
  };

  const openProofModal = (proofUrl) => {
    setProofUrl(proofUrl);
    setShowProofModal(true);
  };

  const closeProofModal = () => {
    setShowProofModal(false);
    setProofUrl("");
  };

  const triggerNotification = (message, type) => {
    setNotification({ visible: true, message, icon: type });
    setTimeout(() => {
      setNotification({ visible: false, message: "", icon: "" });
    }, 3000);
  };

  const openUnsolvedModal = (reportId) => {
    setSelectedReportId(reportId);
    setShowUnsolvedModal(true);
  };

  const closeUnsolvedModal = () => {
    setShowUnsolvedModal(false);
    setUnsolvedReason("");
  };

  const submitUnsolvedReason = async () => {
    if (unsolvedReason && selectedReportId) {
      const { error } = await supabase
        .from("incident_report")
        .update({
          reason: unsolvedReason,
          progress: 3, // Set progress to 3 for unsolved
        })
        .eq("id", selectedReportId);

      if (error) {
        console.error("Error updating report:", error.message);
      } else {
        alert("Reason for unsolved report submitted successfully.");
        await fetchReports(); // Refresh the reports
      }
      closeUnsolvedModal();
    } else {
      console.warn("Reason input is empty or report ID is not set.");
    }
  };

  return (
    <div className="profile-container">
       <div className="bottom-nav-container">
        <div className="bottom-nav">
          <button onClick={() => navigate("/admin")}>
            <FontAwesomeIcon icon={faHome} />
            <span>Home</span>
          </button>
          <button onClick={() => navigate("/Pending")} className="active">
            <FontAwesomeIcon icon={faClipboardList} />
            <span>Complaints</span>
          </button>
          <div className="bottom-complaints">
            <button
              onClick={() => navigate("/Pending")}
              className="pending"
            >
              <FontAwesomeIcon icon={faExclamationCircle} size="1x" />
            </button>
            <button
              onClick={() => navigate("/OnProgress")}
              className="on-progress"
            >
              <FontAwesomeIcon icon={faSpinner} size="1x" />
            </button>
            <button onClick={() => navigate("/Solved")} className="solved">
              <FontAwesomeIcon icon={faClipboardCheck} size="1x" />
            </button>
          </div>
          <button onClick={() => navigate("/users")}>
            <FontAwesomeIcon icon={faUsers} />
            <span>Users</span>
          </button>
          <button onClick={() => navigate("/parking-data")}>
            <FontAwesomeIcon icon={faSquareParking} />
            <span>Park Data</span>
          </button>
        </div>
      </div>
      <div className="profile-sidebar">
        <div className="admin1-logo">
          <img src={adminlogo} className="admin1-logo-image" alt="admin logo" />
          <span className="admin1-logo-text">
            PARK <br /> TRACK
          </span>
        </div>
        <div className="admin1-dashboard">
          <button
            onClick={() => navigate("/Admin")}
            className="admin1-sidebar-button"
          >
            <FontAwesomeIcon icon={faHome} /> 
            Dashboard
          </button>
          <button className="admin1-sidebar-button">
            <FontAwesomeIcon icon={faClipboard} className="admin1-icon" />
            Complaints
          </button>
          <div className="admin1-complaints">
            <button
              className="admin1-sidebar-button"
              onClick={() => navigate("/Pending")}
            >
              <FontAwesomeIcon icon={faClipboardList} className="admin1-icon" />
              Pending
            </button>
            <button
              className="admin1-sidebar-button"
              onClick={() => navigate("/OnProgress")}
            >
              <FontAwesomeIcon
                icon={faClipboardCheck}
                className="admin1-icon"
              />
              In Progress
            </button>
            <button
              className="admin1-sidebar-button"
              onClick={() => navigate("/Solved")}
            >
              <FontAwesomeIcon
                icon={faClipboardCheck}
                className="admin1-icon"
              />
              Solved
            </button>
            <button
              className="admin1-sidebar-button"
              onClick={() => navigate("/Unsolved")}
            >
              <FontAwesomeIcon
                icon={faClipboardCheck}
                className="admin1-icon"
              />
              Unsolved
            </button>
          </div>
          <button
            className="admin1-sidebar-button"
            onClick={() => navigate("/users")}
          >
            <FontAwesomeIcon icon={faUsers} className="admin1-icon" />
            Registered Users
          </button>
          <button onClick={handleLogout} className="admin1-logout-button">
            <FontAwesomeIcon icon={faSignOutAlt} className="admin1-icon" />
            Logout
          </button>
        </div>
      </div>
      <div className="profile-content">
        <div className="profile-complaints-table">
          <div className="admin1-table-title">In Progress Complaints</div>
          {loading ? (
            <p>Loading reports...</p>
          ) : reports.length > 0 ? (
            <table className="profile-users-table">
              <thead>
                <tr>
                  <th className="ticket-column">Ticket #</th>
                  <th>Student ID</th>
                  <th>Date and Time Submitted</th>
                  <th>Incident Date</th>
                  <th className="description-column">Description</th>
                  <th>Remarks</th>
                  <th>Proof</th>
                  <th>Take Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    {" "}
                    {/* Ensure that the 'id' field is being used here */}
                    <td className="ticket-column">{report.id}</td>{" "}
                    {/* Display the 'id' as the Ticket # */}
                    <td>{report.student_id}</td>
                    <td>{new Date(report.submitted_at).toLocaleString()}</td>
                    <td>
                      {report.incident_date
                        ? new Date(report.incident_date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )
                        : "N/A"}
                    </td>
                    <td>{report.description}</td>
                    <td>
                      <button
                        onClick={() => openViewModal(report.remarks)}
                        className="admin1-view-remarks-button"
                      >
                        View Remarks
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => openProofModal(report.proof_of_incident)}
                        className="admin1-view-proof-button"
                      >
                        View Proof
                      </button>
                    </td>
                    <td className="admin1-send-button-column">
                      <button
                        onClick={() => handleSolve(report.id)}
                        className="admin1-solve-button"
                      >
                        Solve
                      </button>
                      <button
                        onClick={() => openUnsolvedModal(report.id)}
                        className="admin1-unsolve-button"
                      >
                        Unsolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No reports in progress.</p>
          )}
        </div>

        {/* Notification Box */}
        {notification.visible && (
          <div className={`notification-box ${notification.icon}`}>
            {notification.message}
          </div>
        )}

        {/* Send Remarks Modal */}
        {showSendModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Send Remarks</h2>
              <textarea
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                placeholder="Enter remarks..."
              />
              <button onClick={sendRemarks}>Send</button>
              <button onClick={closeSendModal}>Cancel</button>
            </div>
          </div>
        )}

        {/* View Remarks Modal */}
        {showViewModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>View Remarks</h2>
              <p>{viewRemarks}</p>
              <button onClick={closeViewModal} className="admin1-close-button">
                Close
              </button>
            </div>
          </div>
        )}

        {/* View Proof Modal */}
        {showProofModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Proof of Incident</h2>
              <img
                src={proofUrl}
                alt="Proof"
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "cover",
                }}
              />
              <button onClick={closeProofModal} className="admin1-close-button">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Unsolved Reason Modal */}
        {showUnsolvedModal && (
          <div className="admin1-modal">
            <div className="admin1-modal-content">
              <h2>Reason for Unsolved</h2>
              <textarea
                value={unsolvedReason}
                onChange={(e) => setUnsolvedReason(e.target.value)}
                placeholder="Enter reason here..."
              />
              <button onClick={submitUnsolvedReason} className="admin1-send-button">
                Submit
              </button>
              <button onClick={closeUnsolvedModal} className="admin1-cancel-button">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnProgress;
