/**
 * Web Crawler Connector
 * Integrates existing web crawler infrastructure with ASOOS Flyer
 * Provides comprehensive web intelligence and analysis
 */

const axios = require('axios');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { URL } = require('url');

class WebCrawlerConnector {
    constructor() {
        this.crawlerEndpoint = process.env.WEB_CRAWLER_ENDPOINT || 'http://localhost:8080/api';
        this.browser = null;
        this.rateLimiter = new Map();
        
        // Web crawler configurations
        this.config = {
            maxConcurrent: 5,
            requestDelay: 1000,
            timeout: 30000,
            retries: 3,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };
        
        // Rate limiting per domain
        this.rateLimits = {
            requestsPerSecond: 2,
            maxConcurrentPerDomain: 3,
            domainDelays: new Map()
        };
        
        console.log('🕸️ Web Crawler Connector initialized');
    }

    /**
     * Initialize the web crawler connector
     */
    async initialize() {
        try {
            console.log('🔧 Initializing web crawler infrastructure...');
            
            // Initialize browser instance for complex crawling with Cloud Run compatibility
            const launchOptions = {
                headless: 'new',
                timeout: 60000, // Increase timeout for Cloud Run
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-default-apps',
                    '--disable-background-networking',
                    '--disable-sync',
                    '--metrics-recording-only',
                    '--no-first-run',
                    '--safebrowsing-disable-auto-update',
                    '--disable-ipc-flooding-protection',
                    '--memory-pressure-off',
                    '--max_old_space_size=4096'
                ]
            };
            
            // Try to launch browser with timeout handling
            try {
                this.browser = await Promise.race([
                    puppeteer.launch(launchOptions),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Puppeteer launch timeout')), 45000)
                    )
                ]);
            } catch (error) {
                console.warn('⚠️ Puppeteer failed to initialize, using HTTP-only mode:', error.message);
                this.browser = null; // Set to null to trigger HTTP-only fallback
                return true; // Still return success to allow HTTP-only operations
            }
            
            console.log('✅ Web crawler browser initialized');
            
