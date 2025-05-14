/**
 * AIXTIV SYMPHONY™ Tenant Visualization Configuration
 * © 2025 AI Publishing International LLP
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This is proprietary software of AI Publishing International LLP.
 * All rights reserved.
 */

import { TenantType } from '../roles/user-types';

/**
 * Visualization Center Theme Interface
 */
export interface VisualizationTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  logo?: string;
  customCSS?: string;
  animations: {
    enabled: boolean;
    speed: 'slow' | 'medium' | 'fast';
    type: 'fade' | 'slide' | 'zoom' | 'none';
  };
}

/**
 * Dashboard Interface
 */
export interface Dashboard {
  id: string;
  name: string;
  description: string;
  icon: string;
  layout: {
    type: 'grid' | 'freeform' | 'flow';
    config: Record<string, any>;
  };
  widgets: DashboardWidget[];
  isDefault: boolean;
  roles: string[]; // Roles that can access this dashboard
  visibility: 'private' | 'tenant' | 'public';
  createdBy: string;
  updatedAt: number;
}

/**
 * Dashboard Widget Interface
 */
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'media' | 'feed' | 'custom';
  title: string;
  description?: string;
  size: {
    width: number;
    height: number;
  };
  position: {
    x: number;
    y: number;
    z?: number;
  };
  dataSource: {
    type: 'api' | 'firestore' | 'static' | 'function';
    config: Record<string, any>;
  };
  visualization: {
    type: string;
    config: Record<string, any>;
  };
  refreshInterval?: number; // in seconds
  interactions?: {
    clickAction?: string;
    hoverAction?: string;
    filterAction?: string;
  };
  permissions?: string[];
}

/**
 * Room configuration for the Visualization Center
 */
export interface VisualizationRoom {
  id: string;
  name: string;
  description: string;
  type: 'vestibule' | 'main' | 'specialty' | 'private';
  theme: string; // Theme ID
  dashboards: string[]; // Dashboard IDs
  layout: {
    type: '2d' | '3d' | 'vr';
    config: Record<string, any>;
  };
  entryAnimation?: {
    type: string;
    duration: number;
    config: Record<string, any>;
  };
  backgroundMedia?: {
    type: 'image' | 'video' | 'model' | 'none';
    url?: string;
    config?: Record<string, any>;
  };
  audioEnabled: boolean;
  interactiveElements: {
    id: string;
    type: string;
    position: Record<string, any>;
    action: Record<string, any>;
  }[];
  permissions: {
    roles: string[];
    customAccess?: Record<string, any>;
  };
  metadata: Record<string, any>;
}

/**
 * Tenant-specific Visualization Center configuration
 */
export interface TenantVisualizationConfig {
  tenantId: string;
  enabled: boolean;
  tenantType: TenantType;
  theme: string; // Default theme ID
  rooms: VisualizationRoom[];
  dashboards: Dashboard[];
  customDomain?: string;
  welcomeMessages: {
    newUser: string;
    returningUser: string;
    member: string;
  };
  entryPoints: {
    web: boolean;
    mobile: boolean;
    vr: boolean;
    qrCode: boolean;
  };
  features: {
    realTimeData: boolean;
    aiAssistant: boolean;
    voiceCommands: boolean;
    userCollaboration: boolean;
    exportCapabilities: boolean;
    customDashboards: boolean;
    interactiveWidgets: boolean;
    advancedAnalytics: boolean;
  };
  branding: {
    logo?: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    customElements?: Record<string, any>;
  };
  cinematic: {
    enabled: boolean;
    entrySequence?: {
      newUser: string;
      returningUser: string;
      member: string;
    };
    transitions?: Record<string, any>;
  };
  notificationConfig: {
    enabled: boolean;
    channels: ('email' | 'inApp' | 'mobile')[];
    frequency: 'realTime' | 'digest' | 'scheduled';
  };
  accessControl: {
    publicAccess: boolean;
    defaultRole: string;
    visitorTracking: boolean;
    maxConcurrentUsers?: number;
  };
  analytics: {
    enabled: boolean;
    trackUserJourney: boolean;
    heatmaps: boolean;
    userSegmentation: boolean;
  };
  metadata: Record<string, any>;
}

/**
 * Default themes for the Visualization Center
 */
