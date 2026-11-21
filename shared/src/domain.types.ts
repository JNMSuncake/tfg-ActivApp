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

export interface AttachedDocumentDto {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileDataUrl?: string; // Base64 o URL para previsualizar/descargar
  uploadedAt: string;
}

export interface ActivitySessionDto {
  id: string;
  tenantId: string;
  activityId: string;
  startTime: string;
  endTime: string;
  location: string;
  sharedNotes?: string | null;
  monitors?: Array<{ monitorUserId: string }>;
}

export interface ActivityDto {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  type: ActivityType;
  maxCapacity: number;
  minAge?: number | null;
  maxAge?: number | null;
  requiresAuthorization: boolean;
  requiredMaterial: RequiredMaterialItem[];
  attachedDocument?: AttachedDocumentDto | null;
  priceCents: number;
  createdAt: string;
  sessions?: ActivitySessionDto[];
  _count?: {
    enrollments?: number;
  };
}

export interface ActivityTemplateDto {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  type: ActivityType;
  defaultLocation: string;
  maxCapacity: number;
  minAge?: number | null;
  maxAge?: number | null;
  priceCents: number;
  requiresAuthorization: boolean;
  requiredMaterial: RequiredMaterialItem[];
}

export interface EnrollmentDto {
  id: string;
  tenantId: string;
  activityId: string;
  childId: string;
  status: EnrollmentStatus;
  waitlistPosition?: number | null;
  createdAt: string;
  activity?: { id: string; title: string };
  child?: { id: string; fullName: string };
}
