import React, { useEffect, useState } from 'react'
import { getInventoryReportData } from '../../services/reportService'
import { formatCurrency } from '../../utils/currencyFormatter'
import LoadingSpinner from '../common/LoadingSpinner'

const InventoryReport = () => {
  const [data, setData] = useState({ lowStock: [], expiringSoon: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getInventoryReportData()
        setData(res)
      } catch (error) {
        console.error('Failed to fetch inventory report:', error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Low Stock Items</h2>
        {data.lowStock.length === 0 ? (
          <p className="text-gray-500">No low stock items.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Current Stock</th>
                <th className="px-4 py-2 text-left">Reorder Level</th>
                <th className="px-4 py-2 text-left">Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {data.lowStock.map((med) => (
                <tr key={med._id}>
                  <td className="px-4 py-2">{med.name}</td>
                  <td className="px-4 py-2">{med.currentStock}</td>
                  <td className="px-4 py-2">{med.reorderLevel}</td>
                  <td className="px-4 py-2">{formatCurrency(med.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4 text-orange-600">Expiring Soon (within 30 days)</h2>
        {data.expiringSoon.length === 0 ? (
          <p className="text-gray-500">No medicines expiring soon.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Expiry Date</th>
                <th className="px-4 py-2 text-left">Stock</th>
              </tr>
            </thead>
            <tbody>
              {data.expiringSoon.map((med) => (
                <tr key={med._id}>
                  <td className="px-4 py-2">{med.name}</td>
                  <td className="px-4 py-2">{new Date(med.expiryDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{med.currentStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default InventoryReport