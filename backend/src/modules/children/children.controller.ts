import { Request, Response } from 'express';
import { ChildrenService } from './children.service.js';
import { PermissionCode } from '@activapp/shared';

/**
 * Controlador de Menores/Participantes — Gestión de fichas y relaciones familiares
 */
export class ChildrenController {

  /** GET /api/children — Listar menores del tenant (con filtrado ABAC médico) */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const children = await ChildrenService.listByTenant(
        req.tenantId!,
        req.user!.userId,
        req.user!.permissions as PermissionCode[]
      );
      res.json({ data: children });
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** GET /api/children/:id — Detalle de un menor (con filtrado ABAC médico) */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const child = await ChildrenService.getById(
        req.tenantId!,
        req.params.id,
        req.user!.userId,
        req.user!.permissions as PermissionCode[]
      );
      res.json({ data: child });
    } catch (error: any) {
      if (error.message === 'CHILD_NOT_FOUND') {
        res.status(404).json({ error: 'CHILD_NOT_FOUND', message: 'Participante no encontrado' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** POST /api/children — Registrar un nuevo menor/participante */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, birthDate, allergies, medicalNotesEncrypted, emergencyContact } = req.body;

      if (!fullName || !birthDate || !emergencyContact) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Campos obligatorios: fullName, birthDate, emergencyContact'
        });
        return;
      }

      const child = await ChildrenService.create({
        tenantId: req.tenantId!,
        fullName,
        birthDate,
        allergies,
        medicalNotesEncrypted,
        emergencyContact
      });

      res.status(201).json({ data: child });
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** PUT /api/children/:id — Actualizar datos de un menor */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const child = await ChildrenService.update(req.tenantId!, req.params.id, req.body);
      res.json({ data: child });
    } catch (error: any) {
      if (error.message === 'CHILD_NOT_FOUND') {
        res.status(404).json({ error: 'CHILD_NOT_FOUND', message: 'Participante no encontrado' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** POST /api/children/:id/tutors — Vincular tutor legal */
  static async linkTutor(req: Request, res: Response): Promise<void> {
    try {
      const { tutorUserId, relationshipType } = req.body;

      if (!tutorUserId) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Campo obligatorio: tutorUserId'
        });
        return;
      }

      const relation = await ChildrenService.linkTutor(req.tenantId!, {
        tutorUserId,
        childId: req.params.id,
        relationshipType
      });

      res.status(201).json({ data: relation });
    } catch (error: any) {
      if (error.message === 'CHILD_NOT_FOUND') {
        res.status(404).json({ error: 'CHILD_NOT_FOUND', message: 'Participante no encontrado' });
        return;
      }
      if (error.message === 'TUTOR_USER_NOT_FOUND') {
        res.status(404).json({ error: 'TUTOR_USER_NOT_FOUND', message: 'Usuario tutor no encontrado' });
        return;
      }
      if (error.code === 'P2002') {
        res.status(409).json({ error: 'ALREADY_LINKED', message: 'El tutor ya está vinculado a este menor' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** DELETE /api/children/:id/tutors/:tutorUserId — Desvincular tutor */
  static async unlinkTutor(req: Request, res: Response): Promise<void> {
    try {
      await ChildrenService.unlinkTutor(req.tenantId!, req.params.tutorUserId, req.params.id);
      res.json({ message: 'Tutor desvinculado correctamente' });
    } catch (error: any) {
      if (error.message === 'CHILD_NOT_FOUND') {
        res.status(404).json({ error: 'CHILD_NOT_FOUND', message: 'Participante no encontrado' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** GET /api/children/my-children — Menores vinculados al tutor autenticado */
  static async myChildren(req: Request, res: Response): Promise<void> {
    try {
      const children = await ChildrenService.listByTutor(req.tenantId!, req.user!.userId);
      res.json({ data: children });
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }
}
