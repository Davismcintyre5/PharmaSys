import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import TransactionsTab from '../components/accounts/TransactionsTab';
import InvoicesTab from '../components/accounts/InvoicesTab';
import WithdrawalsTab from '../components/accounts/WithdrawalsTab';

const Accounts = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('transactions');

  // Only admin and manager can access accounts
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Accounts</h1>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-2 px-1 ${activeTab === 'transactions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-2 px-1 ${activeTab === 'invoices' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Invoices
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`pb-2 px-1 ${activeTab === 'withdrawals' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Withdrawals
          </button>
        </nav>
      </div>
      {activeTab === 'transactions' && <TransactionsTab />}
      {activeTab === 'invoices' && <InvoicesTab />}
      {activeTab === 'withdrawals' && <WithdrawalsTab />}
    </div>
  );
};

export default Accounts;