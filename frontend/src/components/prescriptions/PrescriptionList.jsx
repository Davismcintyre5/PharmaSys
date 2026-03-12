import React from 'react';

const PrescriptionList = ({ prescriptions = [], onVerify }) => {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Patient</th>
          <th>Doctor</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {prescriptions.length === 0 ? (
          <tr>
            <td colSpan="4">No prescriptions found</td>
          </tr>
        ) : (
          prescriptions.map((rx) => (
            <tr key={rx._id}>
              <td>{rx.patientId?.name || 'N/A'}</td>
              <td>{rx.doctorName || 'N/A'}</td>
              <td>{rx.status}</td>
              <td>
                <button onClick={() => onVerify(rx)}>Verify</button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default PrescriptionList;