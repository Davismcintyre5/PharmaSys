import React, { useEffect, useState } from 'react'
import { getLowStockMedicines } from '../../services/dashboardService'
import { formatCurrency } from '../../utils/currencyFormatter'
import LoadingSpinner from '../common/LoadingSpinner'
import { AlertCircle, Package } from 'lucide-react'

const LowStockList = () => {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const data = await getLowStockMedicines()
        setMedicines(data)
      } catch (error) {
        console.error('Failed to fetch low stock medicines:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLowStock()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Low Stock Items</h2>
        <AlertCircle className="text-yellow-500" size={20} />
      </div>
      {medicines.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="mx-auto mb-2" size={40} />
          <p>No low stock items</p>
          <p className="text-sm">All medicines are above reorder level</p>
        </div>
      ) : (
        <ul className="divide-y">
          {medicines.map((med) => (
            <li key={med._id} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">{med.name}</p>
                <p className="text-sm text-gray-500">
                  Reorder at: {med.reorderLevel} units
                </p>
              </div>
              <div className="text-right">
                <p className="text-red-600 font-semibold">{med.currentStock} left</p>
                <p className="text-xs text-gray-500">{formatCurrency(med.unitPrice)} each</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default LowStockList