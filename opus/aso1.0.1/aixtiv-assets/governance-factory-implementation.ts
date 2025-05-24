// Core interfaces for S2DO Governance Framework
interface IGovernanceModel {
  userType: UserType;
  verificationRequirements: VerificationRequirement[];
  approvalWorkflow: ApprovalStep[];
  actionLimitations: ActionLimitation[];
  auditLevel: AuditLevel;
  culturalSensitivityConfig: CulturalSensitivityConfig;
}

enum UserType {
  Individual = 'INDIVIDUAL',
  Professional = 'PROFESSIONAL',
  Student = 'STUDENT',
  Enterprise = 'ENTERPRISE',
  Research = 'RESEARCH',
  Government = 'GOVERNMENT',
}

interface VerificationRequirement {
  id: string;
  name: string;
  description: string;
  verificationType: VerificationType;
  isMandatory: boolean;
  validationRules: ValidationRule[];
  culturalContextRules?: CulturalContextRule[];
}

enum VerificationType {
  Identity = 'IDENTITY',
  Compliance = 'COMPLIANCE',
  Cultural = 'CULTURAL',
  Domain = 'DOMAIN',
  Geographic = 'GEOGRAPHIC',
  Temporal = 'TEMPORAL',
  Ethical = 'ETHICAL',
}

interface ValidationRule {
  id: string;
  condition: string; // JSON string representing logical condition
  errorMessage: string;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
}

interface CulturalContextRule {
  culturalContext: string;
  applicableRegions: string[];
  modifiedValidationRules: ValidationRule[];
  sensitivityLevel: number; // 1-10 scale
}

interface ApprovalStep {
  id: string;
  name: string;
  description: string;
  approverRoles: string[];
  requiredApprovals: number; // Minimum approvals required
  timeoutInHours: number;
  escalationPath?: string;
  conditionalRules?: ConditionalRule[];
}

interface ConditionalRule {
  condition: string; // JSON string representing logical condition
  alternativeApproverRoles?: string[];
  alternativeRequiredApprovals?: number;
}

interface ActionLimitation {
  actionType: string;
  allowedScopes: string[];
  deniedScopes: string[];
  rateLimit?: RateLimit;
  contextualRules?: ContextualRule[];
}

interface RateLimit {
  maxRequests: number;
  timeWindowInSeconds: number;
  burstCapacity?: number;
}

interface ContextualRule {
  context: string;
  condition: string;
  modifiedScopes?: {
    additionalAllowed?: string[];
    additionalDenied?: string[];
  };
}

enum AuditLevel {
  Minimal = 'MINIMAL',
  Standard = 'STANDARD',
  Enhanced = 'ENHANCED',
  Comprehensive = 'COMPREHENSIVE',
}

interface CulturalSensitivityConfig {
  defaultSensitivityLevel: number; // 1-10 scale
  culturalContexts: CulturalContext[];
  topicSensitivityMap: Record<string, number>; // topic -> sensitivity level
  adaptationStrategy: 'CONSERVATIVE' | 'BALANCED' | 'FLEXIBLE';
}

interface CulturalContext {
  id: string;
  name: string;
  description: string;
  applicableRegions: string[];
  sensitivityModifiers: Record<string, number>; // topic -> sensitivity modifier
  communicationGuidelines: string;
}

// GovernanceFactory implementation
class GovernanceFactory {
  private static instance: GovernanceFactory;
  private templates: Map<UserType, IGovernanceModel> = new Map();

  private constructor() {
    // Initialize with default templates
    this.initializeDefaultTemplates();
  }

  public static getInstance(): GovernanceFactory {
    if (!GovernanceFactory.instance) {
      GovernanceFactory.instance = new GovernanceFactory();
    }
    return GovernanceFactory.instance;
  }

