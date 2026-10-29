import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Calendar, 
  CheckSquare, 
  FileSignature, 
  Users, 
  CreditCard, 
  Building2,
  Lock,
  Layers
} from 'lucide-react';
import { UserSessionPayload } from '@activapp/shared';

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [simulationOffline, setSimulationOffline] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSessionPayload | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'attendance' | 'legal' | 'roles'>('dashboard');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Usuarios semilla para pruebas rápidas
  const testUsers: UserSessionPayload[] = [
    {
      userId: 'usr-1',
      tenantId: 'ten-club',
      tenantName: 'Club Esportiu Gràcia',
      tenantSlug: 'ce-gracia',
      email: 'admin@cegracia.cat',
      fullName: 'Laia Puig (Coordinadora)',
      roleId: 'rol-1',
      roleName: 'ADMINISTRADOR',
      isSystemAdmin: true,
      permissions: ['tenants:read', 'roles:manage', 'activities:create', 'attendance:override', 'medical:read_always']
    },
    {
      userId: 'usr-2',
      tenantId: 'ten-club',
      tenantName: 'Club Esportiu Gràcia',
      tenantSlug: 'ce-gracia',
      email: 'entrenador@cegracia.cat',
      fullName: 'Pol Soler (Entrenador)',
      roleId: 'rol-2',
      roleName: 'ENTRENADOR',
      isSystemAdmin: false,
      permissions: ['activities:read', 'attendance:take', 'medical:read_contextual']
    },
    {
      userId: 'usr-3',
      tenantId: 'ten-esplai',
      tenantName: 'Esplai El Pi de Sarrià',
      tenantSlug: 'esplai-el-pi',
      email: 'practicas@esplaielpi.cat',
      fullName: 'Nil Bover (En Pràctiques)',
      roleId: 'rol-3',
      roleName: 'MONITOR_PRACTICAS',
      isSystemAdmin: false,
      permissions: ['activities:read', 'attendance:take']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col text-gray-800">
      {/* Barra Superior con Controles TFG */}
      <header className="bg-brand-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-600 p-2 rounded-lg text-white font-bold flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">ActivApp</h1>
              <p className="text-xs text-blue-200">Plataforma SaaS Multi-Tenant & Offline-First</p>
            </div>
          </div>

          {/* Selector de Entidad y Usuario Activo */}
          <div className="flex items-center gap-3">
            <div className="bg-brand-800/80 px-3 py-1.5 rounded-lg border border-brand-700 text-xs flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-300" />
              <span>{currentUser ? currentUser.tenantName : 'Selecciona Entidad'}</span>
            </div>

            <select 
              className="bg-brand-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-brand-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={currentUser?.email || ''}
              onChange={(e) => {
                const selected = testUsers.find(u => u.email === e.target.value);
                setCurrentUser(selected || null);
              }}
            >
              <option value="">-- Cambiar Usuario / Tenant --</option>
              {testUsers.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.fullName} ({u.tenantName} - {u.roleName})
                </option>
              ))}
            </select>

            {/* Conmutador de Simulación Offline para el Tribunal */}
            <button
              onClick={() => setSimulationOffline(!simulationOffline)}
              title="Modo Demo Tribunal: Simula desconexión forzada de red"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                simulationOffline || !isOnline 
                  ? 'bg-amber-500 text-gray-950 font-bold animate-pulse' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {simulationOffline || !isOnline ? (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>MODO OFFLINE</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>ONLINE (4G/WiFi)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Navegación Principal */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Resumen y Tenant
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'calendar' ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" /> Calendario
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'attendance' ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" /> Asistencia (Offline)
          </button>
          <button
            onClick={() => setActiveTab('legal')}
            className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'legal' ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileSignature className="w-4 h-4" /> LegalTech (Firma PDF)
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'roles' ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock className="w-4 h-4" /> RBAC y Permisos
          </button>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Estado del Sistema & Multi-Tenancy</h2>
              <p className="text-gray-600 text-sm mb-4">
                ActivApp aísla las entidades en base de datos mediante la clave lógica <code className="bg-gray-100 px-1 py-0.5 rounded text-brand-700 font-mono">tenant_id</code>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 font-semibold mb-1">
                    <Building2 className="w-4 h-4" /> Entidad Activa
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {currentUser ? currentUser.tenantName : 'Sin seleccionar'}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Slug: {currentUser ? currentUser.tenantSlug : 'N/A'}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="flex items-center gap-2 text-purple-700 font-semibold mb-1">
                    <Users className="w-4 h-4" /> Rol y Permisos
                  </div>
                  <div className="text-lg font-bold text-purple-900">
                    {currentUser ? currentUser.roleName : 'Anónimo'}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    {currentUser ? `${currentUser.permissions.length} permisos activos` : 'Sin permisos'}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
                    <CreditCard className="w-4 h-4" /> Base de Datos
                  </div>
                  <div className="text-lg font-bold text-emerald-900">PostgreSQL 16</div>
                  <div className="text-xs text-emerald-600 mt-1">Dockerizado en puerto 5432</div>
                </div>
              </div>
            </div>

            {/* Ficha de demostración de ABAC contextual */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-600" /> Protección RGPD: Regla ABAC para Fichas Médicas
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Si un monitor tiene el permiso <code className="bg-gray-100 px-1 font-mono text-xs">medical:read_contextual</code>, los datos médicos de los menores solo se desencriptan y envían si el monitor está asignado a la actividad y dentro del intervalo temporal (desde 48h antes hasta 12h después).
              </p>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                <strong>Verificación activa:</strong> El usuario actual <em>{currentUser?.fullName || 'No conectado'}</em> {currentUser?.permissions.includes('medical:read_always') ? 'tiene acceso permanente de Administrador a fichas médicas.' : currentUser?.permissions.includes('medical:read_contextual') ? 'solo puede ver fichas médicas bajo asignación y ventana temporal activa.' : 'NO tiene autorización para ver datos médicos de menores.'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Motor RBAC Dinámico</h2>
            <p className="text-sm text-gray-600 mb-4">
              Cada club puede crear roles propios (ej. <em>Monitor en Prácticas</em> con acceso limitado sin datos médicos) además de los roles raíz predeterminados.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-700 text-xs uppercase">
                    <th className="py-2 px-3">Rol</th>
                    <th className="py-2 px-3">Tipo</th>
                    <th className="py-2 px-3">Permisos Clave</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  <tr>
                    <td className="py-2 px-3 font-bold text-brand-800">ADMINISTRADOR</td>
                    <td className="py-2 px-3"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">Sistema</span></td>
                    <td className="py-2 px-3">Acceso total, creación de roles, validación de cobros</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-brand-800">MONITOR / ENTRENADOR</td>
                    <td className="py-2 px-3"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">Sistema</span></td>
                    <td className="py-2 px-3">Pasar lista offline, lectura médica contextual</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-brand-800">MONITOR_PRACTICAS</td>
                    <td className="py-2 px-3"><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Dinámico Personalizado</span></td>
                    <td className="py-2 px-3">Pasar lista offline (Bloqueado el acceso a historial médico)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === 'calendar' || activeTab === 'attendance' || activeTab === 'legal') && (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-dashed border-gray-300 text-center">
            <div className="inline-flex p-3 bg-brand-50 text-brand-700 rounded-full mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Módulo en Desarrollo según Hoja de Ruta</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              Este módulo se implementará en la siguiente fase tras la validación de la arquitectura base Multi-Tenant y el esquema Prisma.
            </p>
          </div>
        )}
      </main>

      {/* Pie de página con créditos */}
      <footer className="bg-white border-t border-gray-200 py-3 text-center text-xs text-gray-500">
        ActivApp — Trabajo de Fin de Grado de <strong>Joel Navarro</strong> (2026)
      </footer>
    </div>
  );
}