export const DEFAULT_THEMES: Record<string, VisualizationTheme> = {
  aixtivDefault: {
    id: 'aixtiv-default',
    name: 'AIXTIV Default',
    primaryColor: '#1a237e',
    secondaryColor: '#2979ff',
    accentColor: '#ff6d00',
    backgroundColor: '#fafafa',
    textColor: '#212121',
    fontFamily: 'Roboto, sans-serif',
    animations: {
      enabled: true,
      speed: 'medium',
      type: 'fade',
    },
  },
  darkMode: {
    id: 'dark-mode',
    name: 'Dark Mode',
    primaryColor: '#0d47a1',
    secondaryColor: '#1565c0',
    accentColor: '#ff6d00',
    backgroundColor: '#121212',
    textColor: '#ffffff',
    fontFamily: 'Roboto, sans-serif',
    animations: {
      enabled: true,
      speed: 'medium',
      type: 'fade',
    },
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    primaryColor: '#000000',
    secondaryColor: '#424242',
    accentColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    textColor: '#212121',
    fontFamily: 'Montserrat, sans-serif',
    animations: {
      enabled: true,
      speed: 'slow',
      type: 'fade',
    },
  },
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant',
    primaryColor: '#6200ea',
    secondaryColor: '#00b0ff',
    accentColor: '#ff4081',
    backgroundColor: '#e8eaf6',
    textColor: '#212121',
    fontFamily: 'Poppins, sans-serif',
    animations: {
      enabled: true,
      speed: 'fast',
      type: 'slide',
    },
  },
};

/**
 * Default rooms for the Visualization Center
 */
export const DEFAULT_ROOMS: Record<string, Partial<VisualizationRoom>> = {
  vestibule: {
    id: 'vestibule',
    name: 'Vestibule',
    description: 'Welcome area for the Visualization Center',
    type: 'vestibule',
    theme: 'aixtiv-default',
    audioEnabled: true,
    layout: {
      type: '3d',
      config: {
        cameraPosition: { x: 0, y: 1.6, z: 5 },
        lookAtPosition: { x: 0, y: 1.6, z: 0 },
      },
    },
    entryAnimation: {
      type: 'fadeIn',
      duration: 2000,
      config: {
        easing: 'easeInOutCubic',
      },
    },
    backgroundMedia: {
      type: 'video',
      url: 'assets/videos/vestibule-background.mp4',
      config: {
        loop: true,
        muted: true,
      },
    },
    interactiveElements: [
      {
        id: 'welcome-hologram',
        type: 'hologram',
        position: { x: 0, y: 1, z: 0 },
        action: {
          type: 'playMedia',
          config: {
            mediaType: 'video',
            url: 'assets/videos/welcome-message.mp4',
          },
        },
      },
      {
        id: 'main-room-portal',
        type: 'portal',
        position: { x: 0, y: 1, z: -3 },
        action: {
          type: 'navigate',
          config: {
            destination: 'main-hall',
            transition: 'fade',
          },
        },
      },
    ],
  },
  mainHall: {
    id: 'main-hall',
    name: 'Main Hall',
    description: 'Central area of the Visualization Center',
    type: 'main',
    theme: 'aixtiv-default',
    audioEnabled: true,
    layout: {
      type: '3d',
      config: {
        cameraPosition: { x: 0, y: 1.6, z: 10 },
        lookAtPosition: { x: 0, y: 1.6, z: 0 },
      },
    },
    backgroundMedia: {
      type: 'image',
      url: 'assets/images/main-hall-background.jpg',
      config: {
        panorama: true,
      },
    },
    interactiveElements: [
      {
        id: 'analytics-portal',
        type: 'portal',
        position: { x: -5, y: 1, z: 0 },
        action: {
          type: 'navigate',
          config: {
            destination: 'analytics-room',
            transition: 'slide',
          },
        },
      },
      {
        id: 'strategy-portal',
        type: 'portal',
        position: { x: 5, y: 1, z: 0 },
        action: {
          type: 'navigate',
          config: {
            destination: 'strategy-room',
            transition: 'slide',
          },
        },
      },
      {
        id: 'main-dashboard',
        type: 'interactive-display',
        position: { x: 0, y: 2, z: -5 },
        action: {
          type: 'showDashboard',
          config: {
            dashboardId: 'main-overview',
          },
        },
      },
    ],
  },
  analyticsRoom: {
    id: 'analytics-room',
    name: 'Analytics Room',
    description: 'Specialized room for in-depth analytics',
    type: 'specialty',
    theme: 'dark-mode',
    audioEnabled: true,
    layout: {
      type: '3d',
      config: {
        cameraPosition: { x: 0, y: 1.6, z: 8 },
        lookAtPosition: { x: 0, y: 1.6, z: 0 },
      },
    },
    backgroundMedia: {
      type: 'video',
      url: 'assets/videos/data-particles-background.mp4',
      config: {
        loop: true,
        muted: true,
      },
    },
    interactiveElements: [
      {
        id: 'data-wall',
        type: 'interactive-wall',
        position: { x: 0, y: 2, z: -5 },
        action: {
          type: 'showDashboard',
          config: {
            dashboardId: 'advanced-analytics',
          },
        },
      },
      {
        id: 'return-portal',
        type: 'portal',
        position: { x: 0, y: 1, z: 5 },
        action: {
          type: 'navigate',
          config: {
            destination: 'main-hall',
            transition: 'fade',
          },
        },
      },
    ],
  },
};

