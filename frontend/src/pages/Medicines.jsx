import React, { useState, useEffect } from 'react'
import { getMedicines, deleteMedicine } from '../services/medicineService'
import { getSuppliers } from '../services/supplierService'
import { formatCurrency } from '../utils/currencyFormatter'
import LoadingSpinner from '../components/common/LoadingSpinner'
import MedicineForm from '../components/medicines/MedicineForm'

const Medicines = () => {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [error, setError] = useState('')
  const [suppliers, setSuppliers] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meds, sups] = await Promise.all([
          getMedicines(),
          getSuppliers(),
        ])
        setMedicines(meds)
        setSuppliers(sups)
      } catch (err) {
        setError('Failed to load data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await deleteMedicine(id)
        setMedicines(medicines.filter(m => m._id !== id))
      } catch (err) {
        alert('Failed to delete medicine')
      }
    }
  }

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingMedicine(null)
    // Refresh list after form close
    getMedicines().then(setMedicines).catch(console.error)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-500 p-8">{error}</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Medicines</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Medicine
        </button>
      </div>

      {showForm && (
        <MedicineForm
          medicine={editingMedicine}
          onClose={handleFormClose}
          suppliers={suppliers}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {medicines.map((med) => (
              <tr key={med._id}>
                <td className="px-6 py-4 whitespace-nowrap">{med.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{med.category || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={med.currentStock <= med.reorderLevel ? 'text-red-600 font-semibold' : ''}>
                    {med.currentStock}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(med.unitPrice)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button onClick={() => handleEdit(med)} className="text-blue-600 hover:text-blue-900">Edit</button>
                  <button onClick={() => handleDelete(med._id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Medicines