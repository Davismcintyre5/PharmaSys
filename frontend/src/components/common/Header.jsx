import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { user } = useAuth();
  const displayName = user?.name || 'Admin'; // fallback if name missing

  return (
    <header>
      <h2>Dashboard</h2>
      <div className="welcome">
        Welcome, {displayName} ({user?.role || 'user'})
      </div>
    </header>
  );
};

export default Header;