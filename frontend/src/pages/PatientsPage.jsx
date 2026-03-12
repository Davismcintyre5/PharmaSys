import React, { useState, useEffect } from 'react';
import PatientList from '../components/patients/PatientList';
import PatientForm from '../components/patients/PatientForm';
import PatientHistory from '../components/patients/PatientHistory';
import Modal from '../components/common/Modal';
import { getPatients, createPatient, updatePatient } from '../services/patient.service';
import './Page.css';

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await getPatients();
      setPatients(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      console.error('Failed to load patients', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    if (editing) {
      await updatePatient(editing._id, values);
    } else {
      await createPatient(values);
    }
    loadPatients();
    setModalOpen(false);
    setEditing(null);
  };

  const handleSelect = (patient) => setSelectedPatient(patient);

  if (loading) return <div className="loading">Loading patients...</div>;

  return (
    <div className="page-container">
      <h1>Patients</h1>
      <button onClick={() => { setEditing(null); setModalOpen(true); }}>Add Patient</button>
      <PatientList patients={patients} onSelect={handleSelect} />
      {selectedPatient && <PatientHistory patient={selectedPatient} />}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Patient' : 'Add Patient'}>
        <PatientForm initialValues={editing} onSubmit={handleSave} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default PatientsPage;