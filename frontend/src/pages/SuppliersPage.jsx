import React, { useState, useEffect } from 'react';
import SupplierList from '../components/suppliers/SupplierList';
import SupplierForm from '../components/suppliers/SupplierForm';
import Modal from '../components/common/Modal';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/supplier.service';
import './Page.css';

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const res = await getSuppliers();
      setSuppliers(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      console.error('Failed to load suppliers', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    if (editing) {
      await updateSupplier(editing._id, values);
    } else {
      await createSupplier(values);
    }
    loadSuppliers();
    setModalOpen(false);
    setEditing(null);
  };

  const handleEdit = (supplier) => {
    setEditing(supplier);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      await deleteSupplier(id);
      loadSuppliers();
    }
  };

  if (loading) return <div className="loading">Loading suppliers...</div>;

  return (
    <div className="page-container">
      <h1>Suppliers</h1>
      <button onClick={() => { setEditing(null); setModalOpen(true); }} className="success">Add Supplier</button>
      <SupplierList suppliers={suppliers} onEdit={handleEdit} onDelete={handleDelete} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
        <SupplierForm initialValues={editing} onSubmit={handleSave} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default SuppliersPage;