import React, { useEffect, useState } from 'react'
import { getSuppliers, deleteSupplier } from '../../services/supplierService'
import SupplierForm from './SupplierForm'

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const data = await getSuppliers()
      setSuppliers(data)
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier(id)
        fetchSuppliers()
      } catch (error) {
        console.error('Failed to delete supplier:', error)
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
    fetchSuppliers()
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Supplier
        </button>
      </div>

      {showForm && (
        <SupplierForm supplier={editingSupplier} onClose={handleFormClose} />
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

export default SupplierList