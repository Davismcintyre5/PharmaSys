import React from 'react';
import Sidebar from '../common/Sidebar';
import Header from '../common/Header';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Header />
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;