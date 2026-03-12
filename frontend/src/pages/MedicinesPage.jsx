import React, { useState, useEffect } from 'react';
import MedicineList from '../components/medicines/MedicineList';
import MedicineForm from '../components/medicines/MedicineForm';
import Modal from '../components/common/Modal';
import { getMedicines, createMedicine, updateMedicine, deleteMedicine } from '../services/medicine.service';
import './Page.css';

const MedicinesPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const res = await getMedicines();
      setMedicines(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      console.error('Failed to load medicines', error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    if (editing) {
      await updateMedicine(editing._id, values);
    } else {
      await createMedicine(values);
    }
    loadMedicines();
    setModalOpen(false);
    setEditing(null);
  };

  const handleEdit = (med) => {
    setEditing(med);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      await deleteMedicine(id);
      loadMedicines();
    }
  };

  if (loading) return <div className="loading">Loading medicines...</div>;

  return (
    <div className="page-container">
      <h1>Medicines</h1>
      <button onClick={() => { setEditing(null); setModalOpen(true); }}>Add Medicine</button>
      <MedicineList medicines={medicines} onEdit={handleEdit} onDelete={handleDelete} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Medicine' : 'Add Medicine'}>
        <MedicineForm initialValues={editing} onSubmit={handleSave} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default MedicinesPage;