import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getTransactions, deleteTransaction, printTransaction } from '../services/transactionService';
import { createInvoice } from '../services/invoiceService';
import { requestWithdrawal } from '../services/withdrawalService';
import { getPatients } from '../services/patientService';
import { getSuppliers } from '../services/supplierService';
import { formatCurrency } from '../utils/currencyFormatter';
import { printHtml } from '../utils/printHelper';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Transactions = () => {
  const { user } = useSelector((state) => state.auth);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '', from: '', to: '' });

  // Modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    amount: '',
    dueDate: '',
    description: '',
    clientModel: 'Patient',
    client: '',
    sendTo: { phone: '', email: '' },
  });
  const [withdrawalForm, setWithdrawalForm] = useState({ amount: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetchTransactions();
    fetchClients();
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

  const fetchClients = async () => {
    try {
      const [pats, sups] = await Promise.all([getPatients(), getSuppliers()]);
      setPatients(pats);
      setSuppliers(sups);
    } catch (err) {
      console.error('Failed to fetch clients', err);
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

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handlePrintList = () => {
    window.print();
  };

  // Invoice handlers
  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;
    if (name === 'sendToPhone') setInvoiceForm({ ...invoiceForm, sendTo: { ...invoiceForm.sendTo, phone: value } });
    else if (name === 'sendToEmail') setInvoiceForm({ ...invoiceForm, sendTo: { ...invoiceForm.sendTo, email: value } });
    else setInvoiceForm({ ...invoiceForm, [name]: value });
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const type = invoiceForm.clientModel === 'Patient' ? 'sale' : 'purchase';
      await createInvoice({ ...invoiceForm, type });
      setShowInvoiceModal(false);
      setInvoiceForm({ amount: '', dueDate: '', description: '', clientModel: 'Patient', client: '', sendTo: { phone: '', email: '' } });
      alert('Invoice created successfully. It will appear in Accounts for approval once marked paid.');
    } catch (err) {
      setError(err.response?.data?.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Withdrawal handlers
  const handleWithdrawalChange = (e) => {
    setWithdrawalForm({ ...withdrawalForm, [e.target.name]: e.target.value });
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await requestWithdrawal(withdrawalForm);
      setShowWithdrawalModal(false);
      setWithdrawalForm({ amount: '', reason: '' });
      alert('Withdrawal request submitted. It will appear in Accounts for approval.');
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Create Invoice
          </button>
          <button
            onClick={() => setShowWithdrawalModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Request Withdrawal
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4">
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

      {/* Transactions Table */}
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
                    <button onClick={() => handleDelete(tx._id)} className="text-red-600 hover:text-red-900">Delete</button>
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

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Create Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <form onSubmit={handleInvoiceSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-1">Client Type</label>
                  <select name="clientModel" value={invoiceForm.clientModel} onChange={handleInvoiceChange} className="w-full border rounded px-3 py-2">
                    <option value="Patient">Patient (Sale)</option>
                    <option value="Supplier">Supplier (Purchase)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-1">Client</label>
                  <select name="client" value={invoiceForm.client} onChange={handleInvoiceChange} className="w-full border rounded px-3 py-2" required>
                    <option value="">Select {invoiceForm.clientModel}</option>
                    {(invoiceForm.clientModel === 'Patient' ? patients : suppliers).map(c => (
                      <option key={c._id} value={c._id}>
                        {invoiceForm.clientModel === 'Patient' ? `${c.firstName} ${c.lastName}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Amount</label>
                  <input type="number" step="0.01" name="amount" value={invoiceForm.amount} onChange={handleInvoiceChange} className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Due Date</label>
                  <input type="date" name="dueDate" value={invoiceForm.dueDate} onChange={handleInvoiceChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-1">Description</label>
                  <textarea name="description" value={invoiceForm.description} onChange={handleInvoiceChange} rows="2" className="w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-1">Send To (Optional)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="sendToPhone" placeholder="Phone" value={invoiceForm.sendTo.phone} onChange={handleInvoiceChange} className="border rounded px-3 py-2" />
                    <input type="email" name="sendToEmail" placeholder="Email" value={invoiceForm.sendTo.email} onChange={handleInvoiceChange} className="border rounded px-3 py-2" />
                  </div>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
              <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Request Withdrawal</h3>
              <button onClick={() => setShowWithdrawalModal(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <form onSubmit={handleWithdrawalSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Amount</label>
                <input type="number" step="0.01" name="amount" value={withdrawalForm.amount} onChange={handleWithdrawalChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Reason</label>
                <textarea name="reason" value={withdrawalForm.reason} onChange={handleWithdrawalChange} rows="3" className="w-full border rounded px-3 py-2" required />
              </div>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowWithdrawalModal(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;