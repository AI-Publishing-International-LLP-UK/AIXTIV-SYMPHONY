/**
 * Custom LinkedIn Actor - Open Source Alternative
 * Replaces expensive apify/linkedin-company-scraper
 * Estimated cost savings: $15,000-60,000/month → $100-300/month
 */

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs').promises;

class CustomLinkedInActor {
    constructor(options = {}) {
        this.options = {
            headless: options.headless !== false,
            proxy: options.proxy || null,
            userAgent: options.userAgent || this.getRandomUserAgent(),
            rateLimitMs: options.rateLimitMs || 3000, // 3 seconds between requests
            maxRetries: options.maxRetries || 3,
            outputFormat: options.outputFormat || 'json',
            respectRobots: options.respectRobots !== false,
            ...options
        };
        
        this.rateLimiter = new Map();
        this.sessionCookies = null;
        this.requestCount = 0;
        this.successCount = 0;
        this.errorCount = 0;
        
        // User agent rotation for stealth
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0'
        ];
    }

    /**
     * Main method to scrape multiple companies
     * @param {Array} companyList - Array of company objects with {name, domain, linkedinHandle}
     * @returns {Array} Array of scraped company data
     */
    async scrapeCompanies(companyList) {
        console.log(`🔗 Custom LinkedIn Actor: Starting to scrape ${companyList.length} companies...`);
        
        const results = [];
        const browser = await this.launchBrowser();
        
        try {
            for (let i = 0; i < companyList.length; i++) {
                const company = companyList[i];
                
                try {
                    console.log(`📊 Processing company ${i + 1}/${companyList.length}: ${company.name}`);
                    
                    // Rate limiting
                    await this.respectRateLimit();
                    
                    // Scrape company data
                    const companyData = await this.scrapeCompanyProfile(browser, company);
                    
                    if (companyData) {
                        results.push(companyData);
                        this.successCount++;
                    } else {
                        this.errorCount++;
                    }
                    
                    this.requestCount++;
                    
                    // Progress reporting
                    if ((i + 1) % 10 === 0) {
                        console.log(`📈 Progress: ${i + 1}/${companyList.length} (${this.successCount} successful, ${this.errorCount} errors)`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Error scraping ${company.name}:`, error.message);
                    this.errorCount++;
                    
                    // Add partial data even on error
                    results.push({
                        name: company.name,
                        domain: company.domain,
                        error: error.message,
                        scrapedAt: new Date().toISOString(),
                        dataQuality: 0
                    });
                }
            }
            
        } finally {
            await browser.close();
        }
        
        console.log(`✅ Custom LinkedIn Actor completed: ${this.successCount}/${companyList.length} successful`);
        
        return {
            results,
            summary: {
                totalRequested: companyList.length,
                successful: this.successCount,
                errors: this.errorCount,
                successRate: Math.round((this.successCount / companyList.length) * 100),
                completedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Scrape individual company profile
     */
    async scrapeCompanyProfile(browser, company) {
        const page = await browser.newPage();
        
        try {
            // Set up page with stealth settings
            await this.setupPage(page);
            
            // Method 1: Try direct LinkedIn company page if handle provided
            if (company.linkedinHandle) {
                const directData = await this.scrapeDirectLinkedInPage(page, company.linkedinHandle);
                if (directData && directData.dataQuality > 70) {
                    return { ...directData, ...company, method: 'direct_linkedin' };
                }
            }
            
            // Method 2: Search for company on LinkedIn
            const searchData = await this.searchLinkedInCompany(page, company.name);
            if (searchData && searchData.dataQuality > 50) {
                return { ...searchData, ...company, method: 'linkedin_search' };
            }
            
            // Method 3: Fallback to public profile scraping
            const publicData = await this.scrapePublicProfile(company);
            return { ...publicData, ...company, method: 'public_fallback' };
            
        } finally {
            await page.close();
        }
    }

    /**
     * Set up page with stealth and anti-detection measures
     */
    async setupPage(page) {
        // Set random user agent
        await page.setUserAgent(this.getRandomUserAgent());
        
        // Set viewport to common desktop size
        await page.setViewport({
            width: 1366 + Math.floor(Math.random() * 200),
            height: 768 + Math.floor(Math.random() * 200)
        });
        
        // Set extra headers to appear more human
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        });
        
        // Block unnecessary resources to speed up scraping
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (resourceType === 'image' || resourceType === 'media' || resourceType === 'font') {
                req.abort();
            } else {
                req.continue();
            }
        });
        
        // Add random delays to mouse movements
        await page.evaluateOnNewDocument(() => {
            // Override webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            
            // Mock plugins and languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
            
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
        });
    }

    /**
     * Scrape direct LinkedIn company page
     */
    async scrapeDirectLinkedInPage(page, linkedinHandle) {
        try {
            const url = `https://www.linkedin.com/company/${linkedinHandle}/`;
            console.log(`🔍 Attempting direct LinkedIn scrape: ${url}`);
            
            await page.goto(url, { 
                waitUntil: 'networkidle0', 
                timeout: 30000 
            });
            
            // Wait for content to load
            await page.waitForSelector('h1', { timeout: 10000 });
            
            // Extract company information
            const companyData = await page.evaluate(() => {
                const extractText = (selector) => {
                    const element = document.querySelector(selector);
                    return element ? element.textContent.trim() : null;
                };
                
                const extractAttribute = (selector, attribute) => {
                    const element = document.querySelector(selector);
                    return element ? element.getAttribute(attribute) : null;
                };
                
                return {
                    name: extractText('h1') || extractText('.org-top-card-summary__title'),
                    tagline: extractText('.org-top-card-summary__tagline'),
                    industry: extractText('.org-top-card-summary__industry'),
                    companySize: extractText('.org-top-card-summary__follower-count') || 
                               extractText('[data-test-id="about-us-company-size"] dd'),
                    location: extractText('.org-top-card-summary__location') || 
                             extractText('[data-test-id="about-us-headquarters"] dd'),
                    website: extractAttribute('a[data-test-id="about-us-website"]', 'href'),
                    specialties: extractText('[data-test-id="about-us-specialties"] dd'),
                    description: extractText('.org-about-company-module__company-description') ||
                               extractText('[data-test-id="about-us-description"] p'),
                    foundedYear: extractText('[data-test-id="about-us-founded"] dd'),
                    employeeCount: extractText('[data-test-id="about-us-company-size"] dd'),
                    followerCount: extractText('.org-top-card-summary__follower-count'),
                    logoUrl: extractAttribute('.org-top-card-summary__logo img', 'src'),
                    coverImageUrl: extractAttribute('.org-top-card-summary__background-image img', 'src')
                };
            });
            
            // Calculate data quality
            const dataQuality = this.calculateDataQuality(companyData);
            
            return {
                ...companyData,
                linkedinUrl: url,
                scrapedAt: new Date().toISOString(),
                dataQuality
            };
            
        } catch (error) {
            console.error(`❌ Direct LinkedIn scrape failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Search for company on LinkedIn
     */
    async searchLinkedInCompany(page, companyName) {
        try {
            const searchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}`;
            console.log(`🔍 Searching LinkedIn for: ${companyName}`);
            
            await page.goto(searchUrl, { 
                waitUntil: 'networkidle0', 
                timeout: 30000 
            });
            
            // Wait for search results
            await page.waitForSelector('.search-results-container', { timeout: 10000 });
            
            // Extract first search result
            const searchResult = await page.evaluate((searchName) => {
                const firstResult = document.querySelector('.entity-result');
                if (!firstResult) return null;
                
                const extractText = (selector, parent = firstResult) => {
                    const element = parent.querySelector(selector);
                    return element ? element.textContent.trim() : null;
                };
                
                const name = extractText('.entity-result__title-text a span[dir="ltr"]');
                
                // Only return if name matches reasonably well
                if (!name || !name.toLowerCase().includes(searchName.toLowerCase().substring(0, 5))) {
                    return null;
                }
                
                return {
                    name: name,
                    tagline: extractText('.entity-result__primary-subtitle'),
                    industry: extractText('.entity-result__secondary-subtitle'),
                    location: extractText('.entity-result__location'),
                    employeeRange: extractText('.entity-result__meta'),
                    linkedinUrl: firstResult.querySelector('.entity-result__title-text a')?.href,
                    logoUrl: firstResult.querySelector('img')?.src
                };
            }, companyName);
            
            if (!searchResult) {
                console.log(`⚠️ No matching search results found for: ${companyName}`);
                return null;
            }
            
            // Calculate data quality
            const dataQuality = this.calculateDataQuality(searchResult);
            
            return {
                ...searchResult,
                scrapedAt: new Date().toISOString(),
                dataQuality
            };
            
        } catch (error) {
            console.error(`❌ LinkedIn search failed: ${error.message}`);
            return null;
        }
    }

    /**
     * Fallback to public profile scraping (non-LinkedIn sources)
     */
    async scrapePublicProfile(company) {
        try {
            // Use multiple public sources to gather company information
            const sources = await Promise.allSettled([
                this.scrapeCrunchbase(company.name),
                this.scrapeWikipedia(company.name),
                this.scrapeCompanyWebsite(company.domain)
            ]);
            
            // Merge results from all sources
            const mergedData = this.mergePublicData(sources, company);
            
            return {
                ...mergedData,
                scrapedAt: new Date().toISOString(),
                dataQuality: this.calculateDataQuality(mergedData)
            };
            
        } catch (error) {
            console.error(`❌ Public profile scraping failed: ${error.message}`);
            return {
                name: company.name,
                domain: company.domain,
                error: error.message,
                scrapedAt: new Date().toISOString(),
                dataQuality: 20
            };
        }
    }

    /**
     * Scrape Crunchbase for company information
     */
    async scrapeCrunchbase(companyName) {
        try {
            const searchUrl = `https://www.crunchbase.com/discover/organization.companies/${encodeURIComponent(companyName)}`;
            const response = await axios.get(searchUrl, {
                headers: { 'User-Agent': this.getRandomUserAgent() },
                timeout: 10000
            });
            
            const $ = cheerio.load(response.data);
            
            return {
                source: 'crunchbase',
                name: $('.profile-header h1').text().trim(),
                description: $('.description').text().trim(),
                website: $('a[data-cy="website-link"]').attr('href'),
                foundedYear: $('.founded').text().trim(),
                headquarters: $('.location').text().trim(),
                employeeRange: $('.company-size').text().trim()
            };
            
        } catch (error) {
            return { source: 'crunchbase', error: error.message };
        }
    }

    /**
     * Scrape Wikipedia for company information
     */
    async scrapeWikipedia(companyName) {
        try {
            const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(companyName)}`;
            const response = await axios.get(searchUrl, {
                headers: { 'User-Agent': this.getRandomUserAgent() },
                timeout: 10000
            });
            
            const data = response.data;
            
            return {
                source: 'wikipedia',
                name: data.title,
                description: data.extract,
                wikipediaUrl: data.content_urls?.desktop?.page
            };
            
        } catch (error) {
            return { source: 'wikipedia', error: error.message };
        }
    }

    /**
     * Scrape company's own website
     */
    async scrapeCompanyWebsite(domain) {
        if (!domain) return { source: 'website', error: 'No domain provided' };
        
        try {
            const url = `https://${domain}`;
            const response = await axios.get(url, {
                headers: { 'User-Agent': this.getRandomUserAgent() },
                timeout: 10000,
                maxRedirects: 5
            });
            
            const $ = cheerio.load(response.data);
            
            return {
                source: 'website',
                name: $('title').text().trim(),
                description: $('meta[name="description"]').attr('content'),
                website: url,
                contactEmail: this.extractEmails(response.data)[0],
                socialLinks: this.extractSocialLinks($)
            };
            
        } catch (error) {
            return { source: 'website', error: error.message };
        }
    }

    /**
     * Merge data from multiple public sources
     */
    mergePublicData(sourceResults, company) {
        const merged = {
            name: company.name,
            domain: company.domain,
            sources: []
        };
        
        sourceResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value && !result.value.error) {
                const data = result.value;
                merged.sources.push(data.source);
                
                // Merge fields, preferring non-empty values
                Object.keys(data).forEach(key => {
                    if (key !== 'source' && data[key] && !merged[key]) {
                        merged[key] = data[key];
                    }
                });
            }
        });
        
        return merged;
    }

    /**
     * Calculate data quality score based on available fields
     */
    calculateDataQuality(data) {
        if (!data) return 0;
        
        let score = 0;
        const fields = {
            name: 20,
            description: 15,
            industry: 15,
            location: 10,
            employeeCount: 10,
            website: 10,
            foundedYear: 5,
            tagline: 5,
            specialties: 5,
            linkedinUrl: 5
        };
        
        Object.entries(fields).forEach(([field, points]) => {
            if (data[field] && data[field].toString().trim().length > 0) {
                score += points;
            }
        });
        
        return Math.min(score, 100);
    }

    /**
     * Utility methods
     */
    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    async respectRateLimit() {
        const now = Date.now();
        const lastRequest = this.rateLimiter.get('global') || 0;
        const timeSinceLastRequest = now - lastRequest;
        
        if (timeSinceLastRequest < this.options.rateLimitMs) {
            const delay = this.options.rateLimitMs - timeSinceLastRequest;
            console.log(`⏳ Rate limiting: waiting ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.rateLimiter.set('global', Date.now());
    }

    async launchBrowser() {
        const args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ];
        
        if (this.options.proxy) {
            args.push(`--proxy-server=${this.options.proxy}`);
        }
        
        return await puppeteer.launch({
            headless: this.options.headless,
            args,
            ignoreDefaultArgs: ['--disable-extensions'],
            timeout: 30000
        });
    }

    extractEmails(html) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        return html.match(emailRegex) || [];
    }

    extractSocialLinks($) {
        const socialPlatforms = ['linkedin', 'twitter', 'facebook', 'instagram', 'youtube'];
        const socialLinks = {};
        
        socialPlatforms.forEach(platform => {
            const link = $(`a[href*="${platform}.com"]`).first().attr('href');
            if (link) socialLinks[platform] = link;
        });
        
        return socialLinks;
    }

    /**
     * Save results to file
     */
    async saveResults(results, filename = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputFile = filename || `linkedin-scrape-results-${timestamp}.json`;
        
        try {
            await fs.writeFile(outputFile, JSON.stringify(results, null, 2));
            console.log(`💾 Results saved to: ${outputFile}`);
        } catch (error) {
            console.error(`❌ Failed to save results: ${error.message}`);
        }
    }

    /**
     * Get scraping statistics
     */
    getStats() {
        return {
            requestCount: this.requestCount,
            successCount: this.successCount,
            errorCount: this.errorCount,
            successRate: this.requestCount > 0 ? Math.round((this.successCount / this.requestCount) * 100) : 0
        };
    }
}

module.exports = { CustomLinkedInActor };
