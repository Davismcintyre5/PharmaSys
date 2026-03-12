import React from 'react';

const PatientHistory = ({ patient }) => {
  return (
    <div>
      <h3>Prescription History</h3>
      {patient?.prescriptions?.map(rx => (
        <div key={rx._id}>{rx._id} - {rx.status}</div>
      ))}
    </div>
  );
};

export default PatientHistory;