import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getPatients, deletePatient } from '../../services/patientService';
import PatientForm from './PatientForm';
import LoadingSpinner from '../common/LoadingSpinner';

const PatientList = () => {
  const { user } = useSelector((state) => state.auth);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phone && patient.phone.includes(searchTerm)) ||
      (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredPatients(filtered);
    setCurrentPage(1);
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(data);
      setFilteredPatients(data);
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await deletePatient(id);
        setPatients(patients.filter(p => p._id !== id));
      } catch (err) {
        alert('Failed to delete patient');
      }
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPatient(null);
    fetchPatients();
  };

  const handlePrintList = () => {
    window.print();
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  const goToPage = (page) => setCurrentPage(page);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patients</h1>
        <div className="flex gap-2">
          <button
            onClick={handlePrintList}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Print List
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Patient
          </button>
        </div>
      </div>

      {showForm && <PatientForm patient={editingPatient} onClose={handleFormClose} />}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DOB</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPatients.map((patient) => (
                <tr key={patient._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{`${patient.firstName} ${patient.lastName}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.phone || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.email || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button onClick={() => handleEdit(patient)} className="text-blue-600 hover:text-blue-900">Edit</button>
                    <button onClick={() => handleDelete(patient._id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPatients.length)} of {filteredPatients.length} patients
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Print footer (only visible when printing) */}
      <div className="hidden print:block mt-4 text-center text-sm text-gray-500">
        <p>{user?.username ? `Generated by: ${user.username}` : 'Pharmacy'} – Official Patient List</p>
        <p>Generated: {new Date().toLocaleString()}</p>
        <p>Powered by PharmaSys</p>
      </div>
    </div>
  );
};

export default PatientList;