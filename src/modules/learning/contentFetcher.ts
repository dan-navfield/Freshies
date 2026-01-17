/**
 * Learn Content Pipeline - Content Fetcher
 * Fetches and parses content from external sources
 */

import { FetchResult, ContentSource, SourceMetadata } from './types';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

// ============================================================================
// Content Fetching
// ============================================================================

/**
 * Fetch content from a source URL
 */
export async function fetchSourceContent(source: ContentSource): Promise<FetchResult> {
  try {
    console.log(`Fetching content from: ${source.name}`);
    
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Freshies Content Bot/1.0 (Educational Content Aggregation)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const parsed = parseHTML(html, source);

    return {
      source_url: source.url,
      source_name: source.name,
      source_type: source.type,
      raw_text: parsed.text,
      raw_html: html,
      title: parsed.title,
      publication_date: parsed.metadata.publication_date,
      author: parsed.metadata.author,
      success: true,
    };
  } catch (error) {
    console.error(`Error fetching ${source.name}:`, error);
    
    return {
      source_url: source.url,
      source_name: source.name,
      source_type: source.type,
      raw_text: '',
      title: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse HTML content using cheerio
 */
function parseHTML(html: string, source: ContentSource): {
  text: string;
  title: string;
  metadata: SourceMetadata;
} {
  const $ = cheerio.load(html);
  
  // Use selector config if available
  const config = source.selector_config;
  
  // Extract title
  let title = '';
  if (config?.title_selector) {
    title = $(config.title_selector).first().text().trim();
  } else {
    title = $('h1').first().text().trim() || $('title').text().trim();
  }

  // Extract main content
  let contentElement;
  if (config?.content_selector) {
    contentElement = $(config.content_selector);
  } else {
    // Fallback: try common content selectors
    contentElement = $('article, main, .content, .article-content').first();
  }

  // Remove excluded elements
  if (config?.exclude_selectors) {
    config.exclude_selectors.forEach(selector => {
      contentElement.find(selector).remove();
    });
  }

  // Always remove common unwanted elements
  contentElement.find('script, style, nav, footer, .advertisement, .ad, .sidebar').remove();

  // Extract text while preserving structure
  const text = extractStructuredText(contentElement);

  // Extract metadata
  const metadata: SourceMetadata = {
    title,
  };

  if (config?.date_selector) {
    const dateText = $(config.date_selector).first().text().trim();
    if (dateText) {
      metadata.publication_date = new Date(dateText);
    }
  }

  if (config?.author_selector) {
    metadata.author = $(config.author_selector).first().text().trim();
  }

  return { text, title, metadata };
}

/**
 * Extract structured text from HTML element
 * Preserves headings and paragraph structure
 */
function extractStructuredText(element: cheerio.Cheerio): string {
  const lines: string[] = [];

  element.find('h1, h2, h3, h4, h5, h6, p, li, div').each((_: number, el: cheerio.Element) => {
    const $el = cheerio.load(el);
    const text = $el.text().trim();
    
    if (text) {
      const tagName = el.tagName?.toLowerCase();
      
      // Add markdown-style formatting for headings
      if (tagName?.startsWith('h')) {
        const level = parseInt(tagName[1]);
        lines.push('\n' + '#'.repeat(level) + ' ' + text + '\n');
      } else if (tagName === 'li') {
        lines.push('- ' + text);
      } else {
        lines.push(text);
      }
    }
  });

  return lines.join('\n').trim();
}

// ============================================================================
// Content Parsing
// ============================================================================

/**
 * Parse raw content into structured sections
 */
export function parseRawContent(rawText: string, title: string): {
  title: string;
  sections: Array<{ heading: string; content: string }>;
} {
  const lines = rawText.split('\n');
  const sections: Array<{ heading: string; content: string }> = [];
  
  let currentHeading = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if line is a heading (starts with #)
    if (trimmed.startsWith('#')) {
      // Save previous section
      if (currentHeading && currentContent.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join('\n').trim(),
        });
      }
      
      // Start new section
      currentHeading = trimmed.replace(/^#+\s*/, '');
      currentContent = [];
    } else if (trimmed) {
      currentContent.push(trimmed);
    }
  }

  // Save last section
  if (currentHeading && currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join('\n').trim(),
    });
  }

  // If no sections found, create one from all content
  if (sections.length === 0 && rawText.trim()) {
    sections.push({
      heading: 'Overview',
      content: rawText.trim(),
    });
  }

  return { title, sections };
}

// ============================================================================
// Hashing & Change Detection
// ============================================================================

/**
 * Generate hash of content for change detection
 */
export function hashContent(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

/**
 * Check if content has changed
 */
export function hasContentChanged(
  newHash: string,
  existingHash: string | undefined
): boolean {
  if (!existingHash) return true;
  return newHash !== existingHash;
}

// ============================================================================
// Batch Fetching
// ============================================================================

/**
 * Fetch multiple sources in parallel
 */
export async function fetchMultipleSources(
  sources: ContentSource[],
  maxConcurrent: number = 3
): Promise<FetchResult[]> {
  const results: FetchResult[] = [];
  
  // Process in batches to avoid overwhelming servers
  for (let i = 0; i < sources.length; i += maxConcurrent) {
    const batch = sources.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(source => fetchSourceContent(source))
    );
    results.push(...batchResults);
    
    // Small delay between batches to be respectful
    if (i + maxConcurrent < sources.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// ============================================================================
// Content Validation
// ============================================================================

/**
 * Validate fetched content
 */
export function validateFetchedContent(result: FetchResult): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!result.success) {
    issues.push('Fetch failed');
    return { valid: false, issues };
  }

  if (!result.title || result.title.length < 5) {
    issues.push('Title too short or missing');
  }

  if (!result.raw_text || result.raw_text.length < 100) {
    issues.push('Content too short (< 100 characters)');
  }

  if (result.raw_text.includes('404') || result.raw_text.includes('Page not found')) {
    issues.push('Possible 404 page');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Fetch with retry logic
 */
export async function fetchWithRetry(
  source: ContentSource,
  maxRetries: number = 3,
  delayMs: number = 2000
): Promise<FetchResult> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchSourceContent(source);
      
      if (result.success) {
        return result;
      }
      
      lastError = new Error(result.error || 'Unknown error');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
    }
    
    if (attempt < maxRetries) {
      console.log(`Retry ${attempt}/${maxRetries} for ${source.name} in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
  
  return {
    source_url: source.url,
    source_name: source.name,
    source_type: source.type,
    raw_text: '',
    title: '',
    success: false,
    error: lastError?.message || 'Max retries exceeded',
  };
}
