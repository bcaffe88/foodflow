import type { Express } from 'express';

export function registerHealthCheck(app: Express) {
  app.get('/api/health', (req, res) => {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime),
      environment: process.env.NODE_ENV || 'development',
      database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
      },
      version: '1.0.0',
    });
  });
}
