import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import {
  HomeIcon,
  PillIcon,
  UsersIcon,
  FileTextIcon,
  TruckIcon,
  BarChartIcon,
  SettingsIcon,
  LogOutIcon,
  CreditCardIcon,
  ReceiptIcon,
} from 'lucide-react';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  // Base navigation items
  let navItems = [
    { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/transactions', icon: ReceiptIcon, label: 'Transactions' },
    { to: '/medicines', icon: PillIcon, label: 'Medicines' },
    { to: '/patients', icon: UsersIcon, label: 'Patients' },
    { to: '/prescriptions', icon: FileTextIcon, label: 'Prescriptions' },
    { to: '/suppliers', icon: TruckIcon, label: 'Suppliers' },
    { to: '/reports', icon: BarChartIcon, label: 'Reports' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  // Add Accounts only for admin/manager
  if (isAdminOrManager) {
    // Insert before 'Settings' (index 7)
    navItems.splice(7, 0, { to: '/accounts', icon: CreditCardIcon, label: 'Accounts' });
  }

  // Remove any duplicates by 'to' (just in case)
  navItems = navItems.filter((item, index, self) =>
    index === self.findIndex((i) => i.to === item.to)
  );

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col print:hidden">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">PharmaSys</h2>
        <p className="text-sm text-gray-400">Admin Panel</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to} // each 'to' is unique after dedup
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-md transition ${
                isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{user?.username}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-3 py-2 w-full text-left text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition"
        >
          <LogOutIcon size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;