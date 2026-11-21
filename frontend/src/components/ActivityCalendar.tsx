import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Users, 
  List, 
  Grid,
  Bookmark,
  Plus,
  BookmarkPlus,
  Sparkles,
  X,
  Package
} from 'lucide-react';
import { 
  ActivityDto, 
  ActivitySessionDto, 
  ActivityType, 
  ActivityTemplateDto 
} from '@activapp/shared';

interface ActivityCalendarProps {
  activities: ActivityDto[];
  templates: ActivityTemplateDto[];
  tenantName: string;
  onScheduleActivity: (activityData: Partial<ActivityDto> & { initialSession: any }, saveAsTemplate?: boolean) => void;
  onSaveTemplate: (template: ActivityTemplateDto) => void;
}

// Lugares predefinidos habituales de la entidad
const DEFAULT_LOCATIONS = [
  'Campo Municipal de Gràcia (Césped)',
  'Pista Polideportiva Cubierta',
  'Local / Casal de l\'Esplai (Sala Principal)',
  'Gimnasio y Sala de Calentamiento',
  'Punto de Encuentro: Estación de Gràcia',
  'Parque Natural del Montseny (Salida)'
];

export function ActivityCalendar({ 
  activities, 
  templates, 
  tenantName,
  onScheduleActivity,
  onSaveTemplate
}: ActivityCalendarProps) {
  const [viewMode, setViewMode] = useState<'agenda' | 'month'>('month');
  const [isTemplatesDrawerOpen, setIsTemplatesDrawerOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<{
    activity: ActivityDto;
    session: ActivitySessionDto;
  } | null>(null);

  // Estado para creación rápida en día seleccionado (estilo Jira)
  const [quickCreateDay, setQuickCreateDay] = useState<number | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickType, setQuickType] = useState<ActivityType>('ENTRENAMIENTO');
  const [quickLocation, setQuickLocation] = useState(DEFAULT_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [quickStartTime, setQuickStartTime] = useState('17:30');
  const [quickEndTime, setQuickEndTime] = useState('19:00');
  const [quickMaxCapacity, setQuickMaxCapacity] = useState(20);
  const [saveAsNewTemplate, setSaveAsNewTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Extraer todas las sesiones con su actividad asociada
  const allSessions: Array<{ activity: ActivityDto; session: ActivitySessionDto }> = [];
  activities.forEach((act) => {
    if (act.sessions) {
      act.sessions.forEach((sess) => {
        allSessions.push({ activity: act, session: sess });
      });
    }
  });

  allSessions.sort((a, b) => new Date(a.session.startTime).getTime() - new Date(b.session.startTime).getTime());

  const getTypeColor = (type: ActivityType) => {
    switch (type) {
      case 'ENTRENAMIENTO': return 'bg-emerald-500 text-white';
      case 'PARTIDO': return 'bg-indigo-600 text-white';
      case 'EXCURSION': return 'bg-amber-500 text-white';
      case 'CAMPAMENTO': return 'bg-purple-600 text-white';
      case 'TALLER': return 'bg-pink-500 text-white';
      default: return 'bg-blue-600 text-white';
    }
  };

  // Cargar datos de una plantilla en el modal rápido
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return;

    setQuickTitle(tmpl.title);
    setQuickType(tmpl.type);
    setQuickMaxCapacity(tmpl.maxCapacity);
    
    if (DEFAULT_LOCATIONS.includes(tmpl.defaultLocation)) {
      setQuickLocation(tmpl.defaultLocation);
      setIsCustomLocation(false);
    } else {
      setIsCustomLocation(true);
      setCustomLocation(tmpl.defaultLocation);
    }
  };

  // Abrir Quick-Create para un día específico
  const handleDayClick = (day: number) => {
    setQuickCreateDay(day);
    setSelectedTemplateId('');
    setQuickTitle('');
    setQuickType('ENTRENAMIENTO');
    setQuickLocation(DEFAULT_LOCATIONS[0]);
    setIsCustomLocation(false);
    setCustomLocation('');
    setQuickStartTime('17:30');
    setQuickEndTime('19:00');
    setSaveAsNewTemplate(false);
  };

  // Programar directamente una plantilla desde el Drawer lateral estilo Jira
  const handleQuickScheduleFromTemplate = (template: ActivityTemplateDto) => {
    const today = new Date();
    const day = today.getDate();
    setQuickCreateDay(day);
    setSelectedTemplateId(template.id);
    setQuickTitle(template.title);
    setQuickType(template.type);
    setQuickMaxCapacity(template.maxCapacity);
    if (DEFAULT_LOCATIONS.includes(template.defaultLocation)) {
      setQuickLocation(template.defaultLocation);
      setIsCustomLocation(false);
    } else {
      setIsCustomLocation(true);
      setCustomLocation(template.defaultLocation);
    }
    setIsTemplatesDrawerOpen(false);
  };

  // Guardar la actividad y añadirla al calendario
  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCreateDay || !quickTitle.trim()) return;

    const locationFinal = isCustomLocation ? (customLocation.trim() || 'Ubicación a definir') : quickLocation;
    const year = 2026;
    const dayStr = quickCreateDay.toString().padStart(2, '0');
    const startIso = `${year}-11-${dayStr}T${quickStartTime}:00.000Z`;
    const endIso = `${year}-11-${dayStr}T${quickEndTime}:00.000Z`;

    // Si viene de plantilla, recuperamos los materiales y flags
    const sourceTemplate = templates.find(t => t.id === selectedTemplateId);

    const activityData: Partial<ActivityDto> & { initialSession: any } = {
      title: quickTitle.trim(),
      description: sourceTemplate?.description || `Sesión de ${quickType.toLowerCase()} programada desde el calendario.`,
      type: quickType,
      maxCapacity: quickMaxCapacity,
      minAge: sourceTemplate?.minAge || null,
      maxAge: sourceTemplate?.maxAge || null,
      priceCents: sourceTemplate?.priceCents || 0,
      requiresAuthorization: sourceTemplate?.requiresAuthorization || (quickType === 'EXCURSION' || quickType === 'CAMPAMENTO'),
      requiredMaterial: sourceTemplate?.requiredMaterial || [],
      initialSession: {
        startTime: startIso,
        endTime: endIso,
        location: locationFinal
      }
    };

    onScheduleActivity(activityData, saveAsNewTemplate);

    // Si marcó guardar como plantilla
    if (saveAsNewTemplate) {
      const newTmpl: ActivityTemplateDto = {
        id: `tmpl-${Date.now()}`,
        tenantId: 'ten-club',
        title: quickTitle.trim(),
        description: `Plantilla reutilizable de ${quickTitle.trim()}`,
        type: quickType,
        defaultLocation: locationFinal,
        maxCapacity: quickMaxCapacity,
        priceCents: sourceTemplate?.priceCents || 0,
        requiresAuthorization: quickType === 'EXCURSION' || quickType === 'CAMPAMENTO',
        requiredMaterial: sourceTemplate?.requiredMaterial || []
      };
      onSaveTemplate(newTmpl);
    }

    setQuickCreateDay(null);
  };

  // Guardar sesión activa como plantilla
  const handleSaveActiveSessionAsTemplate = () => {
    if (!selectedSession) return;
    const act = selectedSession.activity;
    const sess = selectedSession.session;

    const newTmpl: ActivityTemplateDto = {
      id: `tmpl-${Date.now()}`,
      tenantId: act.tenantId,
      title: act.title,
      description: act.description,
      type: act.type,
      defaultLocation: sess.location,
      maxCapacity: act.maxCapacity,
      minAge: act.minAge,
      maxAge: act.maxAge,
      priceCents: act.priceCents,
      requiresAuthorization: act.requiresAuthorization,
      requiredMaterial: act.requiredMaterial || []
    };

    onSaveTemplate(newTmpl);
    alert(`¡"${act.title}" guardada en tu biblioteca de plantillas!`);
  };

  return (
    <div className="space-y-6 relative">
      {/* Cabecera del Calendario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-700" />
            <span>Calendario Interactivo</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Planificación y programación de actividades para <span className="font-semibold text-brand-700">{tenantName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Botón Jira Style: Cajón de Plantillas */}
          <button
            onClick={() => setIsTemplatesDrawerOpen(!isTemplatesDrawerOpen)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isTemplatesDrawerOpen
                ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
            }`}
            title="Biblioteca de plantillas preconfiguradas para programar en 1 clic"
          >
            <Bookmark className="w-3.5 h-3.5 text-purple-600" />
            <span>Plantillas ({templates.length})</span>
          </button>

          {/* Selector de Vista (Mes / Agenda) */}
          <div className="bg-gray-100 p-1 rounded-xl flex text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Mes (Jira)
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'agenda' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Agenda
            </button>
          </div>
        </div>
      </div>

      {/* Banner Informativo Jira Style */}
      <div className="bg-blue-50/70 border border-blue-200/80 p-3.5 rounded-2xl flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            <strong>Flujo Rápido tipo Jira:</strong> Haz clic en cualquier casilla del mes para programar una actividad al instante o reutilizar tus plantillas guardadas.
          </span>
        </div>
        <span className="text-[11px] font-semibold text-blue-700 hidden sm:inline">Noviembre 2026</span>
      </div>

      {/* VISTA MENSUAL (JIRA STYLE CON QUICK-CLICK) */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-base text-gray-900">Noviembre 2026</h3>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">⚽ Entrenamiento</span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">🌲 Excursión</span>
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">🏕️ Campamento</span>
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">🏆 Partido</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-1">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 30 }).map((_, i) => {
              const day = i + 1;
              const daySessions = allSessions.filter(s => new Date(s.session.startTime).getDate() === day);
              const hasEvents = daySessions.length > 0;

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`group relative min-h-[92px] p-2 rounded-xl border flex flex-col justify-between text-xs transition-all cursor-pointer ${
                    hasEvents 
                      ? 'bg-brand-50/30 border-brand-200 hover:border-brand-500 hover:shadow-sm' 
                      : 'bg-white border-gray-150 hover:bg-gray-50/80 hover:border-brand-300'
                  }`}
                  title={`Haz clic para añadir una actividad al día ${day} de noviembre`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs ${hasEvents ? 'text-brand-900 font-extrabold' : 'text-gray-500'}`}>
                      {day}
                    </span>
                    {/* Botón rápido '+' tipo Jira al hacer hover */}
                    <span className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-brand-100 text-brand-700 transition-opacity">
                      <Plus className="w-3 h-3" />
                    </span>
                  </div>

                  {hasEvents && (
                    <div className="space-y-1 mt-1">
                      {daySessions.slice(0, 2).map(ev => (
                        <div
                          key={ev.session.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSession(ev);
                          }}
                          className={`text-[10px] font-semibold truncate px-1.5 py-0.5 rounded shadow-2xs hover:opacity-90 ${getTypeColor(ev.activity.type)}`}
                          title={`${ev.activity.title} (${ev.session.location})`}
                        >
                          {ev.activity.title}
                        </div>
                      ))}
                      {daySessions.length > 2 && (
                        <span className="text-[9px] font-bold text-gray-500 block text-right">
                          +{daySessions.length - 2} más
                        </span>
                      )}
                    </div>
                  )}

                  {!hasEvents && (
                    <span className="text-[10px] text-gray-300 italic group-hover:text-brand-400 transition-colors">
                      + Programar
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA AGENDA */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {allSessions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
              <CalendarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-gray-700">No hay sesiones programadas</h4>
              <p className="text-xs text-gray-500 mt-1">Usa las plantillas guardadas para programar sesiones rápidamente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allSessions.map(({ activity, session }) => {
                const startDate = new Date(session.startTime);
                const endDate = new Date(session.endTime);
                const dateStr = startDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                });
                const timeStr = `${startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

                return (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession({ activity, session })}
                    className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getTypeColor(activity.type)}`}>
                        {activity.type}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {timeStr}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-gray-900 leading-snug line-clamp-1">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-brand-800 font-medium capitalize mt-0.5">
                        {dateStr}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{session.location}</span>
                      </span>

                      <span className="flex items-center gap-1 text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md">
                        <Users className="w-3 h-3 text-gray-400" />
                        {activity._count?.enrollments || 0}/{activity.maxCapacity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DRAWER LATERAL: BIBLIOTECA DE PLANTILLAS (JIRA BACKLOG STYLE) */}
      {isTemplatesDrawerOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-base text-gray-900">Biblioteca de Plantillas</h3>
              </div>
              <button
                onClick={() => setIsTemplatesDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Actividades recurrentes preconfiguradas con sus lugares, materiales y aforos. Pulsa <strong>Programar</strong> para agendarlas en cualquier fecha en un solo clic.
            </p>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white hover:border-purple-300 transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getTypeColor(tmpl.type)}`}>
                        {tmpl.type}
                      </span>
                      <h4 className="font-bold text-sm text-gray-900 mt-1">{tmpl.title}</h4>
                    </div>
                    <button
                      onClick={() => handleQuickScheduleFromTemplate(tmpl)}
                      className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3 h-3" /> Programar
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2">{tmpl.description}</p>

                  <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{tmpl.defaultLocation}</span>
                    </span>
                    <span>Aforo: {tmpl.maxCapacity} plazas</span>
                  </div>

                  {tmpl.requiredMaterial && tmpl.requiredMaterial.length > 0 && (
                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Package className="w-3 h-3 text-gray-400" />
                      <span>{tmpl.requiredMaterial.length} materiales predefinidos</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-400">
              Las plantillas se pueden editar y ampliar desde cualquier actividad guardada.
            </span>
          </div>
        </div>
      )}

      {/* MODAL JIRA QUICK-CREATE (AL CLICAR EN UN DÍA DEL CALENDARIO) */}
      {quickCreateDay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-50 text-brand-700 rounded-lg">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-gray-900">
                  Programar para el {quickCreateDay} de Noviembre
                </h3>
              </div>
              <button
                onClick={() => setQuickCreateDay(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-4 text-xs text-gray-700">
              {/* Opción 1: Cargar desde plantilla */}
              {templates.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200/80 space-y-1">
                  <label className="block text-[11px] font-bold text-purple-900 uppercase">
                    ¿Cargar desde plantilla guardada? (Opcional)
                  </label>
                  <select
                    className="w-full px-3 py-1.5 rounded-lg border border-purple-200 text-xs bg-white text-gray-800"
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                  >
                    <option value="">-- Crear nueva desde cero --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.type} - {t.defaultLocation})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Título y Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                    Título de la Actividad *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Partido Infantil A vs CE Sarrià"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-600 focus:outline-none"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                    Tipología *
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                    value={quickType}
                    onChange={(e) => setQuickType(e.target.value as ActivityType)}
                  >
                    <option value="ENTRENAMIENTO">⚽ Entrenamiento</option>
                    <option value="PARTIDO">🏆 Partido</option>
                    <option value="EXCURSION">🌲 Excursión</option>
                    <option value="CAMPAMENTO">🏕️ Campamento</option>
                    <option value="TALLER">🎨 Taller</option>
                    <option value="REUNION">👥 Reunión</option>
                  </select>
                </div>
              </div>

              {/* Selector de Lugar (Requisito Explícito) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase text-gray-600">
                  Escoger Lugar / Instalación *
                </label>
                
                {!isCustomLocation ? (
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                      value={quickLocation}
                      onChange={(e) => setQuickLocation(e.target.value)}
                    >
                      {DEFAULT_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCustomLocation(true)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-semibold"
                    >
                      Otro...
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe la dirección o punto de encuentro..."
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomLocation(false)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-semibold"
                    >
                      Lugares habituales
                    </button>
                  </div>
                )}
              </div>

              {/* Horario y Aforo */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                    value={quickStartTime}
                    onChange={(e) => setQuickStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">Hora Fin</label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                    value={quickEndTime}
                    onChange={(e) => setQuickEndTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">Aforo Máximo</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                    value={quickMaxCapacity}
                    onChange={(e) => setQuickMaxCapacity(parseInt(e.target.value) || 20)}
                  />
                </div>
              </div>

              {/* Opción de guardar como plantilla (Requisito Explícito) */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookmarkPlus className="w-4 h-4 text-purple-600" />
                  <div>
                    <span className="font-semibold text-gray-800 text-xs">Guardar como plantilla reutilizable</span>
                    <p className="text-[10px] text-gray-500">Aparecerá en tu biblioteca para volver a agendarla con la misma configuración.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-600 rounded border-gray-300"
                  checked={saveAsNewTemplate}
                  onChange={(e) => setSaveAsNewTemplate(e.target.checked)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setQuickCreateDay(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Añadir al Calendario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE SESIÓN */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getTypeColor(selectedSession.activity.type)}`}>
                  {selectedSession.activity.type}
                </span>
                <h3 className="font-bold text-base text-gray-900 mt-1">
                  {selectedSession.activity.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-brand-600" />
                <span>
                  {new Date(selectedSession.session.startTime).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>
                  {new Date(selectedSession.session.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} a {new Date(selectedSession.session.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span className="font-semibold">{selectedSession.session.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600" />
                <span>Aforo: {selectedSession.activity._count?.enrollments || 0} / {selectedSession.activity.maxCapacity} confirmados</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {selectedSession.activity.description}
            </p>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSaveActiveSessionAsTemplate}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-purple-200"
              >
                <BookmarkPlus className="w-3.5 h-3.5" /> Guardar como Plantilla
              </button>

              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
