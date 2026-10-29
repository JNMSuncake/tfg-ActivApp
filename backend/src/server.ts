import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { rolesRoutes } from './modules/roles/roles.routes.js';

const app = express();

// Middlewares globales de seguridad y formato
app.use(helmet());
app.use(cors({
  origin: '*', // Para desarrollo; en producción acotar al dominio de la PWA
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Suficiente para firmas en base64 de LegalTech

// Endpoint de verificación de salud
app.get('/api/health', async (_req, res) => {
  try {
    // Validar conexión a PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'ActivApp Backend API',
      database: 'CONNECTED'
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'DEGRADED',
      database: 'DISCONNECTED',
      error: error.message
    });
  }
});

// Rutas de la API (Módulos Core)
app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);

// Manejador de rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint de API no encontrado'
  });
});

// Iniciar servidor
const server = app.listen(env.PORT, () => {
  console.log(`🚀 Servidor ActivApp Backend ejecutándose en http://localhost:${env.PORT}`);
  console.log(`📡 Entorno: ${env.NODE_ENV}`);
});

// Cierre elegante (Graceful Shutdown)
process.on('SIGINT', async () => {
  console.log('🛑 Cerrando servidor y desconectando Prisma...');
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
});

export default app;
