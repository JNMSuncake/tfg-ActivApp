import { prisma } from '../../config/prisma.js';

// =====================================================
// Interfaces de entrada
// =====================================================

export interface EnrollChildParams {
  tenantId: string;
  activityId: string;
  childId: string;
}

// =====================================================
// Servicio de Inscripciones — Máquina de estados y lista de espera
// =====================================================

export class EnrollmentsService {

  /**
   * Inscribir a un participante en una actividad.
   * Si hay plaza → CONFIRMED
   * Si aforo lleno → WAITLISTED (con posición en cola)
   */
  static async enroll(params: EnrollChildParams) {
    const { tenantId, activityId, childId } = params;

    // 1. Verificar que la actividad existe y pertenece al tenant
    const activity = await prisma.activity.findFirst({
      where: { id: activityId, tenantId }
    });

    if (!activity) {
      throw new Error('ACTIVITY_NOT_FOUND');
    }

    // 2. Verificar que el menor pertenece al mismo tenant
    const child = await prisma.child.findFirst({
      where: { id: childId, tenantId }
    });

    if (!child) {
      throw new Error('CHILD_NOT_FOUND');
    }

    // 3. Verificar rango de edad (si está definido)
    if (activity.minAge || activity.maxAge) {
      const age = EnrollmentsService.calculateAge(child.birthDate);
      if (activity.minAge && age < activity.minAge) {
        throw new Error('CHILD_TOO_YOUNG');
      }
      if (activity.maxAge && age > activity.maxAge) {
        throw new Error('CHILD_TOO_OLD');
      }
    }

    // 4. Verificar que no esté ya inscrito
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { activityId_childId: { activityId, childId } }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'CANCELLED') {
        // Re-inscripción tras cancelación: actualizamos el registro existente
        return EnrollmentsService.reEnroll(existingEnrollment.id, tenantId, activityId, activity.maxCapacity);
      }
      throw new Error('ALREADY_ENROLLED');
    }

    // 5. Contar plazas confirmadas actuales
    const confirmedCount = await prisma.enrollment.count({
      where: { activityId, status: 'CONFIRMED' }
    });

    const hasCapacity = confirmedCount < activity.maxCapacity;

    // 6. Crear inscripción con el estado adecuado
    if (hasCapacity) {
      return prisma.enrollment.create({
        data: {
          tenantId,
          activityId,
          childId,
          status: 'CONFIRMED',
          waitlistPosition: null
        },
        include: {
          activity: { select: { id: true, title: true } },
          child: { select: { id: true, fullName: true } }
        }
      });
    } else {
      // Calcular posición en lista de espera
      const lastWaitlisted = await prisma.enrollment.findFirst({
        where: { activityId, status: 'WAITLISTED' },
        orderBy: { waitlistPosition: 'desc' }
      });
      const nextPosition = (lastWaitlisted?.waitlistPosition ?? 0) + 1;

      return prisma.enrollment.create({
        data: {
          tenantId,
          activityId,
          childId,
          status: 'WAITLISTED',
          waitlistPosition: nextPosition
        },
        include: {
          activity: { select: { id: true, title: true } },
          child: { select: { id: true, fullName: true } }
        }
      });
    }
  }

  /**
   * Re-inscripción: un registro previamente cancelado vuelve a activarse
   */
  private static async reEnroll(
    enrollmentId: string,
    tenantId: string,
    activityId: string,
    maxCapacity: number
  ) {
    const confirmedCount = await prisma.enrollment.count({
      where: { activityId, status: 'CONFIRMED' }
    });

    const hasCapacity = confirmedCount < maxCapacity;

    if (hasCapacity) {
      return prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'CONFIRMED', waitlistPosition: null },
        include: {
          activity: { select: { id: true, title: true } },
          child: { select: { id: true, fullName: true } }
        }
      });
    } else {
      const lastWaitlisted = await prisma.enrollment.findFirst({
        where: { activityId, status: 'WAITLISTED' },
        orderBy: { waitlistPosition: 'desc' }
      });
      const nextPosition = (lastWaitlisted?.waitlistPosition ?? 0) + 1;

      return prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'WAITLISTED', waitlistPosition: nextPosition },
        include: {
          activity: { select: { id: true, title: true } },
          child: { select: { id: true, fullName: true } }
        }
      });
    }
  }

  /**
   * Cancelar inscripción y promover automáticamente al primer participante en lista de espera
   */
  static async cancel(tenantId: string, enrollmentId: string) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, tenantId }
    });

    if (!enrollment) {
      throw new Error('ENROLLMENT_NOT_FOUND');
    }

    if (enrollment.status === 'CANCELLED') {
      throw new Error('ALREADY_CANCELLED');
    }

    const wasConfirmed = enrollment.status === 'CONFIRMED';

    // Cancelar la inscripción
    const cancelled = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'CANCELLED', waitlistPosition: null },
      include: {
        activity: { select: { id: true, title: true } },
        child: { select: { id: true, fullName: true } }
      }
    });

    // Si era una plaza confirmada → promover al primero de la lista de espera
    let promoted = null;
    if (wasConfirmed) {
      promoted = await EnrollmentsService.promoteFirstWaitlisted(enrollment.activityId);
    }

    return { cancelled, promoted };
  }

  /**
   * Promover al primer participante en lista de espera a CONFIRMED
   */
  private static async promoteFirstWaitlisted(activityId: string) {
    const firstWaiting = await prisma.enrollment.findFirst({
      where: { activityId, status: 'WAITLISTED' },
      orderBy: { waitlistPosition: 'asc' }
    });

    if (!firstWaiting) {
      return null; // No hay nadie en lista de espera
    }

    const promoted = await prisma.enrollment.update({
      where: { id: firstWaiting.id },
      data: { status: 'CONFIRMED', waitlistPosition: null },
      include: {
        child: { select: { id: true, fullName: true } },
        activity: { select: { id: true, title: true } }
      }
    });

    // Reordenar posiciones de la lista de espera restante
    const remainingWaitlisted = await prisma.enrollment.findMany({
      where: { activityId, status: 'WAITLISTED' },
      orderBy: { waitlistPosition: 'asc' }
    });

    for (let i = 0; i < remainingWaitlisted.length; i++) {
      await prisma.enrollment.update({
        where: { id: remainingWaitlisted[i].id },
        data: { waitlistPosition: i + 1 }
      });
    }

    return promoted;
  }

  /**
   * Listar inscripciones de una actividad
   */
  static async listByActivity(tenantId: string, activityId: string) {
    return prisma.enrollment.findMany({
      where: { tenantId, activityId },
      include: {
        child: {
          select: { id: true, fullName: true, birthDate: true, emergencyContact: true }
        }
      },
      orderBy: [
        { status: 'asc' }, // CONFIRMED primero, luego WAITLISTED
        { waitlistPosition: 'asc' },
        { createdAt: 'asc' }
      ]
    });
  }

  /**
   * Listar inscripciones de un menor específico
   */
  static async listByChild(tenantId: string, childId: string) {
    return prisma.enrollment.findMany({
      where: { tenantId, childId },
      include: {
        activity: {
          select: { id: true, title: true, type: true, maxCapacity: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Calcular la edad a partir de la fecha de nacimiento
   */
  private static calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
