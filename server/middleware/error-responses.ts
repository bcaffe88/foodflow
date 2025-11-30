/**
 * Centralized Error Response Handler
 * Provides consistent error responses across all routes
 */

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Common error responses
export const ERRORS = {
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Dados inválidos fornecidos',
    statusCode: 400,
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Recurso não encontrado',
    statusCode: 404,
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Não autenticado',
    statusCode: 401,
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Acesso negado',
    statusCode: 403,
  },
  CONFLICT: {
    code: 'CONFLICT',
    message: 'Recurso já existe',
    statusCode: 409,
  },
  RATE_LIMIT: {
    code: 'RATE_LIMIT',
    message: 'Muitas requisições. Tente novamente mais tarde',
    statusCode: 429,
  },
  EXTERNAL_SERVICE_ERROR: {
    code: 'EXTERNAL_SERVICE_ERROR',
    message: 'Serviço externo indisponível',
    statusCode: 503,
  },
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Erro ao acessar banco de dados',
    statusCode: 500,
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Erro interno do servidor',
    statusCode: 500,
  },
};

/**
 * Format error response
 */
export function formatErrorResponse(
  error: unknown,
  customMessage?: string
): ApiErrorResponse {
  let code = ERRORS.INTERNAL_ERROR.code;
  let message = customMessage || ERRORS.INTERNAL_ERROR.message;
  let details: Record<string, any> | undefined;

  if (error instanceof AppError) {
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof Error) {
    message = customMessage || error.message;
    // Log original error for debugging
    console.error(`[Error] ${code}: ${error.message}`, error.stack);
  }

  return {
    error: message,
    code,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Safe async wrapper for routes
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
