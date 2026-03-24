import React, { useEffect, useState } from 'react'
import { getMedicines, deleteMedicine } from '../../services/medicineService'
import { formatCurrency } from '../../utils/currencyFormatter'
import MedicineForm from './MedicineForm'

const MedicineList = () => {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)

  useEffect(() => {
    fetchMedicines()
  }, [])

  const fetchMedicines = async () => {
    try {
      const data = await getMedicines()
      setMedicines(data)
    } catch (error) {
      console.error('Failed to fetch medicines:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await deleteMedicine(id)
        fetchMedicines()
      } catch (error) {
        console.error('Failed to delete medicine:', error)
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
    fetchMedicines()
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Medicines</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Medicine
        </button>
      </div>

      {showForm && (
        <MedicineForm medicine={editingMedicine} onClose={handleFormClose} />
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

export default MedicineList