import React from 'react';

const MedicineDetails = ({ medicine }) => {
  if (!medicine) return <div>Select a medicine</div>;
  return (
    <div>
      <h2>{medicine.name}</h2>
      <p>Generic: {medicine.genericName}</p>
      <p>Price: ${medicine.price}</p>
      <p>Stock: {medicine.stock}</p>
      <p>Prescription required: {medicine.requiresPrescription ? 'Yes' : 'No'}</p>
    </div>
  );
};

export default MedicineDetails;