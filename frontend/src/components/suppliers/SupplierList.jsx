import React from 'react';

const SupplierList = ({ suppliers = [], onEdit, onDelete }) => {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Contact Person</th>
          <th>Phone</th>
          <th>Email</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {suppliers.length === 0 ? (
          <tr><td colSpan="5">No suppliers found</td></tr>
        ) : (
          suppliers.map(s => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{s.contactPerson || '-'}</td>
              <td>{s.phone}</td>
              <td>{s.email}</td>
              <td>
                <button onClick={() => onEdit(s)}>Edit</button>
                <button className="danger" onClick={() => onDelete(s._id)}>Delete</button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default SupplierList;