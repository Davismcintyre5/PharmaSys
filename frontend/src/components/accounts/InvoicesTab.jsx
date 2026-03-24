import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, printInvoice, sendInvoice } from '../../services/invoiceService';
import { getPatients } from '../../services/patientService';
import { getSuppliers } from '../../services/supplierService';
import { formatCurrency } from '../../utils/currencyFormatter';
import { printHtml } from '../../utils/printHelper';

const InvoicesTab = () => {
  const { user } = useSelector((state) => state.auth);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', type: '', from: '', to: '' });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    dueDate: '',
    description: '',
    clientModel: 'Patient',
    client: '',
    sendTo: { phone: '', email: '' },
  });
  const [patients, setPatients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, [filters]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await getInvoices(filters);
      setInvoices(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchClients = async () => {
    try {
      const [pats, sups] = await Promise.all([getPatients(), getSuppliers()]);
      setPatients(pats);
      setSuppliers(sups);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const type = formData.clientModel === 'Patient' ? 'sale' : 'purchase';
      await createInvoice({ ...formData, type });
      setShowModal(false);
      setFormData({ amount: '', dueDate: '', description: '', clientModel: 'Patient', client: '', sendTo: { phone: '', email: '' } });
      fetchInvoices();
    } catch (err) { setError(err.response?.data?.message || 'Creation failed'); } finally { setSubmitting(false); }
  };

  const handlePrint = async (id) => {
    try {
      const html = await printInvoice(id);
      printHtml(html);
    } catch (err) { alert('Print failed'); }
  };

  const handleSend = async (id) => {
    if (window.confirm('Send this invoice to client?')) {
      try {
        await sendInvoice(id);
        alert('Invoice sent');
        fetchInvoices();
      } catch (err) { alert('Send failed'); }
    }
  };

  const handleMarkPaid = async (id) => {
    const paymentMethod = prompt('Payment method (cash, card, etc.)', 'cash');
    if (paymentMethod !== null) {
      if (window.confirm('Mark this invoice as paid?')) {
        try {
          await updateInvoice(id, { status: 'paid', paymentMethod });
          fetchInvoices();
        } catch (err) { alert('Update failed'); }
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete invoice?')) {
      try {
        await deleteInvoice(id);
        fetchInvoices();
      } catch (err) { alert('Delete failed'); }
    }
  };

  const handlePrintList = () => {
    window.print();
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'sendToPhone') setFormData({ ...formData, sendTo: { ...formData.sendTo, phone: value } });
    else if (name === 'sendToEmail') setFormData({ ...formData, sendTo: { ...formData.sendTo, email: value } });
    else setFormData({ ...formData, [name]: value });
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex gap-4 flex-wrap">
          <select name="status" value={filters.status} onChange={handleFilterChange} className="border rounded px-2 py-1">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <select name="type" value={filters.type} onChange={handleFilterChange} className="border rounded px-2 py-1">
            <option value="">All Types</option>
            <option value="sale">Sale (Patient)</option>
            <option value="purchase">Purchase (Supplier)</option>
          </select>
          <input type="date" name="from" onChange={handleFilterChange} className="border rounded px-2 py-1" placeholder="From" />
          <input type="date" name="to" onChange={handleFilterChange} className="border rounded px-2 py-1" placeholder="To" />
          <button onClick={fetchInvoices} className="bg-blue-600 text-white px-3 py-1 rounded">Apply</button>
          <button onClick={handlePrintList} className="bg-gray-600 text-white px-3 py-1 rounded">Print List</button>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Create Invoice</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Invoice No.</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Client</th>
              <th className="px-6 py-3 text-left">Amount</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv._id}>
                <td className="px-6 py-4">{inv.invoiceNumber}</td>
                <td className="px-6 py-4">{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 capitalize">{inv.type === 'sale' ? 'Sale' : 'Purchase'}</td>
                <td className="px-6 py-4">{inv.client?.firstName || inv.client?.name || 'N/A'}</td>
                <td className="px-6 py-4">{formatCurrency(inv.amount)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                    inv.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    inv.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button onClick={() => handlePrint(inv._id)} className="text-blue-600 hover:text-blue-900">Print</button>
                  <button onClick={() => handleSend(inv._id)} className="text-green-600 hover:text-green-900">Send</button>
                  {inv.status !== 'paid' && <button onClick={() => handleMarkPaid(inv._id)} className="text-purple-600 hover:text-purple-900">Mark Paid</button>}
                  {inv.status === 'draft' && <button onClick={() => handleDelete(inv._id)} className="text-red-600 hover:text-red-900">Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Print footer (only visible when printing) */}
      <div className="hidden print:block mt-4 text-center text-sm text-gray-500">
        <p>{user?.username ? `Generated by: ${user.username}` : 'Pharmacy'} – Official Invoices List</p>
        <p>Generated: {new Date().toLocaleString()}</p>
        <p>Powered by PharmaSys</p>
      </div>

      {/* Modal for creating invoice */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Create Invoice</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-1">Client Type</label>
                  <select name="clientModel" value={formData.clientModel} onChange={handleFormChange} className="w-full border rounded px-3 py-2">
                    <option value="Patient">Patient (Sale)</option>
                    <option value="Supplier">Supplier (Purchase)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-1">Client</label>
                  <select name="client" value={formData.client} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required>
                    <option value="">Select {formData.clientModel}</option>
                    {(formData.clientModel === 'Patient' ? patients : suppliers).map(c => (
                      <option key={c._id} value={c._id}>
                        {formData.clientModel === 'Patient' ? `${c.firstName} ${c.lastName}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Amount</label>
                  <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Due Date</label>
                  <input type="date" name="dueDate" value={formData.dueDate} onChange={handleFormChange} className="w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-1">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleFormChange} rows="2" className="w-full border rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-1">Send To (Optional)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="sendToPhone" placeholder="Phone" value={formData.sendTo.phone} onChange={handleFormChange} className="border rounded px-3 py-2" />
                    <input type="email" name="sendToEmail" placeholder="Email" value={formData.sendTo.email} onChange={handleFormChange} className="border rounded px-3 py-2" />
                  </div>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
              <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesTab;