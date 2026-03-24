import React, { useState } from 'react'
import SalesReport from '../components/reports/SalesReport'
import InventoryReport from '../components/reports/InventoryReport'

const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveReport('sales')}
            className={`pb-2 px-1 ${activeReport === 'sales' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Sales Report
          </button>
          <button
            onClick={() => setActiveReport('inventory')}
            className={`pb-2 px-1 ${activeReport === 'inventory' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Inventory Report
          </button>
        </nav>
      </div>
      {activeReport === 'sales' && <SalesReport />}
      {activeReport === 'inventory' && <InventoryReport />}
    </div>
  )
}

export default Reports