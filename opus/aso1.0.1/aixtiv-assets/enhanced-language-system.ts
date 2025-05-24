import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { Logger, createLogger } from './logger'; // Implement structured logging

// Enhanced language configuration with additional properties
export interface LanguageConfig {
  code: string; // ISO language code (e.g., 'en', 'es')
  locale: string; // Full locale code (e.g., 'en-US', 'es-ES')
  name: string; // Human-readable name (e.g., 'English', 'Spanish')
  voiceId?: string; // Default TTS voice ID for this language
  enabled: boolean; // Whether this language is enabled
  rtl: boolean; // Right-to-left language
  region: RegionInfo; // Regional information
  genderOptions: GenderOption[]; // Gender-specific options
  formatters: FormatConfig; // Formatting configurations
  securityHash?: string; // Hash for tamper detection
  lastUpdated?: Date; // Last update timestamp
}

// Region information
export interface RegionInfo {
  code: string; // Region code
  name: string; // Region name
  countryCode?: string; // ISO country code
  dialects?: string[]; // Supported dialects
  culturalNotes?: string[]; // Cultural considerations
}

// Gender-specific options
export interface GenderOption {
  type: 'male' | 'female' | 'neutral';
  voiceId?: string; // Voice ID for this gender
  pronouns?: string[]; // Applicable pronouns
  formalityLevels?: string[]; // Formality options
}

// Formatting configurations
export interface FormatConfig {
  dateFormat: string; // Default date format
  timeFormat: string; // Default time format
  numberFormat: string; // Number formatting
  currencyFormat: string; // Currency formatting
  measurementSystem: 'metric' | 'imperial' | 'both';
}

// Character frequency data for fallback detection
interface CharacterFrequencyMap {
  [lang: string]: { [char: string]: number };
}

// Language detection result with enhanced metadata
export interface DetectionResult {
  languageCode: string;
  locale: string;
  confidence: number;
  name: string;
  rtl: boolean;
  region?: RegionInfo;
  detectionMethod: string; // Method used for detection
  processingTimeMs: number; // Performance metric
  alternativeLanguages?: Array<{ code: string; confidence: number }>;
}

// Configuration for the language system
export interface LanguageSystemConfig {
  resourcesDir: string;
  cacheEnabled: boolean;
  cacheTimeoutMs: number;
  securityLevel: 'standard' | 'high' | 'military';
  fallbackLanguage: string;
  detectionThreshold: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Secure hash verification for tamper protection
 */
class SecurityVerifier {
  private algorithm: string;
  private secretKey: string;

  constructor(securityLevel: 'standard' | 'high' | 'military') {
    // Choose appropriate algorithm based on security level
    this.algorithm =
      securityLevel === 'military'
        ? 'sha512'
        : securityLevel === 'high'
          ? 'sha256'
          : 'sha1';

    // Get secret key from environment or generate one
    this.secretKey = process.env.LANGUAGE_SECURITY_KEY || this.generateKey();

    if (!process.env.LANGUAGE_SECURITY_KEY) {
      console.warn(
        'No security key provided in environment. Using generated key.'
      );
    }
  }

  /**
   * Generate a cryptographically secure key
   */
  private generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a secure hash for a language configuration
   */
  public createHash(config: LanguageConfig): string {
    // Create a deterministic string representation excluding the hash itself
    const { securityHash, ...configWithoutHash } = config;
    const configString = JSON.stringify(configWithoutHash) + this.secretKey;

    // Create and return hash
    return crypto.createHash(this.algorithm).update(configString).digest('hex');
  }

  /**
   * Verify a language configuration hasn't been tampered with
   */
  public verifyIntegrity(config: LanguageConfig): boolean {
    if (!config.securityHash) return false;

    const expectedHash = this.createHash(config);
    return crypto.timingSafeEqual(
      Buffer.from(config.securityHash),
      Buffer.from(expectedHash)
    );
  }
}

/**
 * Cache manager for language detection results
 */
class DetectionCache {
  private cache: Map<string, { result: DetectionResult; timestamp: number }> =
    new Map();
  private enabled: boolean;
  private timeoutMs: number;

  constructor(enabled: boolean, timeoutMs: number) {
    this.enabled = enabled;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Get a cached detection result if available and not expired
   */
  public get(text: string): DetectionResult | null {
    if (!this.enabled) return null;

    const cacheKey = this.createCacheKey(text);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < this.timeoutMs) {
        return cached.result;
      } else {
        // Remove expired entry
        this.cache.delete(cacheKey);
      }
    }

    return null;
  }

  /**
   * Store a detection result in the cache
   */
  public set(text: string, result: DetectionResult): void {
    if (!this.enabled) return;

    const cacheKey = this.createCacheKey(text);
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    // Manage cache size periodically
    if (this.cache.size > 1000) {
      this.cleanCache();
    }
  }

  /**
   * Create a secure cache key from text
   */
  private createCacheKey(text: string): string {
    // For longer texts, use hash to prevent excessive memory usage
    if (text.length > 100) {
      return crypto.createHash('sha256').update(text).digest('hex');
    }

    return text;
  }

  /**
   * Clean old entries from the cache
   */
  private cleanCache(): void {
    const now = Date.now();
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.timeoutMs) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Clear the entire cache
   */
  public clear(): void {
    this.cache.clear();
  }
}

/**
 * Enhanced Language Registry with security, caching, and better internationalization
 */
export class LanguageRegistry {
  private static instance: LanguageRegistry;
  private languages: Map<string, LanguageConfig> = new Map();
  private characterFrequencies: CharacterFrequencyMap = {};
  private initialized: boolean = false;
  private securityVerifier: SecurityVerifier;
  private logger: Logger;
  private config: LanguageSystemConfig;

  // Async filesystem operations
  private readFileAsync = promisify(fs.readFile);
  private readDirAsync = promisify(fs.readdir);
  private statAsync = promisify(fs.stat);

  private constructor(config: LanguageSystemConfig) {
    this.config = config;
    this.securityVerifier = new SecurityVerifier(config.securityLevel);
    this.logger = createLogger('LanguageRegistry', config.logLevel);
  }

  public static getInstance(config: LanguageSystemConfig): LanguageRegistry {
    if (!LanguageRegistry.instance) {
      LanguageRegistry.instance = new LanguageRegistry(config);
    } else {
      // Update config if provided and different
      const currentInstance = LanguageRegistry.instance;
      if (
        config &&
        JSON.stringify(currentInstance.config) !== JSON.stringify(config)
      ) {
        currentInstance.config = config;
        currentInstance.securityVerifier = new SecurityVerifier(
          config.securityLevel
        );
        currentInstance.logger = createLogger(
          'LanguageRegistry',
          config.logLevel
        );
      }
    }
    return LanguageRegistry.instance;
  }

  /**
   * Initialize the language registry with enhanced security checks
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.info('Initializing language registry');

      // Load language configurations with integrity verification
      await this.loadLanguageConfigurations();

      // Load character frequency data for fallback detection
      await this.loadCharacterFrequencies();

      this.initialized = true;
      this.logger.info(
        `Language registry initialized with ${this.languages.size} languages`
      );
    } catch (error) {
      this.logger.error('Failed to initialize language registry', { error });
      // Initialize with default languages as fallback
      this.initializeDefaults();
    }
  }

  /**
   * Load language configurations with security checks
   */
  private async loadLanguageConfigurations(): Promise<void> {
    try {
      const dirPath = this.config.resourcesDir;

      // Check if language resources directory exists
      if (fs.existsSync(dirPath)) {
        const files = await this.readDirAsync(dirPath);
        const configFiles = files.filter(
          file => file.endsWith('.json') && !file.includes('char_frequencies')
        );

        for (const file of configFiles) {
          try {
            const filePath = path.join(dirPath, file);
            const fileStat = await this.statAsync(filePath);

            // Skip files that are too large to prevent DOS
            if (fileStat.size > 5 * 1024 * 1024) {
              // 5MB limit
              this.logger.warn(`Skipping oversized file: ${file}`);
              continue;
            }

            const content = await this.readFileAsync(filePath, 'utf8');

            // Basic input validation
            if (content.length === 0 || content.length > 10 * 1024 * 1024) {
              // 10MB limit
              this.logger.warn(`Skipping invalid content in file: ${file}`);
              continue;
            }

            let config: LanguageConfig;
            try {
              config = JSON.parse(content) as LanguageConfig;
            } catch (parseError) {
              this.logger.warn(`Failed to parse JSON in ${file}`, {
                error: parseError,
              });
              continue;
            }

            // Verify configuration integrity if in high security mode
            if (
              this.config.securityLevel !== 'standard' &&
              config.securityHash
            ) {
              const isValid = this.securityVerifier.verifyIntegrity(config);
              if (!isValid) {
                this.logger.warn(
                  `Integrity check failed for ${file}, possible tampering detected`
                );
                continue;
              }
            }

            // Ensure required fields exist
            if (!this.validateLanguageConfig(config)) {
              this.logger.warn(`Invalid language configuration in ${file}`);
              continue;
            }

            // Store validated config
            this.languages.set(config.code, config);
            this.logger.debug(
              `Loaded language: ${config.name} (${config.code})`
            );
          } catch (e) {
            this.logger.warn(`Failed to load language config from ${file}`, {
              error: e,
            });
          }
        }

        // Validate we have at least one language
        if (this.languages.size === 0) {
          this.logger.warn(
            'No valid language configurations found, using defaults'
          );
          this.initializeDefaults();
        }
      } else {
        this.logger.warn(
          'Language resources directory not found, using defaults'
        );
        this.initializeDefaults();
      }
    } catch (error) {
      this.logger.error('Error loading language configurations', { error });
      throw error;
    }
  }

  /**
   * Validate a language configuration has all required fields
   */
  private validateLanguageConfig(config: any): boolean {
    // Required fields check
    const requiredFields = ['code', 'locale', 'name', 'enabled'];
    for (const field of requiredFields) {
      if (config[field] === undefined) {
        return false;
      }
    }

    // Ensure proper language code format (ISO 639-1)
    if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(config.code)) {
      return false;
    }

    // Ensure proper locale format
    if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(config.locale)) {
      return false;
    }

    // Fill in defaults for optional fields if missing
    if (config.rtl === undefined) {
      config.rtl = ['ar', 'he', 'fa', 'ur'].includes(config.code);
    }

    if (!config.region) {
      config.region = {
        code: config.locale.split('-')[1] || '',
        name: '',
      };
    }

    if (!config.genderOptions) {
      config.genderOptions = [{ type: 'neutral' }];
    }

    if (!config.formatters) {
      config.formatters = {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        numberFormat: '#,##0.00',
        currencyFormat: '¤#,##0.00',
        measurementSystem: 'metric',
      };
    }

    return true;
  }

  /**
   * Load character frequency data with security checks
   */
  private async loadCharacterFrequencies(): Promise<void> {
    try {
      const freqFilePath = path.join(
        this.config.resourcesDir,
        'char_frequencies.json'
      );

      if (fs.existsSync(freqFilePath)) {
        const content = await this.readFileAsync(freqFilePath, 'utf8');

        // Basic validation
        if (content.length > 5 * 1024 * 1024) {
          // 5MB limit
          this.logger.warn(
            'Character frequency file too large, using defaults'
          );
          this.initializeDefaultFrequencies();
          return;
        }

        try {
          this.characterFrequencies = JSON.parse(
            content
          ) as CharacterFrequencyMap;
        } catch (parseError) {
          this.logger.warn(
            'Failed to parse character frequencies, using defaults',
            { error: parseError }
          );
          this.initializeDefaultFrequencies();
        }
      } else {
        // Initialize with some basic character frequency data
        this.logger.info('Character frequency file not found, using defaults');
        this.initializeDefaultFrequencies();
      }
    } catch (error) {
      this.logger.warn('Failed to load character frequencies, using defaults', {
        error,
      });
      this.initializeDefaultFrequencies();
    }
  }

  /**
   * Initialize default frequencies with more languages supported
   */
  private initializeDefaultFrequencies(): void {
    // Extended character frequency data with more languages
    this.characterFrequencies = {
      en: { e: 12.7, t: 9.1, a: 8.2, o: 7.5, i: 7.0 },
      es: { e: 13.7, a: 11.5, o: 8.7, s: 7.9, n: 7.0 },
      fr: { e: 14.7, a: 8.2, s: 7.9, i: 7.5, n: 7.1 },
      de: { e: 16.9, n: 10.0, i: 7.6, s: 7.3, r: 7.0 },
      ru: { о: 10.9, е: 8.5, а: 8.0, и: 7.4, н: 6.7 },
      zh: { 的: 4.0, 一: 1.2, 是: 1.1, 不: 0.9, 了: 0.8 },
      ja: { の: 3.5, を: 2.0, に: 1.9, は: 1.8, た: 1.5 },
      ar: { ا: 12.4, ل: 11.2, م: 7.3, و: 7.1, ي: 6.3 },
      hi: { 'ा': 10.3, '्': 7.5, र: 6.4, क: 5.2, त: 4.8 },
      pt: { a: 14.6, e: 12.6, o: 10.7, s: 7.8, r: 6.5 },
      it: { e: 11.8, a: 11.7, i: 10.1, o: 9.8, n: 6.9 },
      nl: { e: 18.9, n: 10.0, a: 7.5, t: 6.8, i: 6.5 },
      tr: { a: 12.9, e: 9.6, i: 8.3, n: 7.9, r: 7.0 },
      pl: { a: 9.9, o: 8.6, e: 8.5, i: 8.3, n: 6.2 },
      uk: { о: 9.4, а: 8.1, и: 6.3, н: 6.1, е: 5.7 },
      he: { י: 12.0, ו: 10.5, ה: 8.5, מ: 6.2, א: 5.8 },
      fa: { ا: 12.6, ی: 10.2, ن: 8.2, ر: 7.3, م: 6.4 },
      th: { า: 15.4, น: 7.2, ร: 5.7, อ: 5.2, ม: 4.1 },
      vi: { n: 12.3, i: 9.8, h: 7.5, t: 7.2, a: 6.9 },
      ko: { 이: 4.7, 는: 3.3, 다: 3.1, 에: 2.8, 하: 2.5 },
      sv: { e: 10.2, a: 9.4, n: 8.5, r: 8.4, t: 7.6 },
    };
  }

  /**
   * Initialize default languages with comprehensive metadata
   */
  private initializeDefaults(): void {
    // Add default languages with enhanced metadata
    const defaults: LanguageConfig[] = [
      {
        code: 'en',
        locale: 'en-US',
        name: 'English',
        voiceId: 'en-US-Neural2-F',
        enabled: true,
        rtl: false,
        region: {
          code: 'US',
          name: 'United States',
          countryCode: 'US',
          dialects: [
            'en-US',
            'en-GB',
            'en-AU',
            'en-CA',
            'en-NZ',
            'en-ZA',
            'en-IN',
          ],
        },
        genderOptions: [
          {
            type: 'male',
            voiceId: 'en-US-Neural2-A',
            pronouns: ['he', 'him', 'his'],
          },
          {
            type: 'female',
            voiceId: 'en-US-Neural2-F',
            pronouns: ['she', 'her', 'hers'],
          },
          {
            type: 'neutral',
            voiceId: 'en-US-Neural2-C',
            pronouns: ['they', 'them', 'theirs'],
          },
        ],
        formatters: {
          dateFormat: 'MM/DD/YYYY',
          timeFormat: 'h:mm A',
          numberFormat: '#,##0.00',
          currencyFormat: '$#,##0.00',
          measurementSystem: 'imperial',
        },
      },
      {
        code: 'es',
        locale: 'es-ES',
        name: 'Spanish',
        voiceId: 'es-ES-Neural2-A',
        enabled: true,
        rtl: false,
        region: {
          code: 'ES',
          name: 'Spain',
          countryCode: 'ES',
          dialects: ['es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-CL', 'es-PE'],
        },
        genderOptions: [
          {
            type: 'male',
            voiceId: 'es-ES-Neural2-A',
            pronouns: ['él', 'lo', 'su'],
          },
          {
            type: 'female',
            voiceId: 'es-ES-Neural2-B',
            pronouns: ['ella', 'la', 'su'],
          },
          {
            type: 'neutral',
            voiceId: 'es-ES-Neural2-C',
            pronouns: ['elle', 'le', 'su'],
          },
        ],
        formatters: {
          dateFormat: 'DD/MM/YYYY',
          timeFormat: 'HH:mm',
          numberFormat: '#.##0,00',
          currencyFormat: '#.##0,00 €',
          measurementSystem: 'metric',
        },
      },
      {
        code: 'ar',
        locale: 'ar-SA',
        name: 'Arabic',
        voiceId: 'ar-XA-Standard-A',
        enabled: true,
        rtl: true,
        region: {
          code: 'SA',
          name: 'Saudi Arabia',
          countryCode: 'SA',
          dialects: ['ar-SA', 'ar-EG', 'ar-MA', 'ar-IQ', 'ar-AE'],
        },
        genderOptions: [
          { type: 'male', voiceId: 'ar-XA-Standard-B' },
          { type: 'female', voiceId: 'ar-XA-Standard-A' },
          { type: 'neutral', voiceId: 'ar-XA-Standard-C' },
        ],
        formatters: {
          dateFormat: 'DD/MM/YYYY',
          timeFormat: 'HH:mm',
          numberFormat: '#,##0.00',
          currencyFormat: '# ,##0.00 ر.س.‏',
          measurementSystem: 'metric',
        },
      },
      // Additional languages would be added here
    ];

    // Add security hashes if using high security
    if (this.config.securityLevel !== 'standard') {
      defaults.forEach(lang => {
        lang.securityHash = this.securityVerifier.createHash(lang);
      });
    }

    // Set all defaults in the registry
    defaults.forEach(lang => {
      this.languages.set(lang.code, lang);
    });

    this.initialized = true;
  }

  /**
   * Create a new secure language configuration with hash
   */
  public createLanguageConfig(config: Partial<LanguageConfig>): LanguageConfig {
    // Ensure required fields exist
    if (!config.code || !config.locale || !config.name) {
      throw new Error('Required language configuration fields missing');
    }

    // Fill in defaults
    const fullConfig: LanguageConfig = {
      code: config.code,
      locale: config.locale,
      name: config.name,
      voiceId: config.voiceId,
      enabled: config.enabled !== undefined ? config.enabled : true,
      rtl: config.rtl !== undefined ? config.rtl : false,
      region: config.region || {
        code: config.locale.split('-')[1] || '',
        name: '',
      },
      genderOptions: config.genderOptions || [{ type: 'neutral' }],
      formatters: config.formatters || {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        numberFormat: '#,##0.00',
        currencyFormat: '¤#,##0.00',
        measurementSystem: 'metric',
      },
      lastUpdated: new Date(),
    };

    // Add security hash if using higher security levels
    if (this.config.securityLevel !== 'standard') {
      fullConfig.securityHash = this.securityVerifier.createHash(fullConfig);
    }

    return fullConfig;
  }

  /**
   * Get all available languages
   */
  public getAllLanguages(): LanguageConfig[] {
    return Array.from(this.languages.values());
  }

  /**
   * Get enabled languages only
   */
  public getEnabledLanguages(): LanguageConfig[] {
    return Array.from(this.languages.values()).filter(lang => lang.enabled);
  }

  /**
   * Get language by code with security verification
   */
  public getLanguage(code: string): LanguageConfig | undefined {
    const language = this.languages.get(code);

    if (
      language &&
      this.config.securityLevel !== 'standard' &&
      language.securityHash
    ) {
      // Verify integrity before returning
      const isValid = this.securityVerifier.verifyIntegrity(language);
      if (!isValid) {
        this.logger.warn(
          `Integrity check failed for language ${code}, possible tampering detected`
        );
        return undefined;
      }
    }

    return language;
  }

  /**
   * Get language by locale with security verification
   */
  public getLanguageByLocale(locale: string): LanguageConfig | undefined {
    const language = Array.from(this.languages.values()).find(
      lang => lang.locale === locale
    );

    if (
      language &&
      this.config.securityLevel !== 'standard' &&
      language.securityHash
    ) {
      // Verify integrity before returning
      const isValid = this.securityVerifier.verifyIntegrity(language);
      if (!isValid) {
        this.logger.warn(
          `Integrity check failed for locale ${locale}, possible tampering detected`
        );
        return undefined;
      }
    }

    return language;
  }

  /**
   * Get language by regional preferences
   */
  public getLanguageByRegion(
    languageCode: string,
    regionCode: string
  ): LanguageConfig | undefined {
    // Find all matching language variants
    const matchingLanguages = Array.from(this.languages.values()).filter(
      lang =>
        lang.code === languageCode &&
        lang.region &&
        (lang.region.code === regionCode ||
          lang.region.countryCode === regionCode)
    );

    if (matchingLanguages.length === 0) {
      // Fallback to base language if no regional match
      return this.getLanguage(languageCode);
    }

    // Return first match with security check
    const language = matchingLanguages[0];

    if (this.config.securityLevel !== 'standard' && language.securityHash) {
      // Verify integrity
      const isValid = this.securityVerifier.verifyIntegrity(language);
      if (!isValid) {
        this.logger.warn(
          `Integrity check failed for language/region ${languageCode}/${regionCode}`
        );
        return undefined;
      }
    }

    return language;
  }

  /**
   * Get character frequency map for a specific language
   */
  public getCharacterFrequency(
    langCode: string
  ): { [char: string]: number } | undefined {
    return this.characterFrequencies[langCode];
  }

  /**
   * Get all character frequency maps
   */
  public getAllCharacterFrequencies(): CharacterFrequencyMap {
    return this.characterFrequencies;
  }
}

/**
 * Enhanced Language Detector with performance optimization and security
 */
export class LanguageDetector {
  private static instance: LanguageDetector;
  private registry: LanguageRegistry;
  private initialized: boolean = false;
  private config: LanguageSystemConfig;
  private logger: Logger;
  private cache: DetectionCache;
  private performanceMetrics: {
    totalDetections: number;
    totalTimeMs: number;
    avgDetectionTimeMs: number;
    cacheHits: number;
    cacheMisses: number;
  };

  // External language detection libraries can be initialized here
  private externalDetectors: any[] = [];

  private constructor(config: LanguageSystemConfig) {
    this.config = config;
    this.registry = LanguageRegistry.getInstance(config);
    this.logger = createLogger('LanguageDetector', config.logLevel);
    this.cache = new DetectionCache(config.cacheEnabled, config.cacheTimeoutMs);
    this.performanceMetrics = {
      totalDetections: 0,
      totalTimeMs: 0,
      avgDetectionTimeMs: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  public static getInstance(config: LanguageSystemConfig): LanguageDetector {
    if (!LanguageDetector.instance) {
      LanguageDetector.instance = new LanguageDetector(config);
    } else {
      // Update config if provided and different
      const currentInstance = LanguageDetector.instance;
      if (
        config &&
        JSON.stringify(currentInstance.config) !== JSON.stringify(config)
      ) {
        currentInstance.config = config;
        currentInstance.registry = LanguageRegistry.getInstance(config);
        currentInstance.logger = createLogger(
          'LanguageDetector',
          config.logLevel
        );
        currentInstance.cache = new DetectionCache(
          config.cacheEnabled,
          config.cacheTimeoutMs
        );
      }
    }
    return LanguageDetector.instance;
  }

  /**
   * Initialize the language detector with enhanced security and performance
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger.info('Initializing language detector');

    // Initialize the language registry
    await this.registry.initialize();

    // Initialize external libraries if available
    try {
      this.initializeExternalDetectors();
    } catch (error) {
      this.logger.warn('Failed to initialize external language detectors', {
        error,
      });
    }
    if (this.externalDetectors.length > 0) {
      this.logger.info(
        `Initialized ${this.externalDetectors.length} external language detectors`
      );
    }

    this.initialized = true;
    this.logger.info('Language detector initialized successfully');
  }

  /**
   * Initialize external language detection libraries with security checks
   */
  private initializeExternalDetectors(): void {
    // Track loaded detectors
    const loadedDetectors: string[] = [];

    try {
      // Check if franc is available
      const franc = require('franc');
      if (franc) {
        this.externalDetectors.push({
          name: 'franc',
          detect: (text: string) => {
            try {
              return franc(text);
            } catch (e) {
              this.logger.debug('Franc detection failed', { error: e });
              return null;
            }
          },
        });
        loadedDetectors.push('franc');
      }
    } catch (e) {
      // Franc not available, continue without it
      this.logger.debug('Franc library not available');
    }

    try {
      // Check if langdetect is available
      const LanguageDetect = require('languagedetect');
      if (LanguageDetect) {
        const detector = new LanguageDetect();
        this.externalDetectors.push({
          name: 'languagedetect',
          detect: (text: string) => {
            try {
              const results = detector.detect(text, 1);
              return results.length > 0 ? results[0][0] : null;
            } catch (e) {
              this.logger.debug('LanguageDetect detection failed', {
                error: e,
              });
              return null;
            }
          },
        });
        loadedDetectors.push('languagedetect');
      }
    } catch (e) {
      // LanguageDetect not available, continue without it
      this.logger.debug('LanguageDetect library not available');
    }

    try {
      // Add CLD (Compact Language Detector) if available
      const cld = require('cld');
      if (cld) {
        this.externalDetectors.push({
          name: 'cld',
          detect: async (text: string) => {
            try {
              const result = await cld.detect(text);
              return result.languages.length > 0
                ? result.languages[0].code
                : null;
            } catch (e) {
              this.logger.debug('CLD detection failed', { error: e });
              return null;
            }
          },
        });
        loadedDetectors.push('cld');
      }
    } catch (e) {
      // CLD not available, continue without it
      this.logger.debug('CLD library not available');
    }

    this.logger.info(
      `Loaded external language detectors: ${loadedDetectors.join(', ') || 'none'}`
    );
  }

  /**
   * Get performance metrics for monitoring
   */
  public getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Reset performance metrics
   */
  public resetPerformanceMetrics() {
    this.performanceMetrics = {
      totalDetections: 0,
      totalTimeMs: 0,
      avgDetectionTimeMs: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(timeMs: number, cacheHit: boolean) {
    this.performanceMetrics.totalDetections++;
    this.performanceMetrics.totalTimeMs += timeMs;
    this.performanceMetrics.avgDetectionTimeMs =
      this.performanceMetrics.totalTimeMs /
      this.performanceMetrics.totalDetections;

    if (cacheHit) {
      this.performanceMetrics.cacheHits++;
    } else {
      this.performanceMetrics.cacheMisses++;
    }
  }

  /**
   * Detect the language of a text with enhanced security, caching and metrics
   */
  public async detect(
    text: string,
    userPreferences?: {
      preferredLanguage?: string;
      preferredRegion?: string;
      preferredGender?: 'male' | 'female' | 'neutral';
    }
  ): Promise<DetectionResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    // Input validation
    if (!text || typeof text !== 'string') {
      this.logger.warn('Invalid input provided to language detector');
      text = '';
    }

    // Strip text to reasonable length to prevent DOS
    const processedText = text.slice(0, 10000).trim();

    if (processedText.length === 0) {
      // Return default or preferred language for empty text
      const defaultLang = userPreferences?.preferredLanguage
        ? this.registry.getLanguage(userPreferences.preferredLanguage)
        : this.registry.getLanguage(this.config.fallbackLanguage) ||
          this.registry.getLanguage('en');

      if (!defaultLang) {
        throw new Error('No default language available');
      }

      const result = {
        languageCode: defaultLang.code,
        locale: defaultLang.locale,
        confidence: 1.0,
        name: defaultLang.name,
        rtl: defaultLang.rtl,
        region: defaultLang.region,
        detectionMethod: 'default',
        processingTimeMs: Date.now() - startTime,
        alternativeLanguages: [],
      };

      this.updateMetrics(result.processingTimeMs, false);
      return result;
    }

    // Check cache first
    const cachedResult = this.cache.get(processedText);
    if (cachedResult) {
      this.updateMetrics(Date.now() - startTime, true);
      this.logger.debug('Language detection cache hit', {
        langCode: cachedResult.languageCode,
      });

      // Apply user preferences to cached result if needed
      return this.applyUserPreferences(cachedResult, userPreferences);
    }

    // 1. Try external detectors first (they're usually more accurate)
    let result = await this.detectWithExternalLibraries(processedText);
    let method = 'external';

    // 2. Use fallback if external detection failed or has low confidence
    if (!result || result.confidence < this.config.detectionThreshold) {
      const fallbackResult = this.detectWithFallback(processedText);

      if (!result || fallbackResult.confidence > result.confidence) {
        result = fallbackResult;
        method = 'fallback';
      }
    }

    // 3. If still no result or very low confidence, use default language
    if (!result || result.confidence < 0.2) {
      const defaultLang =
        this.registry.getLanguage(this.config.fallbackLanguage) ||
        this.registry.getLanguage('en');

      if (defaultLang) {
        result = {
          languageCode: defaultLang.code,
          locale: defaultLang.locale,
          confidence: 0.3,
          name: defaultLang.name,
          rtl: defaultLang.rtl,
          region: defaultLang.region,
          detectionMethod: 'default',
          processingTimeMs: Date.now() - startTime,
          alternativeLanguages: [],
        };
        method = 'default';
      } else {
        throw new Error('No default language available');
      }
    }

    // Set performance metrics
    result.processingTimeMs = Date.now() - startTime;
    result.detectionMethod = method;

    // Update cache
    this.cache.set(processedText, result);

    // Update metrics
    this.updateMetrics(result.processingTimeMs, false);

    // Apply user preferences
    return this.applyUserPreferences(result, userPreferences);
  }

  /**
   * Apply user preferences to detection result
   */
  private applyUserPreferences(
    result: DetectionResult,
    userPreferences?: {
      preferredLanguage?: string;
      preferredRegion?: string;
      preferredGender?: 'male' | 'female' | 'neutral';
    }
  ): DetectionResult {
    if (!userPreferences) return result;

    const detectedLang = this.registry.getLanguage(result.languageCode);
    if (!detectedLang) return result;

    // If user prefers a different language and confidence is low, switch to preferred
    if (
      userPreferences.preferredLanguage &&
      userPreferences.preferredLanguage !== result.languageCode &&
      result.confidence < 0.7
    ) {
      const preferredLang = this.registry.getLanguage(
        userPreferences.preferredLanguage
      );
      if (preferredLang) {
        // Create a new result with the preferred language
        const newResult: DetectionResult = {
          ...result,
          languageCode: preferredLang.code,
          locale: preferredLang.locale,
          name: preferredLang.name,
          rtl: preferredLang.rtl,
          region: preferredLang.region,
          detectionMethod: `${result.detectionMethod}+preference`,
          // Add the original as an alternative
          alternativeLanguages: [
            { code: result.languageCode, confidence: result.confidence },
            ...(result.alternativeLanguages || []),
          ],
        };
        return newResult;
      }
    }

    // If user prefers a specific region, adjust locale
    if (userPreferences.preferredRegion && detectedLang) {
      const regionalLang = this.registry.getLanguageByRegion(
        detectedLang.code,
        userPreferences.preferredRegion
      );

      if (regionalLang) {
        result.locale = regionalLang.locale;
        result.region = regionalLang.region;
      }
    }

    return result;
  }

  /**
   * Detect language using external libraries with enhanced security
   */
  private async detectWithExternalLibraries(
    text: string
  ): Promise<DetectionResult | null> {
    if (this.externalDetectors.length === 0) {
      return null;
    }

    const votes: Map<string, number> = new Map();
    let totalVotes = 0;
    const startTime = Date.now();

    // Apply a simple security check for very long inputs
    const safeText = text.length > 10000 ? text.substring(0, 10000) : text;

    // Collect votes from all detectors with timeout protection
    const results = await Promise.all(
      this.externalDetectors.map(async detector => {
        try {
          // Add timeout protection
          const result = await Promise.race([
            detector.detect(safeText),
            new Promise<null>(resolve => setTimeout(() => resolve(null), 1000)), // 1-second timeout
          ]);

          return { detector: detector.name, result };
        } catch (error) {
          this.logger.debug(`Detector ${detector.name} failed`, { error });
          return { detector: detector.name, result: null };
        }
      })
    );

    // Process results
    for (const { detector, result } of results) {
      if (result) {
        this.logger.debug(`Detector ${detector} detected: ${result}`);
        const currentVotes = votes.get(result) || 0;
        votes.set(result, currentVotes + 1);
        totalVotes++;
      }
    }

    if (totalVotes === 0) return null;

    // Find the language with the most votes
    let bestLang = '';
    let bestVotes = 0;
    // Also track alternatives
    const alternatives: Array<{ code: string; confidence: number }> = [];

    votes.forEach((voteCount, lang) => {
      const confidence = voteCount / totalVotes;

      if (voteCount > bestVotes) {
        // If we already had a best, add it to alternatives
        if (bestLang) {
          alternatives.push({
            code: bestLang,
            confidence: bestVotes / totalVotes,
          });
        }

        bestLang = lang;
        bestVotes = voteCount;
      } else {
        // Add as alternative
        alternatives.push({
          code: lang,
          confidence,
        });
      }
    });

    if (bestLang) {
      const langConfig = this.registry.getLanguage(bestLang);
      if (langConfig) {
        return {
          languageCode: bestLang,
          locale: langConfig.locale,
          confidence: bestVotes / totalVotes,
          name: langConfig.name,
          rtl: langConfig.rtl,
          region: langConfig.region,
          detectionMethod: 'external',
          processingTimeMs: Date.now() - startTime,
          alternativeLanguages: alternatives,
        };
      }
    }

    return null;
  }

  /**
   * Detect language using fallback method (character frequency analysis)
   * with enhanced algorithm
   */
  private detectWithFallback(text: string): DetectionResult {
    const startTime = Date.now();
    const freqMaps = this.registry.getAllCharacterFrequencies();
    const enabledLanguages = this.registry.getEnabledLanguages();

    // Only use enabled languages that have frequency data
    const candidateLanguages = enabledLanguages.filter(
      lang => freqMaps[lang.code] !== undefined
    );

    if (candidateLanguages.length === 0) {
      // No candidate languages with frequency data, return default
      const defaultLang =
        this.registry.getLanguage(this.config.fallbackLanguage) ||
        this.registry.getLanguage('en');

      if (!defaultLang) {
        throw new Error('No default language available');
      }

      return {
        languageCode: defaultLang.code,
        locale: defaultLang.locale,
        confidence: 0.3,
        name: defaultLang.name,
        rtl: defaultLang.rtl,
        region: defaultLang.region,
        detectionMethod: 'default',
        processingTimeMs: Date.now() - startTime,
        alternativeLanguages: [],
      };
    }

    // Create character frequency map for the input text
    const textLength = text.length;
    const cleanText = text.toLowerCase(); // Normalize to lowercase for better matching

    const charFreqMap: { [char: string]: number } = {};
    let totalChars = 0;

    // Count character frequencies in the text
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];

      // Skip non-alphabetic characters, spaces, numbers, etc.
      if (!/\p{L}/u.test(char)) {
        continue;
      }

      charFreqMap[char] = (charFreqMap[char] || 0) + 1;
      totalChars++;
    }

    // Convert counts to percentages
    if (totalChars > 0) {
      Object.keys(charFreqMap).forEach(char => {
        charFreqMap[char] = (charFreqMap[char] / totalChars) * 100;
      });
    }

    // Compare with language frequency maps to find the best match
    const scores: { lang: string; score: number }[] = [];

    for (const lang of candidateLanguages) {
      const langFreq = freqMaps[lang.code];
      if (!langFreq) continue;

      // Calculate distance score (lower is better)
      let distance = 0;
      let matchedChars = 0;

      // For each character in the text, calculate the distance from expected frequency
      Object.keys(charFreqMap).forEach(char => {
        if (langFreq[char] !== undefined) {
          distance += Math.abs(charFreqMap[char] - langFreq[char]);
          matchedChars++;
        } else {
          // Penalty for characters not in the language
          distance += charFreqMap[char];
        }
      });

      // Normalize by the number of matched characters
      if (matchedChars > 0) {
        distance /= matchedChars;
      } else {
        distance = 100; // Maximum distance
      }

      // Convert distance to similarity score (higher is better)
      const score = Math.max(0, 1 - distance / 100);

      scores.push({
        lang: lang.code,
        score,
      });
    }

    // Sort scores (highest first)
    scores.sort((a, b) => b.score - a.score);

    // Get the best match
    if (scores.length > 0 && scores[0].score > 0) {
      const bestMatch = scores[0];
      const langConfig = this.registry.getLanguage(bestMatch.lang);

      if (langConfig) {
        // Create alternatives list from other scores
        const alternatives = scores
          .slice(1, 3) // Take the next 2 highest scores
          .map(s => ({
            code: s.lang,
            confidence: s.score,
          }));

        return {
          languageCode: bestMatch.lang,
          locale: langConfig.locale,
          confidence: bestMatch.score,
          name: langConfig.name,
          rtl: langConfig.rtl,
          region: langConfig.region,
          detectionMethod: 'fallback',
          processingTimeMs: Date.now() - startTime,
          alternativeLanguages: alternatives,
        };
      }
    }

    // Fallback to default if no good match found
    const defaultLang =
      this.registry.getLanguage(this.config.fallbackLanguage) ||
      this.registry.getLanguage('en');

    if (!defaultLang) {
      throw new Error('No default language available');
    }

    return {
      languageCode: defaultLang.code,
      locale: defaultLang.locale,
      confidence: 0.2,
      name: defaultLang.name,
      rtl: defaultLang.rtl,
      region: defaultLang.region,
      detectionMethod: 'default',
      processingTimeMs: Date.now() - startTime,
      alternativeLanguages: [],
    };
  }
}

/**
 * Unified language service for enterprise applications
 */
export class LanguageService {
  private registry: LanguageRegistry;
  private detector: LanguageDetector;
  private config: LanguageSystemConfig;
  private logger: Logger;

  constructor(config?: Partial<LanguageSystemConfig>) {
    // Default configuration with security settings
    this.config = {
      resourcesDir:
        process.env.LANGUAGE_RESOURCES_DIR || './resources/languages',
      cacheEnabled: true,
      cacheTimeoutMs: 3600000, // 1 hour
      securityLevel: (process.env.LANGUAGE_SECURITY_LEVEL as any) || 'standard',
      fallbackLanguage: 'en',
      detectionThreshold: 0.6,
      logLevel: (process.env.LANGUAGE_LOG_LEVEL as any) || 'info',
      ...config,
    };

    this.logger = createLogger('LanguageService', this.config.logLevel);
    this.registry = LanguageRegistry.getInstance(this.config);
    this.detector = LanguageDetector.getInstance(this.config);
  }

  /**
   * Initialize the language service
   */
  public async initialize(): Promise<void> {
    await this.registry.initialize();
    await this.detector.initialize();
    this.logger.info('Language service initialized successfully');
  }

  /**
   * Get language registry
   */
  public getRegistry(): LanguageRegistry {
    return this.registry;
  }

  /**
   * Get language detector
   */
  public getDetector(): LanguageDetector {
    return this.detector;
  }

  /**
   * Detect language with user preferences
   */
  public async detectLanguage(
    text: string,
    userPreferences?: {
      preferredLanguage?: string;
      preferredRegion?: string;
      preferredGender?: 'male' | 'female' | 'neutral';
    }
  ): Promise<DetectionResult> {
    return this.detector.detect(text, userPreferences);
  }

  /**
   * Get language configuration by code
   */
  public getLanguage(code: string): LanguageConfig | undefined {
    return this.registry.getLanguage(code);
  }

  /**
   * Get language voice options for personalization
   */
  public getVoiceOptions(
    langCode: string,
    gender?: 'male' | 'female' | 'neutral'
  ): { voiceId: string; gender: string }[] {
    const lang = this.registry.getLanguage(langCode);
    if (!lang) return [];

    if (gender) {
      // Return voices for specific gender
      const genderOption = lang.genderOptions.find(g => g.type === gender);
      if (genderOption && genderOption.voiceId) {
        return [
          {
            voiceId: genderOption.voiceId,
            gender: genderOption.type,
          },
        ];
      }
    }

    // Return all available voices
    return lang.genderOptions
      .filter(g => g.voiceId)
      .map(g => ({
        voiceId: g.voiceId!,
        gender: g.type,
      }));
  }

  /**
   * Format a date string according to the locale
   */
  public formatDate(
    date: Date,
    langCode: string,
    options?: Intl.DateTimeFormatOptions
  ): string {
    const lang = this.registry.getLanguage(langCode);
    const locale = lang?.locale || 'en-US';

    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  /**
   * Format a number according to the locale
   */
  public formatNumber(
    num: number,
    langCode: string,
    options?: Intl.NumberFormatOptions
  ): string {
    const lang = this.registry.getLanguage(langCode);
    const locale = lang?.locale || 'en-US';

    return new Intl.NumberFormat(locale, options).format(num);
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics() {
    return this.detector.getPerformanceMetrics();
  }

  /**
   * Get security status
   */
  public getSecurityStatus() {
    return {
      securityLevel: this.config.securityLevel,
      resourcesDir: this.config.resourcesDir,
      cacheEnabled: this.config.cacheEnabled,
    };
  }
}

// Export factory function for DI systems
export function createLanguageService(
  config?: Partial<LanguageSystemConfig>
): LanguageService {
  return new LanguageService(config);
}
