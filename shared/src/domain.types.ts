/**
 * ActivApp - Modelos de Dominio y Contratos de Datos
 */

export type ActivityType = 
  | 'ENTRENAMIENTO'
  | 'PARTIDO'
  | 'EXCURSION'
  | 'CAMPAMENTO'
  | 'REUNION'
  | 'TALLER';

export interface RequiredMaterialItem {
  id: string;
  name: string;
  isMandatory: boolean;
  notes?: string;
}

export type EnrollmentStatus = 
  | 'CONFIRMED'
  | 'WAITLISTED'
  | 'PENDING_PAYMENT'
  | 'CANCELLED';

export type PaymentMethod = 
  | 'MANUAL_CASH'
  | 'MANUAL_TRANSFER'
  | 'GATEWAY_CARD';

export type PaymentProvider = 
  | 'MANUAL'
  | 'STRIPE'
  | 'REDSYS';

export type PaymentStatus = 
  | 'PENDING'
  | 'REPORTED_BY_TUTOR'
  | 'VALIDATED_MANUAL'
  | 'CONFIRMED_GATEWAY'
  | 'REFUNDED'
  | 'FAILED';

export type AttendanceStatus = 
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'EXCUSED';

export type AuthorizationStatus = 
  | 'PENDING'
  | 'SIGNED'
  | 'REJECTED';

export interface ChildSummaryDto {
  id: string;
  tenantId: string;
  fullName: string;
  birthDate: string;
  emergencyContact: string;
  // Campos médicos filtrados contextualmente por ABAC
  allergies?: string | null;
  medicalNotes?: string | null;
  isMedicalContextActive?: boolean;
}
