import { useState } from 'react';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  Package, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { ActivityDto, ActivityType, UserSessionPayload, ChildSummaryDto } from '@activapp/shared';

interface ActivitiesListProps {
  activities: ActivityDto[];
  currentUser: UserSessionPayload | null;
  childrenList: ChildSummaryDto[];
  onOpenCreateModal: () => void;
  onEnrollChild: (activityId: string, childId: string) => void;
}

export function ActivitiesList({
  activities,
  currentUser,
  childrenList,
  onOpenCreateModal,
  onEnrollChild
}: ActivitiesListProps) {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [enrollModalActivity, setEnrollModalActivity] = useState<ActivityDto | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const canCreateActivity = currentUser?.permissions.includes('activities:create') || currentUser?.isSystemAdmin;

  const filteredActivities = selectedType === 'ALL'
    ? activities
    : activities.filter(a => a.type === selectedType);

  const formatPrice = (priceCents: number) => {
    if (!priceCents || priceCents === 0) return 'Gratis';
    return `${(priceCents / 100).toFixed(2)} €`;
  };

  const getTypeBadge = (type: ActivityType) => {
    const config: Record<ActivityType, { label: string; color: string }> = {
      ENTRENAMIENTO: { label: '⚽ Entrenamiento', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      PARTIDO: { label: '🏆 Partido', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      EXCURSION: { label: '🌲 Excursión', color: 'bg-amber-50 text-amber-800 border-amber-200' },
      CAMPAMENTO: { label: '🏕️ Campamento', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      TALLER: { label: '🎨 Taller', color: 'bg-pink-50 text-pink-700 border-pink-200' },
      REUNION: { label: '👥 Reunión', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    };
    const c = config[type] || { label: type, color: 'bg-gray-50 text-gray-700 border-gray-200' };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.color}`}>{c.label}</span>;
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollModalActivity || !selectedChildId) return;
    onEnrollChild(enrollModalActivity.id, selectedChildId);
    setEnrollModalActivity(null);
    setSelectedChildId('');
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>Actividades y Eventos</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
              {filteredActivities.length}
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Planificación deportiva y asociativa de <span className="font-semibold text-brand-700">{currentUser?.tenantName || 'Entidad'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canCreateActivity && (
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Nueva Actividad
            </button>
          )}
        </div>
      </div>

      {/* Selector de Categorías */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'ALL', label: 'Todas' },
          { key: 'ENTRENAMIENTO', label: 'Entrenamientos' },
          { key: 'EXCURSION', label: 'Excursiones' },
          { key: 'CAMPAMENTO', label: 'Campamentos' },
          { key: 'PARTIDO', label: 'Partidos' },
          { key: 'TALLER', label: 'Talleres' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedType(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              selectedType === tab.key
                ? 'bg-brand-800 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid de Actividades */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
          <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-gray-700">No hay actividades publicadas en esta categoría</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {canCreateActivity ? 'Puedes crear la primera actividad haciendo clic en "Nueva Actividad".' : 'Vuelve a consultar más tarde para nuevas publicaciones.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActivities.map((act) => {
            const confirmedCount = act._count?.enrollments || 0;
            const availableSeats = Math.max(0, act.maxCapacity - confirmedCount);
            const isFull = availableSeats === 0;
            const isExpanded = expandedActivityId === act.id;

            return (
              <div
                key={act.id}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(act.type)}
                        {act.requiresAuthorization && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <ShieldAlert className="w-3 h-3" /> Requiere Firma Legal
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-gray-900 leading-snug">{act.title}</h3>
                    </div>
                    <span className="text-sm font-black text-brand-900 bg-brand-50 px-2.5 py-1 rounded-xl whitespace-nowrap border border-brand-100">
                      {formatPrice(act.priceCents)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {act.description}
                  </p>

                  {/* Indicador de Cupos / Aforo */}
                  <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 border border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        Ocupación de Plazas
                      </span>
                      <span className={`font-bold ${isFull ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {confirmedCount} / {act.maxCapacity} confirmados
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (confirmedCount / act.maxCapacity) * 100)}%` }}
                      />
                    </div>

                    {isFull ? (
                      <div className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Aforo completo: las nuevas inscripciones pasan a lista de espera ordenada
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {availableSeats} {availableSeats === 1 ? 'plaza disponible' : 'plazas disponibles'}
                      </div>
                    )}
                  </div>

                  {/* Sesiones y Puntos de Encuentro */}
                  {act.sessions && act.sessions.length > 0 && (
                    <div className="space-y-1.5 pt-1 text-xs text-gray-600">
                      {act.sessions.map((sess) => {
                        const dateFormatted = new Date(sess.startTime).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        });
                        const timeFormatted = `${new Date(sess.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${new Date(sess.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

                        return (
                          <div key={sess.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] bg-blue-50/50 p-2 rounded-lg border border-blue-100/60">
                            <span className="flex items-center gap-1.5 font-medium text-blue-900">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              {dateFormatted} ({timeFormatted})
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {sess.location}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Desplegable de Checklist de Material Requerido */}
                  {act.requiredMaterial && act.requiredMaterial.length > 0 && (
                    <div className="pt-1">
                      <button
                        onClick={() => setExpandedActivityId(isExpanded ? null : act.id)}
                        className="text-xs text-brand-700 font-semibold hover:text-brand-900 flex items-center gap-1"
                      >
                        <Package className="w-3.5 h-3.5" />
                        {act.requiredMaterial.length} elementos de material necesario
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200/70 space-y-1">
                          {act.requiredMaterial.map((m) => (
                            <div key={m.id} className="flex items-center justify-between text-[11px]">
                              <span className="text-gray-700">• {m.name}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                m.isMandatory ? 'bg-rose-100 text-rose-800' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {m.isMandatory ? 'Obligatorio' : 'Opcional'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer de Tarjeta con Botón de Inscripción */}
                <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-[11px] text-gray-500">
                    {act.minAge || act.maxAge ? (
                      <span>Edades: {act.minAge || 0} a {act.maxAge || '+'} años</span>
                    ) : (
                      <span>Todas las edades</span>
                    )}
                  </div>

                  <button
                    onClick={() => setEnrollModalActivity(act)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      isFull
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-brand-700 hover:bg-brand-800 text-white'
                    }`}
                  >
                    {isFull ? 'Unirse a Lista de Espera' : 'Inscribirse / Apuntar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Inscripción */}
      {enrollModalActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <h3 className="font-bold text-base text-gray-900">
              Inscripción a: <span className="text-brand-800">{enrollModalActivity.title}</span>
            </h3>

            <p className="text-xs text-gray-600">
              Selecciona el participante o menor a cargo que deseas apuntar a esta actividad.
            </p>

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Participante / Menor a Cargo *
                </label>
                {childrenList.length > 0 ? (
                  <select
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                  >
                    <option value="">-- Elige a un participante --</option>
                    {childrenList.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.fullName} (Nacimiento: {new Date(ch.birthDate).toLocaleDateString('es-ES')})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-800 border border-amber-200">
                    No tienes ningún participante registrado aún. Dirígete a la pestaña <strong>"Mis Participantes"</strong> para añadir uno.
                  </div>
                )}
              </div>

              {enrollModalActivity.requiresAuthorization && (
                <div className="p-3 bg-amber-50/80 rounded-xl text-xs text-amber-900 border border-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                    Requiere Autorización Firmada
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Al inscribir, se generará una orden legal para firmar digitalmente el PDF en la pestaña <strong>LegalTech</strong>.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEnrollModalActivity(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedChildId}
                  className="px-4 py-2 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Confirmar Inscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
