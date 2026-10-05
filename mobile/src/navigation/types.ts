export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  Pending: undefined;
  Renewal: undefined;
  Invoice: { invoiceNumber: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: { plan?: string } | undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  AcceptInvite: { token: string };
};

export type MainTabParamList = {
  DashboardTab: undefined;
  InventoryTab: undefined;
  PosTab: undefined;
  PrescriptionsTab: undefined;
  MoreTab: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  Notifications: undefined;
  AiChat: undefined;
};

export type InventoryStackParamList = {
  InventoryHome: undefined;
  DrugDetail: { drugId: string };
  DrugForm: { drugId?: string } | undefined;
  LowStock: undefined;
  Expiring: undefined;
};

export type PosStackParamList = {
  PosHome: undefined;
  SaleDetail: { saleId: string };
};

export type PrescriptionsStackParamList = {
  PrescriptionsHome: undefined;
  PrescriptionDetail: { prescriptionId: string };
  NewPrescription: undefined;
};

export type MoreStackParamList = {
  MoreHome: undefined;

  Sales: undefined;
  SaleDetail: { saleId: string };

  Patients: undefined;
  PatientDetail: { patientId: string };

  Customers: undefined;

  Suppliers: undefined;

  PurchaseOrders: undefined;
  PurchaseOrderDetail: { purchaseOrderId: string };
  NewPurchaseOrder: undefined;

  Reports: undefined;
  ReportView: { category: string; slug: string };

  AiInsights: undefined;
  AiForecast: undefined;

  Branches: undefined;

  Users: undefined;

  Billing: undefined;

  Settings: undefined;
};