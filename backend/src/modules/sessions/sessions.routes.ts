import { Router } from 'express';
import { ActivitiesController } from '../activities/activities.controller.js';
import { requireAuth } from '../../middlewares/tenantContext.js';
import { requirePermission } from '../../middlewares/rbacGuard.js';

export const sessionsRoutes = Router();

// Todas las rutas requieren autenticación
sessionsRoutes.use(requireAuth);

// Asignación y desasignación de monitores a sesiones
sessionsRoutes.post(
  '/:sessionId/monitors',
  requirePermission('activities:update'),
  ActivitiesController.assignMonitor
);

sessionsRoutes.delete(
  '/:sessionId/monitors/:monitorUserId',
  requirePermission('activities:update'),
  ActivitiesController.removeMonitor
);
