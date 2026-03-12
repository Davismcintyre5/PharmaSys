import React from 'react';

const PatientList = ({ patients = [], onSelect }) => {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Phone</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {patients.length === 0 ? (
          <tr>
            <td colSpan="3">No patients found</td>
          </tr>
        ) : (
          patients.map(p => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>{p.phone}</td>
              <td>
                <button onClick={() => onSelect(p)}>View</button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default PatientList;