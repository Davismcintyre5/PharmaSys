import React, { useState, useEffect } from 'react';
import PrescriptionList from '../components/prescriptions/PrescriptionList';
import PrescriptionVerify from '../components/prescriptions/PrescriptionVerify';
import { getPrescriptions, verifyPrescription } from '../services/prescription.service';
import './Page.css'; // optional shared styling

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await getPrescriptions();
      // Ensure we always set an array
      setPrescriptions(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      console.error('Failed to load prescriptions', error);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (rx) => setSelected(rx);
  const handleApprove = async (id) => {
    await verifyPrescription(id, 'approved');
    loadPrescriptions();
    setSelected(null);
  };
  const handleReject = async (id) => {
    await verifyPrescription(id, 'rejected');
    loadPrescriptions();
    setSelected(null);
  };

  if (loading) return <div className="loading">Loading prescriptions...</div>;

  return (
    <div className="page-container">
      <h1>Prescriptions</h1>
      <PrescriptionList prescriptions={prescriptions} onVerify={handleVerify} />
      {selected && (
        <PrescriptionVerify
          prescription={selected}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default PrescriptionsPage;