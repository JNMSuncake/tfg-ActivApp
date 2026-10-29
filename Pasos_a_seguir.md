# ActivApp — Hoja de Ruta y Pasos a Seguir (TFG)

Este documento detalla la planificación rigurosa por etapas para el desarrollo de **ActivApp**.  
Para asegurar la máxima calidad y evitar regresiones o código desordenado, se aplica la **Regla de Bloqueo Estricto de Etapa (Stage Lock)**: ningún paso posterior puede iniciarse sin la aprobación explícita del usuario y la validación de 0 errores de compilación TypeScript.

---

## 🚦 Bloques de Desarrollo (Stage Lock)

```
[Fase 0: Base y Documentación] ✅ (En Curso)
         ↓
[Fase 1: Core Multi-Tenant, Auth y RBAC Dinámico] 🔒
         ↓
[Fase 2: Calendario, Actividades, Inscripciones y Finanzas] 🔒
         ↓
[Fase 3: Motor Offline-First, IndexedDB y Algoritmo Merge] 🔒
         ↓
[Fase 4: LegalTech (Firma Canvas a PDF) y Web Push API] 🔒
         ↓
[Fase 5: Modo Simulación Tribunal, Testing Integral y Memoria Final] 🔒
```

---

## 📋 Detalle de Fases y Tareas

### Fase 0: Inicialización del Repositorio y Documentación Base
- [x] Configuración de permisos de trabajo en el sistema de archivos.
- [x] Creación de `.gitignore` protegiendo la memoria privada y credenciales.
- [x] Generación del borrador estructurado de la `MemoriaTFG.docx`.
- [x] Redacción de `README.md` público con presentación profesional.
- [x] Redacción de `requerimientos_y_objetivos.md` con matriz de requisitos.
- [x] Redacción de este documento `Pasos_a_seguir.md`.
- [x] Inicialización del repositorio Git y primer commit convencional.
- [x] Instalación y verificación de Docker Desktop activa.

---

### Fase 1: Arquitectura Base, Core Multi-Tenant y RBAC Dinámico
- [x] Configuración del Monorepo con TypeScript y npm workspaces:
  - `/backend` (Node.js + Express con TypeScript modular).
  - `/frontend` (React 18 + Vite + Tailwind CSS + Lucide React).
  - `/shared` (Tipos, enums y DTOs comunes Front/Back).
- [x] Orquestación con `docker-compose.yml` para PostgreSQL 16 saludable en puerto 5432.
- [x] Modelado de la base de datos con **Prisma ORM**:
  - Tablas: `Tenant`, `User`, `Role`, `Child`, `TutorChildRelation`, `Activity`, `ActivitySession`, `Enrollment`, `PaymentTransaction`, `AuthorizationDocument`, `AttendanceRecord`, `SyncConflictAudit`, `PushSubscriptionDevice`, `InternalMessage`.
  - Columna obligatoria `tenant_id` en todas las entidades de dominio.
- [x] Script de datos semilla (`seed.ts`) con 2 entidades de prueba:
  - Entidad 1: Club Esportiu Gràcia con roles, sesiones y usuario admin/entrenador.
  - Entidad 2: Esplai El Pi de Sarrià con rol dinámico `MONITOR_PRACTICAS` y orden legal pendiente.
- [x] Módulo de Autenticación:
  - Login con JWT (*Access Token* 15m + *Refresh Token* 7d) y hash de contraseñas (`bcryptjs`).
  - Middleware `tenantContext.ts`: validación e inyección inmutable del `tenant_id` desde el JWT.
  - Middleware `rbacGuard.ts`: comprobación de permisos granulares y función contextual temporal (ABAC) para acceso médico.
- [x] Módulo de Roles Dinámicos (`roles.service.ts` y controlador): gestión y aislamiento por club.
- [x] Frontend: Shell de la aplicación en React 18 + Vite + Tailwind CSS con selector de entidad, conmutador de simulación offline para el tribunal y matriz RBAC.
- [x] **Criterio de Aceptación Fase 1:** Compilación con 0 errores TypeScript (`npm.cmd run build`) y verificación funcional de endpoints.

---

### Fase 2: Calendario, Actividades, Inscripciones y Finanzas
- [ ] Backend: Modelos y endpoints para Actividades y Sesiones (`Activity`, `ActivitySession`):
  - Gestión de aforo máximo, edades permitidas y bandera `requires_authorization`.
  - Lista estructurada de checklist de material (`RequiredMaterial[]`).
- [ ] Backend: Máquina de estados de Inscripciones (`Enrollment`):
  - Lógica automática de lista de espera ordenada por timestamp (`WAITLISTED`).
  - Promoción automática ante bajas de plazas confirmadas.
