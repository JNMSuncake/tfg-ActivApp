import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Users, 
  List, 
  Grid,
  Columns,
  Bookmark,
  Plus,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  ShieldAlert
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

// Horas del eje vertical (de 08:00 a 22:00)
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const HOUR_ROW_HEIGHT = 64; // Altura en píxeles por cada hora

export function ActivityCalendar({ 
  activities, 
  templates, 
  tenantName,
  onScheduleActivity,
  onSaveTemplate
}: ActivityCalendarProps) {
  // Modo por defecto: SEMANA HORIZONTAL CON HORAS EN EJE VERTICAL
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'agenda'>('week');
  const [isTemplatesDrawerOpen, setIsTemplatesDrawerOpen] = useState(false);
  
  // Semana activa (semana base: 23 de Noviembre de 2026 para alinear con las actividades semilla)
  const [weekOffset, setWeekOffset] = useState(0);
  const BASE_DATE = new Date('2026-11-23T00:00:00.000Z'); // Lunes
  const currentMonday = new Date(BASE_DATE);
  currentMonday.setDate(BASE_DATE.getDate() + weekOffset * 7);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentMonday);
    d.setDate(currentMonday.getDate() + i);
    return d;
  });

  const [selectedSession, setSelectedSession] = useState<{
    activity: ActivityDto;
    session: ActivitySessionDto;
  } | null>(null);

  // Estado del modal de creación rápida por hora y día
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date>(new Date());
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<ActivityType>('ENTRENAMIENTO');
  const [modalMaxCapacity, setModalMaxCapacity] = useState<number>(20);
  const [modalLocation, setModalLocation] = useState(DEFAULT_LOCATIONS[0]);
  const [modalCustomLocation, setModalCustomLocation] = useState('');
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [modalStartTime, setModalStartTime] = useState('17:00');
  const [modalEndTime, setModalEndTime] = useState('18:30');
  const [modalPriceEuros, setModalPriceEuros] = useState(0);
  const [modalRequiresAuth, setModalRequiresAuth] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [saveAsNewTemplate, setSaveAsNewTemplate] = useState(false);

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
      case 'ENTRENAMIENTO': return 'bg-emerald-600 text-white border-emerald-700';
      case 'PARTIDO': return 'bg-indigo-600 text-white border-indigo-700';
      case 'EXCURSION': return 'bg-amber-600 text-white border-amber-700';
      case 'CAMPAMENTO': return 'bg-purple-600 text-white border-purple-700';
      case 'TALLER': return 'bg-pink-600 text-white border-pink-700';
      default: return 'bg-blue-600 text-white border-blue-700';
    }
  };

  // Abrir modal haciendo clic en una franja horaria de un día concreto
  const handleSlotClick = (dayDate: Date, hour: number) => {
    setModalDate(dayDate);
    const startH = hour.toString().padStart(2, '0');
    const endH = Math.min(23, hour + 1).toString().padStart(2, '0');
    setModalStartTime(`${startH}:00`);
    setModalEndTime(`${endH}:30`);
    setModalTitle('');
    setModalType('ENTRENAMIENTO');
    setModalMaxCapacity(20);
    setModalLocation(DEFAULT_LOCATIONS[0]);
    setIsCustomLocation(false);
    setModalCustomLocation('');
    setModalPriceEuros(0);
    setModalRequiresAuth(false);
    setSelectedTemplateId('');
    setSaveAsNewTemplate(false);
    setCreateModalOpen(true);
  };

  // Cargar plantilla en el modal
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return;

    setModalTitle(tmpl.title);
    setModalType(tmpl.type);
    setModalMaxCapacity(tmpl.maxCapacity);
    setModalPriceEuros(tmpl.priceCents / 100);
    setModalRequiresAuth(tmpl.requiresAuthorization);

    if (DEFAULT_LOCATIONS.includes(tmpl.defaultLocation)) {
      setModalLocation(tmpl.defaultLocation);
      setIsCustomLocation(false);
    } else {
      setIsCustomLocation(true);
      setModalCustomLocation(tmpl.defaultLocation);
    }
  };

  // Guardar la actividad y colocarla en el horario
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    const locationFinal = isCustomLocation ? (modalCustomLocation.trim() || 'Ubicación por definir') : modalLocation;
    const year = modalDate.getFullYear();
    const month = (modalDate.getMonth() + 1).toString().padStart(2, '0');
    const day = modalDate.getDate().toString().padStart(2, '0');

    const startIso = `${year}-${month}-${day}T${modalStartTime}:00.000Z`;
    const endIso = `${year}-${month}-${day}T${modalEndTime}:00.000Z`;

    const sourceTemplate = templates.find(t => t.id === selectedTemplateId);

    const activityData: Partial<ActivityDto> & { initialSession: any } = {
      title: modalTitle.trim(),
      description: sourceTemplate?.description || `Sesión de ${modalType.toLowerCase()} programada en ${locationFinal}.`,
      type: modalType,
      maxCapacity: Number(modalMaxCapacity),
      minAge: sourceTemplate?.minAge || null,
      maxAge: sourceTemplate?.maxAge || null,
      priceCents: Math.round(Number(modalPriceEuros) * 100),
      requiresAuthorization: modalRequiresAuth,
      requiredMaterial: sourceTemplate?.requiredMaterial || [],
      initialSession: {
        startTime: startIso,
        endTime: endIso,
        location: locationFinal
      }
    };

    onScheduleActivity(activityData, saveAsNewTemplate);

    if (saveAsNewTemplate) {
      const newTmpl: ActivityTemplateDto = {
        id: `tmpl-${Date.now()}`,
        tenantId: 'ten-club',
        title: modalTitle.trim(),
        description: `Plantilla reutilizable de ${modalTitle.trim()}`,
        type: modalType,
        defaultLocation: locationFinal,
        maxCapacity: Number(modalMaxCapacity),
        priceCents: Math.round(Number(modalPriceEuros) * 100),
        requiresAuthorization: modalRequiresAuth,
        requiredMaterial: sourceTemplate?.requiredMaterial || []
      };
      onSaveTemplate(newTmpl);
    }

    setCreateModalOpen(false);
  };

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="space-y-6">
      {/* Barra Superior de Control del Calendario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-700" />
            <span>Horario Semanal de Actividades</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Planificación deportiva de <span className="font-semibold text-brand-700">{tenantName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Navegación de Semanas */}
          {viewMode === 'week' && (
            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 text-xs">
              <button
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-colors"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="px-2.5 py-1 font-bold text-gray-800 hover:bg-white rounded-lg transition-colors text-xs"
              >
                Hoy
              </button>
              <button
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-colors"
                title="Semana siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Botón Cajón de Plantillas Jira */}
          <button
            onClick={() => setIsTemplatesDrawerOpen(!isTemplatesDrawerOpen)}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <Bookmark className="w-4 h-4 text-purple-600" />
            <span>Plantillas ({templates.length})</span>
          </button>

          {/* Selector de Modos de Vista */}
          <div className="bg-gray-100 p-1 rounded-xl flex text-xs">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-brand-600" /> Semana (Horas)
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Mes
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

      {/* Rango de la Semana Activa */}
      {viewMode === 'week' && (
        <div className="flex items-center justify-between text-xs text-gray-600 bg-brand-50/50 border border-brand-100 px-4 py-2.5 rounded-xl">
          <span className="font-semibold text-brand-900">
            📅 Semana del {weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} al {weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="text-[11px] text-brand-700 italic">
            💡 Haz clic en cualquier casilla horaria para programar una actividad
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 1: SEMANAL CON COLUMNAS POR DÍA Y HORAS EN EL EJE Y */}
      {/* ========================================================= */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
          <div className="min-w-[850px]">
            {/* Cabecera de Columnas: Días de la Semana */}
            <div className="grid grid-cols-8 border-b border-gray-200 sticky top-0 bg-white z-20">
              <div className="p-3 text-center text-xs font-bold text-gray-400 border-r border-gray-100 flex items-center justify-center">
                Hora (Eje Y)
              </div>
              {weekDays.map((date, idx) => {
                const isToday = new Date().toDateString() === date.toDateString();
                return (
                  <div
                    key={idx}
                    className={`p-3 text-center border-r border-gray-100 last:border-r-0 ${
                      isToday ? 'bg-brand-50/70' : 'bg-gray-50/40'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      {dayNames[idx]}
                    </div>
                    <div className={`text-base font-extrabold mt-0.5 ${isToday ? 'text-brand-700' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rejilla de Horas y Contenedor de Eventos */}
            <div className="relative">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-8 border-b border-gray-100 transition-colors"
                  style={{ height: `${HOUR_ROW_HEIGHT}px` }}
                >
                  {/* Etiqueta de la hora en el eje Y */}
                  <div className="p-2 text-right pr-3 text-xs font-bold text-gray-400 border-r border-gray-100 bg-gray-50/20 select-none">
                    {hour.toString().padStart(2, '0')}:00
                  </div>

                  {/* 7 Celdas correspondientes a cada día de la semana */}
                  {weekDays.map((dayDate, dayIdx) => (
                    <div
                      key={dayIdx}
                      onClick={() => handleSlotClick(dayDate, hour)}
                      className="group relative border-r border-gray-100 last:border-r-0 hover:bg-brand-50/40 transition-colors cursor-pointer"
                      title={`Programar actividad el ${dayNames[dayIdx]} ${dayDate.getDate()} a las ${hour}:00`}
                    >
                      {/* Botón flotante al hacer hover */}
                      <span className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 p-0.5 rounded bg-brand-600 text-white shadow-2xs transition-opacity text-[10px] z-10">
                        <Plus className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>
              ))}

              {/* Capa de Eventos Posicionados Absolutamente */}
              {allSessions.map(({ activity, session }) => {
                const sDate = new Date(session.startTime);
                const eDate = new Date(session.endTime);

                // Comprobar si la sesión cae en la semana actual
                const sessionDateStr = sDate.toDateString();
                const dayColumnIndex = weekDays.findIndex(d => d.toDateString() === sessionDateStr);
                if (dayColumnIndex === -1) return null; // No cae en esta semana

                const startH = sDate.getHours() + sDate.getMinutes() / 60;
                const endH = eDate.getHours() + eDate.getMinutes() / 60;

                // Si está fuera del rango 08:00 a 22:00, recortar para vista
                const visibleStart = Math.max(8, startH);
                const visibleEnd = Math.min(23, endH);
                if (visibleStart >= 23 || visibleEnd <= 8) return null;

                const topPx = (visibleStart - 8) * HOUR_ROW_HEIGHT;
                const heightPx = Math.max(38, (visibleEnd - visibleStart) * HOUR_ROW_HEIGHT);

                // Columna 1 a 7 dentro de grid de 8 columnas
                // Left = 12.5% * (dayColumnIndex + 1)
                const leftPercent = (100 / 8) * (dayColumnIndex + 1);
                const widthPercent = (100 / 8) - 0.4;

                const confirmed = activity._count?.enrollments || 0;
                const isFull = confirmed >= activity.maxCapacity;

                return (
                  <div
                    key={session.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSession({ activity, session });
                    }}
                    style={{
                      top: `${topPx + 2}px`,
                      height: `${heightPx - 4}px`,
                      left: `calc(${leftPercent}% + 2px)`,
                      width: `calc(${widthPercent}% - 4px)`
                    }}
                    className={`absolute z-10 rounded-xl p-2.5 shadow-sm border text-xs cursor-pointer overflow-hidden transition-all hover:scale-[1.01] hover:shadow-md ${getTypeColor(activity.type)}`}
                  >
                    <div className="font-bold text-xs truncate leading-tight">
                      {activity.title}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] opacity-90 mt-0.5">
                      <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                      <span>
                        {sDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {eDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {heightPx > 50 && (
                      <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-white/20">
                        <span className="flex items-center gap-1 truncate max-w-[90px]">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{session.location}</span>
                        </span>
                        <span className={`px-1.5 py-0.2 rounded font-extrabold ${isFull ? 'bg-amber-400 text-gray-950' : 'bg-white/20'}`}>
                          {confirmed}/{activity.maxCapacity}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 2: MENSUAL CLÁSICA CON CASILLAS */}
      {/* ========================================================= */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-base text-gray-900">Noviembre 2026</h3>
            <span className="text-xs text-gray-400">30 Días</span>
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
              const dayDate = new Date(`2026-11-${day.toString().padStart(2, '0')}T00:00:00Z`);
              const daySessions = allSessions.filter(s => new Date(s.session.startTime).getDate() === day);

              return (
                <div
                  key={day}
                  onClick={() => handleSlotClick(dayDate, 17)}
                  className="min-h-[85px] p-2 rounded-xl border border-gray-150 hover:border-brand-400 transition-colors cursor-pointer flex flex-col justify-between bg-white hover:bg-gray-50/60"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-800">{day}</span>
                    {daySessions.length > 0 && (
                      <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 rounded-full">
                        {daySessions.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 my-1">
                    {daySessions.slice(0, 2).map(ev => (
                      <div
                        key={ev.session.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(ev);
                        }}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate text-white ${getTypeColor(ev.activity.type)}`}
                      >
                        {ev.activity.title}
                      </div>
                    ))}
                  </div>

                  <span className="text-[9px] text-gray-300 italic block text-right">+ Añadir</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 3: AGENDA EN LISTA CRONOLÓGICA */}
      {/* ========================================================= */}
      {viewMode === 'agenda' && (
        <div className="space-y-3">
          {allSessions.map(({ activity, session }) => {
            const start = new Date(session.startTime);
            const end = new Date(session.endTime);
            return (
              <div
                key={session.id}
                onClick={() => setSelectedSession({ activity, session })}
                className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTypeColor(activity.type)}`}>
                      {activity.type}
                    </span>
                    <span className="text-xs font-semibold text-gray-600">
                      {start.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">{activity.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {session.location}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-gray-800 bg-gray-100 px-3 py-1.5 rounded-xl">
                    {activity._count?.enrollments || 0} / {activity.maxCapacity} plazas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CREAR ACTIVIDAD DIRECTO DESDE CELDA HORARIA */}
      {/* ========================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-50 text-brand-700 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    Nueva Actividad — {modalDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <p className="text-xs text-gray-500">Horario preseleccionado: {modalStartTime} a {modalEndTime}</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4 text-xs text-gray-700">
              {/* Opción 1: Cargar desde plantilla */}
              {templates.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200/80 space-y-1">
                  <label className="block text-[11px] font-bold text-purple-900 uppercase">
                    ¿Usar una plantilla guardada? (Opcional)
                  </label>
                  <select
                    className="w-full px-3 py-1.5 rounded-lg border border-purple-200 text-xs bg-white text-gray-800"
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                  >
                    <option value="">-- Crear desde cero --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.type} - {t.defaultLocation})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nombre y Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                    Nombre de la Actividad *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Entrenamiento Técnico Alevín / Taller de Pintura"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-600 focus:outline-none"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                    Tipología *
                  </label>
                  <select
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                    value={modalType}
                    onChange={(e) => setModalType(e.target.value as ActivityType)}
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

              {/* Límite de personas / Aforo y Cuota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" /> Límite de Personas (Aforo Máximo) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                    value={modalMaxCapacity}
                    onChange={(e) => setModalMaxCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    Al superarse, las siguientes inscripciones irán a lista de espera ordenada.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                    Precio / Cuota (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                    value={modalPriceEuros}
                    onChange={(e) => setModalPriceEuros(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    0 € = Actividad gratuita incluida en la cuota
                  </span>
                </div>
              </div>

              {/* Selector de Lugar / Instalación */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" /> Escoger Lugar / Espacio Habitual *
                </label>
                
                {!isCustomLocation ? (
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                      value={modalLocation}
                      onChange={(e) => setModalLocation(e.target.value)}
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
                      Otra ubicación...
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe la dirección o punto de encuentro..."
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs"
                      value={modalCustomLocation}
                      onChange={(e) => setModalCustomLocation(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomLocation(false)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-semibold"
                    >
                      Espacios habituales
                    </button>
                  </div>
                )}
              </div>

              {/* Horas de Inicio y Fin */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" /> Hora Inicio
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                    value={modalStartTime}
                    onChange={(e) => setModalStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" /> Hora Fin
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                    value={modalEndTime}
                    onChange={(e) => setModalEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Requiere autorización legal */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <div>
                    <span className="font-semibold text-amber-950 text-xs">Requiere Autorización Firmada (PDF)</span>
                    <p className="text-[10px] text-amber-800">Bloquea la asistencia de menores sin firma legal.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-brand-600 rounded"
                  checked={modalRequiresAuth}
                  onChange={(e) => setModalRequiresAuth(e.target.checked)}
                />
              </div>

              {/* Guardar como plantilla */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookmarkPlus className="w-4 h-4 text-purple-700" />
                  <div>
                    <span className="font-semibold text-purple-950 text-xs">Guardar configuración como plantilla</span>
                    <p className="text-[10px] text-purple-800">Se guardará en la biblioteca para reusarla en 1 clic.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-600 rounded"
                  checked={saveAsNewTemplate}
                  onChange={(e) => setSaveAsNewTemplate(e.target.checked)}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Guardar en el Calendario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER LATERAL DE PLANTILLAS JIRA */}
      {/* ========================================================= */}
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
              Plantillas guardadas con su lugar, aforo y materiales. Haz clic en <strong>Programar</strong> para colocarla en el día que quieras en 1 clic.
            </p>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white hover:border-purple-300 transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase text-white ${getTypeColor(tmpl.type)}`}>
                        {tmpl.type}
                      </span>
                      <h4 className="font-bold text-sm text-gray-900 mt-1">{tmpl.title}</h4>
                    </div>
                    <button
                      onClick={() => {
                        setModalDate(weekDays[0]);
                        handleSelectTemplate(tmpl.id);
                        setIsTemplatesDrawerOpen(false);
                        setCreateModalOpen(true);
                      }}
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
                    <span>Límite: {tmpl.maxCapacity} pers.</span>
                  </div>

                  {tmpl.requiredMaterial && tmpl.requiredMaterial.length > 0 && (
                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Package className="w-3 h-3 text-gray-400" />
                      <span>{tmpl.requiredMaterial.length} materiales</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-400">
              Usa el botón "Guardar como plantilla" al crear para añadir más opciones aquí.
            </span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DETALLE DE SESIÓN */}
      {/* ========================================================= */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${getTypeColor(selectedSession.activity.type)}`}>
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
                <span>Límite de personas: {selectedSession.activity._count?.enrollments || 0} / {selectedSession.activity.maxCapacity} confirmados</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {selectedSession.activity.description}
            </p>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  const act = selectedSession.activity;
                  const sess = selectedSession.session;
                  onSaveTemplate({
                    id: `tmpl-${Date.now()}`,
                    tenantId: act.tenantId,
                    title: act.title,
                    description: act.description,
                    type: act.type,
                    defaultLocation: sess.location,
                    maxCapacity: act.maxCapacity,
                    priceCents: act.priceCents,
                    requiresAuthorization: act.requiresAuthorization,
                    requiredMaterial: act.requiredMaterial || []
                  });
                  alert(`"${act.title}" guardada en la biblioteca de plantillas.`);
                }}
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
