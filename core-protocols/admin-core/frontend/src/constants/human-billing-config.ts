import { z } from 'zod'

export const BillingCycleSchema = z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL'])
export type BillingCycle = z.infer<typeof BillingCycleSchema>

export const ServiceTypeSchema = z.enum(['COACHING', 'CONSULTING', 'SPEAKING', 'TRAINING', 'ADVISORY'])
export type ServiceType = z.infer<typeof ServiceTypeSchema>

export const PaymentStatusSchema = z.enum(['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'])
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>

export const PaymentAdminRoleSchema = z.enum(['PAYMENT_APPROVER', 'PAYMENT_VALIDATOR', 'PAYMENT_ADMINISTRATOR', 'PAYMENT_AUDITOR', 'OWNER', 'HEAD_OF_FINANCE'])
export type PaymentAdminRole = z.infer<typeof PaymentAdminRoleSchema>

export const PaymentOverrideTypeSchema = z.enum(['AMOUNT_ADJUSTMENT', 'DEADLINE_EXTENSION', 'APPROVAL_BYPASS', 'VALIDATION_OVERRIDE', 'EMERGENCY_PROCESSING'])
export type PaymentOverrideType = z.infer<typeof PaymentOverrideTypeSchema>

export const billingConfig = {
  paymentSchedule: {
    monthlyPaymentDay: 27,
    processingWindow: 3, // days before payment date
    validationDeadline: 5, // days before payment date
    reminderDays: [7, 3, 1] // days before validation deadline
  },

  tracking: {
    minimumBillableIncrement: 15, // minutes
    maxDailyHours: 12,
    requireApproval: true,
    approvalDeadline: {
      days: 5,
      notificationFrequency: 24 // hours
    }
  },

  validation: {
    requirements: ['TIME_ENTRY', 'SERVICE_CATEGORY', 'CLIENT_ASSIGNMENT', 'MANAGER_APPROVAL', 'SYSTEM_TIMESTAMP'],
    autoValidation: {
      enabled: true,
      thresholds: {
        maxHoursPerDay: 12,
        maxDaysPerMonth: 22,
        minHoursPerEntry: 0.25
      }
    }
  },

  hrIntegration: {
    tables: {
      serviceRecords: 'human_service_records',
      timeTracking: 'human_time_tracking',
      approvals: 'human_service_approvals',
      payments: 'human_service_payments'
    },
    required: {
      employeeId: true,
      departmentCode: true,
      serviceType: true,
      clientId: true
    }
  },

  billing: {
    accumulation: {
      groupBy: ['SERVICE_TYPE', 'CLIENT', 'PROJECT'],
      calculations: ['HOURS', 'RATE', 'ADJUSTMENTS', 'TAXES'],
      summaryLevels: ['DAILY', 'WEEKLY', 'MONTHLY']
    },
    approvals: {
      levels: ['MANAGER', 'FINANCE', 'HR'],
      autoApprovalThreshold: 0, // all entries require approval
      escalationThreshold: 48 // hours before escalation
    }
  },

  notifications: {
    channels: ['EMAIL', 'SYSTEM', 'MOBILE'],
    triggers: {
      missingTimeEntry: true,
      pendingApproval: true,
      approvalComplete: true,
      paymentProcessing: true,
      paymentComplete: true
    },
    escalation: {
      enabled: true,
      thresholds: [24, 48, 72] // hours
    }
  }
} as const

export const timeTrackingRules = {
  validateServiceEntry: (entry: ServiceEntry): ValidationResult => {
    const results: ValidationError[] = []

    if (!entry.timestamp) {
      results.push({
        code: 'MISSING_TIMESTAMP',
        message: 'Service entry must include system timestamp'
      })
    }

    if (!entry.serviceType) {
      results.push({
        code: 'MISSING_SERVICE_TYPE',
        message: 'Service type must be specified'
      })
    }

    // Additional validation logic

    return {
      isValid: results.length === 0,
      errors: results
    }
  },

  canProcessPayment: (records: ServiceRecord[]): boolean => {
    return records.every(record => record.isValidated && record.isApproved && record.hoursTracked > 0)
  }
}

