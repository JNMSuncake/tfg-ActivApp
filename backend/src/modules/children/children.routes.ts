import { Router } from 'express';
import { ChildrenController } from './children.controller.js';
import { requireAuth } from '../../middlewares/tenantContext.js';
import { requirePermission } from '../../middlewares/rbacGuard.js';

export const childrenRoutes = Router();

// Todas las rutas requieren autenticación
childrenRoutes.use(requireAuth);

// Ruta especial: "Mis hijos" para tutores legales (antes de las rutas con :id)
childrenRoutes.get('/my-children', ChildrenController.myChildren);

// CRUD de Menores/Participantes
childrenRoutes.get('/', requirePermission('enrollments:read'), ChildrenController.list);
childrenRoutes.get('/:id', requirePermission('enrollments:read'), ChildrenController.getById);
childrenRoutes.post('/', requirePermission('enrollments:manage'), ChildrenController.create);
childrenRoutes.put('/:id', requirePermission('enrollments:manage'), ChildrenController.update);

// Gestión de vínculos tutor-menor
childrenRoutes.post('/:id/tutors', requirePermission('enrollments:manage'), ChildrenController.linkTutor);
childrenRoutes.delete('/:id/tutors/:tutorUserId', requirePermission('enrollments:manage'), ChildrenController.unlinkTutor);