- [ ] Backend: Modelo financiero desacoplado (`PaymentTransaction`):
  - Registro de pagos en efectivo o transferencia y validación manual por el administrador.
  - Campos reservados para pasarelas futuras (`provider`, `external_tx_id`, `idempotency_key`).
- [ ] Frontend:
  - Vista de calendario interactivo mensual, semanal y agenda.
  - Flujo de inscripción para tutores legales con advertencias de aforo y material necesario.
  - Panel administrativo de control de cupos y validación de cobros.
- **Criterio de Aceptación Fase 2:** Flujo de inscripción y lista de espera verificado con tests automáticos y UI responsiva funcional.

---

### Fase 3: Motor Offline-First y Algoritmo de Merge (Núcleo del TFG)
- [ ] Frontend: Integración de **Dexie.js** (IndexedDB) como base de datos reactiva local:
  - Tablas locales: `local_sessions`, `local_attendances`, `local_children`, `sync_outbox`.
- [ ] Frontend: Patrón Outbox y sincronizador en segundo plano:
  - Encolado de mutaciones locales con `mutation_id` único (UUID v4) y marca de tiempo del cliente.
  - Escucha de eventos de red (`online`/`offline`) y reintento con backoff exponencial.
- [ ] Backend: Motor de Fusión Determinista (`mergeEngine.ts`):
  - Atomicidad a nivel de fila `(session_id, child_id)` para asistencias independientes.
  - Fusión aditiva (*Append-Merge*) para bitácoras e incidencias de texto concurrentes sin pérdida de caracteres.
  - Resolución *Last-Write-Wins* con registro de auditoría en `sync_conflict_audit`.
- [ ] Suite de pruebas unitarias (`mergeEngine.spec.ts`):
  - Prueba de concurrencia Monitor A vs Monitor B.
  - Prueba de idempotencia con retransmisión de mutaciones.
  - Prueba de no violación del aislamiento entre diferentes clubs/tenants.
- **Criterio de Aceptación Fase 3:** Pasaje al 100% de la suite de pruebas del motor de sincronización y funcionamiento fluido sin red.

---

### Fase 4: Módulo LegalTech (Firma Canvas a PDF) y Web Push API
- [ ] Frontend: Componente interactivo `<SignaturePad />` en `<canvas>`:
  - Calibración para pantallas táctiles y Retina con `window.devicePixelRatio`.
  - Interpolación de trazos mediante curvas de Bézier cuadráticas.
  - Captura de metadatos del firmante (fecha/hora, dispositivo, identificador de usuario y menor).
- [ ] Backend/Frontend: Generación de PDF Inmutable con `pdf-lib`:
  - Maquetación A4 con encabezado de la entidad, texto legal de la autorización y firma incrustada.
  - Cálculo e impresión del hash criptográfico SHA-256 en el pie del documento.
- [ ] Lógica de negocio de bloqueo:
  - Bloqueo visual e interactivo de la fila de asistencia en el frontend si la actividad requiere autorización y no consta como firmada.
- [ ] Notificaciones Web Push:
  - Configuración de claves VAPID y Service Worker en frontend (`src/sw.ts`).
  - Tarea programada (`node-cron`) en backend para envíos automáticos 24h antes con el checklist de material.
  - Disparador inmediato de alertas urgentes y cambios de horario.
- **Criterio de Aceptación Fase 4:** Generación de PDF real válida comprobada y entrega de notificaciones en Service Worker.

---

### Fase 5: Modo Simulación para el Tribunal, Testing Integral y Memoria Final
- [ ] Modo Simulación TFG en la interfaz:
  - Barra superior con conmutadores: "Simular Sin Cobertura" y "Simular Monitor B Concurrente".
  - Permite al tribunal ver en tiempo real cómo se encolan mutaciones offline y cómo el servidor ejecuta el *Merge* al reconectar.
- [ ] Pruebas de estrés y verificación general:
  - Auditoría de TypeScript: 0 errores en todo el proyecto.
  - Auditoría de accesibilidad, rendimiento y PWA (Lighthouse).
- [ ] Actualización y completado final de la `MemoriaTFG.docx`:
  - Inserción de diagramas de arquitectura definitivos, capturas de pantalla de la interfaz, tablas de pruebas y conclusiones finales.
- **Criterio de Aceptación Fase 5:** Proyecto 100% listo para defensa ante el tribunal universitario.

---

## 🛡️ Guía de Commits para GitHub

Se utilizarán mensajes de commit estandarizados, claros y descriptivos en español siguiendo la convención:
- `docs: ...` para documentación y memoria.
- `feat: ...` para nuevas funcionalidades y módulos.
- `fix: ...` para corrección de incidencias o ajustes.
- `refactor: ...` para mejoras de código sin alteración funcional.
- `test: ...` para pruebas unitarias y de integración.
- `chore: ...` para configuración de dependencias, scripts y herramientas.