/**
 * Default dashboards for the Visualization Center
 */
export const DEFAULT_DASHBOARDS: Record<string, Partial<Dashboard>> = {
  overview: {
    id: 'overview',
    name: 'Overview Dashboard',
    description: 'General overview of key metrics',
    icon: 'dashboard',
    layout: {
      type: 'grid',
      config: {
        columns: 12,
        rowHeight: 100,
      },
    },
    isDefault: true,
    visibility: 'tenant',
    widgets: [
      {
        id: 'welcome-widget',
        type: 'custom',
        title: 'Welcome',
        size: { width: 12, height: 2 },
        position: { x: 0, y: 0 },
        dataSource: {
          type: 'static',
          config: {
            content: 'Welcome to your visualization center',
          },
        },
        visualization: {
          type: 'welcomeBanner',
          config: {
            showUserName: true,
          },
        },
      },
      {
        id: 'key-metrics',
        type: 'metric',
        title: 'Key Metrics',
        size: { width: 3, height: 3 },
        position: { x: 0, y: 2 },
        dataSource: {
          type: 'api',
          config: {
            endpoint: '/api/metrics/summary',
            refreshInterval: 60,
          },
        },
        visualization: {
          type: 'kpiCards',
          config: {
            layout: '2x2',
          },
        },
      },
      {
        id: 'activity-chart',
        type: 'chart',
        title: 'Activity Over Time',
        size: { width: 9, height: 3 },
        position: { x: 3, y: 2 },
        dataSource: {
          type: 'api',
          config: {
            endpoint: '/api/activity/timeline',
            parameters: {
              period: 'month',
            },
          },
        },
        visualization: {
          type: 'lineChart',
          config: {
            showLegend: true,
            showGridLines: true,
          },
        },
      },
    ],
  },
  executive: {
    id: 'executive',
    name: 'Executive Dashboard',
    description: 'High-level metrics for executives',
    icon: 'trending_up',
    layout: {
      type: 'grid',
      config: {
        columns: 12,
        rowHeight: 100,
      },
    },
    isDefault: false,
    visibility: 'private',
    widgets: [
      {
        id: 'exec-summary',
        type: 'custom',
        title: 'Executive Summary',
        size: { width: 12, height: 2 },
        position: { x: 0, y: 0 },
        dataSource: {
          type: 'api',
          config: {
            endpoint: '/api/reports/executive-summary',
          },
        },
        visualization: {
          type: 'summaryTable',
          config: {
            compact: true,
          },
        },
      },
      {
        id: 'strategic-kpis',
        type: 'metric',
        title: 'Strategic KPIs',
        size: { width: 6, height: 4 },
        position: { x: 0, y: 2 },
        dataSource: {
          type: 'api',
          config: {
            endpoint: '/api/kpis/strategic',
          },
        },
        visualization: {
          type: 'gaugeCharts',
          config: {
            showTargets: true,
          },
        },
      },
      {
        id: 'forecast',
        type: 'chart',
        title: 'Strategic Forecast',
        size: { width: 6, height: 4 },
        position: { x: 6, y: 2 },
        dataSource: {
          type: 'api',
          config: {
            endpoint: '/api/forecasts/strategic',
          },
        },
        visualization: {
          type: 'areaChart',
          config: {
            showConfidenceInterval: true,
          },
        },
      },
    ],
  },
};

/**
 * Factory class for creating Visualization Center configurations
 */
