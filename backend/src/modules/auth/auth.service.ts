import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { UserSessionPayload, PermissionCode } from '@activapp/shared';

export interface LoginParams {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserSessionPayload;
}

export class AuthService {
  /**
   * Autenticación con soporte Multi-Tenant
   */
  static async login({ email, password, tenantSlug }: LoginParams): Promise<AuthTokens> {
    const normalizedEmail = email.trim().toLowerCase();

    // Si se especifica el slug del club/esplai, filtramos directamente por él
    let tenantIdFilter: string | undefined = undefined;
    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug }
      });
      if (!tenant) {
        throw new Error('TENANT_NOT_FOUND');
      }
      tenantIdFilter = tenant.id;
    }

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        ...(tenantIdFilter ? { tenantId: tenantIdFilter } : {}),
        isActive: true
      },
      include: {
        tenant: true,
        role: true
      }
    });

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const permissions = user.role.permissions as PermissionCode[];
    const isSystemAdmin = user.role.name === 'ADMINISTRADOR' || permissions.includes('roles:manage');

    const sessionPayload: UserSessionPayload = {
      userId: user.id,
      tenantId: user.tenant.id,
      tenantName: user.tenant.name,
      tenantSlug: user.tenant.slug,
      email: user.email,
      fullName: user.fullName,
      roleId: user.role.id,
      roleName: user.role.name,
      isSystemAdmin,
      permissions
    };

    const accessToken = jwt.sign(sessionPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any
    });

    const refreshToken = jwt.sign(
      { userId: user.id, tenantId: user.tenantId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
    );

    return {
      accessToken,
      refreshToken,
      user: sessionPayload
    };
  }

  /**
   * Refresco de token de acceso
   */
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; user: UserSessionPayload }> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string; tenantId: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          tenant: true,
          role: true
        }
      });

      if (!user || !user.isActive || user.tenantId !== decoded.tenantId) {
        throw new Error('INVALID_TOKEN');
      }

      const permissions = user.role.permissions as PermissionCode[];
      const isSystemAdmin = user.role.name === 'ADMINISTRADOR' || permissions.includes('roles:manage');

      const sessionPayload: UserSessionPayload = {
        userId: user.id,
        tenantId: user.tenant.id,
        tenantName: user.tenant.name,
        tenantSlug: user.tenant.slug,
        email: user.email,
        fullName: user.fullName,
        roleId: user.role.id,
        roleName: user.role.name,
        isSystemAdmin,
        permissions
      };

      const accessToken = jwt.sign(sessionPayload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as any
      });

      return {
        accessToken,
        user: sessionPayload
      };
    } catch {
      throw new Error('INVALID_REFRESH_TOKEN');
    }
  }
}
