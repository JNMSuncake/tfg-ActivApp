# ActivApp — Requerimientos y Objetivos del Proyecto (TFG)

**Título Oficial:** ActivApp: Diseño e implementación de una plataforma SaaS multitenant y offline-first para la gestión integral de entidades deportivas y asociaciones juveniles.  
**Estudiante:** Joel Navarro Molins (jnavarro@campus.eug.es)  
**Tutor:** Gerard Enrique Manonellas  
**Institución:** Escoles Universitàries Gimbernat i Tomàs Cerdà (Adscrita a la UAB)  
**Curso / Convocatoria:** 2026-2027  

---

## 1. Objetivos del Proyecto

### 1.1. Objetivo General
Diseñar e implementar una plataforma web progresiva (PWA) bajo modelo Software as a Service (SaaS) Multi-Tenant y arquitectura Offline-First / Local-First, que digitalice de forma integral la gestión operativa, legal y comunicativa de clubes deportivos y asociaciones juveniles (*esplais*, *caus*), asegurando la continuidad de servicio sin conexión y el cumplimiento riguroso del Reglamento General de Protección de Datos (RGPD).

### 1.2. Objetivos Específicos
1. **OE-01 (Multi-Tenancy y Seguridad):** Construir una arquitectura Multi-Tenant con aislamiento estricto de datos por `tenant_id` y un sistema de control de acceso RBAC dinámico con reglas contextuales (ABAC) para la protección de historiales médicos.
2. **OE-02 (Local-First y Algoritmo de Sincronización):** Desarrollar un motor de persistencia local en IndexedDB y un algoritmo determinista de resolución de conflictos (*Merge Engine*) que soporte edición concurrente de monitores sin red (asistencias y bitácoras).
3. **OE-03 (LegalTech y Validez Jurídica):** Implementar un módulo de captura biométrica de firma manual sobre lienzo digital (`<canvas>`), con generación instantánea de documentos PDF inmutables validados criptográficamente mediante hash SHA-256.
4. **OE-04 (Gestión de Actividades y Escalabilidad Financiera):** Diseñar la planificación de actividades con listas de espera automáticas basadas en aforos y un modelo de datos financiero desacoplado (*Payment-Ready*) preparado para futuras pasarelas de pago.
5. **OE-05 (Notificaciones y Service Workers):** Implementar notificaciones Web Push nativas multiplataforma mediante Service Workers y tareas programadas en servidor para recordatorios preventivos de material.

---

## 2. Requisitos Funcionales (RF)

### Módulo 1: Multi-Tenancy y RBAC Dinámico
- **RF-1.1 (Aislamiento de Entidades):** El sistema debe garantizar que cada entidad (club o asociación) opere en un espacio de datos estrictamente aislado utilizando la clave `tenant_id` en todas las consultas y escrituras.
- **RF-1.2 (Roles Base y Semilla):** Cada organización debe contar con tres roles base predeterminados: `ADMINISTRADOR`, `MONITOR` y `TUTOR_LEGAL`.
- **RF-1.3 (Roles Dinámicos Personalizables):** El administrador de la organización debe poder crear nuevos roles con un conjunto granular de permisos seleccionables (ej. `Monitor en Prácticas`, `Coordinador`).
- **RF-1.4 (Acceso Contextual a Fichas Médicas - ABAC):** Los datos médicos y alergias de los menores solo podrán ser leídos por los monitores asignados a una actividad dentro de la ventana temporal autorizada (48h antes del inicio hasta 12h tras su finalización), a menos que posean el permiso explícito `medical:read_always`.

### Módulo 2: Calendario y Planificación de Actividades
- **RF-2.1 (Creación de Actividades):** Capacidad para registrar actividades clasificadas por tipología (entrenamiento, partido, excursión de día, campamento/colonias, reunión).
- **RF-2.2 (Restricciones y Parámetros):** Configuración de aforo máximo (`max_capacity`), rango de edad admitido (`min_age` a `max_age`) y marcador de obligatoriedad de autorización legal (`requires_authorization`).
- **RF-2.3 (Checklist de Material):** Definición de lista estructurada de material necesario o recomendado (ej. botas, cantimplora, chubasquero) para cada actividad.
- **RF-2.4 (Calendario Interactivo):** Vista de calendario interactivo (mensual, semanal, agenda) para monitores y familias.

### Módulo 3: Inscripciones y Gestión Financiera
- **RF-3.1 (Inscripción de Menores):** Los tutores legales autenticados pueden inscribir a los menores a su cargo en actividades disponibles según edad y aforo.
- **RF-3.2 (Lista de Espera Automática):** Al alcanzarse el aforo máximo, las nuevas inscripciones deben pasar a estado `WAITLISTED` de forma ordenada por timestamp. Ante una cancelación de plaza confirmada, el sistema debe promocionar automáticamente al primer menor en espera.
- **RF-3.3 (Registro y Validación Manual de Pagos):** El administrador puede consultar los pagos pendientes y marcarlos como validados (efectivo, transferencia bancaria).
- **RF-3.4 (Modelo Financiero Preparado):** El modelo de datos de transacciones debe incorporar los campos desacoplados (`provider`, `external_tx_id`, `idempotency_key`) para permitir la integración futura con pasarelas de pago (Stripe/Redsys) sin migración de esquema.

### Módulo 4: LegalTech y Autorizaciones Digitales
- **RF-4.1 (Generación de Orden de Firma):** Si una actividad requiere autorización, se generará una solicitud de firma para los tutores de cada menor inscrito.
- **RF-4.2 (Lienzo de Firma Biométrica):** Componente interactivo `<SignaturePad />` en `<canvas>` que capture trazos de firma con interpolación de curvas de Bézier, bloqueo de scroll táctil y escalado por `devicePixelRatio`.
- **RF-4.3 (Generación de PDF Inmutable con SHA-256):** El sistema debe generar un documento PDF real A4 conteniendo los datos de la entidad, menor, actividad, imagen de firma manuscrita y pie de auditoría con el hash criptográfico SHA-256 del documento.
- **RF-4.4 (Bloqueo de Asistencia):** Si `requires_authorization === true` y el menor no dispone de autorización firmada (`status === 'SIGNED'`), el monitor tendrá bloqueado el marcado de asistencia ordinario en la interfaz.

### Módulo 5: Asistencia Offline-First y Algoritmo de Merge
- **RF-5.1 (Persistencia Local):** La PWA debe almacenar localmente en IndexedDB las actividades de la semana, listas de niños y estados de autorización.
- **RF-5.2 (Pasar Lista Offline):** El monitor puede marcar `PRESENT`, `ABSENT`, `LATE` o `EXCUSED` y registrar incidencias sin conexión a Internet (Optimistic UI a 60 FPS).
- **RF-5.3 (Cola de Mutaciones Outbox):** Las operaciones locales se encolan con un UUID idempotente (`mutation_id`) y marca de tiempo (`client_timestamp`).
- **RF-5.4 (Algoritmo de Fusión Aditiva - Merge):** Al recuperar la conexión:
  - Las listas de asistencia se fusionan atómicamente por `(session_id, child_id)`.
  - Las notas e incidencias de texto concurrentes se concatenan de forma aditiva y cronológica identificando autor y hora.
  - Las colisiones directas en un mismo menor aplican política *Last-Write-Wins* con registro auditable en `sync_conflict_audit`.

### Módulo 6: Comunicación y Notificaciones Web Push
- **RF-6.1 (Buzón y Mensajería Privada):** Canales unidireccionales de difusión de actividad y conversaciones directas tutor-entidad. Prohibición de canales grupales abiertos entre familias.
- **RF-6.2 (Suscripción Web Push):** Registro de dispositivos mediante Service Workers y Web Push API bajo estándar VAPID.
- **RF-6.3 (Recordatorios Automáticos por Cron):** Envío automático de notificación push a tutores 24 horas antes de la actividad detallando el checklist de material.
- **RF-6.4 (Avisos de Emergencia):** Notificación push instantánea a familias ante cambios de horario, cancelaciones o autorizaciones pendientes urgentes.

---

## 3. Requisitos No Funcionales (RNF)

- **RNF-01 (PWA Instalable):** Aplicación web instalable en dispositivos móviles (Android, iOS 16.4+) y escritorio, operando a pantalla completa y con acceso offline a los recursos estáticos mediante Service Workers.
- **RNF-02 (Local-First y Rendimiento):** La interacción en la pantalla de asistencia y calendario debe responder en menos de 50 ms a nivel local utilizando IndexedDB (Dexie.js).
- **RNF-03 (Seguridad y Privacidad RGPD):**
  - Contraseñas hasheadas mediante `bcrypt` o `argon2`.
  - Autenticación robusta con tokens JWT (*Access Token* de corta duración y *Refresh Token*).
  - Cifrado en reposo para datos sensibles y filtrado estricto en backend para evitar fuga de campos médicos a usuarios no autorizados.
- **RNF-04 (Idempotencia y Resiliencia de Red):** El motor de sincronización del backend debe ignorar peticiones duplicadas identificadas por el mismo `mutation_id`.
- **RNF-05 (Compatibilidad Multiplataforma):** Interfaz adaptada (*Mobile-First*) para smartphones, tablets y pantallas de escritorio.
- **RNF-06 (Calidad y Tipado Estricto):** Cero errores de compilación TypeScript en todo el monorepo y tipado unificado entre frontend y backend mediante carpeta compartida `shared`.

---

## 4. Límites y Alcance del TFG (Fuera de Alcance)

Para acotar el proyecto al marco temporal y de exigencia del TFG, quedan formalmente excluidos:
1. **Integración con hardware físico exclusivo:** No se implementarán lectores NFC físicos ni tornos de acceso con relés.
2. **Cobro bancario real en vivo durante el TFG:** No se procesarán transacciones reales de tarjetas de crédito con pasarelas de producción durante la defensa. El sistema implementa la gestión manual completa y el modelo de datos (*Schema*) desacoplado y preparado para conectar Stripe/Redsys en el futuro mediante Webhook.
3. **Chats abiertos entre familias:** No se permitirán grupos de conversación libres entre tutores para evitar problemas de moderación, spam y riesgos de privacidad bajo el RGPD.
