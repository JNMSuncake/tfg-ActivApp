/**
 * ActivApp - Tipos y Definiciones de Roles y Permisos (RBAC Dinámico + ABAC Contextual)
 */

export type BaseSystemRole = 'ADMIN' | 'MONITOR' | 'TUTOR_LEGAL';

export type PermissionCode =
  // Gestión de Entidades / Clubes
  | 'tenants:read'
  | 'tenants:update'
  
  // Roles y Permisos Dinámicos
  | 'roles:read'
  | 'roles:manage'

  // Usuarios del Club
  | 'users:read'
  | 'users:invite'
  | 'users:manage'

  // Actividades y Planificación
  | 'activities:create'
  | 'activities:read'
  | 'activities:update'
  | 'activities:delete'

  // Control de Asistencia
  | 'attendance:read'
  | 'attendance:take'
  | 'attendance:override'

  // Fichas Médicas y Protección RGPD (ABAC)
  | 'medical:read_always'
  | 'medical:read_contextual'

  // Inscripciones y Finanzas
  | 'enrollments:read'
  | 'enrollments:manage'
  | 'payments:read'
  | 'payments:validate'

  // LegalTech y Autorizaciones
  | 'authorizations:create'
  | 'authorizations:sign'
  | 'authorizations:verify'
  | 'authorizations:download'

  // Comunicación Interna y Avisos
  | 'messages:broadcast'
  | 'messages:direct'
  | 'messages:read';

export interface RoleDto {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  permissions: PermissionCode[];
  isSystemDefault: boolean;
  createdAt: string;
}

export interface UserSessionPayload {
  userId: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  email: string;
  fullName: string;
  roleId: string;
  roleName: string;
  isSystemAdmin: boolean;
  permissions: PermissionCode[];
}
