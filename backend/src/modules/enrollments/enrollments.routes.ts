import { Router } from 'express';
import { EnrollmentsController } from './enrollments.controller.js';
import { requireAuth } from '../../middlewares/tenantContext.js';
import { requirePermission } from '../../middlewares/rbacGuard.js';

export const enrollmentsRoutes = Router();

// Todas las rutas requieren autenticación
enrollmentsRoutes.use(requireAuth);

// Inscripción y cancelación
enrollmentsRoutes.post('/', requirePermission('enrollments:manage'), EnrollmentsController.enroll);
enrollmentsRoutes.post('/:id/cancel', requirePermission('enrollments:manage'), EnrollmentsController.cancel);

// Consultas
enrollmentsRoutes.get('/activity/:activityId', requirePermission('enrollments:read'), EnrollmentsController.listByActivity);
enrollmentsRoutes.get('/child/:childId', requirePermission('enrollments:read'), EnrollmentsController.listByChild);
