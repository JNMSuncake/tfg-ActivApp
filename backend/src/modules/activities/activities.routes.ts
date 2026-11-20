import { Router } from 'express';
import { ActivitiesController } from './activities.controller.js';
import { requireAuth } from '../../middlewares/tenantContext.js';
import { requirePermission } from '../../middlewares/rbacGuard.js';

export const activitiesRoutes = Router();

// Todas las rutas requieren autenticación
activitiesRoutes.use(requireAuth);

// CRUD de Actividades
activitiesRoutes.get('/', requirePermission('activities:read'), ActivitiesController.list);
activitiesRoutes.get('/:id', requirePermission('activities:read'), ActivitiesController.getById);
activitiesRoutes.post('/', requirePermission('activities:create'), ActivitiesController.create);
activitiesRoutes.put('/:id', requirePermission('activities:update'), ActivitiesController.update);
activitiesRoutes.delete('/:id', requirePermission('activities:delete'), ActivitiesController.delete);

// Sesiones de Actividad
activitiesRoutes.get('/:id/sessions', requirePermission('activities:read'), ActivitiesController.listSessions);
activitiesRoutes.post('/:id/sessions', requirePermission('activities:create'), ActivitiesController.createSession);
