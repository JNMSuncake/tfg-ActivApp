import { Router } from 'express';
import { RolesController } from './roles.controller.js';
import { requireAuth } from '../../middlewares/tenantContext.js';
import { requirePermission } from '../../middlewares/rbacGuard.js';

export const rolesRoutes = Router();

rolesRoutes.use(requireAuth);

rolesRoutes.get('/', requirePermission('roles:read'), RolesController.list);
rolesRoutes.post('/', requirePermission('roles:manage'), RolesController.create);
rolesRoutes.put('/:id', requirePermission('roles:manage'), RolesController.update);
