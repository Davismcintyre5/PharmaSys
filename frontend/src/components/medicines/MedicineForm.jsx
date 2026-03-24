import React, { useState, useEffect } from 'react';
import { createMedicine, updateMedicine } from '../../services/medicineService';
import { getSuppliers } from '../../services/supplierService';

const MedicineForm = ({ medicine, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    supplier: '',
    unitPrice: '',
    currentStock: '',
    reorderLevel: '',
    expiryDate: '',
  });
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await getSuppliers();
        setSuppliers(data);
      } catch (err) {
        console.error('Failed to fetch suppliers', err);
      }
    };
    fetchSuppliers();

    if (medicine) {
      setFormData({
        name: medicine.name,
        genericName: medicine.genericName || '',
        category: medicine.category || '',
        supplier: medicine.supplier?._id || medicine.supplier || '',
        unitPrice: medicine.unitPrice,
        currentStock: medicine.currentStock,
        reorderLevel: medicine.reorderLevel,
        expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : '',
      });
    }
  }, [medicine]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (medicine) {
        await updateMedicine(medicine._id, formData);
      } else {
        await createMedicine(formData);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">{medicine ? 'Edit Medicine' : 'Add Medicine'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-1">Name*</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Generic Name</label>
              <input
                type="text"
                name="genericName"
                value={formData.genericName}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Supplier</label>
              <select
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Unit Price*</label>
              <input
                type="number"
                step="0.01"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Current Stock*</label>
              <input
                type="number"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Reorder Level</label>
              <input
                type="number"
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicineForm;