import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserSessionPayload } from '@activapp/shared';

// Extender la interfaz Request de Express para incluir la sesión del usuario
declare global {
  namespace Express {
    interface Request {
      user?: UserSessionPayload;
      tenantId?: string;
    }
  }
}

/**
 * Middleware de Autenticación y Contexto Multi-Tenant.
 * Extrae y valida el token JWT del encabezado Authorization.
 * Inyecta estrictamente el tenantId y el usuario en el objeto Request.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Cabecera Authorization ausente o formato Bearer inválido'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as UserSessionPayload;
    
    // Regla de oro de seguridad: Validar que el tenantId del token coincida si viene en params
    if (req.params.tenantId && req.params.tenantId !== decoded.tenantId) {
      res.status(403).json({
        error: 'FORBIDDEN_CROSS_TENANT',
        message: 'Acceso denegado: intento de acceso cruzado entre organizaciones'
      });
      return;
    }

    req.user = decoded;
    req.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Token JWT expirado o firma inválida'
    });
  }
}
