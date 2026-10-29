import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno del fichero .env en la raíz del monorepo o local
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://activapp_admin:activapp_secret_pass@localhost:5432/activapp_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'clave_secreta_jwt_desarrollo_activapp_2026_tfg',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'clave_secreta_jwt_refresh_desarrollo_activapp_2026_tfg',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || 'mailto:soporte@activapp.local',
};