            // Test existing crawler endpoint if available
            await this.testExistingCrawler();
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize web crawler connector:', error);
            throw error;
        }
    }

    /**
     * Test connection to existing web crawler service
     */
    async testExistingCrawler() {
        try {
            console.log('🧪 Testing existing web crawler endpoint...');
            
            const response = await axios.get(`${this.crawlerEndpoint}/health`, {
                timeout: 5000
            });
            
            if (response.status === 200) {
                console.log('✅ Existing web crawler service is available');
                return true;
            }
            
        } catch (error) {
            console.log('⚠️ Existing web crawler service not available, using fallback methods');
            return false;
        }
    }

    /**
     * Process organizations for comprehensive web intelligence
     * @param {Array} organizations - List of organizations to process
     * @returns {Object} Web intelligence results
     */
    async processOrganizations(organizations) {
        console.log(`🕸️ Web crawler processing ${organizations.length} organizations...`);
        
        if (!this.browser) {
            await this.initialize();
        }
        
        const results = [];
        const batchSize = 5; // Process in smaller batches for web crawling
        
        try {
            for (let i = 0; i < organizations.length; i += batchSize) {
                const batch = organizations.slice(i, i + batchSize);
                
                console.log(`🌐 Processing web batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(organizations.length/batchSize)}`);
                
                const batchResults = await Promise.allSettled(
                    batch.map(org => this.getOrganizationWebIntelligence(org))
                );
                
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        console.error(`❌ Failed to process ${batch[index].name}:`, result.reason.message);
                        results.push({
                            name: batch[index].name,
                            error: result.reason.message,
                            source: 'web_crawler'
                        });
                    }
                });
                
                // Rate limiting between batches
                if (i + batchSize < organizations.length) {
                    console.log('⏳ Rate limiting: waiting 3 seconds...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            
            console.log(`✅ Web crawler completed processing: ${results.filter(r => !r.error).length}/${organizations.length} successful`);
            
            return {
                source: 'web_crawler',
                status: 'completed',
                data: results,
                summary: {
                    total: organizations.length,
                    successful: results.filter(r => !r.error).length,
                    failed: results.filter(r => r.error).length,
                    avgProcessingTime: this.calculateAverageProcessingTime(results)
                }
            };
            
        } catch (error) {
            console.error('❌ Web crawler batch processing failed:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive web intelligence for an organization
     * @param {Object} organization - Organization object with name, domain, etc.
     * @returns {Object} Web intelligence data
     */
    async getOrganizationWebIntelligence(organization) {
        const startTime = Date.now();
        
        try {
            console.log(`🌐 Analyzing web presence for ${organization.name}...`);
            
            // Determine primary website URL
            const websiteUrl = await this.determineWebsiteUrl(organization);
            
            if (!websiteUrl) {
                return {
                    ...organization,
                    source: 'web_crawler',
                    status: 'no_website_found',
                    scrapedAt: new Date().toISOString(),
                    processingTime: Date.now() - startTime
                };
            }
            
            // Analyze website using existing crawler or fallback
            const websiteData = await this.analyzeWebsite(websiteUrl, organization);
            
            // Get additional web intelligence
            const socialMedia = await this.getSocialMediaPresence(organization, websiteUrl);
            const technicalInfo = await this.getTechnicalAnalysis(websiteUrl);
            const seoAnalysis = await this.getSEOAnalysis(websiteUrl);
            const competitiveIntel = await this.getCompetitiveIntelligence(organization, websiteUrl);
            
            const processingTime = Date.now() - startTime;
            
            return {
                ...organization,
                website: {
                    url: websiteUrl,
                    ...websiteData
                },
                socialMedia,
                technical: technicalInfo,
                seo: seoAnalysis,
                competitive: competitiveIntel,
                source: 'web_crawler',
                scrapedAt: new Date().toISOString(),
                processingTime,
                dataQuality: this.calculateWebDataQuality(websiteData, socialMedia, technicalInfo, seoAnalysis)
            };
            
        } catch (error) {
            console.error(`❌ Error analyzing web presence for ${organization.name}:`, error);
            throw error;
        }
    }

    /**
     * Determine the primary website URL for an organization
     */
    async determineWebsiteUrl(organization) {
        // Try organization.website first
        if (organization.website) {
            return this.normalizeUrl(organization.website);
        }
        
        // Try organization.domain
        if (organization.domain) {
            return this.normalizeUrl(organization.domain);
        }
        
        // Generate likely URLs from company name
        const possibleUrls = this.generatePossibleUrls(organization.name);
        
        for (const url of possibleUrls) {
            try {
                const response = await axios.head(url, { timeout: 5000 });
                if (response.status === 200) {
                    return url;
                }
            } catch (error) {
                // Continue to next URL
            }
        }
        
        return null;
    }

    /**
     * Analyze website using existing crawler or fallback methods
     */
    async analyzeWebsite(websiteUrl, organization) {
        try {
            // Try existing web crawler service first
            const existingCrawlerResult = await this.useExistingCrawler(websiteUrl, organization);
            if (existingCrawlerResult) {
                return existingCrawlerResult;
            }
            
            // Fallback to direct crawling
            return await this.crawlWebsiteDirectly(websiteUrl);
            
        } catch (error) {
            console.log(`⚠️ Website analysis failed for ${websiteUrl}, using basic fetch`);
            return await this.basicWebsiteAnalysis(websiteUrl);
        }
    }

    /**
     * Use existing web crawler service
     */
    async useExistingCrawler(websiteUrl, organization) {
        try {
            console.log(`🔗 Using existing crawler for ${websiteUrl}`);
            
            const response = await axios.post(`${this.crawlerEndpoint}/crawl`, {
                url: websiteUrl,
                organization: organization.name,
                depth: 2,
                extractors: [
                    'company_info',
                    'products_services', 
                    'team_info',
                    'contact_info',
                    'technology_stack',
                    'news_updates'
                ]
            }, {
                timeout: 60000
            });
            
            if (response.data && response.data.success) {
                console.log(`✅ Existing crawler successful for ${websiteUrl}`);
                return this.formatExistingCrawlerData(response.data);
            }
            
            return null;
            
        } catch (error) {
            console.log(`⚠️ Existing crawler failed for ${websiteUrl}: ${error.message}`);
            return null;
        }
    }

    /**
     * Direct website crawling using Puppeteer
     */
    async crawlWebsiteDirectly(websiteUrl) {
        console.log(`🤖 Direct crawling ${websiteUrl}`);
        
        const page = await this.browser.newPage();
        
        try {
            await page.setUserAgent(this.config.userAgent);
            await page.setViewport({ width: 1920, height: 1080 });
            
            // Enable request interception for performance
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });
            
            await page.goto(websiteUrl, { 
                waitUntil: 'networkidle0', 
                timeout: this.config.timeout 
            });
            
            // Extract comprehensive data
            const pageData = await page.evaluate(() => {
                return {
                    title: document.title,
                    description: document.querySelector('meta[name="description"]')?.content || '',
                    keywords: document.querySelector('meta[name="keywords"]')?.content || '',
                    headings: {
                        h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
                        h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()).slice(0, 10),
                        h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim()).slice(0, 10)
                    },
                    links: {
                        internal: Array.from(document.querySelectorAll('a[href^="/"], a[href*="' + window.location.hostname + '"]'))
                                      .map(a => ({ text: a.textContent.trim(), href: a.href }))
                                      .slice(0, 20),
                        external: Array.from(document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])'))
                                      .map(a => ({ text: a.textContent.trim(), href: a.href }))
                                      .slice(0, 10)
                    },
                    images: Array.from(document.querySelectorAll('img')).map(img => ({
                        src: img.src,
                        alt: img.alt
                    })).slice(0, 10),
                    scripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src).slice(0, 10),
                    bodyText: document.body.textContent.substring(0, 5000)
                };
            });
            
            // Analyze content for company information
            const companyInfo = this.extractCompanyInfo(pageData);
            const techStack = this.analyzeTechStack(pageData);
            
            return {
                ...pageData,
                companyInfo,
                techStack,
                crawlMethod: 'puppeteer_direct'
            };
            
        } finally {
            await page.close();
        }
    }

    /**
     * Basic website analysis using axios and cheerio
     */
    async basicWebsiteAnalysis(websiteUrl) {
        try {
            console.log(`📄 Basic analysis for ${websiteUrl}`);
            
            const response = await axios.get(websiteUrl, {
                timeout: this.config.timeout,
                headers: {
                    'User-Agent': this.config.userAgent
                }
            });
            
            const $ = cheerio.load(response.data);
            
            return {
                title: $('title').text().trim(),
                description: $('meta[name="description"]').attr('content') || '',
                keywords: $('meta[name="keywords"]').attr('content') || '',
                headings: {
                    h1: $('h1').map((i, el) => $(el).text().trim()).get(),
                    h2: $('h2').map((i, el) => $(el).text().trim()).get().slice(0, 10),
                    h3: $('h3').map((i, el) => $(el).text().trim()).get().slice(0, 10)
                },
                links: {
                    internal: $('a[href^="/"]').map((i, el) => ({
                        text: $(el).text().trim(),
                        href: $(el).attr('href')
                    })).get().slice(0, 20),
                    external: $('a[href^="http"]').map((i, el) => ({
                        text: $(el).text().trim(), 
                        href: $(el).attr('href')
                    })).get().slice(0, 10)
                },
                bodyText: $('body').text().substring(0, 5000),
                companyInfo: this.extractCompanyInfoFromText($('body').text()),
                crawlMethod: 'cheerio_basic'
            };
            
        } catch (error) {
            throw new Error(`Basic website analysis failed: ${error.message}`);
        }
    }

    /**
     * Get social media presence
     */
    async getSocialMediaPresence(organization, websiteUrl) {
        try {
            const socialPlatforms = {
                linkedin: [`linkedin.com/company/${this.slugify(organization.name)}`],
                twitter: [`twitter.com/${this.slugify(organization.name)}`, `x.com/${this.slugify(organization.name)}`],
                facebook: [`facebook.com/${this.slugify(organization.name)}`],
                instagram: [`instagram.com/${this.slugify(organization.name)}`],
                youtube: [`youtube.com/c/${this.slugify(organization.name)}`, `youtube.com/@${this.slugify(organization.name)}`]
            };
            
            const foundProfiles = {};
            
            // Check each platform
            for (const [platform, possibleUrls] of Object.entries(socialPlatforms)) {
                for (const urlPath of possibleUrls) {
                    const fullUrl = `https://${urlPath}`;
                    try {
                        const response = await axios.head(fullUrl, { 
                            timeout: 5000,
                            maxRedirects: 5
                        });
                        
                        if (response.status === 200) {
                            foundProfiles[platform] = fullUrl;
                            break; // Found one for this platform
                        }
                    } catch (error) {
                        // Continue checking
                    }
                }
                
                // Rate limiting between platform checks
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            return {
                platforms: foundProfiles,
                profileCount: Object.keys(foundProfiles).length,
                strongPresence: Object.keys(foundProfiles).length >= 3
            };
            
        } catch (error) {
            return {
                platforms: {},
                profileCount: 0,
                error: error.message
            };
        }
    }

    /**
     * Get technical analysis of the website
     */
    async getTechnicalAnalysis(websiteUrl) {
        try {
            // If browser is not available, use HTTP-only fallback
            if (!this.browser) {
                return await this.getTechnicalAnalysisHttpOnly(websiteUrl);
            }
            
            const page = await this.browser.newPage();
            
            try {
                await page.goto(websiteUrl, { waitUntil: 'networkidle0' });
                
                const techInfo = await page.evaluate(() => {
                    const technologies = {
                        frameworks: [],
                        analytics: [],
                        advertising: [],
                        hosting: []
                    };
                    
                    // Check for common JavaScript frameworks/libraries
                    if (window.React) technologies.frameworks.push('React');
                    if (window.Vue) technologies.frameworks.push('Vue');
                    if (window.angular) technologies.frameworks.push('Angular');
                    if (window.jQuery) technologies.frameworks.push('jQuery');
                    
                    // Check for analytics tools
                    if (window.gtag || window.ga) technologies.analytics.push('Google Analytics');
                    if (window.fbq) technologies.advertising.push('Facebook Pixel');
                    
                    // Check meta tags and scripts for more tech indicators
                    const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
                    const links = Array.from(document.querySelectorAll('link[href]')).map(l => l.href);
                    
                    // Analyze script sources
                    scripts.forEach(src => {
                        if (src.includes('googletagmanager')) technologies.analytics.push('Google Tag Manager');
                        if (src.includes('hotjar')) technologies.analytics.push('Hotjar');
                        if (src.includes('intercom')) technologies.frameworks.push('Intercom');
                        if (src.includes('stripe')) technologies.frameworks.push('Stripe');
                        if (src.includes('paypal')) technologies.frameworks.push('PayPal');
                    });
                    
                    return {
                        ...technologies,
                        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                        scriptsCount: scripts.length,
                        linksCount: links.length
                    };
                });
                
                // Check response headers for server information
                const response = await page.goto(websiteUrl, { waitUntil: 'networkidle0' });
                const headers = response.headers();
                
                return {
                    ...techInfo,
                    server: headers.server || 'Unknown',
                    powered_by: headers['x-powered-by'] || 'Unknown',
                    security_headers: {
                        hsts: !!headers['strict-transport-security'],
                        csp: !!headers['content-security-policy'],
                        xframe: !!headers['x-frame-options']
                    }
                };
                
            } finally {
                await page.close();
            }
            
        } catch (error) {
            return {
                error: error.message,
                available: false
            };
        }
    }

    /**
     * Get SEO analysis
     */
    async getSEOAnalysis(websiteUrl) {
        try {
            const response = await axios.get(websiteUrl, {
                timeout: this.config.timeout,
                headers: { 'User-Agent': this.config.userAgent }
            });
            
            const $ = cheerio.load(response.data);
            
            const seoData = {
                title: {
                    text: $('title').text().trim(),
                    length: $('title').text().trim().length,
                    optimal: $('title').text().trim().length >= 30 && $('title').text().trim().length <= 60
                },
                description: {
                    text: $('meta[name="description"]').attr('content') || '',
                    length: ($('meta[name="description"]').attr('content') || '').length,
                    optimal: ($('meta[name="description"]').attr('content') || '').length >= 120 && ($('meta[name="description"]').attr('content') || '').length <= 160
                },
                headings: {
                    h1_count: $('h1').length,
                    h2_count: $('h2').length,
                    h3_count: $('h3').length,
                    h1_optimal: $('h1').length === 1
                },
                images: {
                    total: $('img').length,
                    with_alt: $('img[alt]').length,
                    without_alt: $('img').length - $('img[alt]').length,
                    alt_ratio: $('img').length > 0 ? ($('img[alt]').length / $('img').length * 100).toFixed(1) : 0
                },
                links: {
                    internal: $('a[href^="/"]').length,
                    external: $('a[href^="http"]').not(`[href*="${new URL(websiteUrl).hostname}"]`).length,
                    total: $('a[href]').length
                },
                structured_data: $('script[type="application/ld+json"]').length > 0,
                canonical: $('link[rel="canonical"]').length > 0,
                robots_meta: $('meta[name="robots"]').attr('content') || 'not_specified'
            };
            
            // Calculate SEO score
            let score = 0;
            if (seoData.title.optimal) score += 20;
            if (seoData.description.optimal) score += 20;
            if (seoData.headings.h1_optimal) score += 15;
            if (seoData.images.alt_ratio > 80) score += 15;
            if (seoData.structured_data) score += 10;
            if (seoData.canonical) score += 10;
            if (seoData.robots_meta !== 'not_specified') score += 10;
            
            seoData.overall_score = score;
            seoData.grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
            
            return seoData;
            
        } catch (error) {
            return {
                error: error.message,
                available: false
            };
        }
    }

    /**
     * Get competitive intelligence
     */
    async getCompetitiveIntelligence(organization, websiteUrl) {
        try {
            // This would integrate with competitive intelligence APIs
            // For now, return placeholder competitive analysis
            
            return {
                market_position: 'analyzing...',
                key_competitors: [],
                differentiation_points: [],
                market_trends: 'data_pending',
                competitive_advantages: [],
                analysis_available: false,
                note: 'Competitive intelligence requires additional API integrations'
            };
            
        } catch (error) {
            return {
                error: error.message,
                available: false
            };
        }
    }

    // Utility methods
    normalizeUrl(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return `https://${url}`;
        }
        return url;
    }

    generatePossibleUrls(companyName) {
        const slug = this.slugify(companyName);
        return [
            `https://${slug}.com`,
            `https://www.${slug}.com`,
            `https://${slug}.net`,
            `https://${slug}.org`,
            `https://${slug}.io`
        ];
    }

    slugify(text) {
        return text.toLowerCase()
                  .replace(/[^a-z0-9\s]/g, '')
                  .replace(/\s+/g, '')
                  .substring(0, 50);
    }

    extractCompanyInfo(pageData) {
        const info = {
            products: [],
            services: [],
            team_mentions: [],
            contact_info: {}
        };
        
        const text = pageData.bodyText.toLowerCase();
        
        // Look for product/service indicators
        const productKeywords = ['product', 'solution', 'platform', 'software', 'tool'];
        const serviceKeywords = ['service', 'consulting', 'support', 'training', 'implementation'];
        
        productKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                info.products.push(keyword);
            }
        });
        
        serviceKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                info.services.push(keyword);
            }
        });
        
        return info;
    }

    extractCompanyInfoFromText(text) {
        // Basic text analysis for company information
        const lowerText = text.toLowerCase();
        
        return {
            has_about_section: lowerText.includes('about') || lowerText.includes('company'),
            has_products: lowerText.includes('product') || lowerText.includes('solution'),
            has_services: lowerText.includes('service') || lowerText.includes('consulting'),
            has_contact: lowerText.includes('contact') || lowerText.includes('email'),
            has_team: lowerText.includes('team') || lowerText.includes('founder'),
            word_count: text.split(/\s+/).length
        };
    }

    analyzeTechStack(pageData) {
        const techStack = {
            frontend: [],
            analytics: [],
            marketing: [],
            hosting: []
        };
        
        // Analyze scripts for technology indicators
        pageData.scripts?.forEach(script => {
            if (script.includes('react')) techStack.frontend.push('React');
            if (script.includes('vue')) techStack.frontend.push('Vue');
            if (script.includes('angular')) techStack.frontend.push('Angular');
            if (script.includes('jquery')) techStack.frontend.push('jQuery');
            if (script.includes('google-analytics')) techStack.analytics.push('Google Analytics');
            if (script.includes('gtag')) techStack.analytics.push('Google Tag Manager');
        });
        
        return techStack;
    }

    formatExistingCrawlerData(crawlerData) {
        // Format data from existing crawler service
        return {
            ...crawlerData.extracted_data,
            crawlMethod: 'existing_crawler_service',
            pages_crawled: crawlerData.pages_crawled || 1,
            extraction_time: crawlerData.processing_time
        };
    }

    calculateWebDataQuality(websiteData, socialMedia, technicalInfo, seoAnalysis) {
        let score = 0;
        
        // Website data quality
        if (websiteData?.title) score += 15;
        if (websiteData?.description) score += 10;
        if (websiteData?.companyInfo) score += 15;
        if (websiteData?.headings?.h1?.length > 0) score += 10;
        
        // Social media presence
        if (socialMedia?.profileCount > 0) score += 15;
        if (socialMedia?.profileCount >= 3) score += 10;
        
        // Technical analysis
        if (technicalInfo?.available !== false) score += 10;
        if (technicalInfo?.frameworks?.length > 0) score += 5;
        
        // SEO analysis
        if (seoAnalysis?.available !== false) score += 10;
        if (seoAnalysis?.overall_score >= 60) score += 10;
        
        return Math.min(score, 100);
    }

    calculateAverageProcessingTime(results) {
        const times = results.filter(r => r.processingTime).map(r => r.processingTime);
        if (times.length === 0) return 0;
        return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    }

    /**
     * HTTP-only fallback for technical analysis when browser is unavailable
     */
    async getTechnicalAnalysisHttpOnly(websiteUrl) {
        try {
            const response = await axios.get(websiteUrl, {
                timeout: this.config.timeout,
                headers: { 'User-Agent': this.config.userAgent }
            });
            
            const $ = cheerio.load(response.data);
            
            // Basic technical analysis from HTML source
            const technologies = {
                frameworks: [],
                analytics: [],
                advertising: [],
                hosting: []
            };
            
            // Check for common frameworks in scripts
            $('script[src]').each((i, elem) => {
                const src = $(elem).attr('src');
                if (src.includes('react')) technologies.frameworks.push('React');
                if (src.includes('vue')) technologies.frameworks.push('Vue');
                if (src.includes('angular')) technologies.frameworks.push('Angular');
                if (src.includes('jquery')) technologies.frameworks.push('jQuery');
                if (src.includes('googletagmanager') || src.includes('gtag')) technologies.analytics.push('Google Analytics/GTM');
                if (src.includes('hotjar')) technologies.analytics.push('Hotjar');
                if (src.includes('facebook.net') || src.includes('fbevents')) technologies.advertising.push('Facebook Pixel');
            });
            
            return {
                ...technologies,
                mode: 'http_only_fallback',
                scriptsCount: $('script').length,
                linksCount: $('a[href]').length,
                available: true
            };
            
        } catch (error) {
            return {
                error: error.message,
                available: false,
                mode: 'http_only_fallback'
            };
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            console.log('🧹 Web crawler browser closed');
        }
    }

    /**
     * Graceful shutdown method (calls cleanup for compatibility)
     */
    async shutdown() {
        console.log('🔄 Shutting down WebCrawlerConnector...');
        await this.cleanup();
        console.log('✅ WebCrawlerConnector shutdown completed');
    }

    /**
     * Health check method
     */
    async healthCheck() {
        try {
            const browserAvailable = this.browser !== null;
            const httpFallbackAvailable = true; // HTTP requests should always work
            
            return {
                status: 'healthy',
                browserMode: browserAvailable,
                httpFallbackMode: httpFallbackAvailable,
                message: browserAvailable 
                    ? 'Browser mode active with HTTP fallback' 
                    : 'HTTP-only mode (browser unavailable)'
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
}

module.exports = { WebCrawlerConnector };
