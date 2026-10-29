# ActivApp 📱⚡

> **Plataforma Web Progresiva (PWA) SaaS Multi-Tenant y Offline-First para la gestión integral de entidades deportivas y asociaciones juveniles (*esplais*, *caus*).**

![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5+-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22_LTS-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-Modular-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_ORM-6+-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white)
![IndexedDB](https://img.shields.io/badge/Dexie.js-IndexedDB-orange)

---

## 📌 Visión General

**ActivApp** es una solución de ingeniería de software diseñada para modernizar y blindar jurídicamente la operativa de clubes deportivos, centros excursionistas y entidades de educación en el ocio (*esplais* y agrupamientos *escoltes/caus*).

Resuelve tres problemas estructurales del sector:
1. **Privacidad y RGPD:** Elimina listas en papel y grupos de WhatsApp donde se exponen datos de contacto y salud de menores.
2. **Operatividad Offline:** Permite a los monitores pasar lista, registrar incidencias y consultar alergias en plena montaña o en pabellones sin cobertura, fusionando los cambios automáticamente al reconectar (*Merge Engine*).
3. **Seguridad Jurídica (LegalTech):** Sustituye autorizaciones informales por firmas biométricas en pantalla con trazado de curvas Bézier y generación instantánea de PDFs inmutables sellados con hash criptográfico SHA-256.

---

## 🚀 Módulos del Sistema

### 1. Multi-Tenant y RBAC Dinámico
- **Aislamiento lógico de datos:** Cada club o asociación cuenta con su espacio hermético indexado por `tenant_id`.
- **Motor de permisos dinámicos:** Creación de roles personalizados con permisos granulares (`activities:create`, `attendance:take`, `medical:read_contextual`, etc.).
- **Control Contextual (ABAC):** La información médica de los menores únicamente se expone a los monitores asignados durante la ventana temporal de la actividad (desde 48h antes hasta 12h después).

### 2. Calendario y Planificación de Actividades
- Tipos de actividad (entrenamientos, salidas de día, campamentos/colonias).
- Restricciones de aforo (`max_capacity`), edades permitidas (`min_age`, `max_age`) y requerimiento de autorización previa.
- Checklist de material obligatorio/recomendado con alertas automáticas.

### 3. Inscripciones y Gestión Financiera
- Máquina de estados: `CONFIRMED`, `WAITLISTED`, `PENDING_PAYMENT`, `CANCELLED`.
- Gestión automática de listas de espera por orden de registro cronológico.
- Modelo de datos financiero desacoplado (*Payment-Ready*): registro y validación manual de pagos para el alcance del TFG, con esquema preparado para integrar pasarelas externas (Stripe/Redsys) por webhook sin refactorizar la base de datos.

### 4. LegalTech: Autorizaciones y Firma Digital
- Lienzo interactivo (`<canvas>`) optimizado para pantallas táctiles y escritorio, con calibración de densidad de píxeles (`devicePixelRatio`) e interpolación de curvas de Bézier.
- Generación de documentos PDF A4 reales (`pdf-lib`) con datos legales, firma incrustada y hash SHA-256.
- Bloqueo preventivo de asistencia en caso de no disponer de la autorización firmada y validada.

### 5. Asistencia Offline-First y Algoritmo de Merge
- Persistencia local en el navegador mediante **Dexie.js** (IndexedDB) con interfaz optimista a 60 FPS.
- Cola de mutaciones salientes (*Outbox Pattern*) con identificador único `mutation_id` para garantizar idempotencia en redes intermitentes.
- **Motor de Fusión Híbrido (Merge Engine):**
  - Atomicidad a nivel de fila `(session_id, child_id)` para evitar colisiones entre monitores que pasan lista simultáneamente.
  - Fusión aditiva cronológica (*Append-Merge*) para bitácoras e incidencias de texto sin pérdida de información.
  - Resolución *Last-Write-Wins* con auditoría completa en caso de colisión directa en el mismo menor.

### 6. Comunicación y Notificaciones Web Push
- Canales de difusión por actividad (unidireccionales y con confirmación de lectura) y mensajería privada directa entidad-familia.
- Notificaciones Web Push nativas mediante Service Workers (estándar VAPID) operativas con la PWA cerrada.
- Disparadores automáticos (`node-cron`) para recordatorios de material 24 horas antes del evento.

---

## 🛠️ Stack Tecnológico

```
activapp/
├── frontend/             # PWA en React 18, TypeScript, Vite, Tailwind CSS y Dexie.js
├── backend/              # API REST modular en Node.js, Express y TypeScript
├── shared/               # Tipos TypeScript, DTOs y contratos compartidos (End-to-End Type Safety)
└── docker-compose.yml    # Orquestación local de PostgreSQL 16 + pgAdmin
```

---

## 💻 Entorno de Desarrollo Local

### Requisitos Previos
- **Node.js:** Versión 20+ LTS (recomendado v22+)
- **NPM:** Versión 10+
- **Docker Desktop:** Activo para la base de datos PostgreSQL

### Pasos Rápidos
```powershell
# 1. Levantar la base de datos en Docker
docker compose up -d

# 2. Instalar dependencias globales y de submódulos
npm.cmd install

# 3. Aplicar migraciones y semillas en Prisma
cd backend
npx.cmd prisma migrate dev
npx.cmd prisma db seed
cd ..

# 4. Iniciar Frontend y Backend en modo desarrollo
npm.cmd run dev
```

---

## 🎓 Contexto Académico

Proyecto desarrollado por **Joel Navarro** como **Trabajo de Fin de Grado (TFG)** en el Grado en Ingeniería Informática (Convocatoria 2026).
