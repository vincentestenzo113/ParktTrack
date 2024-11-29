import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./utils/supabaseClient";

const ParkingData = () => {
  const [parkingData, setParkingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchDate, setSearchDate] = useState("");
  const [searchTime, setSearchTime] = useState("");
  const [searchStudentId, setSearchStudentId] = useState("");
  const itemsPerPage = 20;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchParkingData = async () => {
      try {
        const { data, error } = await supabase
          .from("parking")
          .select("student_id, entry_time, exit_time, entry_date, exit_date");

        if (error) {
          console.error("Error fetching parking data:", error);
        } else {
          setParkingData(data);
        }
      } catch (error) {
        console.error("Error during data fetch:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParkingData();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const filteredItems = parkingData.filter((entry) => {
    const matchesDate = searchDate
      ? entry.entry_date.includes(searchDate) || entry.exit_date.includes(searchDate)
      : true;
    const matchesTime = searchTime
      ? entry.entry_time.includes(searchTime) || entry.exit_time.includes(searchTime)
      : true;
    const matchesStudentId = searchStudentId
      ? entry.student_id.toString().includes(searchStudentId)
      : true;
    return matchesDate && matchesTime && matchesStudentId;
  });

  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const nextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const prevPage = () => {
    setCurrentPage((prevPage) => prevPage - 1);
  };

  const formatTime = (timeString, dateString) => {
    try {
      const dateTimeString = `${dateString}T${timeString}`;
      const options = { hour: 'numeric', minute: 'numeric', hour12: true };
      return new Intl.DateTimeFormat('en-US', options).format(new Date(dateTimeString));
    } catch (error) {
      console.error("Invalid time value:", timeString);
      return "Invalid Time";
    }
  };

  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
    } catch (error) {
      console.error("Invalid date value:", dateString);
      return "Invalid Date";
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="parking-data-container">
      <button
        onClick={() => navigate("/admin")}
        className="back-button"
      >
        Back
      </button>
      <h2>Parking Data</h2>
      <div className="search-inputs">
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          placeholder="Search by Date"
          className="search-input"
        />
        <div className="search-input-container">
          <input
            type="time"
            value={searchTime}
            onChange={(e) => setSearchTime(e.target.value)}
            placeholder="Search by Time"
            className="search-input"
          />
          <button
            onClick={() => setSearchTime("")}
            className="clear-button"
          >
            Clear
          </button>
        </div>
        <input
          type="text"
          value={searchStudentId}
          onChange={(e) => setSearchStudentId(e.target.value)}
          placeholder="Search by Student ID"
          className="search-input"
        />
      </div>
      <table className="parking-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Entry Time</th>
            <th>Exit Time</th>
            <th>Entry Date</th>
            <th>Exit Date</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((entry, index) => (
            <tr key={index}>
              <td>{entry.student_id}</td>
              <td>{formatTime(entry.entry_time, entry.entry_date)}</td>
              <td>{formatTime(entry.exit_time, entry.exit_date)}</td>
              <td>{formatDate(entry.entry_date)}</td>
              <td>{formatDate(entry.exit_date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination-info">
        Page {currentPage} of {totalPages}
      </div>
      <div className="pagination-buttons">
        <button onClick={prevPage} disabled={currentPage === 1}>
          Previous
        </button>
        <button
          onClick={nextPage}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ParkingData;