import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from 'puppeteer';
import { ScrapingSource, ScrapingSourceConfig } from '../types';

// Import Chromium for serverless (conditional)
let chromium: any;
try {
  chromium = require('@sparticuz/chromium');
  console.log('✅ @sparticuz/chromium loaded successfully');
} catch (e) {
  console.warn('⚠️ @sparticuz/chromium not available:', e.message);
  // @sparticuz/chromium not available, will use regular Puppeteer
}

/**
 * Get Chrome executable path for different environments
 */
function getChromePath(): string | undefined {
  // Check for Vercel/serverless environment variables
  if (process.env.VERCEL || process.env.LAMBDA_TASK_ROOT) {
    // Use chromium on Vercel
    return undefined; // Let Puppeteer use bundled Chromium
  }
  
  // Check common Chrome paths for different platforms
  const possiblePaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/opt/google/chrome/chrome'
  ];
  
  const fs = require('fs');
  for (const path of possiblePaths) {
    try {
      if (fs.existsSync(path)) {
        return path;
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  return undefined;
}

export abstract class BaseScraper {
  protected source: ScrapingSource;
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  protected isInitialized = false;

  constructor(source: ScrapingSource) {
    this.source = source;
  }

  /**
   * Initialize the scraper (launch browser, create page)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log(`🚀 Starting initialization for ${this.source.name}...`);
    const startTime = Date.now();

    try {
      const proxyUrl = (this.source.config as any)?.proxyUrl || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
      // Enhanced launch args for serverless environments
      const launchArgs = [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-features=VizDisplayCompositor',
          '--disable-ipc-flooding-protection',
          '--single-process', // Important for serverless
          '--memory-pressure-off'
        ] as string[];
        
      if (proxyUrl) {
        launchArgs.push(`--proxy-server=${proxyUrl}`);
      }

      // Get Chrome path for the environment
      const chromePath = getChromePath();
      
      const launchOptions: PuppeteerLaunchOptions = {
        headless: this.source.config.useHeadless !== false ? 'new' : false,
        args: launchArgs,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: chromePath,
        timeout: 30000
      };
      
      // Special configuration for serverless environments
      const isServerless = process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.VERCEL_ENV;
      
      if (isServerless) {
        console.log('🔧 Serverless environment detected - using ultra-fast config');
        
        if (chromium) {
          try {
            // Use @sparticuz/chromium with minimal, fast configuration
            const executablePath = await chromium.executablePath();
            console.log('🚀 @sparticuz/chromium path found');
            
            launchOptions.executablePath = executablePath;
            launchOptions.args = [
              // Minimal args for maximum speed and memory efficiency
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--disable-gpu',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              '--disable-extensions',
              '--disable-plugins',
              '--disable-images',
              '--disable-javascript',
              '--disable-default-apps',
              '--disable-sync',
              '--disable-translate',
              '--disable-reading-from-canvas',
              '--disable-permissions-api',
              '--disable-web-security',
              '--single-process',
              '--memory-pressure-off',
              '--max_old_space_size=1024',
              '--js-flags=--max-old-space-size=1024'
            ];
            launchOptions.timeout = 15000; // Reduce timeout for faster failure
            launchOptions.headless = 'new';
            console.log('✅ Ultra-fast serverless config applied');
          } catch (chromiumError) {
            console.error('❌ @sparticuz/chromium failed:', chromiumError);
            throw new Error('Chromium initialization failed in serverless environment');
          }
        } else {
          throw new Error('@sparticuz/chromium not available in serverless environment');
        }
      }

      console.log(`🚀 Launching browser for ${this.source.name}...`);
      if (process.env.VERCEL) {
        console.log('🔧 Vercel environment detected, using bundled Chromium');
      }
      
      // Wrap browser launch in timeout for serverless
      const browserLaunchPromise = puppeteer.launch(launchOptions);
      
      let browser;
      if (isServerless) {
        // 10 second timeout for serverless browser launch
        browser = await Promise.race([
          browserLaunchPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Browser launch timeout (10s)')), 10000)
          )
        ]);
      } else {
        browser = await browserLaunchPromise;
      }
      
      this.browser = browser as any;
      console.log(`✅ Browser launched successfully for ${this.source.name}`);
      
      // Also timeout page creation in serverless
      if (isServerless) {
        this.page = await Promise.race([
          this.browser.newPage(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Page creation timeout (5s)')), 5000)
          )
        ]) as any;
      } else {
        this.page = await this.browser.newPage();
      }
      
      console.log(`📄 New page created for ${this.source.name}`);
      
      // Quick setup for serverless
      if (isServerless) {
        await Promise.race([
          this.setupPage(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Page setup timeout (5s)')), 5000)
          )
        ]);
      } else {
        await this.setupPage();
      }
      
    } catch (error) {
        console.error(`❌ Browser launch failed for ${this.source.name}:`, error.message);
        
        // Multiple fallback strategies for serverless
        if (isServerless) {
          console.log('🔄 Trying serverless fallback configurations...');
          
          // Fallback 1: Try with @sparticuz/chromium if not used yet
          if (chromium && !launchOptions.executablePath?.includes('chromium')) {
            try {
              console.log('🔄 Fallback 1: Forcing @sparticuz/chromium...');
              const fallbackOptions = {
                headless: 'new',
                executablePath: await chromium.executablePath(),
                args: chromium.args,
                timeout: 60000
              };
              this.browser = await puppeteer.launch(fallbackOptions);
              console.log(`✅ Browser launched with @sparticuz/chromium fallback for ${this.source.name}`);
            } catch (chromiumError) {
              console.error('❌ @sparticuz/chromium fallback failed:', chromiumError.message);
              
              // Fallback 2: Minimal serverless config
              console.log('🔄 Fallback 2: Minimal serverless config...');
              const minimalOptions = {
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process'],
                timeout: 60000
              };
              this.browser = await puppeteer.launch(minimalOptions);
              console.log(`✅ Browser launched with minimal fallback for ${this.source.name}`);
            }
          } else {
            // Fallback 2: Minimal serverless config
            console.log('🔄 Fallback: Minimal serverless config...');
            const minimalOptions = {
              headless: 'new',
              args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process'],
              timeout: 60000
            };
            this.browser = await puppeteer.launch(minimalOptions);
            console.log(`✅ Browser launched with minimal fallback for ${this.source.name}`);
          }
        } else {
          throw error;
        }
      }
      
      this.page = await this.browser.newPage();
      console.log(`📄 New page created for ${this.source.name}`);

      // Set user agent
      await this.page.setUserAgent(this.getRandomUserAgent());

      // Set extra headers
      if (this.source.config.headers) {
        await this.page.setExtraHTTPHeaders(this.source.config.headers);
      }

      // Set viewport
      await this.page.setViewport({ width: 1920, height: 1080 });

      this.isInitialized = true;
      
      const elapsed = Date.now() - startTime;
      console.log(`✅ Scraper initialization completed for ${this.source.name} in ${elapsed}ms`);
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`❌ Failed to initialize scraper for ${this.source.name} after ${elapsed}ms:`, error);
      
      // Cleanup on failure
      if (this.browser) {
        try {
          await this.browser.close();
        } catch (cleanupError) {
          console.error(`Cleanup error:`, cleanupError);
        }
      }
      
      throw new Error(`Scraper initialization failed for ${this.source.name}: ${error.message}`);
    }
  }

  /**
   * Setup page with basic configuration
   */
  private async setupPage(): Promise<void> {
    if (!this.page) throw new Error('Page not available');
    
    // Set user agent
    await this.page.setUserAgent(this.getRandomUserAgent());

    // Set extra headers
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9,nl;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });

    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.isInitialized = false;
    } catch (error) {
      console.error(`Error during cleanup for ${this.source.name}:`, error);
    }
  }

  /**
   * Navigate to a URL with retry logic
   */
  async navigateToUrl(url: string, maxRetries: number = 3): Promise<boolean> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        return true;
      } catch (error) {
        console.warn(`Navigation attempt ${attempt} failed for ${url}:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retry
        await this.delay(1000 * attempt);
      }
    }

    return false;
  }

  /**
   * Wait for a selector to appear
   */
  async waitForSelector(selector: string, timeout: number = 10000): Promise<boolean> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract text content from an element
   */
  async extractText(selector: string): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      const element = await this.page.$(selector);
      if (!element) return '';

      const text = await this.page.evaluate(el => el.textContent?.trim() || '', element);
      return text;
    } catch (error) {
      console.warn(`Failed to extract text from ${selector}:`, error);
      return '';
    }
  }

  /**
   * Extract multiple text values from elements
   */
  async extractTextMultiple(selector: string): Promise<string[]> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      const texts = await this.page.evaluate((sel) => {
        const elements = document.querySelectorAll(sel);
        return Array.from(elements).map(el => el.textContent?.trim() || '');
      }, selector);
      
      return texts.filter(text => text.length > 0);
    } catch (error) {
      console.warn(`Failed to extract multiple texts from ${selector}:`, error);
      return [];
    }
  }

  /**
   * Extract attribute value from an element
   */
  async extractAttribute(selector: string, attribute: string): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      const element = await this.page.$(selector);
      if (!element) return '';

      const value = await this.page.evaluate(
        (el, attr) => el.getAttribute(attr) || '', 
        element, 
        attribute
      );
      return value;
    } catch (error) {
      console.warn(`Failed to extract attribute ${attribute} from ${selector}:`, error);
      return '';
    }
    }

  /**
   * Extract href from a link element
   */
  async extractHref(selector: string): Promise<string> {
    return this.extractAttribute(selector, 'href');
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      const element = await this.page.$(selector);
      return element !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Click on an element
   */
  async clickElement(selector: string): Promise<boolean> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      await this.page.click(selector);
      return true;
    } catch (error) {
      console.warn(`Failed to click element ${selector}:`, error);
      return false;
    }
  }

  /**
   * Type text into an input field
   */
  async typeText(selector: string, text: string): Promise<boolean> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      await this.page.type(selector, text);
      return true;
    } catch (error) {
      console.warn(`Failed to type text into ${selector}:`, error);
      return false;
    }
  }

  /**
   * Wait for a delay
   */
  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Take a screenshot (useful for debugging)
   */
  async takeScreenshot(path?: string): Promise<Buffer | null> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      const screenshot = await this.page.screenshot({ 
        fullPage: true,
        path 
      });
      return screenshot as Buffer;
    } catch (error) {
      console.warn('Failed to take screenshot:', error);
      return null;
    }
  }

  /**
   * Get page content
   */
  async getPageContent(): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      return await this.page.content();
    } catch (error) {
      console.warn('Failed to get page content:', error);
      return '';
    }
  }

  /**
   * Execute custom JavaScript on the page
   */
  async executeScript<T>(script: string, ...args: any[]): Promise<T> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      return await this.page.evaluate(script, ...args);
    } catch (error) {
      console.warn('Failed to execute script:', error);
      throw error;
    }
  }

  /**
   * Get random user agent to avoid detection
   */
  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Check if the page has anti-bot protection
   */
  async hasAntiBotProtection(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      const indicators = [
        'captcha',
        'robot',
        'bot',
        'verification',
        'security check',
        'cloudflare',
        'access denied'
      ];

      const content = await this.getPageContent().toLowerCase();
      return indicators.some(indicator => content.includes(indicator));
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for rate limiting
   */
  async waitForRateLimit(): Promise<void> {
    const delay = this.source.config.delay || 1000;
    await this.delay(delay);
  }

  /**
   * Get source configuration
   */
  getSourceConfig(): ScrapingSourceConfig {
    return { ...this.source.config };
  }

  /**
   * Get source name
   */
  getSourceName(): string {
    return this.source.name;
  }

  /**
   * Check if scraper is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.page) return false;
      
      // Try to navigate to a simple page to test connectivity
      await this.page.goto('data:text/html,<html><body>Test</body></html>');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Abstract method that must be implemented by subclasses
   * This is the main scraping logic for each source
   */
  abstract scrapeProduct(searchTerm: string): Promise<any>;

  /**
   * Abstract method for searching products
   */
  abstract searchProducts(query: string): Promise<any[]>;
}
