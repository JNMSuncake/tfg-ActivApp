import { Request, Response, NextFunction } from 'express';
import { PermissionCode } from '@activapp/shared';
import { prisma } from '../config/prisma.js';

/**
 * Guardia RBAC: Comprueba que el usuario autenticado cuente con al menos uno de los permisos requeridos.
 * Los administradores de sistema tienen bypass automático.
 */
export function requirePermission(...requiredPermissions: PermissionCode[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Sesión no iniciada'
      });
      return;
    }

    if (user.isSystemAdmin) {
      return next();
    }

    const hasPermission = requiredPermissions.some((perm) =>
      user.permissions.includes(perm)
    );

    if (!hasPermission) {
      res.status(403).json({
        error: 'FORBIDDEN_INSUFFICIENT_PERMISSIONS',
        message: `Permisos insuficientes. Se requiere uno de: [${requiredPermissions.join(', ')}]`
      });
      return;
    }

    next();
  };
}

/**
 * Control de Acceso Contextual (ABAC) para Fichas Médicas de Menores:
 * Un monitor con 'medical:read_contextual' solo puede ver datos médicos si:
 * 1. Está asignado a la actividad en la que participa el menor.
 * 2. La fecha actual está dentro de la ventana: desde 48h antes del inicio hasta 12h después del fin.
 */
export async function isMedicalContextActiveForUser(
  userId: string,
  tenantId: string,
  childId: string
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 12 * 60 * 60 * 1000); // Hasta 12h después de terminar
  const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);   // Desde 48h antes de empezar

  // Buscar si existe alguna sesión activa/próxima a la que el menor esté inscrito y el monitor asignado
  const activeAssignment = await prisma.activitySession.findFirst({
    where: {
      tenantId,
      startTime: { lte: windowEnd },
      endTime: { gte: windowStart },
      monitors: {
        some: { monitorUserId: userId }
      },
      activity: {
        enrollments: {
          some: {
            childId,
            status: 'CONFIRMED'
          }
        }
      }
    }
  });

  return !!activeAssignment;
}
