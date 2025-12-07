/**
 * Rate limiter for Google Gemini API (Free Tier)
 * Free tier limits:
 * - 15 requests per minute (Gemini 2.0 Flash)
 * - 1,000,000 tokens per minute
 * - 1,500 requests per day
 */

class GeminiRateLimiter {
  constructor() {
    // Track requests
    this.requestTimestamps = [];
    this.dailyRequestCount = 0;
    this.lastResetDate = new Date().toDateString();
    
    // Free tier limits
    this.MAX_RPM = 15;           // Requests per minute
    this.MAX_RPD = 1500;         // Requests per day
    this.MINUTE_MS = 60 * 1000;  // 1 minute in milliseconds
  }

  /**
   * Check if we can make a request
   * Returns { allowed: boolean, waitTime: number }
   */
  canMakeRequest() {
    const now = Date.now();
    const currentDate = new Date().toDateString();

    // Reset daily counter if it's a new day
    if (currentDate !== this.lastResetDate) {
      this.dailyRequestCount = 0;
      this.lastResetDate = currentDate;
    }

    // Check daily limit
    if (this.dailyRequestCount >= this.MAX_RPD) {
      return { 
        allowed: false, 
        waitTime: this.getTimeUntilMidnight(),
        reason: 'Daily limit reached (1500 requests/day)'
      };
    }

    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.MINUTE_MS
    );

    // Check per-minute limit
    if (this.requestTimestamps.length >= this.MAX_RPM) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = this.MINUTE_MS - (now - oldestRequest);
      return { 
        allowed: false, 
        waitTime: Math.ceil(waitTime / 1000),
        reason: 'Rate limit: 15 requests/minute'
      };
    }

    return { allowed: true, waitTime: 0 };
  }

  /**
   * Record a successful request
   */
  recordRequest() {
    this.requestTimestamps.push(Date.now());
    this.dailyRequestCount++;
  }

  /**
   * Get time until midnight (for daily reset)
   */
  getTimeUntilMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return Math.ceil((tomorrow - now) / 1000);
  }

  /**
   * Get current usage stats
   */
  getStats() {
    const now = Date.now();
    const recentRequests = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.MINUTE_MS
    ).length;

    return {
      requestsThisMinute: recentRequests,
      requestsToday: this.dailyRequestCount,
      dailyLimitRemaining: this.MAX_RPD - this.dailyRequestCount,
      minuteLimitRemaining: this.MAX_RPM - recentRequests
    };
  }
}

// Export singleton instance
module.exports = new GeminiRateLimiter();
