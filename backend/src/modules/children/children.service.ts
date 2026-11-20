import { prisma } from '../../config/prisma.js';
import { isMedicalContextActiveForUser } from '../../middlewares/rbacGuard.js';
import { PermissionCode } from '@activapp/shared';

// =====================================================
// Interfaces de entrada
// =====================================================

export interface CreateChildParams {
  tenantId: string;
  fullName: string;
  birthDate: string; // ISO date string (YYYY-MM-DD)
  allergies?: string;
  medicalNotesEncrypted?: string;
  emergencyContact: string;
}

export interface UpdateChildParams {
  fullName?: string;
  birthDate?: string;
  allergies?: string;
  medicalNotesEncrypted?: string;
  emergencyContact?: string;
}

export interface LinkTutorParams {
  tutorUserId: string;
  childId: string;
  relationshipType?: string;
}

// =====================================================
// Servicio de Menores/Participantes
// =====================================================

export class ChildrenService {

  /**
   * Listar menores de un tenant.
   * Los campos médicos se filtran según los permisos del usuario solicitante (ABAC).
   */
  static async listByTenant(
    tenantId: string,
    requestingUserId: string,
    permissions: PermissionCode[]
  ) {
    const children = await prisma.child.findMany({
      where: { tenantId },
      include: {
        tutors: {
          include: {
            tutor: { select: { id: true, fullName: true, email: true, phone: true } }
          }
        },
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    // Filtrado ABAC de datos médicos
    const hasFullMedical = permissions.includes('medical:read_always');
    const hasContextualMedical = permissions.includes('medical:read_contextual');

    const result = await Promise.all(
      children.map(async (child) => {
        let allergies: string | null = null;
        let medicalNotes: string | null = null;
        let isMedicalContextActive = false;

        if (hasFullMedical) {
          // Acceso completo a datos médicos (Administrador)
          allergies = child.allergies;
          medicalNotes = child.medicalNotesEncrypted;
          isMedicalContextActive = true;
        } else if (hasContextualMedical) {
          // Acceso contextual: solo si hay actividad activa con este menor
          isMedicalContextActive = await isMedicalContextActiveForUser(
            requestingUserId, tenantId, child.id
          );
          if (isMedicalContextActive) {
            allergies = child.allergies;
            medicalNotes = child.medicalNotesEncrypted;
          }
        }

        return {
          id: child.id,
          tenantId: child.tenantId,
          fullName: child.fullName,
          birthDate: child.birthDate,
          emergencyContact: child.emergencyContact,
          allergies,
          medicalNotes,
          isMedicalContextActive,
          tutors: child.tutors,
          _count: child._count
        };
      })
    );

    return result;
  }

  /**
   * Obtener un menor por ID con filtrado ABAC
   */
  static async getById(
    tenantId: string,
    childId: string,
    requestingUserId: string,
    permissions: PermissionCode[]
  ) {
    const child = await prisma.child.findFirst({
      where: { id: childId, tenantId },
      include: {
        tutors: {
          include: {
            tutor: { select: { id: true, fullName: true, email: true, phone: true } }
          }
        },
        enrollments: {
          include: {
            activity: { select: { id: true, title: true, type: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!child) {
      throw new Error('CHILD_NOT_FOUND');
    }

    // Filtrado ABAC
    const hasFullMedical = permissions.includes('medical:read_always');
    const hasContextualMedical = permissions.includes('medical:read_contextual');

    let allergies: string | null = null;
    let medicalNotes: string | null = null;
    let isMedicalContextActive = false;

    if (hasFullMedical) {
      allergies = child.allergies;
      medicalNotes = child.medicalNotesEncrypted;
      isMedicalContextActive = true;
    } else if (hasContextualMedical) {
      isMedicalContextActive = await isMedicalContextActiveForUser(
        requestingUserId, tenantId, childId
      );
      if (isMedicalContextActive) {
        allergies = child.allergies;
        medicalNotes = child.medicalNotesEncrypted;
      }
    }

    return {
      ...child,
      allergies,
      medicalNotes: medicalNotes,
      medicalNotesEncrypted: undefined, // Nunca exponer el campo raw
      isMedicalContextActive
    };
  }

  /**
   * Crear un nuevo menor/participante
   */
  static async create(params: CreateChildParams) {
    return prisma.child.create({
      data: {
        tenantId: params.tenantId,
        fullName: params.fullName,
        birthDate: new Date(params.birthDate),
        allergies: params.allergies ?? null,
        medicalNotesEncrypted: params.medicalNotesEncrypted ?? null,
        emergencyContact: params.emergencyContact
      }
    });
  }

  /**
   * Actualizar datos de un menor (validando tenant)
   */
  static async update(tenantId: string, childId: string, params: UpdateChildParams) {
    const existing = await prisma.child.findFirst({
      where: { id: childId, tenantId }
    });

    if (!existing) {
      throw new Error('CHILD_NOT_FOUND');
    }

    return prisma.child.update({
      where: { id: childId },
      data: {
        ...(params.fullName !== undefined && { fullName: params.fullName }),
        ...(params.birthDate !== undefined && { birthDate: new Date(params.birthDate) }),
        ...(params.allergies !== undefined && { allergies: params.allergies }),
        ...(params.medicalNotesEncrypted !== undefined && { medicalNotesEncrypted: params.medicalNotesEncrypted }),
        ...(params.emergencyContact !== undefined && { emergencyContact: params.emergencyContact })
      }
    });
  }

  /**
   * Vincular un tutor legal a un menor
   */
  static async linkTutor(tenantId: string, params: LinkTutorParams) {
    // Verificar que ambos pertenecen al mismo tenant
    const child = await prisma.child.findFirst({
      where: { id: params.childId, tenantId }
    });

    if (!child) {
      throw new Error('CHILD_NOT_FOUND');
    }

    const tutor = await prisma.user.findFirst({
      where: { id: params.tutorUserId, tenantId, isActive: true }
    });

    if (!tutor) {
      throw new Error('TUTOR_USER_NOT_FOUND');
    }

    return prisma.tutorChildRelation.create({
      data: {
        tutorUserId: params.tutorUserId,
        childId: params.childId,
        relationshipType: params.relationshipType ?? 'PADRE_MADRE_TUTOR'
      }
    });
  }

  /**
   * Desvincular un tutor de un menor
   */
  static async unlinkTutor(tenantId: string, tutorUserId: string, childId: string) {
    // Verificar que el menor pertenece al tenant
    const child = await prisma.child.findFirst({
      where: { id: childId, tenantId }
    });

    if (!child) {
      throw new Error('CHILD_NOT_FOUND');
    }

    return prisma.tutorChildRelation.delete({
      where: {
        tutorUserId_childId: { tutorUserId, childId }
      }
    });
  }

  /**
   * Listar menores vinculados a un tutor específico (para vista "Mis Hijos")
   */
  static async listByTutor(tenantId: string, tutorUserId: string) {
    const relations = await prisma.tutorChildRelation.findMany({
      where: { tutorUserId },
      include: {
        child: {
          include: {
            enrollments: {
              where: { status: { in: ['CONFIRMED', 'WAITLISTED'] } },
              include: {
                activity: { select: { id: true, title: true, type: true } }
              }
            }
          }
        }
      }
    });

    // El tutor siempre ve los datos médicos de sus propios hijos
    return relations.map((rel) => ({
      relationId: rel.id,
      relationshipType: rel.relationshipType,
      child: {
        id: rel.child.id,
        fullName: rel.child.fullName,
        birthDate: rel.child.birthDate,
        emergencyContact: rel.child.emergencyContact,
        allergies: rel.child.allergies,
        medicalNotes: rel.child.medicalNotesEncrypted,
        enrollments: rel.child.enrollments
      }
    }));
  }
}