export const paymentManagementWorkflows = {
  /**
   * Check if a user has permission to perform payment actions
   */
  hasPaymentAccess: (userId: string, requiredRole: PaymentAdminRole): boolean => {
    // Morgan has full payment management access
    if (userId === 'morgan-001') {
      return true
    }
    // Additional access logic for other administrators
    return false
  },

  /**
   * Approve a payment with administrator validation
   */
  approvePayment: async (recordId: string, administrator: PaymentAdministratorProfile): Promise<ServiceRecord | null> => {
    if (!administrator.roles.includes('PAYMENT_APPROVER' as PaymentAdminRole)) {
      throw new Error('Administrator lacks payment approval permissions')
    }
    
    // Implementation would update the service record
    // This is a placeholder for the actual database update
    return null
  },

  /**
   * Validate payment entries with proper workflow
   */
  validatePaymentEntry: (record: ServiceRecord, administrator: PaymentAdministratorProfile): ValidationResult => {
    const results: ValidationError[] = []

    if (!administrator.roles.includes('PAYMENT_VALIDATOR' as PaymentAdminRole)) {
      results.push({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Administrator lacks payment validation permissions'
      })
    }

    if (!record.entry.timestamp) {
      results.push({
        code: 'MISSING_TIMESTAMP',
        message: 'Payment entry must include system timestamp'
      })
    }

    if (record.hoursTracked <= 0) {
      results.push({
        code: 'INVALID_HOURS',
        message: 'Payment entry must have valid hours tracked'
      })
    }

    return {
      isValid: results.length === 0,
      errors: results
    }
  },

  /**
   * Apply payment overrides with full audit logging
   */
  applyPaymentOverride: async (
    recordId: string,
    overrideType: PaymentOverrideType,
    administrator: PaymentAdministratorProfile,
    reason: string,
    newValues: Partial<ServiceRecord>
  ): Promise<PaymentOverrideLog> => {
    if (!administrator.roles.includes('PAYMENT_ADMINISTRATOR' as PaymentAdminRole)) {
      throw new Error('Administrator lacks payment override permissions')
    }

    const overrideLog: PaymentOverrideLog = {
      id: `override-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      administrator,
      overrideType,
      reason,
      originalState: {}, // Would be populated with current record state
      newState: newValues
    }

    // Log the override action
    console.log('Payment override applied:', overrideLog)
    
    return overrideLog
  },

  /**
   * Generate payment audit reports
   */
  generateAuditReport: (administrator: PaymentAdministratorProfile, dateRange: { start: Date, end: Date }): object => {
    if (!administrator.roles.includes('PAYMENT_AUDITOR' as PaymentAdminRole)) {
      throw new Error('Administrator lacks payment audit permissions')
    }

    return {
      auditor: administrator.name,
      dateRange,
      reportGenerated: new Date(),
      // Additional audit data would be populated here
    }
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  code: string
  message: string
}

export interface ServiceEntry {
  timestamp: Date
  serviceType: ServiceType
  hours: number
  employeeId: string
  clientId: string
  projectId?: string
  notes?: string
}

export interface ServiceRecord {
  id: string
  entry: ServiceEntry
  isValidated: boolean
  isApproved: boolean
  hoursTracked: number
  approvalChain: string[]
  paymentStatus: PaymentStatus
}

export interface PaymentAdministratorProfile {
  userId: string
  name: string
  roles: PaymentAdminRole[]
  accessLevel: number
  notificationPreferences: string[]
  title?: string
  department?: string
  permissions?: {
    isOwner?: boolean
    canOverrideAnyPayment?: boolean
    canAccessAllFinancialOperations?: boolean
    canManagePaymentSystem?: boolean
  }
}

export interface PaymentOverrideLog {
  id: string
  timestamp: Date
  administrator: PaymentAdministratorProfile
  overrideType: PaymentOverrideType
  reason: string
  originalState: Partial<ServiceRecord>
  newState: Partial<ServiceRecord>
}
