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
  Layers,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import { 
  UserSessionPayload, 
  ActivityDto, 
  ChildSummaryDto, 
  EnrollmentDto,
  ActivityTemplateDto,
  AttachedDocumentDto 
} from '@activapp/shared';
import { ActivitiesList } from './components/ActivitiesList';
import { ActivityCalendar } from './components/ActivityCalendar';
import { MyParticipants } from './components/MyParticipants';
import { CreateActivityModal } from './components/CreateActivityModal';

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [simulationOffline, setSimulationOffline] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activities' | 'calendar' | 'participants' | 'attendance' | 'legal' | 'roles'>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  // Escucha del estado de red
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

  // Usuarios Semilla para Pruebas Multi-Tenant
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
      permissions: ['tenants:read', 'roles:manage', 'activities:create', 'activities:read', 'activities:update', 'activities:delete', 'enrollments:manage', 'enrollments:read', 'attendance:override', 'medical:read_always']
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
      permissions: ['activities:read', 'enrollments:read', 'attendance:take', 'medical:read_contextual']
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
      permissions: ['activities:read', 'enrollments:read', 'attendance:take']
    },
    {
      userId: 'usr-4',
      tenantId: 'ten-club',
      tenantName: 'Club Esportiu Gràcia',
      tenantSlug: 'ce-gracia',
      email: 'familia.navarro@gmail.com',
      fullName: 'Marc Navarro (Tutor Legal / Familia)',
      roleId: 'rol-4',
      roleName: 'TUTOR_LEGAL',
      isSystemAdmin: false,
      permissions: ['activities:read', 'enrollments:manage', 'enrollments:read', 'authorizations:sign']
    }
  ];

  const [currentUser, setCurrentUser] = useState<UserSessionPayload | null>(testUsers[0]);

  // Semilla de Actividades de la Fase 2A
  const [activities, setActivities] = useState<ActivityDto[]>([
    {
      id: 'act-1',
      tenantId: 'ten-club',
      title: 'Entrenamiento Táctico y Partido Infantil',
      description: 'Sesión intensiva de fútbol base, coordinación de juego en equipo y partidillo amistoso contra la escuela invitada.',
      type: 'ENTRENAMIENTO',
      maxCapacity: 16,
      minAge: 8,
      maxAge: 12,
      priceCents: 0,
      requiresAuthorization: false,
      requiredMaterial: [
        { id: 'm1', name: 'Botas de fútbol multitaco', isMandatory: true },
        { id: 'm2', name: 'Espinilleras homologadas', isMandatory: true },
        { id: 'm3', name: 'Cantimplora con agua fresca', isMandatory: false }
      ],
      createdAt: new Date().toISOString(),
      sessions: [
        {
          id: 'sess-1',
          tenantId: 'ten-club',
          activityId: 'act-1',
          startTime: '2026-11-22T10:00:00.000Z',
          endTime: '2026-11-22T12:30:00.000Z',
          location: 'Campo de Fútbol Municipal de Gràcia',
          sharedNotes: 'Llegar 15 minutos antes para el calentamiento.'
        }
      ],
      _count: { enrollments: 16 } // Aforo completo para demostrar lista de espera
    },
    {
      id: 'act-2',
      tenantId: 'ten-club',
      title: 'Excursión al Parque Natural del Montseny',
      description: 'Ruta de senderismo interpretativo, orientación básica con brújula y comida de pícnic en plena naturaleza.',
      type: 'EXCURSION',
      maxCapacity: 20,
      minAge: 7,
      maxAge: 16,
      priceCents: 1500, // 15.00 €
      requiresAuthorization: true,
      attachedDocument: {
        fileName: 'Autorizacion_Paterna_Montseny_2026.pdf',
        fileSize: 148500,
        fileType: 'application/pdf',
        uploadedAt: '2026-11-16T15:30:00.000Z'
      },
      requiredMaterial: [
        { id: 'm4', name: 'Calzado de senderismo', isMandatory: true },
        { id: 'm5', name: 'Chubasquero o impermeable', isMandatory: true },
        { id: 'm6', name: 'Almuerzo y cantimplora de 1L', isMandatory: true },
        { id: 'm7', name: 'Gorra para el sol', isMandatory: false }
      ],
      createdAt: new Date().toISOString(),
      sessions: [
        {
          id: 'sess-2',
          tenantId: 'ten-club',
          activityId: 'act-2',
          startTime: '2026-11-28T08:30:00.000Z',
          endTime: '2026-11-28T17:30:00.000Z',
          location: 'Punto de encuentro: Estación de Gràcia (Autocar privado)'
        }
      ],
      _count: { enrollments: 8 }
    },
    {
      id: 'act-3',
      tenantId: 'ten-club',
      title: 'Reunión de Inicio de Temporada 2026',
      description: 'Asamblea general informativa con familias y entrenadores para el arranque del nuevo curso deportivo.',
      type: 'REUNION',
      maxCapacity: 50,
      minAge: null,
      maxAge: null,
      priceCents: 0,
      requiresAuthorization: false,
      requiredMaterial: [],
      createdAt: '2026-11-01T10:00:00.000Z',
      sessions: [
        {
          id: 'sess-3',
          tenantId: 'ten-club',
          activityId: 'act-3',
          startTime: '2026-11-10T18:00:00.000Z',
          endTime: '2026-11-10T19:30:00.000Z',
          location: 'Sala de Actos del Club Social',
          sharedNotes: 'Presentación de la normativa interna y entrega del dossier del alumno.'
        }
      ],
      _count: { enrollments: 32 }
    }
  ]);

  // Semilla de Participantes / Menores
  const [childrenList, setChildrenList] = useState<ChildSummaryDto[]>([
    {
      id: 'ch-1',
      tenantId: 'ten-club',
      fullName: 'Pau Navarro Soler',
      birthDate: '2016-04-12T00:00:00.000Z',
      emergencyContact: 'Marc Navarro (+34 611 222 333)',
      allergies: 'Alérgico a la penicilina y frutos secos',
      medicalNotes: 'Lleva medicación antihistamínica de urgencia en la mochila.',
      isMedicalContextActive: true
    },
    {
      id: 'ch-2',
      tenantId: 'ten-club',
      fullName: 'Clara Puig Mas',
      birthDate: '2015-09-25T00:00:00.000Z',
      emergencyContact: 'Laia Puig (+34 622 333 444)',
      allergies: 'Intolerancia severa a la lactosa',
      medicalNotes: 'Requiere menú adaptado sin trazas de lácteos en campamentos.',
      isMedicalContextActive: true
    }
  ]);

  // Semilla de Inscripciones con Máquina de Estados
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([
    {
      id: 'enr-1',
      tenantId: 'ten-club',
      activityId: 'act-1',
      childId: 'ch-1',
      status: 'CONFIRMED',
      waitlistPosition: null,
      createdAt: '2026-11-15T12:00:00.000Z',
      activity: { id: 'act-1', title: 'Entrenamiento Táctico y Partido Infantil' },
      child: { id: 'ch-1', fullName: 'Pau Navarro Soler' }
    },
    {
      id: 'enr-2',
      tenantId: 'ten-club',
      activityId: 'act-2',
      childId: 'ch-1',
      status: 'CONFIRMED',
      waitlistPosition: null,
      createdAt: '2026-11-16T15:30:00.000Z',
      activity: { id: 'act-2', title: 'Excursión al Parque Natural del Montseny' },
      child: { id: 'ch-1', fullName: 'Pau Navarro Soler' }
    }
  ]);

  // Biblioteca de Plantillas de Actividades Guardadas (Estilo Jira Backlog/Templates)
  const [templates, setTemplates] = useState<ActivityTemplateDto[]>([
    {
      id: 'tmpl-1',
      tenantId: 'ten-club',
      title: 'Entrenamiento Fútbol Base A',
      description: 'Sesión estándar de 90 minutos con calentamiento, circuitos técnicos y partidillo reducido.',
      type: 'ENTRENAMIENTO',
      defaultLocation: 'Campo Municipal de Gràcia (Césped)',
      maxCapacity: 18,
      minAge: 8,
      maxAge: 12,
      priceCents: 0,
      requiresAuthorization: false,
      requiredMaterial: [
        { id: 'm1', name: 'Botas multitaco', isMandatory: true },
        { id: 'm2', name: 'Espinilleras homologadas', isMandatory: true },
        { id: 'm3', name: 'Cantimplora con agua', isMandatory: false }
      ]
    },
    {
      id: 'tmpl-2',
      tenantId: 'ten-club',
      title: 'Excursión de Fin de Semana Esplai',
      description: 'Salida de día completo a entorno natural con juegos de orientación y dinámicas de grupo.',
      type: 'EXCURSION',
      defaultLocation: 'Punto de Encuentro: Estación de Gràcia',
      maxCapacity: 25,
      minAge: 7,
      maxAge: 15,
      priceCents: 1500, // 15 €
      requiresAuthorization: true,
      requiredMaterial: [
        { id: 'm4', name: 'Calzado de montaña', isMandatory: true },
        { id: 'm5', name: 'Chubasquero', isMandatory: true },
        { id: 'm6', name: 'Almuerzo de pícnic', isMandatory: true }
      ]
    },
    {
      id: 'tmpl-3',
      tenantId: 'ten-club',
      title: 'Partido Oficial de Liga Local',
      description: 'Encuentro de competición federada escolar con arbitraje oficial.',
      type: 'PARTIDO',
      defaultLocation: 'Pista Polideportiva Cubierta',
      maxCapacity: 14,
      minAge: 9,
      maxAge: 13,
      priceCents: 0,
      requiresAuthorization: false,
      requiredMaterial: [
        { id: 'm7', name: 'Equipación oficial del club', isMandatory: true },
        { id: 'm8', name: 'DNI / Ficha federativa', isMandatory: true }
      ]
    }
  ]);

  // Manejador: Guardar Plantilla en la Biblioteca
  const handleSaveTemplate = (newTemplate: ActivityTemplateDto) => {
    // Si ya existe con el mismo ID, actualizar; si no, agregar
    setTemplates(prev => {
      const exists = prev.some(t => t.id === newTemplate.id);
      if (exists) {
        return prev.map(t => t.id === newTemplate.id ? newTemplate : t);
      }
      return [newTemplate, ...prev];
    });
    setSystemAlert(`¡Plantilla "${newTemplate.title}" guardada en la biblioteca!`);
    setTimeout(() => setSystemAlert(null), 4000);
  };

  // Manejador: Programar Actividad directamente desde el Calendario (Quick-Create Jira)
  const handleScheduleActivityFromCalendar = (
    activityData: Partial<ActivityDto> & { initialSession: any },
    saveAsTemplate?: boolean
  ) => {
    const actId = `act-${Date.now()}`;
    const newActivity: ActivityDto = {
      id: actId,
      tenantId: currentUser?.tenantId || 'ten-club',
      title: activityData.title || 'Actividad Programada',
      description: activityData.description || '',
      type: activityData.type || 'ENTRENAMIENTO',
      maxCapacity: activityData.maxCapacity || 20,
      minAge: activityData.minAge ?? null,
      maxAge: activityData.maxAge ?? null,
      priceCents: activityData.priceCents || 0,
      requiresAuthorization: activityData.requiresAuthorization || false,
      requiredMaterial: activityData.requiredMaterial || [],
      attachedDocument: activityData.attachedDocument || null,
      createdAt: new Date().toISOString(),
      sessions: [
        {
          id: `sess-${Date.now()}`,
          tenantId: currentUser?.tenantId || 'ten-club',
          activityId: actId,
          startTime: activityData.initialSession.startTime,
          endTime: activityData.initialSession.endTime,
          location: activityData.initialSession.location
        }
      ],
      _count: { enrollments: 0 }
    };

    setActivities(prev => [newActivity, ...prev]);
    const extraMsg = saveAsTemplate ? ' y guardada como plantilla' : '';
    setSystemAlert(`¡Actividad "${newActivity.title}" añadida al calendario${extraMsg}!`);
    setTimeout(() => setSystemAlert(null), 4000);
  };

  // Manejador: Crear Actividad
  const handleCreateActivity = (newActData: Partial<ActivityDto> & { initialSession?: any }) => {
    const actId = `act-${Date.now()}`;
    const newActivity: ActivityDto = {
      id: actId,
      tenantId: currentUser?.tenantId || 'ten-club',
      title: newActData.title || 'Nueva Actividad',
      description: newActData.description || '',
      type: newActData.type || 'ENTRENAMIENTO',
      maxCapacity: newActData.maxCapacity || 20,
      minAge: newActData.minAge ?? null,
      maxAge: newActData.maxAge ?? null,
      priceCents: newActData.priceCents || 0,
      requiresAuthorization: newActData.requiresAuthorization || false,
      requiredMaterial: newActData.requiredMaterial || [],
      attachedDocument: newActData.attachedDocument || null,
      createdAt: new Date().toISOString(),
      sessions: newActData.initialSession ? [
        {
          id: `sess-${Date.now()}`,
          tenantId: currentUser?.tenantId || 'ten-club',
          activityId: actId,
          startTime: newActData.initialSession.startTime,
          endTime: newActData.initialSession.endTime,
          location: newActData.initialSession.location
        }
      ] : [],
      _count: { enrollments: 0 }
    };

    setActivities([newActivity, ...activities]);
    setSystemAlert(`¡Actividad "${newActivity.title}" publicada con éxito!`);
    setTimeout(() => setSystemAlert(null), 4000);
  };

  // Manejador: Eliminar Actividad (con regla de negocio temporal: bloqueado si ya ha pasado)
  const handleDeleteActivity = (activityId: string) => {
    const targetActivity = activities.find(a => a.id === activityId);
    if (!targetActivity) return;

    const now = new Date();
    const hasPastSession = targetActivity.sessions?.some(s => new Date(s.startTime) < now);

    if (hasPastSession) {
      alert(`No se puede eliminar la actividad "${targetActivity.title}" porque ya contiene sesiones celebradas en el pasado. Las actividades pasadas deben preservarse por motivos de trazabilidad, auditoría y RGPD.`);
      return;
    }

    setActivities(prev => prev.filter(a => a.id !== activityId));
    setEnrollments(prev => prev.filter(e => e.activityId !== activityId));
    setSystemAlert(`La actividad "${targetActivity.title}" ha sido eliminada correctamente.`);
    setTimeout(() => setSystemAlert(null), 4000);
  };

  // Manejador: Adjuntar Documento a una Actividad existente
  const handleAttachDocument = (activityId: string, document: AttachedDocumentDto) => {
    setActivities(prev => prev.map(a => {
      if (a.id === activityId) {
        return {
          ...a,
          attachedDocument: document,
          requiresAuthorization: true
        };
      }
      return a;
    }));
    setSystemAlert(`Documento "${document.fileName}" adjuntado para firma biométrica.`);
    setTimeout(() => setSystemAlert(null), 4000);
  };

  // Manejador: Inscribir Participante (Máquina de Estados de Cupos)
  const handleEnrollChild = (activityId: string, childId: string) => {
    const targetActivity = activities.find(a => a.id === activityId);
    const targetChild = childrenList.find(c => c.id === childId);
    if (!targetActivity || !targetChild) return;

    // Verificar si ya está inscrito
    const alreadyEnrolled = enrollments.find(e => e.activityId === activityId && e.childId === childId && e.status !== 'CANCELLED');
    if (alreadyEnrolled) {
      alert(`${targetChild.fullName} ya tiene una plaza activa en esta actividad.`);
      return;
    }

    const confirmedCount = targetActivity._count?.enrollments || 0;
    const hasCapacity = confirmedCount < targetActivity.maxCapacity;

    if (hasCapacity) {
      // Inscripción Confirmada
      const newEnrollment: EnrollmentDto = {
        id: `enr-${Date.now()}`,
        tenantId: targetActivity.tenantId,
        activityId,
        childId,
        status: 'CONFIRMED',
        waitlistPosition: null,
        createdAt: new Date().toISOString(),
        activity: { id: targetActivity.id, title: targetActivity.title },
        child: { id: targetChild.id, fullName: targetChild.fullName }
      };

      setEnrollments([...enrollments, newEnrollment]);
      setActivities(activities.map(a => 
        a.id === activityId 
          ? { ...a, _count: { enrollments: (a._count?.enrollments || 0) + 1 } }
          : a
      ));
      setSystemAlert(`¡Plaza CONFIRMADA para ${targetChild.fullName} en "${targetActivity.title}"!`);
    } else {
      // Inscripción en Lista de Espera Automática
      const existingWaitlist = enrollments.filter(e => e.activityId === activityId && e.status === 'WAITLISTED');
      const nextPosition = existingWaitlist.length + 1;

      const newEnrollment: EnrollmentDto = {
        id: `enr-${Date.now()}`,
        tenantId: targetActivity.tenantId,
        activityId,
        childId,
        status: 'WAITLISTED',
        waitlistPosition: nextPosition,
        createdAt: new Date().toISOString(),
        activity: { id: targetActivity.id, title: targetActivity.title },
        child: { id: targetChild.id, fullName: targetChild.fullName }
      };

      setEnrollments([...enrollments, newEnrollment]);
      setSystemAlert(`Aforo completo. ${targetChild.fullName} añadido a la LISTA DE ESPERA en la posición #${nextPosition}.`);
    }

    setTimeout(() => setSystemAlert(null), 5000);
  };

  // Manejador: Cancelación con Promoción Automática del Primer Esperante
  const handleCancelEnrollment = (enrollmentId: string) => {
    const target = enrollments.find(e => e.id === enrollmentId);
    if (!target) return;

    const wasConfirmed = target.status === 'CONFIRMED';
    const activityId = target.activityId;

    // Buscar si hay alguien en lista de espera para esta actividad
    const waitlisted = enrollments
      .filter(e => e.activityId === activityId && e.status === 'WAITLISTED')
      .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));

    const firstInQueue = waitlisted[0];

    // Actualizar inscripciones
    const updatedEnrollments = enrollments.map(enr => {
      if (enr.id === enrollmentId) {
        return { ...enr, status: 'CANCELLED' as const, waitlistPosition: null };
      }
      if (wasConfirmed && firstInQueue && enr.id === firstInQueue.id) {
        // Promocionado automáticamente
        return { ...enr, status: 'CONFIRMED' as const, waitlistPosition: null };
      }
      // Reordenar posiciones de espera restantes
      if (wasConfirmed && enr.activityId === activityId && enr.status === 'WAITLISTED' && (!firstInQueue || enr.id !== firstInQueue.id)) {
        return { ...enr, waitlistPosition: Math.max(1, (enr.waitlistPosition || 2) - 1) };
      }
      return enr;
    });

    setEnrollments(updatedEnrollments);

    if (wasConfirmed && firstInQueue) {
      setSystemAlert(`Plaza cancelada. Se ha PROMOVIDO AUTOMÁTICAMENTE a ${firstInQueue.child?.fullName || 'el primer participante'} desde la lista de espera a CONFIRMADO.`);
    } else {
      setSystemAlert('Inscripción cancelada.');
      if (wasConfirmed) {
        setActivities(activities.map(a => 
          a.id === activityId 
            ? { ...a, _count: { enrollments: Math.max(0, (a._count?.enrollments || 1) - 1) } }
            : a
        ));
      }
    }

    setTimeout(() => setSystemAlert(null), 6000);
  };

  // Manejador: Añadir Nuevo Menor
  const handleAddChild = (childData: {
    fullName: string;
    birthDate: string;
    emergencyContact: string;
    allergies?: string;
    medicalNotes?: string;
  }) => {
    const newChild: ChildSummaryDto = {
      id: `ch-${Date.now()}`,
      tenantId: currentUser?.tenantId || 'ten-club',
      fullName: childData.fullName,
      birthDate: childData.birthDate,
      emergencyContact: childData.emergencyContact,
      allergies: childData.allergies || null,
      medicalNotes: childData.medicalNotes || null,
      isMedicalContextActive: true
    };

    setChildrenList([...childrenList, newChild]);
    setSystemAlert(`¡Participante "${newChild.fullName}" añadido a la unidad familiar!`);
    setTimeout(() => setSystemAlert(null), 4000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col text-gray-800">
      {/* Barra de Notificación Flotante del Sistema */}
      {systemAlert && (
        <div className="fixed top-16 right-4 z-50 bg-brand-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-brand-700 flex items-center gap-2 max-w-md animate-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="leading-snug">{systemAlert}</span>
        </div>
      )}

      {/* Barra Superior con Controles TFG */}
      <header className="bg-brand-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-600 p-2 rounded-xl text-white font-bold flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">ActivApp</h1>
              <p className="text-xs text-blue-200">Plataforma SaaS Multi-Tenant & Offline-First (TFG)</p>
            </div>
          </div>

          {/* Selector de Entidad y Usuario Activo */}
          <div className="flex items-center gap-3">
            <div className="bg-brand-800/80 px-3 py-1.5 rounded-xl border border-brand-700 text-xs flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-300" />
              <span>{currentUser ? currentUser.tenantName : 'Selecciona Entidad'}</span>
            </div>

            <select 
              className="bg-brand-800 text-white text-xs px-2.5 py-1.5 rounded-xl border border-brand-700 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
              value={currentUser?.email || ''}
              onChange={(e) => {
                const selected = testUsers.find(u => u.email === e.target.value);
                setCurrentUser(selected || null);
              }}
            >
              <option value="">-- Cambiar Usuario / Rol --</option>
              {testUsers.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.fullName} ({u.roleName})
                </option>
              ))}
            </select>

            {/* Conmutador de Simulación Offline para el Tribunal */}
            <button
              onClick={() => setSimulationOffline(!simulationOffline)}
              title="Modo Demo Tribunal: Simula desconexión forzada de red"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
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

      {/* Navegación Principal con todas las Vistas */}
      <nav className="bg-white border-b border-gray-200 sticky top-[57px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 sm:space-x-2 overflow-x-auto py-2 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'dashboard' ? 'bg-brand-50 text-brand-700 font-bold border-b-2 border-brand-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Resumen y Tenant
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-3 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'activities' ? 'bg-brand-50 text-brand-700 font-bold border-b-2 border-brand-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Actividades ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'calendar' ? 'bg-brand-50 text-brand-700 font-bold border-b-2 border-brand-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" /> Calendario
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-3 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'participants' ? 'bg-brand-50 text-brand-700 font-bold border-b-2 border-brand-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HeartHandshake className="w-4 h-4" /> Mis Participantes ({childrenList.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'attendance' ? 'bg-brand-50 text-brand-700 font-bold border-b-2 border-brand-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" /> Asistencia (Fase 3)
          </button>
          <button
            onClick={() => setActiveTab('legal')}
            className={`px-3 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'legal' ? 'bg-brand-50 text-brand-700 font-bold border-b-2 border-brand-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileSignature className="w-4 h-4" /> LegalTech & Stripe (Fase 2B)
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-2 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'roles' ? 'bg-brand-50 text-brand-700 font-bold border-b-2 border-brand-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock className="w-4 h-4" /> RBAC Dinámico
          </button>
        </div>
      </nav>

      {/* Contenido Principal Dinámico */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Estado del Sistema & Multi-Tenancy</h2>
              <p className="text-gray-600 text-sm mb-4">
                ActivApp aísla las entidades en base de datos mediante la clave lógica <code className="bg-gray-100 px-1 py-0.5 rounded text-brand-700 font-mono">tenant_id</code>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 font-semibold mb-1 text-xs">
                    <Building2 className="w-4 h-4" /> Entidad Activa
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {currentUser ? currentUser.tenantName : 'Sin seleccionar'}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Slug: {currentUser ? currentUser.tenantSlug : 'N/A'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
                  <div className="flex items-center gap-2 text-purple-700 font-semibold mb-1 text-xs">
                    <Users className="w-4 h-4" /> Rol Activo
                  </div>
                  <div className="text-lg font-bold text-purple-900">
                    {currentUser ? currentUser.roleName : 'Anónimo'}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    {currentUser ? `${currentUser.permissions.length} permisos del club` : 'Sin permisos'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1 text-xs">
                    <CreditCard className="w-4 h-4" /> Base de Datos
                  </div>
                  <div className="text-lg font-bold text-emerald-900">PostgreSQL 16</div>
                  <div className="text-xs text-emerald-600 mt-1">Prisma ORM (13 tablas con tenant_id)</div>
                </div>
              </div>
            </div>

            {/* Ficha de Protección RGPD */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-600" /> Protección RGPD: Regla ABAC para Fichas Médicas
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Si un monitor tiene el permiso <code className="bg-gray-100 px-1 font-mono text-xs">medical:read_contextual</code>, los datos médicos de los menores solo se desencriptan si el monitor está asignado a la actividad y dentro de la ventana temporal activa (48h antes hasta 12h después).
              </p>
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <strong>Verificación para el usuario actual ({currentUser?.fullName}):</strong>{' '}
                {currentUser?.permissions.includes('medical:read_always')
                  ? 'Tiene acceso permanente de Administrador a fichas médicas.'
                  : currentUser?.permissions.includes('medical:read_contextual')
                  ? 'Solo puede ver fichas médicas bajo asignación y ventana temporal activa (Monitor Titulado).'
                  : 'NO tiene autorización para ver datos médicos de menores (Monitor en Prácticas / Tutor).'}
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Actividades */}
        {activeTab === 'activities' && (
          <ActivitiesList
            activities={activities}
            currentUser={currentUser}
            childrenList={childrenList}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onEnrollChild={handleEnrollChild}
            onDeleteActivity={handleDeleteActivity}
          />
        )}

        {/* Pestaña: Calendario */}
        {activeTab === 'calendar' && (
          <ActivityCalendar
            activities={activities}
            templates={templates}
            tenantName={currentUser?.tenantName || 'Entidad'}
            onScheduleActivity={handleScheduleActivityFromCalendar}
            onSaveTemplate={handleSaveTemplate}
            onDeleteActivity={handleDeleteActivity}
            onAttachDocument={handleAttachDocument}
          />
        )}

        {/* Pestaña: Mis Participantes */}
        {activeTab === 'participants' && (
          <MyParticipants
            childrenList={childrenList}
            enrollments={enrollments}
            onAddChild={handleAddChild}
            onCancelEnrollment={handleCancelEnrollment}
          />
        )}

        {/* Pestaña: Roles Dinámicos */}
        {activeTab === 'roles' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Motor RBAC Dinámico</h2>
            <p className="text-sm text-gray-600 mb-4">
              Cada club puede crear roles propios (ej. <em>Monitor en Prácticas</em> con acceso limitado sin datos médicos) además de los roles raíz predeterminados.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-700 text-xs uppercase">
                    <th className="py-2.5 px-3">Rol</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Permisos Clave</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-brand-800">ADMINISTRADOR</td>
                    <td className="py-2.5 px-3"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold">Sistema</span></td>
                    <td className="py-2.5 px-3">Acceso total, creación de actividades, roles y validación de cobros</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-brand-800">ENTRENADOR / MONITOR</td>
                    <td className="py-2.5 px-3"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold">Sistema</span></td>
                    <td className="py-2.5 px-3">Pasar lista offline, lectura médica contextual (ABAC)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-brand-800">MONITOR_PRACTICAS</td>
                    <td className="py-2.5 px-3"><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-bold">Dinámico Personalizado</span></td>
                    <td className="py-2.5 px-3">Pasar lista offline (Bloqueado el acceso a historial médico)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-brand-800">TUTOR_LEGAL</td>
                    <td className="py-2.5 px-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold">Familia</span></td>
                    <td className="py-2.5 px-3">Inscribir menores, ver actividades y firma biométrica LegalTech</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pestañas en desarrollo (Fase 2B y Fase 3) */}
        {(activeTab === 'attendance' || activeTab === 'legal') && (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-dashed border-gray-300 text-center">
            <div className="inline-flex p-3 bg-brand-50 text-brand-700 rounded-full mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {activeTab === 'legal' ? 'Módulo LegalTech & Stripe (Fase 2B)' : 'Módulo Asistencia Offline & Merge Engine (Fase 3)'}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 leading-relaxed">
              {activeTab === 'legal' 
                ? 'Próxima etapa: Firma biométrica sobre Canvas, generación de PDF inmutable sellado con SHA-256 y pasarela Stripe real.'
                : 'Etapa posterior: Persistencia local con Dexie.js (IndexedDB), Service Worker y algoritmo de resolución de conflictos concurrentes.'}
            </p>
          </div>
        )}
      </main>

      {/* Modal para Crear Actividad */}
      <CreateActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateActivity}
        tenantName={currentUser?.tenantName || 'Entidad'}
      />

      {/* Pie de página */}
      <footer className="bg-white border-t border-gray-200 py-3.5 text-center text-xs text-gray-500">
        ActivApp — Trabajo de Fin de Grado de <strong>Joel Navarro Molins</strong> (EUG - UAB, 2026-2027)
      </footer>
    </div>
  );
}
