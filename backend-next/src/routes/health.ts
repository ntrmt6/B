import { Router } from 'express';
import os from 'os';
import { execSync } from 'child_process';
import { getDatabase } from '../db/mongo';
import { getCacheStats, flushAllCache } from '../services/redisCache';
import { authenticateToken, requireRole } from '../middleware/auth';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res, next) => {
  try {
    const health: {
      status: string;
      timestamp: string;
      services: { mongodb: string; redis: string };
      cache: { memoryEntries: number; redisConnected: boolean };
      server: { cpuUsage: number; memoryUsage: number; diskUsage: number; uptime: string };
    } = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: 'unknown',
        redis: 'unknown'
      },
      cache: {
        memoryEntries: 0,
        redisConnected: false
      },
      server: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        uptime: ''
      }
    };

    // Check MongoDB (with timeout to prevent hanging)
    try {
      const db = await getDatabase();
      const pingPromise = db.admin().ping();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB ping timeout')), 5000)
      );
      await Promise.race([pingPromise, timeoutPromise]);
      health.services.mongodb = 'connected';
    } catch (error) {
      health.services.mongodb = 'disconnected';
      health.status = 'degraded';
    }

    // Check Redis and get cache stats
    try {
      const cacheStats = getCacheStats();
      health.cache = cacheStats;
      health.services.redis = cacheStats.redisConnected ? 'connected' : 'disconnected';
      if (!cacheStats.redisConnected) {
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.redis = 'error';
      health.status = 'degraded';
    }

    // Server metrics using Node.js os module
    try {
      // CPU usage: average across all cores
      const cpus = os.cpus();
      let totalIdle = 0, totalTick = 0;
      for (const cpu of cpus) {
        for (const type of Object.keys(cpu.times) as Array<keyof typeof cpu.times>) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      }
      const cpuUsage = Math.round((1 - totalIdle / totalTick) * 100);

      // Memory usage
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

      // Disk usage: best-effort using /tmp stat (works on Linux)
      let diskUsage = 0;
      try {
        const dfOutput = execSync("df / --output=pcent 2>/dev/null | tail -1", { encoding: 'utf8', timeout: 3000 });
        diskUsage = parseInt(dfOutput.trim().replace('%', ''), 10) || 0;
      } catch {
        // Fallback - disk usage not available
        diskUsage = 0;
      }

      // Uptime formatting
      const uptimeSeconds = os.uptime();
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const uptime = days > 0
        ? `${days}d ${hours}h ${minutes}m`
        : hours > 0
          ? `${hours}h ${minutes}m`
          : `${minutes}m`;

      health.server = { cpuUsage, memoryUsage, diskUsage, uptime };
    } catch (error) {
      // Server metrics not critical - keep defaults
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    next(error);
  }
});

// POST /health/cache/flush - Flush all caches (super_admin only)
healthRouter.post('/cache/flush', authenticateToken, requireRole('super_admin'), async (_req, res, next) => {
  try {
    const result = await flushAllCache();
    res.json({
      message: 'Cache flushed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});
