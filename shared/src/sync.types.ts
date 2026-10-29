/**
 * ActivApp - Tipos para Sincronización Offline-First, Outbox y Algoritmo Merge
 */

export type SyncEntityType = 
  | 'ATTENDANCE_RECORD'
  | 'SESSION_NOTES'
  | 'INCIDENT_LOG';

export type SyncActionType = 
  | 'CREATE'
  | 'UPDATE'
  | 'APPEND_TEXT';

export interface OutboxMutationDto {
  localSeq?: number;
  mutationId: string; // UUID v4 generado en cliente para idempotencia
  tenantId: string;
  userId: string;
  entityType: SyncEntityType;
  entityId: string;
  action: SyncActionType;
  baseVersion: number;
  clientTimestamp: string;
  payload: Record<string, unknown>;
}

export interface SyncBatchRequest {
  clientSentAt: string;
  mutations: OutboxMutationDto[];
}

export interface MutationSyncResult {
  mutationId: string;
  success: boolean;
  entityId: string;
  entityType: SyncEntityType;
  newVersion: number;
  mergedData?: Record<string, unknown>;
  conflictNotice?: string;
  error?: string;
}

export interface SyncBatchResponse {
  serverProcessedAt: string;
  results: MutationSyncResult[];
}

export interface ConflictAuditRecord {
  id: string;
  tenantId: string;
  entityType: SyncEntityType;
  entityId: string;
  userAId: string;
  userBId: string;
  payloadA: unknown;
  payloadB: unknown;
  mergedResult: unknown;
  resolvedAt: string;
}