export class TenantVisualizationFactory {
  /**
   * Create a default Visualization Center configuration for a tenant
   */
  static createDefaultConfig(
    tenantId: string,
    tenantType: TenantType,
    customConfig: Partial<TenantVisualizationConfig> = {}
  ): TenantVisualizationConfig {
    // Base configuration
    const baseConfig: TenantVisualizationConfig = {
      tenantId,
      enabled: true,
      tenantType,
      theme: 'aixtiv-default',
      rooms: [],
      dashboards: [],
      welcomeMessages: {
        newUser: 'Welcome to the Visualization Center!',
        returningUser: 'Welcome back to the Visualization Center!',
        member: 'Welcome, valued member!',
      },
      entryPoints: {
        web: true,
        mobile: true,
        vr: false,
        qrCode: true,
      },
      features: {
        realTimeData: true,
        aiAssistant: true,
        voiceCommands: false,
        userCollaboration: true,
        exportCapabilities: true,
        customDashboards: true,
        interactiveWidgets: true,
        advancedAnalytics: true,
      },
      branding: {
        colors: {
          primary: '#1a237e',
          secondary: '#2979ff',
          accent: '#ff6d00',
        },
      },
      cinematic: {
        enabled: true,
        entrySequence: {
          newUser: 'assets/videos/new-user-entry.mp4',
          returningUser: 'assets/videos/returning-user-entry.mp4',
          member: 'assets/videos/member-entry.mp4',
        },
      },
      notificationConfig: {
        enabled: true,
        channels: ['email', 'inApp'],
        frequency: 'realTime',
      },
      accessControl: {
        publicAccess: false,
        defaultRole: 'viewer',
        visitorTracking: true,
      },
      analytics: {
        enabled: true,
        trackUserJourney: true,
        heatmaps: true,
        userSegmentation: true,
      },
      metadata: {},
    };

    // Add tenant-type specific configurations
    let typeConfig: Partial<TenantVisualizationConfig> = {};

    switch (tenantType) {
      case TenantType.ENTERPRISE:
        typeConfig = this.getEnterpriseConfig();
        break;
      case TenantType.ORGANIZATIONAL:
        typeConfig = this.getOrganizationalConfig();
        break;
      case TenantType.ACADEMIC:
        typeConfig = this.getAcademicConfig();
        break;
      case TenantType.GROUP:
        typeConfig = this.getGroupConfig();
        break;
      case TenantType.INDIVIDUAL:
        typeConfig = this.getIndividualConfig();
        break;
    }

    // Add default rooms and dashboards
    const defaultRooms = this.getDefaultRooms(tenantType);
    const defaultDashboards = this.getDefaultDashboards(tenantType);

    // Merge all configurations
    return {
      ...baseConfig,
      ...typeConfig,
      ...customConfig,
      tenantId,
      rooms: [...defaultRooms, ...(customConfig.rooms || [])],
      dashboards: [...defaultDashboards, ...(customConfig.dashboards || [])],
    };
  }

  /**
   * Get default rooms based on tenant type
   */
  private static getDefaultRooms(tenantType: TenantType): VisualizationRoom[] {
    // Convert the partial rooms to full rooms with default values
    const defaultRooms: VisualizationRoom[] = [
      {
        ...(DEFAULT_ROOMS.vestibule as VisualizationRoom),
        permissions: { roles: ['*'] }, // Access for all roles
        metadata: {},
      },
      {
        ...(DEFAULT_ROOMS.mainHall as VisualizationRoom),
        permissions: { roles: ['*'] },
        metadata: {},
      },
    ];

    // Add specialized rooms based on tenant type
    switch (tenantType) {
      case TenantType.ENTERPRISE:
      case TenantType.ORGANIZATIONAL:
        defaultRooms.push({
          ...(DEFAULT_ROOMS.analyticsRoom as VisualizationRoom),
          permissions: { roles: ['admin', 'analyst', 'executive'] },
          metadata: {},
        });
        break;
    }

    return defaultRooms;
  }

  /**
   * Get default dashboards based on tenant type
   */
  private static getDefaultDashboards(tenantType: TenantType): Dashboard[] {
    // Convert the partial dashboards to full dashboards with default values
    const now = Date.now();
    const defaultDashboards: Dashboard[] = [
      {
        ...(DEFAULT_DASHBOARDS.overview as Dashboard),
        roles: ['*'],
        createdBy: 'system',
        updatedAt: now,
      },
    ];

    // Add specialized dashboards based on tenant type
    switch (tenantType) {
      case TenantType.ENTERPRISE:
        defaultDashboards.push({
          ...(DEFAULT_DASHBOARDS.executive as Dashboard),
          roles: ['admin', 'executive'],
          createdBy: 'system',
          updatedAt: now,
        });
        break;
    }

    return defaultDashboards;
  }

