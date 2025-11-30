/**
 * Error Tracking Service
 * Logs errors para análise e debugging
 */

interface TrackedError {
  id: string;
  code: string;
  message: string;
  details?: Record<string, any>;
  route: string;
  method: string;
  userId?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// In-memory error log (production: migrar para DB)
const errorLog: TrackedError[] = [];
const ERROR_LOG_LIMIT = 1000;

export function trackError(
  code: string,
  message: string,
  route: string,
  method: string,
  details?: Record<string, any>,
  userId?: string
): TrackedError {
  const error: TrackedError = {
    id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    code,
    message,
    details,
    route,
    method,
    userId,
    timestamp: new Date(),
    severity: getSeverity(code),
  };

  errorLog.push(error);
  
  // Keep log size under control
  if (errorLog.length > ERROR_LOG_LIMIT) {
    errorLog.shift();
  }

  // Log to console for development
  console.error(`[Error Tracked] ${code}: ${message}`, {
    route,
    method,
    userId,
    severity: error.severity,
  });

  return error;
}

function getSeverity(code: string): 'low' | 'medium' | 'high' | 'critical' {
  const critical = ['DATABASE_ERROR', 'EXTERNAL_SERVICE_ERROR'];
  const high = ['VALIDATION_ERROR', 'CONFLICT', 'UNAUTHORIZED'];
  const medium = ['NOT_FOUND', 'RATE_LIMIT'];
  
  if (critical.includes(code)) return 'critical';
  if (high.includes(code)) return 'high';
  if (medium.includes(code)) return 'medium';
  return 'low';
}

export function getErrorStats() {
  const stats = {
    total: errorLog.length,
    byCode: {} as Record<string, number>,
    bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
    recent: errorLog.slice(-20),
  };

  errorLog.forEach(err => {
    stats.byCode[err.code] = (stats.byCode[err.code] || 0) + 1;
    stats.bySeverity[err.severity]++;
  });

  return stats;
}

export function getErrorsByCode(code: string, limit = 50) {
  return errorLog.filter(e => e.code === code).slice(-limit);
}

export function getRecentErrors(limit = 50) {
  return errorLog.slice(-limit);
}

export function clearErrorLog() {
  errorLog.length = 0;
}
