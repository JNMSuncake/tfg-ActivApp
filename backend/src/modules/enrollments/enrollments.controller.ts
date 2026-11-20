import { Request, Response } from 'express';
import { EnrollmentsService } from './enrollments.service.js';

/**
 * Controlador de Inscripciones — Inscripción, cancelación y lista de espera
 */
export class EnrollmentsController {

  /** POST /api/enrollments — Inscribir a un menor en una actividad */
  static async enroll(req: Request, res: Response): Promise<void> {
    try {
      const { activityId, childId } = req.body;

      if (!activityId || !childId) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Campos obligatorios: activityId, childId'
        });
        return;
      }

      const enrollment = await EnrollmentsService.enroll({
        tenantId: req.tenantId!,
        activityId,
        childId
      });

      const statusCode = enrollment.status === 'WAITLISTED' ? 202 : 201;
      res.status(statusCode).json({ data: enrollment });
    } catch (error: any) {
      const errorMap: Record<string, { status: number; message: string }> = {
        'ACTIVITY_NOT_FOUND': { status: 404, message: 'Actividad no encontrada' },
        'CHILD_NOT_FOUND': { status: 404, message: 'Participante no encontrado' },
        'ALREADY_ENROLLED': { status: 409, message: 'El participante ya está inscrito en esta actividad' },
        'CHILD_TOO_YOUNG': { status: 422, message: 'El participante no cumple la edad mínima requerida' },
        'CHILD_TOO_OLD': { status: 422, message: 'El participante supera la edad máxima permitida' }
      };

      const mapped = errorMap[error.message];
      if (mapped) {
        res.status(mapped.status).json({ error: error.message, message: mapped.message });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** POST /api/enrollments/:id/cancel — Cancelar inscripción */
  static async cancel(req: Request, res: Response): Promise<void> {
    try {
      const result = await EnrollmentsService.cancel(req.tenantId!, req.params.id);

      res.json({
        data: result.cancelled,
        promoted: result.promoted
          ? {
              message: `Plaza promovida automáticamente a ${result.promoted.child.fullName}`,
              enrollment: result.promoted
            }
          : null
      });
    } catch (error: any) {
      if (error.message === 'ENROLLMENT_NOT_FOUND') {
        res.status(404).json({ error: 'ENROLLMENT_NOT_FOUND', message: 'Inscripción no encontrada' });
        return;
      }
      if (error.message === 'ALREADY_CANCELLED') {
        res.status(409).json({ error: 'ALREADY_CANCELLED', message: 'La inscripción ya estaba cancelada' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** GET /api/enrollments/activity/:activityId — Listar inscritos de una actividad */
  static async listByActivity(req: Request, res: Response): Promise<void> {
    try {
      const enrollments = await EnrollmentsService.listByActivity(
        req.tenantId!, req.params.activityId
      );
      res.json({ data: enrollments });
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }

  /** GET /api/enrollments/child/:childId — Listar actividades de un menor */
  static async listByChild(req: Request, res: Response): Promise<void> {
    try {
      const enrollments = await EnrollmentsService.listByChild(
        req.tenantId!, req.params.childId
      );
      res.json({ data: enrollments });
    } catch (error: any) {
      res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
  }
}
