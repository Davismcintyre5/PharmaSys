import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getTransactions, deleteTransaction, printTransaction } from '../../services/transactionService';
import { approveTransaction, rejectTransaction } from '../../services/accountsService';
import { formatCurrency } from '../../utils/currencyFormatter';
import { printHtml } from '../../utils/printHelper';

const TransactionsTab = () => {
  const { user } = useSelector((state) => state.auth);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '', from: '', to: '' });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await getTransactions(filters);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this transaction? This action cannot be undone.')) {
      try {
        await deleteTransaction(id);
        fetchTransactions();
      } catch (error) {
        alert('Delete failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handlePrint = async (id) => {
    try {
      const html = await printTransaction(id);
      printHtml(html);
    } catch (error) {
      alert('Failed to print receipt');
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm('Approve this transaction?')) {
      try {
        await approveTransaction(id);
        fetchTransactions();
      } catch (error) {
        alert('Approval failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (reason !== null) {
      try {
        await rejectTransaction(id, reason);
        fetchTransactions();
      } catch (error) {
        alert('Rejection failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handlePrintList = () => {
    window.print();
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm text-gray-600">Type</label>
            <select name="type" value={filters.type} onChange={handleFilterChange} className="border rounded px-3 py-1">
              <option value="">All</option>
              <option value="sale">Sale</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="border rounded px-3 py-1">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">From Date</label>
            <input type="date" name="from" value={filters.from} onChange={handleFilterChange} className="border rounded px-3 py-1" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">To Date</label>
            <input type="date" name="to" value={filters.to} onChange={handleFilterChange} className="border rounded px-3 py-1" />
          </div>
          <button onClick={fetchTransactions} className="bg-blue-600 text-white px-4 py-1 rounded self-end">Apply</button>
          <button onClick={handlePrintList} className="bg-gray-600 text-white px-4 py-1 rounded self-end">Print List</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Payment Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => (
              <tr key={tx._id}>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(tx.createdAt).toLocaleString()}</td>
                <td className="px-6 py-4 capitalize">{tx.type}</td>
                <td className="px-6 py-4">{tx.reference || '—'}</td>
                <td className="px-6 py-4">{formatCurrency(tx.amount)}</td>
                <td className="px-6 py-4 capitalize">{tx.paymentMethod}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                    tx.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button onClick={() => handlePrint(tx._id)} className="text-blue-600 hover:text-blue-900">Print</button>
                  {tx.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(tx._id)} className="text-green-600 hover:text-green-900">Approve</button>
                      <button onClick={() => handleReject(tx._id)} className="text-red-600 hover:text-red-900">Reject</button>
                      <button onClick={() => handleDelete(tx._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
        <p>{user?.username ? `Generated by: ${user.username}` : 'Pharmacy'} – Official Transactions List</p>
        <p>Generated: {new Date().toLocaleString()}</p>
        <p>Powered by PharmaSys</p>
      </div>
    </div>
  );
};

export default TransactionsTab;