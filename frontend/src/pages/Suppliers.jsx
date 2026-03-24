import React, { useState, useEffect } from 'react'
import { getSuppliers, deleteSupplier } from '../services/supplierService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SupplierForm from '../components/suppliers/SupplierForm'

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await getSuppliers()
        setSuppliers(data)
      } catch (err) {
        setError('Failed to load suppliers')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSuppliers()
  }, [])

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier(id)
        setSuppliers(suppliers.filter(s => s._id !== id))
      } catch (err) {
        alert('Failed to delete supplier')
      }
    }
  }

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingSupplier(null)
    getSuppliers().then(setSuppliers).catch(console.error)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-500 p-8">{error}</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Supplier
        </button>
      </div>

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          onClose={handleFormClose}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {suppliers.map((supplier) => (
              <tr key={supplier._id}>
                <td className="px-6 py-4 whitespace-nowrap">{supplier.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{supplier.contactPerson || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{supplier.phone || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{supplier.email || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button onClick={() => handleEdit(supplier)} className="text-blue-600 hover:text-blue-900">Edit</button>
                  <button onClick={() => handleDelete(supplier._id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Suppliers