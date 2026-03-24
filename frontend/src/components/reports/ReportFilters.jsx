import React, { useState } from 'react'

const ReportFilters = ({ onFilter, initialFrom, initialTo }) => {
  const [from, setFrom] = useState(initialFrom || '')
  const [to, setTo] = useState(initialTo || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    onFilter({ from, to })
  }

  const handleReset = () => {
    setFrom('')
    setTo('')
    onFilter({ from: '', to: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-4 flex flex-wrap items-end gap-4">
      <div>
        <label className="block text-sm text-gray-600 mb-1">From Date</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">To Date</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
        >
          Reset
        </button>
      </div>
    </form>
  )
}

export default ReportFilters