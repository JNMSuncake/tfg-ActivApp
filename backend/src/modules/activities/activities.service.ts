import { prisma } from '../../config/prisma.js';
import { ActivityType } from '@activapp/shared';

// =====================================================
// Interfaces de entrada para el servicio de actividades
// =====================================================

export interface CreateActivityParams {
  tenantId: string;
  title: string;
  description: string;
  type: ActivityType;
  maxCapacity: number;
  minAge?: number;
  maxAge?: number;
  requiresAuthorization?: boolean;
  requiredMaterial?: { id: string; name: string; isMandatory: boolean; notes?: string }[];
  priceCents?: number;
}

export interface UpdateActivityParams {
  title?: string;
  description?: string;
  type?: ActivityType;
  maxCapacity?: number;
  minAge?: number | null;
  maxAge?: number | null;
  requiresAuthorization?: boolean;
  requiredMaterial?: { id: string; name: string; isMandatory: boolean; notes?: string }[];
  priceCents?: number;
}

export interface CreateSessionParams {
  tenantId: string;
  activityId: string;
  startTime: Date;
  endTime: Date;
  location: string;
  sharedNotes?: string;
}

// =====================================================
// Servicio de Actividades — Lógica de negocio
// =====================================================

export class ActivitiesService {

  /**
   * Listar todas las actividades de un tenant, con conteo de inscritos
   */
  static async listByTenant(tenantId: string) {
    return prisma.activity.findMany({
      where: { tenantId },
      include: {
        sessions: {
          orderBy: { startTime: 'asc' }
        },
        _count: {
          select: {
            enrollments: {
              where: { status: 'CONFIRMED' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Obtener una actividad por ID (con validación de tenant)
   */
  static async getById(tenantId: string, activityId: string) {
    const activity = await prisma.activity.findFirst({
      where: { id: activityId, tenantId },
      include: {
        sessions: {
          orderBy: { startTime: 'asc' },
          include: {
            monitors: true,
            _count: { select: { attendances: true } }
          }
        },
        enrollments: {
          include: { child: true },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            enrollments: { where: { status: 'CONFIRMED' } }
          }
        }
      }
    });

    if (!activity) {
      throw new Error('ACTIVITY_NOT_FOUND');
    }

    return activity;
  }

  /**
   * Crear una nueva actividad
   */
  static async create(params: CreateActivityParams) {
    return prisma.activity.create({
      data: {
        tenantId: params.tenantId,
        title: params.title,
        description: params.description,
        type: params.type,
        maxCapacity: params.maxCapacity,
        minAge: params.minAge ?? null,
        maxAge: params.maxAge ?? null,
        requiresAuthorization: params.requiresAuthorization ?? false,
        requiredMaterial: params.requiredMaterial ?? [],
        priceCents: params.priceCents ?? 0
      },
      include: { sessions: true }
    });
  }

  /**
   * Actualizar una actividad existente (validando tenant)
   */
  static async update(tenantId: string, activityId: string, params: UpdateActivityParams) {
    // Verificar que existe y pertenece al tenant
    const existing = await prisma.activity.findFirst({
      where: { id: activityId, tenantId }
    });

    if (!existing) {
      throw new Error('ACTIVITY_NOT_FOUND');
    }

    return prisma.activity.update({
      where: { id: activityId },
      data: {
        ...(params.title !== undefined && { title: params.title }),
        ...(params.description !== undefined && { description: params.description }),
        ...(params.type !== undefined && { type: params.type }),
        ...(params.maxCapacity !== undefined && { maxCapacity: params.maxCapacity }),
        ...(params.minAge !== undefined && { minAge: params.minAge }),
        ...(params.maxAge !== undefined && { maxAge: params.maxAge }),
        ...(params.requiresAuthorization !== undefined && { requiresAuthorization: params.requiresAuthorization }),
        ...(params.requiredMaterial !== undefined && { requiredMaterial: params.requiredMaterial }),
        ...(params.priceCents !== undefined && { priceCents: params.priceCents })
      },
      include: { sessions: true }
    });
  }

  /**
   * Eliminar una actividad (siempre y cuando no haya pasado ya en el tiempo)
   */
  static async delete(tenantId: string, activityId: string) {
    const activity = await prisma.activity.findFirst({
      where: { id: activityId, tenantId },
      include: {
        sessions: true,
        _count: {
          select: { enrollments: { where: { status: 'CONFIRMED' } } }
        }
      }
    });

    if (!activity) {
      throw new Error('ACTIVITY_NOT_FOUND');
    }

    // Regla de Negocio: No se pueden eliminar actividades que ya se hayan celebrado (pasadas)
    const now = new Date();
    const hasPastSession = activity.sessions.some(s => new Date(s.startTime) < now);
    if (hasPastSession) {
      throw new Error('CANNOT_DELETE_PAST_ACTIVITY');
    }

    return prisma.activity.delete({
      where: { id: activityId }
    });
  }

  // =============================================================
  // Sesiones de Actividad
  // =============================================================

  /**
   * Crear una sesión para una actividad existente
   */
  static async createSession(params: CreateSessionParams) {
    // Verificar que la actividad existe y pertenece al tenant
    const activity = await prisma.activity.findFirst({
      where: { id: params.activityId, tenantId: params.tenantId }
    });

    if (!activity) {
      throw new Error('ACTIVITY_NOT_FOUND');
    }

    return prisma.activitySession.create({
      data: {
        tenantId: params.tenantId,
        activityId: params.activityId,
        startTime: params.startTime,
        endTime: params.endTime,
        location: params.location,
        sharedNotes: params.sharedNotes ?? null
      }
    });
  }

  /**
   * Listar sesiones de una actividad
   */
  static async listSessions(tenantId: string, activityId: string) {
    return prisma.activitySession.findMany({
      where: { tenantId, activityId },
      include: {
        monitors: true,
        _count: { select: { attendances: true } }
      },
      orderBy: { startTime: 'asc' }
    });
  }

  /**
   * Asignar un monitor a una sesión
   */
  static async assignMonitor(tenantId: string, sessionId: string, monitorUserId: string) {
    // Verificar que la sesión pertenece al tenant
    const session = await prisma.activitySession.findFirst({
      where: { id: sessionId, tenantId }
    });

    if (!session) {
      throw new Error('SESSION_NOT_FOUND');
    }

    // Verificar que el usuario monitor pertenece al mismo tenant
    const monitor = await prisma.user.findFirst({
      where: { id: monitorUserId, tenantId, isActive: true }
    });

    if (!monitor) {
      throw new Error('MONITOR_USER_NOT_FOUND');
    }

    return prisma.activityMonitorAssignment.create({
      data: {
        sessionId,
        monitorUserId
      }
    });
  }

  /**
   * Desasignar un monitor de una sesión
   */
  static async removeMonitor(tenantId: string, sessionId: string, monitorUserId: string) {
    const session = await prisma.activitySession.findFirst({
      where: { id: sessionId, tenantId }
    });

    if (!session) {
      throw new Error('SESSION_NOT_FOUND');
    }

    return prisma.activityMonitorAssignment.delete({
      where: {
        sessionId_monitorUserId: { sessionId, monitorUserId }
      }
    });
  }
}
