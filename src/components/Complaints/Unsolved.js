import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faClipboard,
  faClipboardCheck,
  faClipboardList,
  faUsers,
  faSignOutAlt,
  faHome,
  faSquareParking,
  faSpinner,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import adminlogo from "../public/parktracklogo.png";

const Unsolved = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from("incident_report")
        .select(
          "id, student_id, description, submitted_at, incident_date, reason"
        )
        .eq("progress", 3); 

      if (error) {
        console.error("Error fetching reports:", error.message);
      } else {
        
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
            <button onClick={() => navigate("/Pending")} className="pending">
              <FontAwesomeIcon icon={faExclamationCircle} size="1x" />
            </button>
            <button onClick={() => navigate("/OnProgress")} className="on-progress">
              <FontAwesomeIcon icon={faSpinner} size="1x" />
            </button>
            <button onClick={() => navigate("/Solved")} className="solved">
              <FontAwesomeIcon icon={faClipboardCheck} size="1x" />
            </button>
            <button onClick={() => navigate("/Unsolved")} className="unsolved">
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
          <button onClick={() => navigate("/Admin")} className="admin1-sidebar-button">
            <FontAwesomeIcon icon={faHome} /> 
            Dashboard
          </button>
          <button className="admin1-sidebar-button">
            <FontAwesomeIcon icon={faClipboard} className="admin1-icon" />
            Complaints
          </button>
          <div className="admin1-complaints">
            <button className="admin1-sidebar-button" onClick={() => navigate("/Pending")}>
              <FontAwesomeIcon icon={faClipboardList} className="admin1-icon" />
              Pending
            </button>
            <button className="admin1-sidebar-button" onClick={() => navigate("/OnProgress")}>
              <FontAwesomeIcon icon={faClipboardCheck} className="admin1-icon" />
              In Progress
            </button>
            <button className="admin1-sidebar-button" onClick={() => navigate("/Solved")}>
              <FontAwesomeIcon icon={faClipboardCheck} className="admin1-icon" />
              Solved
            </button>
            <button className="admin1-sidebar-button" onClick={() => navigate("/Unsolved")}>
              <FontAwesomeIcon icon={faClipboardCheck} className="admin1-icon" />
              Unsolved
            </button>
          </div>
          <button className="admin1-sidebar-button" onClick={() => navigate("/users")}>
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
          <div className="admin1-table-title">Unsolved Complaints</div>
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
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="ticket-column">{report.id}</td>
                    <td>{report.student_id}</td>
                    <td>{new Date(report.submitted_at).toLocaleString()}</td>
                    <td>
                      {report.incident_date
                        ? new Date(report.incident_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })
                        : "N/A"}
                    </td>
                    <td>{report.description}</td>
                    <td>{report.reason || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No reports found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unsolved; 