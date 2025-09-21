/**
 * ASOOS Dynamic Interface Compiler
 * Builds personalized interfaces from 47 modular packets
 * Visionary: User | Implementation: AI
 */

const INTERFACE_STRUCTURE = {
  // Section 1: Left - "Let us take care of"  
  LEFT_SECTION: {
    name: 'automation_zone',
    units: [
      'ai_monitoring_panel',
      'auto_deployment_status', 
      'system_health_dashboard',
      'testament_swarm_activity',
      'background_processes',
      'api_gateway_status',
      'security_scanner',
      'performance_metrics',
      'error_resolution',
      'backup_systems',
      'compliance_checker',
      'integration_health',
      'database_optimizer',
      'cache_manager',
      'log_analyzer'
    ]
  },

  // Section 2: Center - "We collaborate"
  CENTER_SECTION: {
    name: 'collaboration_hub',
    units: [
      'chat_interface',
      'voice_synthesis',
      'document_workspace',
      'shared_dashboards',
      'project_timeline',
      'team_notifications',
      'decision_tracker',
      'meeting_scheduler',
      'workflow_designer',
      'approval_pipeline',
      'knowledge_base',
      'training_modules',
      'feedback_system',
      'goal_tracker',
      'resource_planner'
    ]
  },

  // Section 3: Right - "Innovate on command line"
  RIGHT_SECTION: {
    name: 'innovation_lab',
    units: [
      'terminal_interface',
      'code_generator',
      'deployment_wizard',
      'testing_sandbox',
      'prototype_builder',
      'api_designer',
      'data_explorer',
      'experiment_tracker',
      'model_trainer',
      'pipeline_builder',
      'version_controller',
      'environment_manager',
      'service_composer',
      'integration_tester',
      'performance_profiler'
    ]
  },

  // Section 4: Utility 1 - Admin Tools (Diamond/Emerald/Sapphire)
  UTILITY_ADMIN_SECTION: {
    name: 'admin_utilities',
    accessLevel: ['diamond_sao', 'emerald_sao', 'sapphire_sao'],
    units: [
      'user_management',
      'permission_matrix',
      'billing_dashboard',
      'analytics_suite',
      'audit_trails',
      'security_console',
      'backup_manager',
      'integration_hub',
      'notification_center',
      'support_portal'
    ]
  },

  // Section 5: Utility 2 - Super Admin (Diamond/Emerald only)
  UTILITY_SUPERADMIN_SECTION: {
    name: 'superadmin_utilities', 
    accessLevel: ['diamond_sao', 'emerald_sao'],
    units: [
      'system_architecture',
      'global_monitoring',
      'tenant_provisioning',
      'mcp_orchestrator',
      'sallyport_manager',
      'infrastructure_control',
      'deployment_pipeline',
      'database_admin',
      'api_governance',
      'emergency_controls'
    ]
  }
};

// Dynamic packet loader
class InterfaceCompiler {
  constructor(companyConfig) {
    this.config = companyConfig;
    this.mcpEndpoint = companyConfig.mcpUrl;
    this.sallyPortToken = companyConfig.sallyPortToken;
  }

  async buildInterface() {
    const template = await this.loadBaseTemplate();
    const enabledUnits = await this.getEnabledUnits();
    const userLevel = this.config.accessLevel; // diamond_sao, emerald_sao, sapphire_sao, etc.
    
    // Build main sections
    const leftHTML = await this.buildSection('LEFT_SECTION', enabledUnits.left);
    const centerHTML = await this.buildSection('CENTER_SECTION', enabledUnits.center);  
    const rightHTML = await this.buildSection('RIGHT_SECTION', enabledUnits.right);
    
    // Build utility sections based on access level
    let adminHTML = '';
    let superAdminHTML = '';
    
    if (this.hasAccess('UTILITY_ADMIN_SECTION', userLevel)) {
      adminHTML = await this.buildSection('UTILITY_ADMIN_SECTION', enabledUnits.admin || []);
    }
    
    if (this.hasAccess('UTILITY_SUPERADMIN_SECTION', userLevel)) {
      superAdminHTML = await this.buildSection('UTILITY_SUPERADMIN_SECTION', enabledUnits.superadmin || []);
    }
    
    return this.assembleInterface(template, {
      left: leftHTML,
      center: centerHTML, 
      right: rightHTML,
      admin: adminHTML,
      superadmin: superAdminHTML
    });
  }

  async buildSection(sectionName, enabledUnits) {
    const section = INTERFACE_STRUCTURE[sectionName];
    let html = '';
    
    for (const unit of section.units) {
      if (enabledUnits.includes(unit)) {
        const packet = await this.loadPacket(unit);
        html += packet.render(this.config);
      }
    }
    
    return html;
  }
}

module.exports = { InterfaceCompiler, INTERFACE_STRUCTURE };