import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { requireAuth } from '../../middlewares/tenantContext.js';

export const authRoutes = Router();

authRoutes.post('/login', AuthController.login);
authRoutes.post('/refresh', AuthController.refresh);
authRoutes.get('/me', requireAuth, AuthController.me);
