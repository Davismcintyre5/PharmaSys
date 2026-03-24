import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import SummaryCards from '../components/dashboard/SummaryCards'
import IncomeChart from '../components/dashboard/IncomeChart'
import LowStockList from '../components/dashboard/LowStockList'
import TopMedicines from '../components/dashboard/TopMedicines'
import RecentActivity from '../components/dashboard/RecentActivity'
import { getDashboardSummary, getIncomeOverview } from '../services/dashboardService'
import LoadingSpinner from '../components/common/LoadingSpinner'

const Dashboard = () => {
  const [summary, setSummary] = useState(null)
  const [incomeData, setIncomeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, incomeRes] = await Promise.all([
          getDashboardSummary(),
          getIncomeOverview(7),
        ])
        setSummary(summaryRes)
        setIncomeData(incomeRes)
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <SummaryCards data={summary} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <IncomeChart data={incomeData} />
        <LowStockList />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <TopMedicines />
        <RecentActivity />
      </div>
    </div>
  )
}

export default Dashboard