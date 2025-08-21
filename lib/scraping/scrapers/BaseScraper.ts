import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from 'puppeteer';
import { ScrapingSource, ScrapingSourceConfig } from '../types';

// Import Chromium for serverless (conditional)
let chromium: any;
try {
  chromium = require('@sparticuz/chromium');
  console.log('✅ @sparticuz/chromium loaded successfully');
} catch (e) {
  console.warn('⚠️ @sparticuz/chromium not available:', e.message);
}

/**
 * Get Chrome executable path for different environments
 */
function getChromePath(): string | undefined {
  // Check for Vercel/serverless environment variables
  if (process.env.VERCEL || process.env.LAMBDA_TASK_ROOT) {
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
      // Special configuration for serverless environments
      const isServerless = process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.VERCEL_ENV;
      
      if (isServerless) {
        console.log('🔧 Serverless environment detected - using conservative config');
        
        // Force use of @sparticuz/chromium for Vercel with ETXTBSY protection
        if (!chromium) {
          throw new Error('❌ @sparticuz/chromium is required for serverless environment but not available');
        }
        
        let executablePath;
        try {
          executablePath = await chromium.executablePath({
            // Use a unique path to avoid ETXTBSY conflicts
            cacheDir: `/tmp/chromium-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          });
        } catch (pathError) {
          // Fallback to default path
          executablePath = await chromium.executablePath();
        }
        
        console.log('✅ Using @sparticuz/chromium executable:', executablePath);
        
        const launchOptions: PuppeteerLaunchOptions = {
          executablePath,
          headless: 'new',
          args: [
            // Use base chromium args but filter out problematic ones
            ...chromium.args.filter((arg: string) => 
              !arg.includes('--disable-extensions') && 
              !arg.includes('--disable-dev-shm-usage')
            ),
            // Add our safe args
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process',
            '--disable-features=VizDisplayCompositor,TranslateUI',
            '--memory-pressure-off',
            '--max_old_space_size=512',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--force-color-profile=srgb',
            '--disable-features=AudioServiceOutOfProcess,TranslateUI,AcceptCHFrame',
            '--allow-running-insecure-content'
          ],
          timeout: 25000 // Aggressive timeout for faster failure
        };
        
        console.log('🔧 Serverless launch options:', { executablePath, argsCount: launchOptions.args?.length });
        
        console.log(`🚀 Launching browser for ${this.source.name}...`);
        const launchStart = Date.now();
        
        // Retry logic for ETXTBSY errors
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          attempts++;
          try {
            console.log(`🔄 Browser launch attempt ${attempts}/${maxAttempts} for ${this.source.name}`);
            
            // Add aggressive timeout for Vercel
            const browserPromise = puppeteer.launch(launchOptions);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Browser launch exceeded 20 seconds')), 20000)
            );
            
            this.browser = await Promise.race([browserPromise, timeoutPromise]) as any;
            const launchTime = Date.now() - launchStart;
            console.log(`✅ Browser launched successfully for ${this.source.name} in ${launchTime}ms (attempt ${attempts})`);
            break; // Success, exit retry loop
            
          } catch (launchError: any) {
            console.warn(`❌ Browser launch attempt ${attempts} failed:`, launchError.message);
            
            if (launchError.code === 'ETXTBSY' && attempts < maxAttempts) {
              console.log(`🔄 ETXTBSY error detected, waiting 2 seconds before retry...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Try with a new executable path for next attempt
              try {
                executablePath = await chromium.executablePath({
                  cacheDir: `/tmp/chromium-retry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                });
                launchOptions.executablePath = executablePath;
                console.log(`🔄 Using new executable path: ${executablePath}`);
              } catch (pathError) {
                console.warn(`⚠️ Could not get new executable path, continuing with existing`);
              }
              continue; // Retry
            } else {
              throw launchError; // Non-retryable error or max attempts reached
            }
          }
        }
        
        this.page = await this.browser.newPage();
        console.log(`📄 New page created for ${this.source.name}`);
        
        // Basic page setup
        await this.page.setUserAgent(this.getRandomUserAgent());
        await this.page.setViewport({ width: 1280, height: 720 });
        
      } else {
        // Local environment - use standard configuration
        const launchOptions: PuppeteerLaunchOptions = {
          headless: this.source.config.useHeadless !== false ? 'new' : false,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ],
          defaultViewport: { width: 1920, height: 1080 },
          timeout: 30000
        };
        
        const chromePath = getChromePath();
        if (chromePath) {
          launchOptions.executablePath = chromePath;
        }
        
        console.log(`🚀 Launching browser for ${this.source.name}...`);
        this.browser = await puppeteer.launch(launchOptions);
        console.log(`✅ Browser launched successfully for ${this.source.name}`);
        
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
      }

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
