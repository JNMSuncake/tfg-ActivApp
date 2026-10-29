import { prisma } from '../../config/prisma.js';
import { PermissionCode, RoleDto } from '@activapp/shared';

export class RolesService {
  /**
   * Obtiene todos los roles de la organización activa
   */
  static async getTenantRoles(tenantId: string): Promise<RoleDto[]> {
    const roles = await prisma.role.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' }
    });

    return roles.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      description: r.description,
      permissions: r.permissions as PermissionCode[],
      isSystemDefault: r.isSystemDefault,
      createdAt: r.createdAt.toISOString()
    }));
  }

  /**
   * Crea un rol dinámico para la organización
   */
  static async createCustomRole(
    tenantId: string,
    data: { name: string; description: string; permissions: PermissionCode[] }
  ): Promise<RoleDto> {
    const existing = await prisma.role.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: data.name.trim().toUpperCase()
        }
      }
    });

    if (existing) {
      throw new Error('ROLE_ALREADY_EXISTS');
    }

    const created = await prisma.role.create({
      data: {
        tenantId,
        name: data.name.trim().toUpperCase(),
        description: data.description.trim(),
        permissions: data.permissions,
        isSystemDefault: false
      }
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      name: created.name,
      description: created.description,
      permissions: created.permissions as PermissionCode[],
      isSystemDefault: created.isSystemDefault,
      createdAt: created.createdAt.toISOString()
    };
  }

  /**
   * Actualiza los permisos de un rol no protegido
   */
  static async updateRole(
    tenantId: string,
    roleId: string,
    data: { description?: string; permissions?: PermissionCode[] }
  ): Promise<RoleDto> {
    const role = await prisma.role.findFirst({
      where: { id: roleId, tenantId }
    });

    if (!role) {
      throw new Error('ROLE_NOT_FOUND');
    }

    if (role.isSystemDefault && role.name === 'ADMINISTRADOR') {
      throw new Error('CANNOT_MODIFY_ROOT_ADMIN');
    }

    const updated = await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(data.description ? { description: data.description } : {}),
        ...(data.permissions ? { permissions: data.permissions } : {})
      }
    });

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      name: updated.name,
      description: updated.description,
      permissions: updated.permissions as PermissionCode[],
      isSystemDefault: updated.isSystemDefault,
      createdAt: updated.createdAt.toISOString()
    };
  }
}
