import React from 'react';
import { formatCurrency } from '../../utils/currency';

const MedicineList = ({ medicines = [], onEdit, onDelete }) => {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {medicines.length === 0 ? (
          <tr>
            <td colSpan="4">No medicines found</td>
          </tr>
        ) : (
          medicines.map(med => (
            <tr key={med._id}>
              <td>{med.name}</td>
              <td>{formatCurrency(med.price)}</td>
              <td>{med.stock}</td>
              <td>
                <button onClick={() => onEdit(med)}>Edit</button>
                <button className="danger" onClick={() => onDelete(med._id)}>Delete</button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default MedicineList;