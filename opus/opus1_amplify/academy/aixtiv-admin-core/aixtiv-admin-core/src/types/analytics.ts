export interface AnalyticsConfig {
  tracking: TrackingConfig
  reporting: ReportingConfig
  storage: AnalyticsStorageConfig
  visualization: VisualizationConfig
}

export interface TrackingConfig {
  enabled: boolean
  trackingId: string
  samplingRate: number
  eventTypes: EventType[]
  customDimensions: CustomDimension[]
  filters: AnalyticsFilter[]
}

export interface ReportingConfig {
  schedule: ReportSchedule
  formats: ReportFormat[]
  destinations: ReportDestination[]
  metrics: MetricConfig[]
  aggregations: AggregationType[]
}

export interface AnalyticsStorageConfig {
  provider: StorageProvider
  retention: RetentionPolicy
  compression: CompressionConfig
  partitioning: PartitioningStrategy
}

export interface VisualizationConfig {
  charts: ChartConfig[]
  dashboards: DashboardConfig[]
  interactivity: InteractivityOptions
  exportFormats: ExportFormat[]
}

export interface EventType {
  name: string
  category: string
  parameters: EventParameter[]
  validation?: EventValidation
}

export interface CustomDimension {
  name: string
  scope: DimensionScope
  type: DimensionType
  defaultValue?: any
}

export interface AnalyticsFilter {
  field: string
  operator: FilterOperator
  value: any
  priority: number
}

export interface ReportSchedule {
  frequency: ReportFrequency
  timezone: string
  startDate: Date
  endDate?: Date
}

export interface MetricConfig {
  name: string
  formula: string
  unit: string
  thresholds: MetricThreshold[]
}

export interface RetentionPolicy {
  duration: number
  granularity: TimeGranularity
  archiveStrategy?: ArchiveStrategy
}

export interface ChartConfig {
  type: ChartType
  data: DataSource
  options: ChartOptions
  interactivity?: ChartInteractivity
}

export interface DashboardConfig {
  layout: LayoutConfig
  widgets: WidgetConfig[]
  filters: DashboardFilter[]
  sharing: SharingOptions
}

export enum ReportFrequency {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains'
}

export enum DimensionScope {
  USER = 'user',
  SESSION = 'session',
  HIT = 'hit',
  PRODUCT = 'product'
}

export enum DimensionType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date'
}

export enum TimeGranularity {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  SCATTER = 'scatter',
  HEATMAP = 'heatmap'
}

export enum StorageProvider {
  GOOGLE_ANALYTICS = 'google_analytics',
  BIGQUERY = 'bigquery',
  SNOWFLAKE = 'snowflake',
  CUSTOM = 'custom'
}

export interface EventParameter {
  name: string
  type: DimensionType
  required: boolean
  validation?: ParameterValidation
}

export interface EventValidation {
  rules: ValidationRule[]
  errorHandling: ErrorHandlingStrategy
}

export interface ValidationRule {
  type: ValidationType
  parameters: Record<string, any>
  errorMessage: string
}

export interface ReportFormat {
  type: string
  options: Record<string, any>
}

export interface ReportDestination {
  type: DestinationType
  config: Record<string, any>
}

export interface MetricThreshold {
  level: ThresholdLevel
  value: number
  alert: AlertConfig
}

export interface CompressionConfig {
  enabled: boolean
  algorithm: CompressionAlgorithm
  level: number
}

export interface PartitioningStrategy {
  field: string
  type: PartitionType
  interval?: number
}

export interface InteractivityOptions {
  enabled: boolean
  features: InteractiveFeature[]
  restrictions: InteractionRestriction[]
}

export interface ExportFormat {
  type: string
  options: Record<string, any>
}

export interface LayoutConfig {
  type: LayoutType
  columns: number
  rows: number
  gridSize: GridSize
}

export interface WidgetConfig {
  type: WidgetType
  position: Position
  size: Size
  data: DataSource
}

export interface DashboardFilter {
  field: string
  type: FilterType
  options: FilterOptions
}

export interface SharingOptions {
  enabled: boolean
  permissions: Permission[]
  expirationTime?: number
}

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface GridSize {
  width: number
  height: number
}

export interface DataSource {
  type: DataSourceType
  query: string
  refresh: RefreshStrategy
}

export interface ChartOptions {
  title: string
  axes: AxisConfig[]
  legend: LegendConfig
  tooltips: TooltipConfig
}

export interface ChartInteractivity {
  zoom: boolean
  pan: boolean
  drill: DrillDownConfig
}

export interface AxisConfig {
  type: AxisType
  position: AxisPosition
  label: string
  format: string
}

export interface LegendConfig {
  position: LegendPosition
  style: LegendStyle
}

export interface TooltipConfig {
  enabled: boolean
  format: string
  trigger: TooltipTrigger
}

export interface DrillDownConfig {
  enabled: boolean
  levels: DrillDownLevel[]
}

export interface Permission {
  role: UserRole
  actions: UserAction[]
}

export enum AxisType {
  LINEAR = 'linear',
  LOGARITHMIC = 'logarithmic',
  DATETIME = 'datetime',
  CATEGORY = 'category'
}

export enum AxisPosition {
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BOTTOM = 'bottom'
}

export enum LegendPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right'
}

export enum TooltipTrigger {
  HOVER = 'hover',
  CLICK = 'click'
}

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export enum UserAction {
  VIEW = 'view',
  EDIT = 'edit',
  SHARE = 'share',
  DELETE = 'delete'
}
