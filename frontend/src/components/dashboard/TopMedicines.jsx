import React, { useEffect, useState } from 'react'
import { getTopMedicines } from '../../services/dashboardService'
import { formatCurrency } from '../../utils/currencyFormatter'
import LoadingSpinner from '../common/LoadingSpinner'
import { TrendingUp, Package } from 'lucide-react'

const TopMedicines = () => {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopMedicines = async () => {
      try {
        const data = await getTopMedicines()
        setMedicines(data)
      } catch (error) {
        console.error('Failed to fetch top medicines:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTopMedicines()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Top Selling Medicines</h2>
        <TrendingUp className="text-green-500" size={20} />
      </div>
      {medicines.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="mx-auto mb-2" size={40} />
          <p>No sales data yet</p>
          <p className="text-sm">Sales will appear here once transactions are recorded</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {medicines.map((med, idx) => (
            <li key={med._id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`
                  inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                  ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                    idx === 1 ? 'bg-gray-100 text-gray-700' : 
                    idx === 2 ? 'bg-orange-100 text-orange-700' : 
                    'bg-blue-100 text-blue-700'}
                `}>
                  {idx + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-800">{med.name}</p>
                  <p className="text-xs text-gray-500">{med.category || 'Uncategorized'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">{med.unitsSold} units</p>
                <p className="text-xs text-gray-500">{formatCurrency(med.revenue)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default TopMedicines