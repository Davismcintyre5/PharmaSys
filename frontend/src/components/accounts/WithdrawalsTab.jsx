import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getWithdrawals, requestWithdrawal, approveWithdrawal, rejectWithdrawal, printWithdrawal } from '../../services/withdrawalService';
import { formatCurrency } from '../../utils/currencyFormatter';
import { printHtml } from '../../utils/printHelper';

const WithdrawalsTab = () => {
  const { user } = useSelector((state) => state.auth);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', from: '', to: '' });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ amount: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, [filters]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const data = await getWithdrawals(filters);
      setWithdrawals(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await requestWithdrawal(formData);
      setShowModal(false);
      setFormData({ amount: '', reason: '' });
      fetchWithdrawals();
    } catch (err) { setError(err.response?.data?.message); } finally { setSubmitting(false); }
  };

  const handleApprove = async (id) => {
    if (window.confirm('Approve this withdrawal?')) {
      try {
        await approveWithdrawal(id);
        fetchWithdrawals();
      } catch (err) { alert('Approval failed'); }
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (reason !== null) {
      try {
        await rejectWithdrawal(id, reason);
        fetchWithdrawals();
      } catch (err) { alert('Rejection failed'); }
    }
  };

  const handlePrint = async (id) => {
    try {
      const html = await printWithdrawal(id);
      printHtml(html);
    } catch (err) { alert('Print failed'); }
  };

  const handlePrintList = () => {
    window.print();
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex gap-4 flex-wrap">
          <select name="status" onChange={handleFilterChange} className="border rounded px-2 py-1">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input type="date" name="from" onChange={handleFilterChange} className="border rounded px-2 py-1" />
          <input type="date" name="to" onChange={handleFilterChange} className="border rounded px-2 py-1" />
          <button onClick={fetchWithdrawals} className="bg-blue-600 text-white px-3 py-1 rounded">Apply</button>
          <button onClick={handlePrintList} className="bg-gray-600 text-white px-3 py-1 rounded">Print List</button>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Request Withdrawal</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Amount</th>
              <th className="px-6 py-3 text-left">Reason</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Requested By</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map(w => (
              <tr key={w._id}>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(w.createdAt).toLocaleString()}</td>
                <td className="px-6 py-4">{formatCurrency(w.amount)}</td>
                <td className="px-6 py-4">{w.reason}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    w.status === 'approved' ? 'bg-green-100 text-green-800' :
                    w.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {w.status}
                  </span>
                </td>
                <td className="px-6 py-4">{w.requestedBy?.username}</td>
                <td className="px-6 py-4 space-x-2">
                  <button onClick={() => handlePrint(w._id)} className="text-blue-600 hover:text-blue-900">Print</button>
                  {w.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(w._id)} className="text-green-600 hover:text-green-900">Approve</button>
                      <button onClick={() => handleReject(w._id)} className="text-red-600 hover:text-red-900">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Print footer (only visible when printing) */}
      <div className="hidden print:block mt-4 text-center text-sm text-gray-500">
        <p>{user?.username ? `Generated by: ${user.username}` : 'Pharmacy'} – Official Withdrawals List</p>
        <p>Generated: {new Date().toLocaleString()}</p>
        <p>Powered by PharmaSys</p>
      </div>

      {/* Request Withdrawal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Request Withdrawal</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <form onSubmit={handleRequest}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Amount</label>
                <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Reason</label>
                <textarea name="reason" value={formData.reason} onChange={handleFormChange} rows="3" className="w-full border rounded px-3 py-2" required />
              </div>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalsTab;