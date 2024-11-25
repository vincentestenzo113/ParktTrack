import React, { useEffect, useState } from 'react';
import { supabase } from './utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('student_id, created_at, plate_number');
      if (error) {
        console.error('Error fetching users:', error.message);
      } else if (data) {
        const filteredUsers = data.filter(user => String(user.student_id) !== '123456789');
        console.log('Filtered users:', filteredUsers);
        setUsers(filteredUsers);  // Set the filtered data
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);
  

  return (
    <div className="users1-container">
      <h2>Registered Users</h2>
      <button className="back-button" onClick={() => navigate('/admin')}>
        Return
      </button>

      {loading ? (
        <p>Loading users...</p>
      ) : users.length > 0 ? (
        <table className="user1-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student ID</th>
              <th>Plate Number</th>
              <th>Date Created</th>
            </tr>
          </thead>
          <tbody>
  {users.map((user, index) => (
    user.student_id !== '123456789' && (
      <tr key={user.student_id}>
        <td>{index + 1}</td>
        <td>{user.student_id}</td>
        <td>{user.plate_number}</td>  
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
