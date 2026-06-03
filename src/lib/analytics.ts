'use client';

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

/**
 * Custom endpoint for reporting Web Vitals in production.
 * Set this to your analytics/monitoring service URL.
 * Example: process.env.NEXT_PUBLIC_VITALS_ENDPOINT
 */
const VITALS_ENDPOINT = process.env.NEXT_PUBLIC_VITALS_ENDPOINT;

/**
 * Report a single Web Vital metric.
 * - Development: logs to console with color-coded rating
 * - Production: sends to custom endpoint if configured
 */
function reportMetric(metric: Metric): void {
  const { name, value, rating, id } = metric;

  if (process.env.NODE_ENV === 'development') {
    const ratingEmoji =
      rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
    console.log(
      `[Web Vitals] ${ratingEmoji} ${name}: ${value.toFixed(name === 'CLS' ? 4 : 0)}${name === 'CLS' ? '' : 'ms'} (${rating})`,
    );
    return;
  }

  // Production: send to custom endpoint
  if (VITALS_ENDPOINT) {
    const body = JSON.stringify({
      name,
      value,
      rating,
      id,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });

    // Use sendBeacon for non-blocking delivery; fall back to fetch
    if (navigator.sendBeacon) {
      navigator.sendBeacon(VITALS_ENDPOINT, body);
    } else {
      fetch(VITALS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        // Silently ignore reporting failures
      });
    }
  }
}

/**
 * Initialize Web Vitals monitoring.
 * Call this once in your app's entry point (providers / layout).
 */
export function reportWebVitals(): void {
  onCLS(reportMetric);
  onFCP(reportMetric);
  onINP(reportMetric);
  onLCP(reportMetric);
  onTTFB(reportMetric);
}
