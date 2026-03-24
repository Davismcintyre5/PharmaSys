import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { formatCurrency } from '../../utils/currencyFormatter'
import { TrendingUp, Calendar } from 'lucide-react'

const IncomeChart = ({ data, chartType = 'bar' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Income Overview (Last 7 Days)</h2>
          <TrendingUp className="text-gray-400" size={20} />
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Calendar className="mx-auto mb-2" size={40} />
            <p>No income data available</p>
            <p className="text-sm">Sales data will appear here</p>
          </div>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded border border-gray-200">
          <p className="font-semibold text-gray-700">{label}</p>
          <p className="text-blue-600 font-bold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  const totalIncome = data.reduce((sum, day) => sum + day.income, 0)
  const averageIncome = totalIncome / data.length

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Income Overview</h2>
          <p className="text-sm text-gray-500">Last 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-gray-500">Avg: {formatCurrency(averageIncome)}/day</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="income" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="income" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export default IncomeChart