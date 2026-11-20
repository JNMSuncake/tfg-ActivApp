import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Users, 
  List, 
  Grid
} from 'lucide-react';
import { ActivityDto, ActivitySessionDto, ActivityType } from '@activapp/shared';

interface ActivityCalendarProps {
  activities: ActivityDto[];
  tenantName: string;
}

export function ActivityCalendar({ activities, tenantName }: ActivityCalendarProps) {
  const [viewMode, setViewMode] = useState<'agenda' | 'month'>('agenda');
  const [selectedSession, setSelectedSession] = useState<{
    activity: ActivityDto;
    session: ActivitySessionDto;
  } | null>(null);

  // Extraer todas las sesiones con su actividad asociada
  const allSessions: Array<{ activity: ActivityDto; session: ActivitySessionDto }> = [];
  activities.forEach((act) => {
    if (act.sessions) {
      act.sessions.forEach((sess) => {
        allSessions.push({ activity: act, session: sess });
      });
    }
  });

  // Ordenar cronológicamente
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

  return (
    <div className="space-y-6">
      {/* Cabecera del Calendario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-700" />
            <span>Calendario de Actividades</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cronograma de sesiones y salidas de <span className="font-semibold text-brand-700">{tenantName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-xl flex text-xs">
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'agenda' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Agenda
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Mensual
            </button>
          </div>
        </div>
      </div>

      {/* Vista Agenda */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {allSessions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
              <CalendarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-gray-700">No hay sesiones programadas</h4>
              <p className="text-xs text-gray-500 mt-1">Crea actividades y añade sesiones para ver el calendario en acción.</p>
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

      {/* Vista Mensual (Simulador Visual TFG) */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-base text-gray-900">Noviembre 2026</h3>
            <div className="flex items-center gap-1 text-xs">
              <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">⚽ Entrenamiento</span>
              <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">🌲 Excursión</span>
              <span className="px-2 py-1 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">🏕️ Campamento</span>
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
              const hasEvents = allSessions.some(s => new Date(s.session.startTime).getDate() === day);

              return (
                <div
                  key={day}
                  className={`min-h-[70px] p-2 rounded-xl border flex flex-col justify-between text-xs transition-colors ${
                    hasEvents 
                      ? 'bg-brand-50/40 border-brand-200 hover:border-brand-500' 
                      : 'bg-white border-gray-100 text-gray-400'
                  }`}
                >
                  <span className={`font-bold ${hasEvents ? 'text-brand-900' : 'text-gray-400'}`}>
                    {day}
                  </span>

                  {hasEvents && (
                    <div className="space-y-1">
                      {allSessions
                        .filter(s => new Date(s.session.startTime).getDate() === day)
                        .slice(0, 2)
                        .map(ev => (
                          <div
                            key={ev.session.id}
                            className="text-[10px] font-semibold truncate px-1.5 py-0.5 rounded bg-brand-700 text-white"
                            title={ev.activity.title}
                          >
                            {ev.activity.title}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Detalle de Sesión */}
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

            <button
              onClick={() => setSelectedSession(null)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors"
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
