import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { PublicLayout } from '@/components/layout/public/Layout';
import { AuthShell } from '@/components/layout/public/AuthShell';
import { AppLayout } from '@/components/layout/app/Layout';
import { CartProvider } from '@/context/CartContext';

import ProtectedRoute from './ProtectedRoute';
import PendingRoute from './PendingRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import RoleGuard from './RoleGuard';
import { Spinner } from '@/components/ui/Spinner';

/* ─── Skeleton fallback for all pages (swap for real pages as you build) ─── */
const ComingSoon = lazy(() => import('./ComingSoon'));

function Page({ title, back }: { title?: string; back?: string } = {}) {
  return <ComingSoon title={title} back={back} />;
}

/* ─── Route tree ─── */

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg">
          <Spinner size="lg" />
        </div>
      }
    >
      <Routes>
        {/* ── PUBLIC LANDING ── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Page title="Home" />} />
          <Route path="/pricing" element={<Page title="Pricing" />} />
          <Route path="/features" element={<Page title="Features" />} />
          <Route path="/about" element={<Page title="About" />} />
          <Route path="/contact" element={<Page title="Contact" />} />
          <Route path="/downloads" element={<Page title="Downloads" />} />
        </Route>

        {/* ── AUTH ── */}
        <Route
          element={
            <AuthShell>
              <></>
            </AuthShell>
          }
        />
        <Route path="/login" element={<PublicOnlyRoute><AuthShell><Page title="Sign in" /></AuthShell></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><AuthShell maxWidth="lg"><Page title="Create account" /></AuthShell></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><AuthShell><Page title="Forgot password" /></AuthShell></PublicOnlyRoute>} />
        <Route path="/reset-password" element={<AuthShell><Page title="Reset password" /></AuthShell>} />
        <Route path="/accept-invite" element={<AuthShell><Page title="Accept invitation" /></AuthShell>} />

        {/* ── PUBLIC MISC ── */}
        <Route path="/pending" element={<PendingRoute><AuthShell><Page title="Awaiting approval" /></AuthShell></PendingRoute>} />
        <Route path="/invoice/:number" element={<AuthShell><Page title="Invoice" /></AuthShell>} />

        {/* ── APP (tenant dashboard) ── */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />

          <Route path="dashboard" element={<Page title="Dashboard" back="/" />} />
          <Route path="pos" element={<CartProvider><Page title="Point of sale" back="/app/dashboard" /></CartProvider>} />

          {/* Sales */}
          <Route path="sales" element={<Page title="Sales" back="/app/dashboard" />} />
          <Route path="sales/:id" element={<Page title="Sale detail" back="/app/sales" />} />

          {/* Inventory */}
          <Route path="inventory" element={<Page title="Inventory" back="/app/dashboard" />} />
          <Route path="inventory/:id" element={<Page title="Drug detail" back="/app/inventory" />} />
          <Route path="inventory/expiring" element={<Page title="Expiring soon" back="/app/inventory" />} />
          <Route path="inventory/low-stock" element={<Page title="Low stock" back="/app/inventory" />} />

          {/* Patients */}
          <Route path="patients" element={<Page title="Patients" back="/app/dashboard" />} />
          <Route path="patients/:id" element={<Page title="Patient detail" back="/app/patients" />} />

          {/* Prescriptions */}
          <Route path="prescriptions" element={<Page title="Prescriptions" back="/app/dashboard" />} />
          <Route path="prescriptions/:id" element={<Page title="Prescription detail" back="/app/prescriptions" />} />

          {/* Customers */}
          <Route path="customers" element={<Page title="Customers" back="/app/dashboard" />} />

          {/* Suppliers */}
          <Route path="suppliers" element={<Page title="Suppliers" back="/app/dashboard" />} />

          {/* Purchase Orders */}
          <Route path="purchase-orders" element={<Page title="Purchase orders" back="/app/dashboard" />} />
          <Route path="purchase-orders/:id" element={<Page title="Purchase order detail" back="/app/purchase-orders" />} />

          {/* Reports */}
          <Route path="reports" element={<Page title="Reports" back="/app/dashboard" />} />
          <Route path="reports/sales" element={<Page title="Sales report" back="/app/reports" />} />
          <Route path="reports/top-drugs" element={<Page title="Top drugs" back="/app/reports" />} />
          <Route path="reports/tax" element={<Page title="Tax report" back="/app/reports" />} />

          {/* Owner-only */}
          <Route
            path="branches"
            element={
              <RoleGuard roles={['owner']}>
                <Page title="Branches" back="/app/dashboard" />
              </RoleGuard>
            }
          />
          <Route
            path="billing"
            element={
              <RoleGuard roles={['owner']}>
                <Page title="Billing" back="/app/dashboard" />
              </RoleGuard>
            }
          />

          {/* Shared */}
          <Route path="users" element={<Page title="Staff" back="/app/dashboard" />} />
          <Route path="settings" element={<Page title="Settings" back="/app/dashboard" />} />
          <Route path="notifications" element={<Page title="Notifications" back="/app/dashboard" />} />

          {/* AI */}
          <Route path="ai" element={<Navigate to="/app/ai/chat" replace />} />
          <Route path="ai/chat" element={<Page title="AI chat" back="/app/dashboard" />} />
          <Route path="ai/insights" element={<Page title="AI insights" back="/app/dashboard" />} />
          <Route path="ai/forecast" element={<Page title="Stock forecast" back="/app/dashboard" />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<Page title="Page not found" />} />
      </Routes>
    </Suspense>
  );
}