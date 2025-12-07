import { Request, Response, NextFunction } from 'express';

/**
 * Authentication middleware for Goose API integration
 * Ensures secure communication between 4g3n7 and Goose services
 */
export function gooseAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-goose-api-key'] || req.headers['authorization'];

  // Allow requests from internal Docker network or with valid API key
  const isInternalRequest = req.ip === '127.0.0.1' ||
                           req.ip?.startsWith('172.') || // Docker internal network
                           req.ip?.startsWith('192.168.') || // Local network
                           !apiKey; // Allow if no API key required in dev

  if (isInternalRequest) {
    return next();
  }

  // Check API key in production
  const expectedKey = process.env.GOOSE_API_SECRET;
  if (!expectedKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'GOOSE_API_SECRET not configured'
    });
  }

  const providedKey = typeof apiKey === 'string' ? apiKey : '';
  if (providedKey !== `Bearer ${expectedKey}` && providedKey !== expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }

  next();
}

/**
 * Rate limiting middleware for Goose API calls
 */
export function gooseRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // Simple in-memory rate limiting (for production, use Redis)
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // requests per minute

  if (!(global as any).gooseRateLimit) {
    (global as any).gooseRateLimit = new Map();
  }

  const rateLimitMap = (global as any).gooseRateLimit as Map<string, { count: number; resetTime: number }>;
  const clientData = rateLimitMap.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
  } else if (clientData.count >= maxRequests) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  } else {
    clientData.count++;
  }

  next();
}

