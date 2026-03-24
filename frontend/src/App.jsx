import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import Patients from './pages/Patients';
import Prescriptions from './pages/Prescriptions';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';

const PrivateRoute = ({ children, requiredRole }) => {
  const { token, user } = useSelector((state) => state.auth);
  if (!token) return <Navigate to="/login" />;
  if (requiredRole && !requiredRole.includes(user?.role)) return <Navigate to="/dashboard" />;
  return children;
};

const AppLayout = ({ children }) => (
  <div className="flex h-screen">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto bg-gray-100">{children}</main>
    </div>
  </div>
);

function App() {
  const { token } = useSelector((state) => state.auth);

  if (!token) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
        <Route path="/medicines" element={<PrivateRoute><AppLayout><Medicines /></AppLayout></PrivateRoute>} />
        <Route path="/patients" element={<PrivateRoute><AppLayout><Patients /></AppLayout></PrivateRoute>} />
        <Route path="/prescriptions" element={<PrivateRoute><AppLayout><Prescriptions /></AppLayout></PrivateRoute>} />
        <Route path="/suppliers" element={<PrivateRoute><AppLayout><Suppliers /></AppLayout></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><AppLayout><Reports /></AppLayout></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute><AppLayout><Transactions /></AppLayout></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><AppLayout><Settings /></AppLayout></PrivateRoute>} />
        <Route path="/accounts" element={<PrivateRoute requiredRole={['admin', 'manager']}><AppLayout><Accounts /></AppLayout></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;