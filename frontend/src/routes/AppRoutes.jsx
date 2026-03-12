import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from '../components/common/PrivateRoute';
import Layout from '../components/layout/Layout';
import DashboardPage from '../pages/DashboardPage';
import MedicinesPage from '../pages/MedicinesPage';
import PatientsPage from '../pages/PatientsPage';
import PrescriptionsPage from '../pages/PrescriptionsPage';
import SuppliersPage from '../pages/SuppliersPage';
import ReportsPage from '../pages/ReportsPage';
import AccountsPage from '../pages/AccountsPage';
import SettingsPage from '../pages/SettingsPage';
import NotificationsPage from '../pages/NotificationsPage';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Layout>
            <DashboardPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/medicines" element={
        <PrivateRoute>
          <Layout>
            <MedicinesPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/patients" element={
        <PrivateRoute>
          <Layout>
            <PatientsPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/prescriptions" element={
        <PrivateRoute>
          <Layout>
            <PrescriptionsPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/suppliers" element={
        <PrivateRoute>
          <Layout>
            <SuppliersPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/reports" element={
        <PrivateRoute>
          <Layout>
            <ReportsPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/accounts" element={
        <PrivateRoute>
          <Layout>
            <AccountsPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/settings" element={
        <PrivateRoute>
          <Layout>
            <SettingsPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/notifications" element={
        <PrivateRoute>
          <Layout>
            <NotificationsPage />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;