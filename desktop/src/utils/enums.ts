export function roleLabel(role: string): string {
  switch (role) {
    case 'owner': return 'Owner';
    case 'branch_manager': return 'Branch Manager';
    case 'cashier': return 'Cashier';
    default: return role;
  }
}

export function userStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Active';
    case 'pending': return 'Pending';
    case 'suspended': return 'Suspended';
    case 'rejected': return 'Rejected';
    default: return status;
  }
}

export function tenantStatusLabel(status: string): string {
  switch (status) {
    case 'pending_user': return 'Pending';
    case 'active': return 'Active';
    case 'rejected': return 'Rejected';
    case 'suspended': return 'Suspended';
    case 'expired': return 'Expired';
    default: return status;
  }
}

export function saleStatusLabel(status: string): string {
  switch (status) {
    case 'completed': return 'Completed';
    case 'partially_refunded': return 'Partially refunded';
    case 'refunded': return 'Refunded';
    case 'voided': return 'Voided';
    default: return status;
  }
}

export function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'cash': return 'Cash';
    case 'mpesa': return 'M-Pesa';
    case 'card': return 'Card';
    case 'insurance': return 'Insurance';
    case 'mpesa_stk': return 'M-Pesa STK Push';
    case 'mpesa_send': return 'M-Pesa Send Money';
    case 'mpesa_till': return 'M-Pesa Till';
    case 'mpesa_paybill': return 'M-Pesa Paybill';
    case 'bank': return 'Bank Transfer';
    case 'stripe': return 'Card (Stripe)';
    default: return method;
  }
}

export function prescriptionStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Pending';
    case 'dispensed': return 'Dispensed';
    case 'partial': return 'Partial';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

export function purchaseOrderStatusLabel(status: string): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'ordered': return 'Ordered';
    case 'received': return 'Received';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

export function invoiceStatusLabel(status: string): string {
  switch (status) {
    case 'draft': return 'Draft';
    case 'sent': return 'Sent';
    case 'paid': return 'Paid';
    case 'overdue': return 'Overdue';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

export function subscriptionStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Active';
    case 'perpetual': return 'Perpetual';
    case 'past_due': return 'Past due';
    case 'expired': return 'Expired';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

export function notificationTypeLabel(type: string): string {
  switch (type) {
    case 'info': return 'Info';
    case 'success': return 'Success';
    case 'warning': return 'Warning';
    case 'error': return 'Error';
    case 'sale': return 'Sale';
    case 'inventory': return 'Inventory';
    case 'prescription': return 'Prescription';
    case 'subscription': return 'Subscription';
    case 'system': return 'System';
    default: return type;
  }
}

export function drugFormLabel(form: string): string {
  switch (form) {
    case 'tablet': return 'Tablet';
    case 'capsule': return 'Capsule';
    case 'syrup': return 'Syrup';
    case 'suspension': return 'Suspension';
    case 'injection': return 'Injection';
    case 'cream': return 'Cream';
    case 'ointment': return 'Ointment';
    case 'drops': return 'Drops';
    case 'inhaler': return 'Inhaler';
    case 'other': return 'Other';
    default: return form;
  }
}

export function movementTypeLabel(type: string): string {
  switch (type) {
    case 'in': return 'Stock in';
    case 'out': return 'Stock out';
    case 'adjust': return 'Adjustment';
    case 'expired': return 'Expired';
    case 'returned': return 'Returned';
    default: return type;
  }
}

export function genderLabel(gender: string): string {
  switch (gender) {
    case 'male': return 'Male';
    case 'female': return 'Female';
    case 'other': return 'Other';
    default: return gender;
  }
}