import React, { useState, useEffect } from 'react';
import { getBalance, getTransactions, createTransaction, deleteTransaction } from '../services/account.service';
import { getSettings } from '../services/setting.service';
import TransactionList from '../components/accounts/TransactionList';
import TransactionForm from '../components/accounts/TransactionForm';
import Modal from '../components/common/Modal';
import { formatCurrency } from '../utils/currency';
import './Page.css';

const AccountsPage = () => {
  const [balance, setBalance] = useState({ balance: 0, totalIncome: 0, totalExpense: 0, totalWithdrawal: 0 });
  const [transactions, setTransactions] = useState([]);
  const [pharmacyName, setPharmacyName] = useState('Pharmacy');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balanceRes, txRes, settingsRes] = await Promise.all([
        getBalance(),
        getTransactions(),
        getSettings()
      ]);
      setBalance(balanceRes.data.data);
      setTransactions(Array.isArray(txRes.data.data) ? txRes.data.data : []);
      if (settingsRes.data.data?.pharmacyName) {
        setPharmacyName(settingsRes.data.data.pharmacyName);
      }
    } catch (error) {
      console.error('Failed to load accounts data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    await createTransaction(values);
    loadData();
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      await deleteTransaction(id);
      loadData();
    }
  };

  if (loading) return <div className="loading">Loading accounts...</div>;

  return (
    <div className="page-container">
      <h1>Accounts</h1>
      <div className="stats-grid">
        <div className="stats-card">
          <h4>Current Balance</h4>
          <p>{formatCurrency(balance.balance)}</p>
        </div>
        <div className="stats-card">
          <h4>Total Income</h4>
          <p>{formatCurrency(balance.totalIncome)}</p>
        </div>
        <div className="stats-card">
          <h4>Total Expenses</h4>
          <p>{formatCurrency(balance.totalExpense)}</p>
        </div>
        <div className="stats-card">
          <h4>Total Withdrawals</h4>
          <p>{formatCurrency(balance.totalWithdrawal)}</p>
        </div>
      </div>

      <button onClick={() => { setEditing(null); setModalOpen(true); }} className="success">
        Add Transaction
      </button>

      <TransactionList
        transactions={transactions}
        pharmacyName={pharmacyName}
        onDelete={handleDelete}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Transaction">
        <TransactionForm onSubmit={handleSave} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default AccountsPage;