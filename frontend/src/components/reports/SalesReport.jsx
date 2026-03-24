import React, { useState } from 'react'
import { getSalesReportData, printSalesReport } from '../../services/reportService'
import { formatCurrency } from '../../utils/currencyFormatter'
import { printHtml } from '../../utils/printHelper'
import ReportFilters from './ReportFilters'
import LoadingSpinner from '../common/LoadingSpinner'

const SalesReport = () => {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ from: '', to: '' })

  const handleFilter = async ({ from, to }) => {
    setLoading(true)
    try {
      const data = await getSalesReportData(from, to)
      setSales(data)
      setFilters({ from, to })
    } catch (error) {
      console.error('Failed to fetch sales report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async () => {
    try {
      const response = await printSalesReport(filters.from, filters.to)
      const blob = new Blob([response.data], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const win = window.open(url, '_blank')
      win.focus()
      win.print()
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (error) {
      console.error('Failed to print sales report:', error)
    }
  }

  const totalAmount = sales.reduce((sum, s) => sum + s.amount, 0)

  return (
    <div>
      <ReportFilters onFilter={handleFilter} initialFrom={filters.from} initialTo={filters.to} />
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Sales Transactions</h2>
          {sales.length > 0 && (
            <button
              onClick={handlePrint}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Print Report
            </button>
          )}
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : sales.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No sales data found for the selected period.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reference</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Payment Method</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cashier</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale._id}>
                      <td className="px-4 py-2">{new Date(sale.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-2">{sale.reference || '—'}</td>
                      <td className="px-4 py-2">{formatCurrency(sale.amount)}</td>
                      <td className="px-4 py-2 capitalize">{sale.paymentMethod}</td>
                      <td className="px-4 py-2">{sale.createdBy?.username || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right font-bold">
              Total: {formatCurrency(totalAmount)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SalesReport