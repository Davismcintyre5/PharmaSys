import React from 'react';

const PrescriptionVerify = ({ prescription, onApprove, onReject }) => {
  return (
    <div>
      <h3>Verify Prescription</h3>
      <p>Patient: {prescription.patientId?.name}</p>
      <p>Doctor: {prescription.doctorName}</p>
      <p>Items: {prescription.items?.length}</p>
      <button onClick={() => onApprove(prescription._id)}>Approve</button>
      <button onClick={() => onReject(prescription._id)}>Reject</button>
    </div>
  );
};

export default PrescriptionVerify;