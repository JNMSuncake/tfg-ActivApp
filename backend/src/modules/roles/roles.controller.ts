import { Request, Response } from 'express';
import { RolesService } from './roles.service.js';

export class RolesController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const roles = await RolesService.getTenantRoles(req.tenantId!);
      res.json({ roles });
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, permissions } = req.body;
      if (!name || !description || !Array.isArray(permissions)) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'Nombre, descripción y array de permisos requeridos'
        });
        return;
      }

      const role = await RolesService.createCustomRole(req.tenantId!, {
        name,
        description,
        permissions
      });

      res.status(201).json({ role });
    } catch (error: any) {
      if (error.message === 'ROLE_ALREADY_EXISTS') {
        res.status(409).json({ error: 'CONFLICT', message: 'Ya existe un rol con ese nombre en este club' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { description, permissions } = req.body;

      const role = await RolesService.updateRole(req.tenantId!, id, {
        description,
        permissions
      });

      res.json({ role });
    } catch (error: any) {
      if (error.message === 'ROLE_NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Rol no encontrado' });
        return;
      }
      if (error.message === 'CANNOT_MODIFY_ROOT_ADMIN') {
        res.status(403).json({ error: 'FORBIDDEN', message: 'No se puede modificar el rol raíz de administrador' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }
}