  private initializeDefaultTemplates(): void {
    // Initialize default templates for each user type
    this.templates.set(UserType.Individual, this.createIndividualTemplate());
    this.templates.set(
      UserType.Professional,
      this.createProfessionalTemplate()
    );
    this.templates.set(UserType.Student, this.createStudentTemplate());
    this.templates.set(UserType.Enterprise, this.createEnterpriseTemplate());
    this.templates.set(UserType.Research, this.createResearchTemplate());
    this.templates.set(UserType.Government, this.createGovernmentTemplate());
  }

  private createIndividualTemplate(): IGovernanceModel {
    return {
      userType: UserType.Individual,
      verificationRequirements: [
        {
          id: 'ind-ver-001',
          name: 'Basic Identity Verification',
          description: "Verification of user's basic identity",
          verificationType: VerificationType.Identity,
          isMandatory: true,
          validationRules: [
            {
              id: 'val-001',
              condition: '{"type": "EXISTS", "field": "email"}',
              errorMessage: 'Email is required',
              severity: 'ERROR',
            },
          ],
        },
        {
          id: 'ind-ver-002',
          name: 'Cultural Context Identification',
          description: "Identification of user's cultural context",
          verificationType: VerificationType.Cultural,
          isMandatory: false,
          validationRules: [
            {
              id: 'val-002',
              condition: '{"type": "OPTIONAL", "field": "culturalPreferences"}',
              errorMessage: 'Cultural preferences are recommended',
              severity: 'WARNING',
            },
          ],
        },
      ],
      approvalWorkflow: [
        {
          id: 'ind-app-001',
          name: 'Automated Verification',
          description: 'Automated verification of user identity',
          approverRoles: ['SYSTEM'],
          requiredApprovals: 1,
          timeoutInHours: 1,
        },
      ],
      actionLimitations: [
        {
          actionType: 'COMMUNICATION',
          allowedScopes: ['PERSONAL', 'PUBLIC'],
          deniedScopes: ['RESTRICTED', 'CLASSIFIED'],
          rateLimit: {
            maxRequests: 100,
            timeWindowInSeconds: 3600,
          },
        },
      ],
      auditLevel: AuditLevel.Standard,
      culturalSensitivityConfig: {
        defaultSensitivityLevel: 5,
        culturalContexts: [
          {
            id: 'global-default',
            name: 'Global Default',
            description: 'Default cultural context for global users',
            applicableRegions: ['GLOBAL'],
            sensitivityModifiers: {
              religion: 3,
              politics: 3,
              health: 2,
            },
            communicationGuidelines:
              'Maintain neutral, respectful communication',
          },
        ],
        topicSensitivityMap: {
          religion: 7,
          politics: 7,
          health: 5,
          education: 3,
          entertainment: 2,
        },
        adaptationStrategy: 'BALANCED',
      },
    };
  }

  private createProfessionalTemplate(): IGovernanceModel {
    // Similar to individual but with professional-specific settings
    // This would be more detailed in a real implementation
    return {
      userType: UserType.Professional,
      verificationRequirements: [
        {
          id: 'pro-ver-001',
          name: 'Professional Identity Verification',
          description: 'Verification of professional identity',
          verificationType: VerificationType.Identity,
          isMandatory: true,
          validationRules: [
            {
              id: 'val-001',
              condition: '{"type": "EXISTS", "field": "email"}',
              errorMessage: 'Professional email is required',
              severity: 'ERROR',
            },
            {
              id: 'val-002',
              condition:
                '{"type": "EXISTS", "field": "professionalCredentials"}',
              errorMessage: 'Professional credentials are required',
              severity: 'ERROR',
            },
          ],
        },
      ],
      approvalWorkflow: [
        {
          id: 'pro-app-001',
          name: 'Credential Verification',
          description: 'Verification of professional credentials',
          approverRoles: ['SYSTEM', 'DOMAIN_EXPERT'],
          requiredApprovals: 2,
          timeoutInHours: 48,
        },
      ],
      actionLimitations: [
        {
          actionType: 'COMMUNICATION',
          allowedScopes: ['PERSONAL', 'PROFESSIONAL', 'PUBLIC'],
          deniedScopes: ['RESTRICTED', 'CLASSIFIED'],
          rateLimit: {
            maxRequests: 200,
            timeWindowInSeconds: 3600,
          },
        },
      ],
      auditLevel: AuditLevel.Enhanced,
      culturalSensitivityConfig: {
        defaultSensitivityLevel: 6,
        culturalContexts: [
          {
            id: 'professional-global',
            name: 'Professional Global',
            description: 'Cultural context for professional users',
            applicableRegions: ['GLOBAL'],
            sensitivityModifiers: {
              religion: 3,
              politics: 3,
              health: 2,
              professional_ethics: 8,
            },
            communicationGuidelines:
              'Maintain professional, respectful communication',
          },
        ],
        topicSensitivityMap: {
          religion: 7,
          politics: 7,
          health: 5,
          education: 3,
          professional_ethics: 8,
          entertainment: 2,
        },
        adaptationStrategy: 'BALANCED',
      },
    };
  }

