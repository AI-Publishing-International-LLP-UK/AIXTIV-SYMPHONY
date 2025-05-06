/**
 * Owner Types Index
 *
 * This file exports all owner types defined in the AIXTIV Symphony system.
 * These types define the capabilities, permissions, and pricing for different
 * levels of ownership within the platform.
 */

export * from './professional-owner';
export * from './team-owner';
export * from './enterprise-owner';
export * from './group-owner';
export * from './organizational-enterprise-owner';
export * from './organizational-department-owner';
export * from './community-leader-owner';
export * from './academic-faculty-owner';
export * from './academic-educator-owner';

/**
 * Convenience function to get an owner type by name
 */
export const getOwnerTypeByName = (typeName: string) => {
  switch (typeName.toLowerCase()) {
    case 'professional':
      return require('./professional-owner').ProfessionalOwner;
    case 'team':
      return require('./team-owner').TeamOwner;
    case 'enterprise':
      return require('./enterprise-owner').EnterpriseOwner;
    case 'group':
      return require('./group-owner').GroupOwner;
    case 'organizational-enterprise':
      return require('./organizational-enterprise-owner')
        .OrganizationalEnterpriseOwner;
    case 'organizational-department':
      return require('./organizational-department-owner')
        .OrganizationalDepartmentOwner;
    case 'community-leader':
      return require('./community-leader-owner').CommunityLeaderOwner;
    case 'academic-faculty':
      return require('./academic-faculty-owner').AcademicFacultyOwner;
    case 'academic-educator':
      return require('./academic-educator-owner').AcademicEducatorOwner;
    default:
      throw new Error(`Unknown owner type: ${typeName}`);
  }
};
