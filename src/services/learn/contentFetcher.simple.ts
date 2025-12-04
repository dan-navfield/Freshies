/**
 * Learn Content Pipeline - Simple Content Fetcher
 * Fetches content from external sources (simplified version without cheerio)
 */

import { FetchResult, ContentSource } from './types';
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
    const parsed = parseHTMLSimple(html);

    return {
      source_url: source.url,
      source_name: source.name,
      source_type: source.type,
      raw_text: parsed.text,
      raw_html: html,
      title: parsed.title,
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
 * Simple HTML parsing (strips tags)
 */
function parseHTMLSimple(html: string): {
  text: string;
  title: string;
} {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Remove script and style tags
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Clean up whitespace
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .trim();

  return { text: cleaned, title };
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
  // Simple parsing - split by common section indicators
  const sections: Array<{ heading: string; content: string }> = [];
  
  // Split into paragraphs
  const paragraphs = rawText.split(/\n\n+/).filter(p => p.trim().length > 50);
  
  if (paragraphs.length > 0) {
    // Group paragraphs into sections (every 3-4 paragraphs)
    const sectionSize = Math.ceil(paragraphs.length / 3);
    
    for (let i = 0; i < paragraphs.length; i += sectionSize) {
      const sectionParas = paragraphs.slice(i, i + sectionSize);
      sections.push({
        heading: i === 0 ? 'Overview' : `Section ${Math.floor(i / sectionSize) + 1}`,
        content: sectionParas.join('\n\n'),
      });
    }
  } else {
    // Fallback: single section
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