  // Additional template methods for other user types
  // These would be implemented similarly to the above methods
  private createStudentTemplate(): IGovernanceModel {
    // Implementation for student template
    return {
      userType: UserType.Student,
      verificationRequirements: [],
      approvalWorkflow: [],
      actionLimitations: [],
      auditLevel: AuditLevel.Standard,
      culturalSensitivityConfig: {
        defaultSensitivityLevel: 5,
        culturalContexts: [],
        topicSensitivityMap: {},
        adaptationStrategy: 'BALANCED',
      },
    };
  }

  private createEnterpriseTemplate(): IGovernanceModel {
    // Implementation for enterprise template
    return {
      userType: UserType.Enterprise,
      verificationRequirements: [],
      approvalWorkflow: [],
      actionLimitations: [],
      auditLevel: AuditLevel.Comprehensive,
      culturalSensitivityConfig: {
        defaultSensitivityLevel: 7,
        culturalContexts: [],
        topicSensitivityMap: {},
        adaptationStrategy: 'CONSERVATIVE',
      },
    };
  }

  private createResearchTemplate(): IGovernanceModel {
    // Implementation for research template
    return {
      userType: UserType.Research,
      verificationRequirements: [],
      approvalWorkflow: [],
      actionLimitations: [],
      auditLevel: AuditLevel.Enhanced,
      culturalSensitivityConfig: {
        defaultSensitivityLevel: 4,
        culturalContexts: [],
        topicSensitivityMap: {},
        adaptationStrategy: 'FLEXIBLE',
      },
    };
  }

  private createGovernmentTemplate(): IGovernanceModel {
    // Implementation for government template
    return {
      userType: UserType.Government,
      verificationRequirements: [],
      approvalWorkflow: [],
      actionLimitations: [],
      auditLevel: AuditLevel.Comprehensive,
      culturalSensitivityConfig: {
        defaultSensitivityLevel: 8,
        culturalContexts: [],
        topicSensitivityMap: {},
        adaptationStrategy: 'CONSERVATIVE',
      },
    };
  }

  // Public method to create a governance model
  public createGovernanceModel(
    userType: UserType,
    customizations?: Partial<IGovernanceModel>
  ): IGovernanceModel {
    // Get the base template
    const baseTemplate = this.templates.get(userType);

    if (!baseTemplate) {
      throw new Error(`No template found for user type: ${userType}`);
    }

    // Apply customizations if provided
    if (customizations) {
      return this.applyCustomizations(baseTemplate, customizations);
    }

    // Return a deep copy of the template to prevent modifications to the original
    return JSON.parse(JSON.stringify(baseTemplate));
  }

