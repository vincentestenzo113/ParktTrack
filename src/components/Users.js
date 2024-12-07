import React, { useEffect, useState } from 'react';
import { supabase } from './utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('student_id, created_at, motorcycle_model, motorcycle_colorway, contact_number, rfid_tag');
      if (error) {
        console.error('Error fetching users:', error.message);
      } else if (data) {
        const filteredUsers = data.filter(user => String(user.student_id) !== '123456789');
        setUsers(filteredUsers);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredUsers = users.filter(user => {
    const motorcycleDetails = `${user.motorcycle_model} - ${user.motorcycle_colorway}`;
    return (
      String(user.student_id).includes(searchTerm) ||
      motorcycleDetails.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="users1-container">
      <h2>Registered Users</h2>
      <button className="back-button" onClick={() => navigate('/admin')}>
        Return
      </button>

      <input
        type="text"
        placeholder="Search by Student ID or Motorcycle Details"
        value={searchTerm}
        onChange={handleSearch}
        className="search-bar"
      />

      {loading ? (
        <p>Loading users...</p>
      ) : filteredUsers.length > 0 ? (
        <table className="user1-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student ID</th>
              <th>Motorcycle Details</th>
              <th>RFID</th>
              <th>Contact Number</th>
              <th>Date Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              user.student_id !== '123456789' && (
                <tr key={user.student_id}>
                  <td>{index + 1}</td>
                  <td>{user.student_id}</td>
                  <td>
                    {user.motorcycle_model && user.motorcycle_colorway 
                      ? `${user.motorcycle_model} - ${user.motorcycle_colorway}` 
                      : "No motorcycle inputted"}
                  </td>
                  <td>{user.rfid_tag ? "Tagged" : "Not Tagged"}</td>
                  <td>{user.contact_number || "No contact number"}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      ) : (
        <p>No registered users found.</p>
      )}
    </div>
  );
};

export default Users;
