import type { UserRole } from '@/types';

export type Permission =
  | 'branches.create' | 'branches.edit' | 'branches.view.all' | 'branches.view.own'
  | 'users.invite.manager' | 'users.invite.cashier' | 'users.view' | 'users.update' | 'users.remove'
  | 'drugs.create' | 'drugs.edit' | 'drugs.view'
  | 'inventory.receive' | 'inventory.adjust' | 'inventory.view'
  | 'sales.create' | 'sales.refund' | 'sales.void'
  | 'patients.view' | 'patients.create' | 'patients.update'
  | 'prescriptions.view' | 'prescriptions.dispense'
  | 'reports.branch' | 'reports.tenant'
  | 'suppliers.view' | 'suppliers.manage'
  | 'purchase_orders.view' | 'purchase_orders.create' | 'purchase_orders.receive'
  | 'customers.view' | 'customers.create' | 'customers.update'
  | 'settings.edit'
  | 'billing.manage'
  | 'ai.use';

const OWNER: Permission[] = [
  'branches.create', 'branches.edit', 'branches.view.all',
  'users.invite.manager', 'users.invite.cashier', 'users.view', 'users.update', 'users.remove',
  'drugs.create', 'drugs.edit', 'drugs.view',
  'inventory.receive', 'inventory.adjust', 'inventory.view',
  'sales.create', 'sales.refund', 'sales.void',
  'patients.view', 'patients.create', 'patients.update',
  'prescriptions.view', 'prescriptions.dispense',
  'reports.branch', 'reports.tenant',
  'suppliers.view', 'suppliers.manage',
  'purchase_orders.view', 'purchase_orders.create', 'purchase_orders.receive',
  'customers.view', 'customers.create', 'customers.update',
  'settings.edit',
  'billing.manage',
  'ai.use',
];

const BRANCH_MANAGER: Permission[] = [
  'branches.view.own',
  'users.invite.cashier', 'users.view', 'users.update',
  'drugs.view',
  'inventory.receive', 'inventory.adjust', 'inventory.view',
  'sales.create', 'sales.refund', 'sales.void',
  'patients.view', 'patients.create', 'patients.update',
  'prescriptions.view', 'prescriptions.dispense',
  'reports.branch',
  'suppliers.view',
  'purchase_orders.view', 'purchase_orders.create', 'purchase_orders.receive',
  'customers.view', 'customers.create', 'customers.update',
  'ai.use',
];

const CASHIER: Permission[] = [
  'drugs.view',
  'inventory.view',
  'sales.create',
  'patients.view', 'patients.create',
  'customers.view', 'customers.create', 'customers.update',
];

const BY_ROLE: Record<UserRole, Permission[]> = {
  owner: OWNER,
  branch_manager: BRANCH_MANAGER,
  cashier: CASHIER,
};

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return BY_ROLE[role]?.includes(permission) ?? false;
}

export function canManageBranches(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'branches.create');
}

export function canInviteManagers(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'users.invite.manager');
}

export function canInviteCashiers(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'users.invite.cashier');
}

export function canDispense(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'prescriptions.dispense');
}

export function canRefund(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'sales.refund');
}

export function canEditSettings(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'settings.edit');
}

export function canManageBilling(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'billing.manage');
}

export function canViewTenantReports(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'reports.tenant');
}

export function canUseAi(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'ai.use');
}