  private applyCustomizations(
    baseModel: IGovernanceModel,
    customizations: Partial<IGovernanceModel>
  ): IGovernanceModel {
    // Create a deep copy of the base model
    const customModel = JSON.parse(JSON.stringify(baseModel));

    // Apply customizations
    if (customizations.verificationRequirements) {
      customModel.verificationRequirements = this.mergeArrays(
        customModel.verificationRequirements,
        customizations.verificationRequirements,
        'id'
      );
    }

    if (customizations.approvalWorkflow) {
      customModel.approvalWorkflow = this.mergeArrays(
        customModel.approvalWorkflow,
        customizations.approvalWorkflow,
        'id'
      );
    }

    if (customizations.actionLimitations) {
      customModel.actionLimitations = this.mergeArrays(
        customModel.actionLimitations,
        customizations.actionLimitations,
        'actionType'
      );
    }

    if (customizations.auditLevel) {
      customModel.auditLevel = customizations.auditLevel;
    }

    if (customizations.culturalSensitivityConfig) {
      // Deep merge the cultural sensitivity config
      customModel.culturalSensitivityConfig = {
        ...customModel.culturalSensitivityConfig,
        ...customizations.culturalSensitivityConfig,
        culturalContexts: this.mergeArrays(
          customModel.culturalSensitivityConfig.culturalContexts,
          customizations.culturalSensitivityConfig.culturalContexts || [],
          'id'
        ),
        topicSensitivityMap: {
          ...customModel.culturalSensitivityConfig.topicSensitivityMap,
          ...(customizations.culturalSensitivityConfig.topicSensitivityMap ||
            {}),
        },
      };
    }

    return customModel;
  }

  private mergeArrays<T>(
    baseArray: T[],
    customArray: T[],
    idField: string
  ): T[] {
    const result = [...baseArray];

    customArray.forEach(customItem => {
      const index = result.findIndex(
        item => item[idField] === customItem[idField]
      );

      if (index >= 0) {
        // Replace existing item
        result[index] = customItem;
      } else {
        // Add new item
        result.push(customItem);
      }
    });

    return result;
  }
}

// Usage example for Step 1: Creating governance models for different pilots
function implementStep1() {
  const factory = GovernanceFactory.getInstance();

  // Create a governance model for Individual users
  const individualGovernance = factory.createGovernanceModel(
    UserType.Individual
  );

  // Create a customized governance model for Enterprise users
  const enterpriseGovernance = factory.createGovernanceModel(
    UserType.Enterprise,
    {
      auditLevel: AuditLevel.Comprehensive,
      culturalSensitivityConfig: {
        defaultSensitivityLevel: 8,
        adaptationStrategy: 'CONSERVATIVE',
        culturalContexts: [
          {
            id: 'enterprise-global',
            name: 'Enterprise Global',
            description: 'Cultural context for enterprise users',
            applicableRegions: ['GLOBAL'],
            sensitivityModifiers: {
              corporate_ethics: 9,
              financial_information: 9,
              competition: 8,
            },
            communicationGuidelines:
              'Maintain strict professional standards and confidentiality',
          },
        ],
        topicSensitivityMap: {
          corporate_ethics: 9,
          financial_information: 9,
          competition: 8,
        },
      },
      actionLimitations: [
        {
          actionType: 'COMMUNICATION',
          allowedScopes: [
            'ENTERPRISE_INTERNAL',
            'BUSINESS_PARTNER',
            'PUBLIC_APPROVED',
          ],
          deniedScopes: ['PERSONAL', 'COMPETITOR', 'RESTRICTED', 'CLASSIFIED'],
          rateLimit: {
            maxRequests: 1000,
            timeWindowInSeconds: 3600,
            burstCapacity: 100,
          },
          contextualRules: [
            {
              context: 'FINANCIAL_REPORTING',
              condition: '{"type": "TIME_PERIOD", "period": "QUIET_PERIOD"}',
              modifiedScopes: {
                additionalDenied: ['PUBLIC_APPROVED'],
              },
            },
          ],
        },
      ],
    }
  );

  // Create a governance model for Government users
  const governmentGovernance = factory.createGovernanceModel(
    UserType.Government
  );

  // Return the created governance models for further use
  return {
    individualGovernance,
    enterpriseGovernance,
    governmentGovernance,
  };
}
