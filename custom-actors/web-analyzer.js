/**
 * Custom Web Analyzer Actor - Open Source Alternative
 * Replaces expensive apify/web-scraper and apify/website-content-crawler
 * Estimated cost savings: $3,000-15,000/month → $50-150/month
 */

const playwright = require('playwright');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs').promises;
const url = require('url');

class CustomWebAnalyzer {
    constructor(options = {}) {
        this.options = {
            headless: options.headless !== false,
            timeout: options.timeout || 30000,
            rateLimitMs: options.rateLimitMs || 1000, // 1 second between requests
            maxDepth: options.maxDepth || 3,
            maxPagesPerSite: options.maxPagesPerSite || 10,
            userAgent: options.userAgent || this.getRandomUserAgent(),
            respectRobots: options.respectRobots !== false,
            ...options
        };
        
        this.aiKeywords = [
            'artificial intelligence', 'machine learning', 'ai', 'automation',
            'chatbot', 'deep learning', 'neural network', 'natural language',
            'computer vision', 'robotic process automation', 'rpa',
            'predictive analytics', 'data science', 'artificial general intelligence',
            'llm', 'large language model', 'generative ai', 'openai', 'chatgpt'
        ];
        
        this.techKeywords = [
            'cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'microservices',
            'api', 'rest', 'graphql', 'blockchain', 'fintech', 'saas', 'platform'
        ];
        
        this.rateLimiter = new Map();
        this.visitedUrls = new Set();
        this.results = [];
        
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        ];
    }

    /**
     * Analyze multiple websites
     * @param {Array} websites - Array of website objects with {name, domain, url}
     * @returns {Object} Analysis results
     */
    async analyzeWebsites(websites) {
        console.log(`🌐 Custom Web Analyzer: Starting analysis of ${websites.length} websites...`);
        
        const results = [];
        
        for (let i = 0; i < websites.length; i++) {
            const website = websites[i];
            
            try {
                console.log(`📊 Analyzing website ${i + 1}/${websites.length}: ${website.domain || website.url}`);
                
                // Rate limiting
                await this.respectRateLimit(website.domain || website.url);
                
                // Analyze website
                const analysis = await this.analyzeWebsite(website);
                
                if (analysis) {
                    results.push(analysis);
                }
                
                // Progress reporting
                if ((i + 1) % 5 === 0) {
                    console.log(`📈 Progress: ${i + 1}/${websites.length} websites analyzed`);
                }
                
            } catch (error) {
                console.error(`❌ Error analyzing ${website.domain || website.url}:`, error.message);
                
                // Add error result
                results.push({
                    ...website,
                    error: error.message,
                    analyzedAt: new Date().toISOString(),
                    dataQuality: 0
                });
            }
        }
        
        console.log(`✅ Custom Web Analyzer completed: ${results.length}/${websites.length} analyzed`);
        
        return {
            results,
            summary: {
                totalRequested: websites.length,
                successful: results.filter(r => !r.error).length,
                errors: results.filter(r => r.error).length,
                completedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Analyze individual website
     */
    async analyzeWebsite(website) {
        const domain = website.domain || this.extractDomain(website.url);
        const baseUrl = website.url || `https://${domain}`;
        
        try {
            // Multi-method analysis approach
            const analyses = await Promise.allSettled([
                this.performQuickHTMLAnalysis(baseUrl),
                this.performDeepBrowserAnalysis(baseUrl),
                this.performTechnicalAnalysis(domain),
                this.analyzeKeyPages(baseUrl)
            ]);
            
            // Merge all analysis results
            const mergedAnalysis = this.mergeAnalyses(analyses, website);
            
            return {
                ...website,
                ...mergedAnalysis,
                analyzedAt: new Date().toISOString(),
                dataQuality: this.calculateWebDataQuality(mergedAnalysis)
            };
            
        } catch (error) {
            console.error(`❌ Website analysis failed for ${domain}:`, error.message);
            return null;
        }
    }

    /**
     * Quick HTML analysis using Axios + Cheerio
     */
    async performQuickHTMLAnalysis(url) {
        try {
            const response = await axios.get(url, {
                timeout: 15000,
                maxRedirects: 5,
                headers: {
                    'User-Agent': this.getRandomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'DNT': '1',
                    'Connection': 'keep-alive'
                }
            });

            const $ = cheerio.load(response.data);
            const html = response.data;
            
            return {
                method: 'quick_html',
                url: response.request.res.responseUrl || url,
                statusCode: response.status,
                
                // Basic metadata
                title: $('title').text().trim(),
                description: $('meta[name="description"]').attr('content') || '',
                keywords: $('meta[name="keywords"]').attr('content') || '',
                author: $('meta[name="author"]').attr('content') || '',
                viewport: $('meta[name="viewport"]').attr('content') || '',
                
                // AI and technology detection
                aiMentions: this.findKeywordMentions(html, this.aiKeywords),
                techMentions: this.findKeywordMentions(html, this.techKeywords),
                
                // Technology stack detection
                technologies: this.detectTechnologies($, html),
                
                // Content analysis
                headings: this.extractHeadings($),
                links: this.extractLinks($, url),
                images: this.extractImages($, url),
                forms: this.extractForms($),
                
                // Contact information
                emails: this.extractEmails(html),
                phoneNumbers: this.extractPhoneNumbers(html),
                
                // Social media links
                socialLinks: this.extractSocialLinks($),
                
                // Business indicators
                businessIndicators: this.detectBusinessIndicators(html, $),
                
                // Performance metrics
                pageSize: Buffer.byteLength(html, 'utf8'),
                loadTime: response.duration || 0
            };
            
        } catch (error) {
            return {
                method: 'quick_html',
                url: url,
                error: error.message,
                statusCode: error.response?.status || 0
            };
        }
    }

    /**
     * Deep browser analysis using Playwright
     */
    async performDeepBrowserAnalysis(url) {
        let browser = null;
        let page = null;
        
        try {
            browser = await playwright.chromium.launch({
                headless: this.options.headless,
                timeout: 30000
            });
            
            page = await browser.newPage();
            
            // Set up page
            await page.setUserAgent(this.getRandomUserAgent());
            await page.setViewport({ width: 1366, height: 768 });
            
            // Track performance
            const startTime = Date.now();
            
            // Navigate to page
            const response = await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 30000
            });
            
            const loadTime = Date.now() - startTime;
            
            // JavaScript-rendered content analysis
            const deepData = await page.evaluate((aiKeywords, techKeywords) => {
                const extractText = (selector) => {
                    const elements = document.querySelectorAll(selector);
                    return Array.from(elements).map(el => el.textContent.trim()).filter(text => text);
                };
                
                const countMatches = (text, keywords) => {
                    const lowerText = text.toLowerCase();
                    return keywords.filter(keyword => lowerText.includes(keyword.toLowerCase()));
                };
                
                const bodyText = document.body?.innerText || '';\n                const htmlText = document.documentElement?.outerHTML || '';\n                \n                return {\n                    finalUrl: window.location.href,\n                    renderedTitle: document.title,\n                    \n                    // AI mentions in rendered content\n                    renderedAiMentions: countMatches(bodyText, aiKeywords),\n                    renderedTechMentions: countMatches(bodyText, techKeywords),\n                    \n                    // Interactive elements\n                    hasChat: !!document.querySelector('[class*="chat"], [id*="chat"], [class*="support"], [data-testid*="chat"]'),\n                    hasSearch: !!document.querySelector('input[type="search"], [class*="search"], [id*="search"]'),\n                    hasLogin: !!document.querySelector('[class*="login"], [id*="login"], [href*="login"], [href*="signin"]'),\n                    hasSignup: !!document.querySelector('[class*="signup"], [id*="signup"], [href*="register"], [href*="join"]'),\n                    \n                    // Career and company pages\n                    hasCareerPage: !!document.querySelector('a[href*="career"], a[href*="job"], [class*="career"], [id*="career"]'),\n                    hasAboutPage: !!document.querySelector('a[href*="about"], [class*="about"], [id*="about"]'),\n                    hasContactPage: !!document.querySelector('a[href*="contact"], [class*="contact"], [id*="contact"]'),\n                    hasPricingPage: !!document.querySelector('a[href*="pricing"], [class*="pricing"], [id*="pricing"]'),\n                    \n                    // Content metrics\n                    scriptCount: document.querySelectorAll('script').length,\n                    styleCount: document.querySelectorAll('style, link[rel="stylesheet"]').length,\n                    imageCount: document.querySelectorAll('img').length,\n                    linkCount: document.querySelectorAll('a').length,\n                    formCount: document.querySelectorAll('form').length,\n                    \n                    // Text content analysis\n                    wordCount: bodyText.split(/\\s+/).length,\n                    paragraphCount: document.querySelectorAll('p').length,\n                    headingCount: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,\n                    \n                    // Business indicators\n                    hasPricing: bodyText.toLowerCase().includes('price') || bodyText.toLowerCase().includes('$'),\n                    hasDemo: bodyText.toLowerCase().includes('demo') || bodyText.toLowerCase().includes('trial'),\n                    hasAPI: bodyText.toLowerCase().includes('api') || bodyText.toLowerCase().includes('developer'),\n                    \n                    // Technology indicators\n                    usesReact: !!document.querySelector('[data-reactroot], [data-react-]') || htmlText.includes('react'),\n                    usesAngular: htmlText.includes('angular') || htmlText.includes('ng-'),\n                    usesVue: htmlText.includes('vue') || htmlText.includes('v-'),\n                    usesJQuery: htmlText.includes('jquery') || !!window.jQuery,\n                    \n                    // Analytics detection\n                    hasGoogleAnalytics: htmlText.includes('google-analytics') || htmlText.includes('gtag'),\n                    hasGTM: htmlText.includes('googletagmanager'),\n                    hasFacebookPixel: htmlText.includes('facebook.net') || htmlText.includes('fbq'),\n                    \n                    // SEO indicators\n                    hasStructuredData: !!document.querySelector('[type="application/ld+json"]'),\n                    hasOpenGraph: !!document.querySelector('meta[property^="og:"]'),\n                    hasTwitterCard: !!document.querySelector('meta[name^="twitter:"]'),\n                    \n                    // Performance indicators\n                    pageHeight: document.body.scrollHeight,\n                    viewportHeight: window.innerHeight\n                };\n            }, this.aiKeywords, this.techKeywords);\n            \n            return {\n                method: 'deep_browser',\n                statusCode: response?.status() || 200,\n                loadTime: loadTime,\n                ...deepData\n            };\n            \n        } catch (error) {\n            return {\n                method: 'deep_browser',\n                error: error.message,\n                url: url\n            };\n        } finally {\n            if (page) await page.close();\n            if (browser) await browser.close();\n        }\n    }\n\n    /**\n     * Technical analysis of domain and infrastructure\n     */\n    async performTechnicalAnalysis(domain) {\n        try {\n            const analyses = await Promise.allSettled([\n                this.analyzeHTTPHeaders(domain),\n                this.analyzeDNS(domain),\n                this.analyzeSSL(domain),\n                this.analyzeRobotsTxt(domain),\n                this.analyzeSitemap(domain)\n            ]);\n            \n            const technical = {};\n            analyses.forEach((result, index) => {\n                if (result.status === 'fulfilled' && result.value) {\n                    Object.assign(technical, result.value);\n                }\n            });\n            \n            return {\n                method: 'technical',\n                ...technical\n            };\n            \n        } catch (error) {\n            return {\n                method: 'technical',\n                error: error.message\n            };\n        }\n    }\n\n    /**\n     * Analyze key pages (about, careers, contact, etc.)\n     */\n    async analyzeKeyPages(baseUrl) {\n        const keyPages = [\n            { path: '/about', name: 'about' },\n            { path: '/careers', name: 'careers' },\n            { path: '/contact', name: 'contact' },\n            { path: '/pricing', name: 'pricing' },\n            { path: '/api', name: 'api' },\n            { path: '/developers', name: 'developers' }\n        ];\n        \n        const pageAnalyses = {};\n        \n        for (const keyPage of keyPages) {\n            try {\n                const pageUrl = new URL(keyPage.path, baseUrl).toString();\n                const response = await axios.get(pageUrl, {\n                    timeout: 10000,\n                    headers: { 'User-Agent': this.getRandomUserAgent() }\n                });\n                \n                if (response.status === 200) {\n                    const $ = cheerio.load(response.data);\n                    pageAnalyses[keyPage.name] = {\n                        exists: true,\n                        title: $('title').text().trim(),\n                        description: $('meta[name=\"description\"]').attr('content') || '',\n                        wordCount: response.data.split(/\\s+/).length,\n                        aiMentions: this.findKeywordMentions(response.data, this.aiKeywords).length\n                    };\n                }\n            } catch (error) {\n                pageAnalyses[keyPage.name] = {\n                    exists: false,\n                    error: error.message\n                };\n            }\n            \n            // Rate limiting\n            await new Promise(resolve => setTimeout(resolve, 500));\n        }\n        \n        return {\n            method: 'key_pages',\n            pages: pageAnalyses\n        };\n    }\n\n    /**\n     * Merge all analysis results\n     */\n    mergeAnalyses(analyses, website) {\n        const merged = {\n            domain: website.domain || this.extractDomain(website.url),\n            name: website.name || '',\n            analysisResults: {}\n        };\n        \n        analyses.forEach((result, index) => {\n            const methods = ['quick_html', 'deep_browser', 'technical', 'key_pages'];\n            const methodName = methods[index];\n            \n            if (result.status === 'fulfilled' && result.value) {\n                merged.analysisResults[methodName] = result.value;\n                \n                // Merge key data to top level\n                const data = result.value;\n                if (data.title && !merged.title) merged.title = data.title;\n                if (data.description && !merged.description) merged.description = data.description;\n                if (data.technologies) merged.technologies = data.technologies;\n                if (data.aiMentions) merged.aiMentions = data.aiMentions;\n                if (data.socialLinks) merged.socialLinks = data.socialLinks;\n            }\n        });\n        \n        // Calculate combined metrics\n        merged.combinedMetrics = this.calculateCombinedMetrics(merged.analysisResults);\n        \n        return merged;\n    }\n\n    /**\n     * Helper methods for data extraction\n     */\n    findKeywordMentions(text, keywords) {\n        const lowerText = text.toLowerCase();\n        const mentions = [];\n        \n        keywords.forEach(keyword => {\n            const regex = new RegExp(keyword.toLowerCase(), 'gi');\n            const matches = lowerText.match(regex);\n            if (matches && matches.length > 0) {\n                mentions.push({\n                    keyword: keyword,\n                    count: matches.length\n                });\n            }\n        });\n        \n        return mentions;\n    }\n\n    detectTechnologies($, html) {\n        const technologies = [];\n        \n        // Frontend frameworks\n        if ($('script[src*=\"react\"]').length || html.includes('React')) technologies.push('React');\n        if ($('script[src*=\"angular\"]').length || html.includes('angular')) technologies.push('Angular');\n        if ($('script[src*=\"vue\"]').length || html.includes('Vue')) technologies.push('Vue.js');\n        if ($('script[src*=\"jquery\"]').length) technologies.push('jQuery');\n        \n        // CSS frameworks\n        if ($('link[href*=\"bootstrap\"]').length || html.includes('bootstrap')) technologies.push('Bootstrap');\n        if (html.includes('tailwind')) technologies.push('Tailwind CSS');\n        \n        // Analytics\n        if (html.includes('google-analytics') || html.includes('gtag')) technologies.push('Google Analytics');\n        if (html.includes('googletagmanager')) technologies.push('Google Tag Manager');\n        if (html.includes('hotjar')) technologies.push('Hotjar');\n        \n        // CDNs\n        if (html.includes('cloudflare')) technologies.push('Cloudflare');\n        if (html.includes('amazonaws')) technologies.push('AWS');\n        if (html.includes('googleapis')) technologies.push('Google APIs');\n        \n        return technologies;\n    }\n\n    extractHeadings($) {\n        const headings = {};\n        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {\n            const elements = $(tag);\n            if (elements.length > 0) {\n                headings[tag] = elements.map((i, el) => $(el).text().trim()).get().slice(0, 10);\n            }\n        });\n        return headings;\n    }\n\n    extractLinks($, baseUrl) {\n        const links = [];\n        $('a[href]').each((i, el) => {\n            if (i >= 100) return false; // Limit to first 100 links\n            \n            const href = $(el).attr('href');\n            const text = $(el).text().trim();\n            \n            if (href && text) {\n                try {\n                    const absoluteUrl = new URL(href, baseUrl).toString();\n                    links.push({\n                        url: absoluteUrl,\n                        text: text.substring(0, 100), // Limit text length\n                        isInternal: absoluteUrl.includes(this.extractDomain(baseUrl))\n                    });\n                } catch (error) {\n                    // Skip invalid URLs\n                }\n            }\n        });\n        return links;\n    }\n\n    extractImages($, baseUrl) {\n        const images = [];\n        $('img[src]').each((i, el) => {\n            if (i >= 50) return false; // Limit to first 50 images\n            \n            const src = $(el).attr('src');\n            const alt = $(el).attr('alt') || '';\n            \n            if (src) {\n                try {\n                    const absoluteUrl = new URL(src, baseUrl).toString();\n                    images.push({\n                        src: absoluteUrl,\n                        alt: alt.substring(0, 100)\n                    });\n                } catch (error) {\n                    // Skip invalid URLs\n                }\n            }\n        });\n        return images;\n    }\n\n    extractForms($) {\n        const forms = [];\n        $('form').each((i, el) => {\n            if (i >= 10) return false; // Limit to first 10 forms\n            \n            const $form = $(el);\n            const action = $form.attr('action') || '';\n            const method = $form.attr('method') || 'GET';\n            const inputs = [];\n            \n            $form.find('input').each((j, input) => {\n                const $input = $(input);\n                inputs.push({\n                    type: $input.attr('type') || 'text',\n                    name: $input.attr('name') || '',\n                    placeholder: $input.attr('placeholder') || ''\n                });\n            });\n            \n            forms.push({\n                action,\n                method: method.toUpperCase(),\n                inputCount: inputs.length,\n                inputs: inputs.slice(0, 10) // Limit inputs per form\n            });\n        });\n        \n        return forms;\n    }\n\n    extractEmails(html) {\n        const emailRegex = /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g;\n        const matches = html.match(emailRegex) || [];\n        \n        // Remove duplicates and common false positives\n        const emails = [...new Set(matches)].filter(email => \n            !email.includes('@example.') && \n            !email.includes('@domain.') && \n            !email.includes('@test.')\n        );\n        \n        return emails.slice(0, 10); // Limit to 10 emails\n    }\n\n    extractPhoneNumbers(html) {\n        const phoneRegex = /(?:\\+?1[-\\s]?)?\\(?[0-9]{3}\\)?[-\\s]?[0-9]{3}[-\\s]?[0-9]{4}/g;\n        const matches = html.match(phoneRegex) || [];\n        return [...new Set(matches)].slice(0, 5); // Limit to 5 phone numbers\n    }\n\n    extractSocialLinks($) {\n        const socialPlatforms = {\n            linkedin: ['linkedin.com'],\n            twitter: ['twitter.com', 'x.com'],\n            facebook: ['facebook.com'],\n            instagram: ['instagram.com'],\n            youtube: ['youtube.com'],\n            github: ['github.com'],\n            tiktok: ['tiktok.com']\n        };\n        \n        const socialLinks = {};\n        \n        Object.entries(socialPlatforms).forEach(([platform, domains]) => {\n            domains.forEach(domain => {\n                const link = $(`a[href*=\"${domain}\"]`).first().attr('href');\n                if (link && !socialLinks[platform]) {\n                    socialLinks[platform] = link;\n                }\n            });\n        });\n        \n        return socialLinks;\n    }\n\n    detectBusinessIndicators(html, $) {\n        const lowerHtml = html.toLowerCase();\n        \n        return {\n            hasEcommerce: lowerHtml.includes('cart') || lowerHtml.includes('shop') || lowerHtml.includes('buy'),\n            hasPricing: lowerHtml.includes('price') || lowerHtml.includes('$') || lowerHtml.includes('cost'),\n            hasDemo: lowerHtml.includes('demo') || lowerHtml.includes('trial') || lowerHtml.includes('preview'),\n            hasAPI: lowerHtml.includes('api') || lowerHtml.includes('developer') || lowerHtml.includes('endpoint'),\n            hasCareers: lowerHtml.includes('career') || lowerHtml.includes('job') || lowerHtml.includes('hiring'),\n            hasSupport: lowerHtml.includes('support') || lowerHtml.includes('help') || lowerHtml.includes('contact'),\n            hasBlog: lowerHtml.includes('blog') || lowerHtml.includes('news') || lowerHtml.includes('article'),\n            hasLogin: !!$('[href*=\"login\"], [href*=\"signin\"], [class*=\"login\"], [id*=\"login\"]').length\n        };\n    }\n\n    // Technical analysis helpers\n    async analyzeHTTPHeaders(domain) {\n        try {\n            const response = await axios.head(`https://${domain}`, {\n                timeout: 10000,\n                headers: { 'User-Agent': this.getRandomUserAgent() }\n            });\n            \n            return {\n                httpHeaders: {\n                    server: response.headers.server || 'Unknown',\n                    powered: response.headers['x-powered-by'] || 'Unknown',\n                    cloudflare: !!response.headers['cf-ray'],\n                    contentType: response.headers['content-type'] || 'Unknown'\n                }\n            };\n        } catch (error) {\n            return { httpHeaders: { error: error.message } };\n        }\n    }\n\n    async analyzeDNS(domain) {\n        // DNS analysis would require additional libraries\n        return { dns: { analyzed: false, reason: 'DNS analysis not implemented' } };\n    }\n\n    async analyzeSSL(domain) {\n        try {\n            const response = await axios.get(`https://${domain}`, {\n                timeout: 10000,\n                headers: { 'User-Agent': this.getRandomUserAgent() }\n            });\n            \n            return {\n                ssl: {\n                    enabled: true,\n                    redirectsToHttps: response.request.res.responseUrl?.startsWith('https://')\n                }\n            };\n        } catch (error) {\n            return {\n                ssl: {\n                    enabled: false,\n                    error: error.message\n                }\n            };\n        }\n    }\n\n    async analyzeRobotsTxt(domain) {\n        try {\n            const response = await axios.get(`https://${domain}/robots.txt`, {\n                timeout: 5000,\n                headers: { 'User-Agent': this.getRandomUserAgent() }\n            });\n            \n            return {\n                robotsTxt: {\n                    exists: true,\n                    content: response.data.substring(0, 1000) // Limit content\n                }\n            };\n        } catch (error) {\n            return {\n                robotsTxt: {\n                    exists: false,\n                    error: error.message\n                }\n            };\n        }\n    }\n\n    async analyzeSitemap(domain) {\n        try {\n            const response = await axios.get(`https://${domain}/sitemap.xml`, {\n                timeout: 5000,\n                headers: { 'User-Agent': this.getRandomUserAgent() }\n            });\n            \n            return {\n                sitemap: {\n                    exists: true,\n                    size: response.data.length\n                }\n            };\n        } catch (error) {\n            return {\n                sitemap: {\n                    exists: false,\n                    error: error.message\n                }\n            };\n        }\n    }\n\n    calculateCombinedMetrics(analysisResults) {\n        const metrics = {\n            totalAIMentions: 0,\n            totalTechMentions: 0,\n            hasCompleteAnalysis: true,\n            methods: Object.keys(analysisResults)\n        };\n        \n        // Aggregate AI mentions\n        Object.values(analysisResults).forEach(result => {\n            if (result.aiMentions) {\n                metrics.totalAIMentions += Array.isArray(result.aiMentions) ? result.aiMentions.length : 0;\n            }\n            if (result.renderedAiMentions) {\n                metrics.totalAIMentions += Array.isArray(result.renderedAiMentions) ? result.renderedAiMentions.length : 0;\n            }\n        });\n        \n        return metrics;\n    }\n\n    calculateWebDataQuality(analysis) {\n        let score = 0;\n        \n        // Basic information\n        if (analysis.title) score += 15;\n        if (analysis.description) score += 15;\n        \n        // Analysis completeness\n        const methods = analysis.analysisResults ? Object.keys(analysis.analysisResults) : [];\n        score += methods.length * 10; // 10 points per analysis method\n        \n        // Content richness\n        if (analysis.combinedMetrics?.totalAIMentions > 0) score += 20;\n        if (analysis.technologies && analysis.technologies.length > 0) score += 15;\n        if (analysis.socialLinks && Object.keys(analysis.socialLinks).length > 0) score += 10;\n        \n        return Math.min(score, 100);\n    }\n\n    // Utility methods\n    extractDomain(url) {\n        try {\n            return new URL(url).hostname;\n        } catch (error) {\n            return url;\n        }\n    }\n\n    getRandomUserAgent() {\n        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];\n    }\n\n    async respectRateLimit(identifier) {\n        const now = Date.now();\n        const lastRequest = this.rateLimiter.get(identifier) || 0;\n        const timeSinceLastRequest = now - lastRequest;\n        \n        if (timeSinceLastRequest < this.options.rateLimitMs) {\n            const delay = this.options.rateLimitMs - timeSinceLastRequest;\n            console.log(`⏳ Rate limiting ${identifier}: waiting ${delay}ms...`);\n            await new Promise(resolve => setTimeout(resolve, delay));\n        }\n        \n        this.rateLimiter.set(identifier, Date.now());\n    }\n\n    async saveResults(results, filename = null) {\n        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');\n        const outputFile = filename || `web-analysis-results-${timestamp}.json`;\n        \n        try {\n            await fs.writeFile(outputFile, JSON.stringify(results, null, 2));\n            console.log(`💾 Results saved to: ${outputFile}`);\n        } catch (error) {\n            console.error(`❌ Failed to save results: ${error.message}`);\n        }\n    }\n}\n\nmodule.exports = { CustomWebAnalyzer };
