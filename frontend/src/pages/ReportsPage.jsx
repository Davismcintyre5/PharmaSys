import React, { useState, useEffect } from 'react';
import { getSalesReport, getInventoryReport, getFinancialReport } from '../services/report.service';
import { getSettings } from '../services/setting.service';
import { formatCurrency } from '../utils/currency';
import './Page.css';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedAt, setGeneratedAt] = useState(null);
  const [pharmacyName, setPharmacyName] = useState('Pharmacy');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      if (res.data.data?.pharmacyName) {
        setPharmacyName(res.data.data.pharmacyName);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setData([]);
    try {
      let res;
      if (reportType === 'sales') {
        res = await getSalesReport({ startDate, endDate });
      } else if (reportType === 'inventory') {
        res = await getInventoryReport();
      } else if (reportType === 'financial') {
        res = await getFinancialReport({ startDate, endDate });
      }
      setData(res.data.data || []);
      setGeneratedAt(new Date());
    } catch (err) {
      console.error('Report generation failed:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'sales': return 'Sales Report';
      case 'inventory': return 'Inventory Report';
      case 'financial': return 'Financial Report';
      default: return 'Report';
    }
  };

  return (
    <div className="page-container">
      <h1>Reports</h1>

      {/* Controls – hidden when printing */}
      <div className="no-print card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group">
            <label>Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="financial">Financial Report</option>
            </select>
          </div>
          {reportType !== 'inventory' && (
            <>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </>
          )}
          <button onClick={handleGenerate} className="primary">Generate</button>
          <button onClick={handlePrint} className="secondary" disabled={!data.length}>Print</button>
        </div>
      </div>

      {loading && <div className="loading">Loading report...</div>}
      {error && <div className="alert error">{error}</div>}

      {!loading && !error && data.length === 0 && (
        <p>No data found for the selected criteria.</p>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="printable">
          {/* Watermark – only visible in print */}
          <div className="watermark">{pharmacyName}</div>

          <div className="report-header">
            <h2>{pharmacyName}</h2>
            <h3>{getReportTitle()}</h3>
            {reportType !== 'inventory' && startDate && endDate && (
              <p>Period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</p>
            )}
            <p>Generated: {generatedAt?.toLocaleString()}</p>
            <hr />
          </div>

          {reportType === 'sales' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map(order => (
                  <tr key={order._id}>
                    <td>{order._id}</td>
                    <td>{order.patientId?.name || 'N/A'}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{formatCurrency(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'inventory' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {data.map(med => (
                  <tr key={med._id}>
                    <td>{med.name}</td>
                    <td>{med.category || '-'}</td>
                    <td>{med.stock}</td>
                    <td>{formatCurrency(med.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'financial' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.map(tx => (
                  <tr key={tx._id}>
                    <td>{new Date(tx.date).toLocaleDateString()}</td>
                    <td><span className={`badge ${tx.type}`}>{tx.type}</span></td>
                    <td>{tx.description}</td>
                    <td>{formatCurrency(tx.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="report-footer" style={{ marginTop: '30px', textAlign: 'center' }}>
            <hr />
            <p>{pharmacyName} - {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;