  /**
   * Enterprise-specific visualization configuration
   */
  private static getEnterpriseConfig(): Partial<TenantVisualizationConfig> {
    return {
      features: {
        realTimeData: true,
        aiAssistant: true,
        voiceCommands: true,
        userCollaboration: true,
        exportCapabilities: true,
        customDashboards: true,
        interactiveWidgets: true,
        advancedAnalytics: true,
      },
      accessControl: {
        publicAccess: false,
        defaultRole: 'viewer',
        visitorTracking: true,
        maxConcurrentUsers: 100,
      },
      welcomeMessages: {
        newUser: 'Welcome to your Enterprise Visualization Center!',
        returningUser: 'Welcome back to your Enterprise Visualization Center!',
        member: 'Welcome, valued enterprise member!',
      },
    };
  }

  /**
   * Organizational-specific visualization configuration
   */
  private static getOrganizationalConfig(): Partial<TenantVisualizationConfig> {
    return {
      features: {
        realTimeData: true,
        aiAssistant: true,
        voiceCommands: false,
        userCollaboration: true,
        exportCapabilities: true,
        customDashboards: true,
        interactiveWidgets: true,
        advancedAnalytics: true,
      },
      accessControl: {
        publicAccess: true, // May include public data
        defaultRole: 'viewer',
        visitorTracking: true,
        maxConcurrentUsers: 50,
      },
      welcomeMessages: {
        newUser: 'Welcome to the Organizational Visualization Center!',
        returningUser:
          'Welcome back to the Organizational Visualization Center!',
        member: 'Welcome, valued organization member!',
      },
    };
  }

  /**
   * Academic-specific visualization configuration
   */
  private static getAcademicConfig(): Partial<TenantVisualizationConfig> {
    return {
      features: {
        realTimeData: false, // Lower priority for real-time
        aiAssistant: true,
        voiceCommands: false,
        userCollaboration: true,
        exportCapabilities: true,
        customDashboards: false,
        interactiveWidgets: true,
        advancedAnalytics: true,
      },
      accessControl: {
        publicAccess: true,
        defaultRole: 'student',
        visitorTracking: true,
        maxConcurrentUsers: 200, // Higher for classrooms
      },
      welcomeMessages: {
        newUser: 'Welcome to the Academic Visualization Center!',
        returningUser: 'Welcome back to the Academic Visualization Center!',
        member: 'Welcome, scholar!',
      },
    };
  }

  /**
   * Group-specific visualization configuration
   */
  private static getGroupConfig(): Partial<TenantVisualizationConfig> {
    return {
      features: {
        realTimeData: true,
        aiAssistant: true,
        voiceCommands: false,
        userCollaboration: true,
        exportCapabilities: true,
        customDashboards: false,
        interactiveWidgets: true,
        advancedAnalytics: false,
      },
      accessControl: {
        publicAccess: false,
        defaultRole: 'member',
        visitorTracking: true,
        maxConcurrentUsers: 20,
      },
      welcomeMessages: {
        newUser: 'Welcome to your Group Visualization Center!',
        returningUser: 'Welcome back to your Group Visualization Center!',
        member: 'Welcome, group member!',
      },
    };
  }

  /**
   * Individual-specific visualization configuration
   */
  private static getIndividualConfig(): Partial<TenantVisualizationConfig> {
    return {
      features: {
        realTimeData: false,
        aiAssistant: true,
        voiceCommands: false,
        userCollaboration: false,
        exportCapabilities: true,
        customDashboards: false,
        interactiveWidgets: true,
        advancedAnalytics: false,
      },
      accessControl: {
        publicAccess: false,
        defaultRole: 'owner',
        visitorTracking: false,
        maxConcurrentUsers: 5,
      },
      welcomeMessages: {
        newUser: 'Welcome to your Personal Visualization Center!',
        returningUser: 'Welcome back to your Personal Visualization Center!',
        member: 'Welcome back!',
      },
    };
  }
}

export default {
  TenantVisualizationFactory,
  DEFAULT_THEMES,
  DEFAULT_ROOMS,
  DEFAULT_DASHBOARDS,
};
