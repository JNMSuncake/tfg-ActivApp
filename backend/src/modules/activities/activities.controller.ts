import { Request, Response } from 'express';
import { ActivitiesService } from './activities.service.js';

/**
 * Controlador de Actividades — Gestión de actividades y sesiones del club/esplai
 */
export class ActivitiesController {

  // =====================================================
  // CRUD de Actividades
  // =====================================================

  /** GET /api/activities — Listar actividades del tenant */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const activities = await ActivitiesService.listByTenant(req.tenantId!);
      res.json({ data: activities });
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** GET /api/activities/:id — Obtener detalle de una actividad */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const activity = await ActivitiesService.getById(req.tenantId!, req.params.id);
      res.json({ data: activity });
    } catch (error: any) {
      if (error.message === 'ACTIVITY_NOT_FOUND') {
        res.status(404).json({ error: 'ACTIVITY_NOT_FOUND', message: 'Actividad no encontrada' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** POST /api/activities — Crear una nueva actividad */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, type, maxCapacity, minAge, maxAge, requiresAuthorization, requiredMaterial, priceCents } = req.body;

      if (!title || !description || !type || !maxCapacity) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Campos obligatorios: title, description, type, maxCapacity'
        });
        return;
      }

      const activity = await ActivitiesService.create({
        tenantId: req.tenantId!,
        title,
        description,
        type,
        maxCapacity,
        minAge,
        maxAge,
        requiresAuthorization,
        requiredMaterial,
        priceCents
      });

      res.status(201).json({ data: activity });
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** PUT /api/activities/:id — Actualizar una actividad */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const activity = await ActivitiesService.update(req.tenantId!, req.params.id, req.body);
      res.json({ data: activity });
    } catch (error: any) {
      if (error.message === 'ACTIVITY_NOT_FOUND') {
        res.status(404).json({ error: 'ACTIVITY_NOT_FOUND', message: 'Actividad no encontrada' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** DELETE /api/activities/:id — Eliminar una actividad */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      await ActivitiesService.delete(req.tenantId!, req.params.id);
      res.json({ message: 'Actividad eliminada correctamente' });
    } catch (error: any) {
      if (error.message === 'ACTIVITY_NOT_FOUND') {
        res.status(404).json({ error: 'ACTIVITY_NOT_FOUND', message: 'Actividad no encontrada' });
        return;
      }
      if (error.message === 'CANNOT_DELETE_PAST_ACTIVITY') {
        res.status(403).json({
          error: 'CANNOT_DELETE_PAST_ACTIVITY',
          message: 'No se puede eliminar una actividad que ya se ha celebrado en el pasado'
        });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  // =====================================================
  // Sesiones de Actividad
  // =====================================================

  /** POST /api/activities/:id/sessions — Crear sesión */
  static async createSession(req: Request, res: Response): Promise<void> {
    try {
      const { startTime, endTime, location, sharedNotes } = req.body;

      if (!startTime || !endTime || !location) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Campos obligatorios: startTime, endTime, location'
        });
        return;
      }

      const session = await ActivitiesService.createSession({
        tenantId: req.tenantId!,
        activityId: req.params.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        sharedNotes
      });

      res.status(201).json({ data: session });
    } catch (error: any) {
      if (error.message === 'ACTIVITY_NOT_FOUND') {
        res.status(404).json({ error: 'ACTIVITY_NOT_FOUND', message: 'Actividad no encontrada' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** GET /api/activities/:id/sessions — Listar sesiones */
  static async listSessions(req: Request, res: Response): Promise<void> {
    try {
      const sessions = await ActivitiesService.listSessions(req.tenantId!, req.params.id);
      res.json({ data: sessions });
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** POST /api/sessions/:sessionId/monitors — Asignar monitor */
  static async assignMonitor(req: Request, res: Response): Promise<void> {
    try {
      const { monitorUserId } = req.body;

      if (!monitorUserId) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Campo obligatorio: monitorUserId'
        });
        return;
      }

      const assignment = await ActivitiesService.assignMonitor(
        req.tenantId!, req.params.sessionId, monitorUserId
      );
      res.status(201).json({ data: assignment });
    } catch (error: any) {
      if (error.message === 'SESSION_NOT_FOUND') {
        res.status(404).json({ error: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada' });
        return;
      }
      if (error.message === 'MONITOR_USER_NOT_FOUND') {
        res.status(404).json({ error: 'MONITOR_USER_NOT_FOUND', message: 'Usuario monitor no encontrado en este tenant' });
        return;
      }
      // Duplicado de asignación
      if (error.code === 'P2002') {
        res.status(409).json({ error: 'ALREADY_ASSIGNED', message: 'El monitor ya está asignado a esta sesión' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** DELETE /api/sessions/:sessionId/monitors/:monitorUserId — Desasignar monitor */
  static async removeMonitor(req: Request, res: Response): Promise<void> {
    try {
      await ActivitiesService.removeMonitor(
        req.tenantId!, req.params.sessionId, req.params.monitorUserId
      );
      res.json({ message: 'Monitor desasignado correctamente' });
    } catch (error: any) {
      if (error.message === 'SESSION_NOT_FOUND') {
        res.status(404).json({ error: 'SESSION_NOT_FOUND', message: 'Sesión no encontrada' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }
}
