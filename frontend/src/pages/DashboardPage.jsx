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
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Format date and time
  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString();

  return (
    <div className="dashboard-container">
      {/* System Header with PharmaSys and pharmacy name */}
      <div className="system-header" style={{ marginBottom: '20px', borderBottom: '2px solid #4361ee', paddingBottom: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', color: '#4361ee' }}>PharmaSys</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#2c3e50' }}>{settings.pharmacyName || 'Pharmacy'}</h2>
          <div style={{ textAlign: 'right', color: '#555' }}>
            <div>{formattedDate}</div>
            <div style={{ fontSize: '20px', fontWeight: '500', fontFamily: 'monospace' }}>{formattedTime}</div>
          </div>
        </div>
      </div>

      <h2 className="dashboard-title">Dashboard</h2>
      
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