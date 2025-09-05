import { PaymentAdministratorProfile, PaymentAdminRole } from './human-billing-config'

export const morganProfile: PaymentAdministratorProfile = {
  userId: 'morgan-001',
  name: 'Morgan',
  roles: ['PAYMENT_ADMINISTRATOR', 'PAYMENT_APPROVER', 'PAYMENT_VALIDATOR', 'PAYMENT_AUDITOR', 'OWNER'] as PaymentAdminRole[],
  accessLevel: 10, // Owner-level access
  notificationPreferences: ['EMAIL', 'SYSTEM'],
  title: 'Head of Finance',
  department: 'Finance',
  permissions: {
    isOwner: true,
    canOverrideAnyPayment: true,
    canAccessAllFinancialOperations: true,
    canManagePaymentSystem: true
  }
}

export const paymentAdministrators: PaymentAdministratorProfile[] = [
  morganProfile
]

