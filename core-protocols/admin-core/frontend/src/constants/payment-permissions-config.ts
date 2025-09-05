import { morganProfile } from './payment-admins'
import { PaymentAdminRole, PaymentOverrideType, PaymentAdministratorProfile } from './human-billing-config'

export interface PaymentPermissionMatrix {
  userId: string
  name: string
  permissions: {
    canApprovePayments: boolean
    canValidateEntries: boolean
    canOverridePayments: boolean
    canGenerateReports: boolean
    canViewAllRecords: boolean
    canDeleteRecords: boolean
    canModifyAmounts: boolean
    canBypassApprovals: boolean
    canEmergencyProcess: boolean
    maxOverrideAmount: number
    approvalLimits: {
      daily: number
      monthly: number
    }
  }
  allowedOverrideTypes: PaymentOverrideType[]
  accessLevelRequiredFor: {
    viewPayments: number
    approvePayments: number
    modifyPayments: number
    deletePayments: number
    auditAccess: number
  }
}

export const paymentPermissionsConfig: Record<string, PaymentPermissionMatrix> = {
  'morgan-001': {
    userId: 'morgan-001',
    name: 'Morgan',
    permissions: {
      canApprovePayments: true,
      canValidateEntries: true,
      canOverridePayments: true,
      canGenerateReports: true,
      canViewAllRecords: true,
      canDeleteRecords: true,
      canModifyAmounts: true,
      canBypassApprovals: true,
      canEmergencyProcess: true,
      maxOverrideAmount: 100000, // $100,000 maximum override
      approvalLimits: {
        daily: 50, // Can approve up to 50 payments per day
        monthly: 1000 // Can approve up to 1000 payments per month
      }
    },
    allowedOverrideTypes: [
      'AMOUNT_ADJUSTMENT',
      'DEADLINE_EXTENSION', 
      'APPROVAL_BYPASS',
      'VALIDATION_OVERRIDE',
      'EMERGENCY_PROCESSING'
    ] as PaymentOverrideType[],
    accessLevelRequiredFor: {
      viewPayments: 1,
      approvePayments: 1,
      modifyPayments: 1,
      deletePayments: 1,
      auditAccess: 1
    }
  }
}

export const paymentAccessControl = {
  /**
   * Check if a user has specific payment permission
   */
  hasPermission: (userId: string, permission: keyof PaymentPermissionMatrix['permissions']): boolean => {
    const userConfig = paymentPermissionsConfig[userId]
    return userConfig?.permissions[permission] || false
  },

  /**
   * Check if user can perform specific override type
   */
  canPerformOverride: (userId: string, overrideType: PaymentOverrideType): boolean => {
    const userConfig = paymentPermissionsConfig[userId]
    return userConfig?.allowedOverrideTypes.includes(overrideType) || false
  },

  /**
   * Get maximum override amount for user
   */
  getMaxOverrideAmount: (userId: string): number => {
    const userConfig = paymentPermissionsConfig[userId]
    return userConfig?.permissions.maxOverrideAmount || 0
  },

  /**
   * Check if user meets access level requirement
   */
  meetsAccessLevel: (userId: string, action: keyof PaymentPermissionMatrix['accessLevelRequiredFor']): boolean => {
    const userConfig = paymentPermissionsConfig[userId]
    if (!userConfig) return false
    
    const requiredLevel = userConfig.accessLevelRequiredFor[action]
    const userLevel = morganProfile.accessLevel // For Morgan specifically
    
    return userLevel >= requiredLevel
  },

  /**
   * Get daily approval limit for user
   */
  getDailyApprovalLimit: (userId: string): number => {
    const userConfig = paymentPermissionsConfig[userId]
    return userConfig?.permissions.approvalLimits.daily || 0
  },

  /**
   * Get monthly approval limit for user
   */
  getMonthlyApprovalLimit: (userId: string): number => {
    const userConfig = paymentPermissionsConfig[userId]
    return userConfig?.permissions.approvalLimits.monthly || 0
  },

  /**
   * Validate if user can approve specific payment amount
   */
  canApproveAmount: (userId: string, amount: number): boolean => {
    const userConfig = paymentPermissionsConfig[userId]
    if (!userConfig) return false
    
    return userConfig.permissions.canApprovePayments && 
           amount <= userConfig.permissions.maxOverrideAmount
  },

  /**
   * Log payment action for audit trail
   */
  logPaymentAction: (userId: string, action: string, details: object): void => {
    const timestamp = new Date().toISOString()
    const userConfig = paymentPermissionsConfig[userId]
    
    console.log(`[PAYMENT AUDIT] ${timestamp}`, {
      user: userConfig?.name || 'Unknown',
      userId,
      action,
      details,
      accessLevel: userConfig?.permissions || 'No permissions found'
    })
  },

  /**
   * Get all users with specific payment role
   */
  getUsersWithRole: (role: PaymentAdminRole): PaymentAdministratorProfile[] => {
    return [morganProfile].filter(admin => admin.roles.includes(role))
  }
}

export default paymentAccessControl
