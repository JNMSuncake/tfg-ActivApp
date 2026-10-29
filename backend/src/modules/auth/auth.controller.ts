import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, tenantSlug } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'Email y contraseña requeridos'
        });
        return;
      }

      const result = await AuthService.login({ email, password, tenantSlug });
      res.json(result);
    } catch (error: any) {
      if (error.message === 'TENANT_NOT_FOUND') {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Organización no encontrada' });
        return;
      }
      if (error.message === 'INVALID_CREDENTIALS') {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'Credenciales inválidas' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error interno de autenticación' });
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ error: 'BAD_REQUEST', message: 'Refresh token requerido' });
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);
      res.json(result);
    } catch {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token de refresco inválido o expirado' });
    }
  }

  static me(req: Request, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Sesión no iniciada' });
      return;
    }
    res.json({ user: req.user });
  }
}
