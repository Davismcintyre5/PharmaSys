import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { PublicLayout } from '@/components/layout/public/Layout';
import { AppLayout } from '@/components/layout/app/Layout';
import { CartProvider } from '@/context/CartContext';
import { Spinner } from '@/components/ui/Spinner';

import ProtectedRoute from './ProtectedRoute';
import PendingRoute from './PendingRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import RoleGuard from './RoleGuard';

/* ─── Public landing ─── */
const Home = lazy(() => import('@/pages/public/Landing/Home'));
const Pricing = lazy(() => import('@/pages/public/Landing/Pricing'));
const Features = lazy(() => import('@/pages/public/Landing/Features'));
const About = lazy(() => import('@/pages/public/Landing/About'));
const Contact = lazy(() => import('@/pages/public/Landing/Contact'));
const Downloads = lazy(() => import('@/pages/public/Landing/Downloads'));

/* ─── Auth ─── */
const Login = lazy(() => import('@/pages/public/Auth/Login'));
const Register = lazy(() => import('@/pages/public/Auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/public/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/public/Auth/ResetPassword'));
const AcceptInvite = lazy(() => import('@/pages/public/Auth/AcceptInvite'));

/* ─── Public misc ─── */
const Pending = lazy(() => import('@/pages/public/Pending'));
const Invoice = lazy(() => import('@/pages/public/Invoice'));
const NotFound = lazy(() => import('@/pages/public/NotFound'));

/* ─── App: Dashboard ─── */
const Dashboard = lazy(() => import('@/pages/app/Dashboard'));

/* ─── App: POS ─── */
const Pos = lazy(() => import('@/pages/app/Pos/Pos'));

/* ─── App: Sales ─── */
const Sales = lazy(() => import('@/pages/app/Sales/Sales'));
const SaleDetail = lazy(() => import('@/pages/app/Sales/SaleDetail'));

/* ─── App: Reports ─── */
const Reports = lazy(() => import('@/pages/app/Reports/Reports'));
const ReportView = lazy(() => import('@/pages/app/Reports/ReportView'));

/* ─── App: Billing ─── */
const Billing = lazy(() => import('@/pages/app/Billing/Billing'));
const BillingPending = lazy(() => import('@/pages/app/Billing/Pending'));
const Renew = lazy(() => import('@/pages/app/Billing/Renew'));
const Upgrade = lazy(() => import('@/pages/app/Billing/Upgrade'));

/* ─── App: AI ─── */
const AiChat = lazy(() => import('@/pages/app/Ai/AiChat'));
const AiInsights = lazy(() => import('@/pages/app/Ai/AiInsights'));
const AiForecast = lazy(() => import('@/pages/app/Ai/AiForecast'));

/* ─── App: Branches & Settings ─── */
const Branches = lazy(() => import('@/pages/app/Branches/Branches'));
const Settings = lazy(() => import('@/pages/app/Settings/Settings'));

/* ─── App: Users / Patients / Customers / Suppliers ─── */
const Users = lazy(() => import('@/pages/app/Users/Users'));
const Patients = lazy(() => import('@/pages/app/Patients/Patients'));
const PatientDetail = lazy(() => import('@/pages/app/Patients/PatientDetail'));
const Customers = lazy(() => import('@/pages/app/Customers/Customers'));
const Suppliers = lazy(() => import('@/pages/app/Suppliers/Suppliers'));

/* ─── App: Prescriptions ─── */
const Prescriptions = lazy(() => import('@/pages/app/Prescriptions/Prescriptions'));
const PrescriptionDetail = lazy(() => import('@/pages/app/Prescriptions/PrescriptionDetail'));
const NewPrescription = lazy(() => import('@/pages/app/Prescriptions/NewPrescription'));

/* ─── App: Inventory ─── */
const Drugs = lazy(() => import('@/pages/app/Inventory/Drugs'));
const DrugDetail = lazy(() => import('@/pages/app/Inventory/DrugDetail'));
const LowStock = lazy(() => import('@/pages/app/Inventory/LowStock'));
const Expiring = lazy(() => import('@/pages/app/Inventory/Expiring'));

/* ─── App: Notifications ─── */
const Notifications = lazy(() => import('@/pages/app/Notifications/Notifications'));

/* ─── App: Purchase Orders ─── */
const PurchaseOrders = lazy(() => import('@/pages/app/PurchaseOrders/PurchaseOrders'));
const PurchaseOrderDetail = lazy(() => import('@/pages/app/PurchaseOrders/PurchaseOrderDetail'));
const PurchaseOrderForm = lazy(() => import('@/pages/app/PurchaseOrders/PurchaseOrderForm'));

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
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/downloads" element={<Downloads />} />
        </Route>

        {/* ── AUTH ── */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPassword />
            </PublicOnlyRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />

        {/* ── PUBLIC MISC ── */}
        <Route
          path="/pending"
          element={
            <PendingRoute>
              <Pending />
            </PendingRoute>
          }
        />
        <Route path="/invoice/:number" element={<Invoice />} />

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

          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* POS */}
          <Route
            path="pos"
            element={
              <CartProvider>
                <Pos />
              </CartProvider>
            }
          />

          {/* Sales */}
          <Route path="sales" element={<Sales />} />
          <Route path="sales/:id" element={<SaleDetail />} />

          {/* Reports */}
          <Route path="reports" element={<Reports />} />
          <Route path="reports/:category/:slug" element={<ReportView />} />

          {/* Inventory */}
          <Route path="inventory" element={<Drugs />} />
          <Route path="inventory/low-stock" element={<LowStock />} />
          <Route path="inventory/expiring" element={<Expiring />} />
          <Route path="inventory/:id" element={<DrugDetail />} />

          {/* Patients */}
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientDetail />} />

          {/* Prescriptions */}
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="prescriptions/new" element={<NewPrescription />} />
          <Route path="prescriptions/:id" element={<PrescriptionDetail />} />

          {/* Customers */}
          <Route path="customers" element={<Customers />} />

          {/* Suppliers */}
          <Route path="suppliers" element={<Suppliers />} />

          {/* Purchase Orders */}
          <Route path="purchase-orders" element={<PurchaseOrders />} />
          <Route path="purchase-orders/new" element={<PurchaseOrderForm />} />
          <Route path="purchase-orders/:id" element={<PurchaseOrderDetail />} />

          {/* Billing — owner only */}
          <Route
            path="billing"
            element={
              <RoleGuard roles={['owner']}>
                <Billing />
              </RoleGuard>
            }
          />
          <Route
            path="billing/pending"
            element={
              <RoleGuard roles={['owner']}>
                <BillingPending />
              </RoleGuard>
            }
          />
          <Route
            path="billing/renew"
            element={
              <RoleGuard roles={['owner']}>
                <Renew />
              </RoleGuard>
            }
          />
          <Route
            path="billing/upgrade"
            element={
              <RoleGuard roles={['owner']}>
                <Upgrade />
              </RoleGuard>
            }
          />

          {/* Branches — owner only */}
          <Route
            path="branches"
            element={
              <RoleGuard roles={['owner']}>
                <Branches />
              </RoleGuard>
            }
          />

          {/* AI — permission-gated by sidebar (ai.use) */}
          <Route path="ai" element={<Navigate to="/app/ai/chat" replace />} />
          <Route path="ai/chat" element={<AiChat />} />
          <Route path="ai/insights" element={<AiInsights />} />
          <Route path="ai/forecast" element={<AiForecast />} />

          {/* Shared */}
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}