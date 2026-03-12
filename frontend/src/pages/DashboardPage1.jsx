import React, { useEffect, useState } from 'react';
import StatsCard from '../components/dashboard/StatsCard';
import Chart from '../components/dashboard/Chart';
import { getDashboardStats } from '../services/dashboard.service';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/currency';
import './DashboardPage.css';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalMedicines: 0,
    pendingPrescriptions: 0,
    todayIncome: 0,
    todayExpense: 0,
    lowStockItems: 0,
    currentBalance: 0,
    incomeChart: { labels: [], data: [] },
  });

  const { settings, loading: settingsLoading } = useSettings();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      }
    };
    fetchStats();
  }, []);

  const chartData = {
    labels: stats.incomeChart.labels,
    datasets: [
      {
        label: `Daily Income (${settings.currency})`,
        data: stats.incomeChart.data,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMin: 0,
      },
    },
  };

  if (settingsLoading) return <div className="loading">Loading settings...</div>;

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      
      <div className="stats-grid">
        <StatsCard title="Current Balance" value={formatCurrency(stats.currentBalance)} />
        <StatsCard title="Revenue Today" value={formatCurrency(stats.todayIncome)} />
        <StatsCard title="Expenses Today" value={formatCurrency(stats.todayExpense)} />
        <StatsCard title="Low Stock Items" value={stats.lowStockItems} />
      </div>

      <div className="stats-grid secondary">
        <StatsCard title="Total Patients" value={stats.totalPatients} />
        <StatsCard title="Medicines" value={stats.totalMedicines} />
        <StatsCard title="Pending Rx" value={stats.pendingPrescriptions} />
      </div>

      <div className="chart-section">
        <h2>Income Overview (Last 7 Days)</h2>
        <div className="chart-wrapper" style={{ height: '350px' }}>
          <Chart data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;