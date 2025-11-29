import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { log } from "./logger";
import { serveStaticFixed } from "./static-server";
import { seedDatabase } from "./seed-index";
import { runMigrations } from "./migrate";
import { rateLimit, csrfProtection } from "./middleware/security";
import { initRedis, closeRedis } from "./middleware/cache";
import { apiLimiter } from "./middleware/rate-limit";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { initializeEmail } from "./services/email-service";

const app = express();

// Ensure app env is set correctly based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
app.set('env', nodeEnv);
// Trust proxy for rate limiting and X-Forwarded-For headers (both dev and prod)
app.set('trust proxy', 1);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Initialize Redis cache
initRedis().catch(err => {
  console.warn("[Cache] Failed to initialize Redis:", err);
});

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Security headers (disable in dev for Vite HMR)
if (nodeEnv === 'production') {
  app.use(helmet());
}

// Middlewares de segurança (disable rate limiting in dev for testing)
if (nodeEnv === 'production') {
  app.use(rateLimit);
  app.use(apiLimiter);
}
app.use(csrfProtection);

// Initialize Email Service
initializeEmail();

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run migrations and then seed database on startup
  await runMigrations();

  try {
    await seedDatabase();
  } catch (err) {
    log("Seed error:", err);
  }

  const server = await registerRoutes(app);

  // Initialize WebSocket for real-time driver updates
  const { driverSocketManager } = await import("./websocket/driver-socket");
  driverSocketManager.initialize(server);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const timestamp = new Date().toISOString();
    
    log(`[${timestamp}] ERROR [${status}]: ${message}`);
    if (err.stack) log(err.stack);

    if (res.headersSent) {
      return;
    }

    res.status(status).json({ 
      error: message,
      status,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const env = app.get("env");
  log(`[Server] Starting in ${env} mode (NODE_ENV=${nodeEnv})`);
  if (env === "development") {
    log("[Server] Setting up Vite dev server...");
    try {
      const { setupVite } = await import("./vite");
      await setupVite(app, server);
    } catch (err) {
      log("[Server] Vite module not available, serving static files");
      serveStaticFixed(app);
    }
  } else {
    log("[Server] Serving static files from dist/public/...");
    serveStaticFixed(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    log("SIGTERM received, closing Redis connection");
    await closeRedis();
    process.exit(0);
  });
})();
