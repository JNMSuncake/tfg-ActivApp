import { useState } from 'react';
import { X, Plus, Trash2, Calendar, MapPin, Euro, Users, ShieldAlert, Sparkles } from 'lucide-react';
import { ActivityType, RequiredMaterialItem, ActivityDto } from '@activapp/shared';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newActivity: Partial<ActivityDto> & { initialSession?: any }) => void;
  tenantName: string;
}

export function CreateActivityModal({ isOpen, onClose, onCreate, tenantName }: CreateActivityModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ActivityType>('ENTRENAMIENTO');
  const [maxCapacity, setMaxCapacity] = useState<number>(20);
  const [minAge, setMinAge] = useState<number | ''>('');
  const [maxAge, setMaxAge] = useState<number | ''>('');
  const [priceEuros, setPriceEuros] = useState<number>(0);
  const [requiresAuthorization, setRequiresAuthorization] = useState(false);

  // Material requerido
  const [materialItems, setMaterialItems] = useState<RequiredMaterialItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemMandatory, setNewItemMandatory] = useState(true);

  // Sesión inicial
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionStartTime, setSessionStartTime] = useState('09:00');
  const [sessionEndTime, setSessionEndTime] = useState('13:00');
  const [sessionLocation, setSessionLocation] = useState('Instalaciones Centrales');

  if (!isOpen) return null;

  const handleAddMaterial = () => {
    if (!newItemName.trim()) return;
    setMaterialItems([
      ...materialItems,
      {
        id: `mat-${Date.now()}`,
        name: newItemName.trim(),
        isMandatory: newItemMandatory
      }
    ]);
    setNewItemName('');
    setNewItemMandatory(true);
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterialItems(materialItems.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const start = new Date(`${sessionDate}T${sessionStartTime}:00`);
    const end = new Date(`${sessionDate}T${sessionEndTime}:00`);

    const newActivity: Partial<ActivityDto> & { initialSession?: any } = {
      title: title.trim(),
      description: description.trim(),
      type,
      maxCapacity: Number(maxCapacity),
      minAge: minAge !== '' ? Number(minAge) : null,
      maxAge: maxAge !== '' ? Number(maxAge) : null,
      priceCents: Math.round(Number(priceEuros) * 100),
      requiresAuthorization,
      requiredMaterial: materialItems,
      initialSession: {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        location: sessionLocation.trim() || 'Por definir'
      }
    };

    onCreate(newActivity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 text-brand-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Crear Nueva Actividad</h3>
              <p className="text-xs text-gray-500">Publicando en: <span className="font-semibold text-brand-700">{tenantName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-sm text-gray-700">
          {/* Título y Tipología */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Título de la Actividad *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Salida al Montseny - Senderismo y Orientación"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Tipología *
                </label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-white"
                  value={type}
                  onChange={(e) => setType(e.target.value as ActivityType)}
                >
                  <option value="ENTRENAMIENTO">⚽ Entrenamiento</option>
                  <option value="PARTIDO">🏆 Partido / Competición</option>
                  <option value="EXCURSION">🌲 Excursión de Día</option>
                  <option value="CAMPAMENTO">🏕️ Campamento / Colonias</option>
                  <option value="TALLER">🎨 Taller Creativo</option>
                  <option value="REUNION">👥 Reunión / Asamblea</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Aforo Máximo de Plazas *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm pl-9"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <Users className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Descripción Detallada *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explica a las familias el objetivo, itinerario, nivel de dificultad y detalles de la actividad..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Rango de Edad, Precio y Autorización Legal */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-600">Condiciones de Acceso</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Edad Mínima</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Sin límite"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Edad Máxima</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Sin límite"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cuota / Precio (€)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white pl-7"
                    value={priceEuros}
                    onChange={(e) => setPriceEuros(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                  <Euro className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-gray-800">Requiere Autorización Legal Firmada</div>
                  <div className="text-[11px] text-gray-500">Bloquea el marcado de asistencia si el tutor no firma el PDF con hash SHA-256</div>
                </div>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 cursor-pointer"
                checked={requiresAuthorization}
                onChange={(e) => setRequiresAuthorization(e.target.checked)}
              />
            </div>
          </div>

          {/* Checklist de Material Requerido */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                Checklist de Material Necesario
              </label>
              <span className="text-[11px] text-gray-400">Notificado automáticamente por Web Push 24h antes</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. Cantimplora 1L, Botas de montaña, Chubasquero..."
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-brand-600 focus:outline-none"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMaterial();
                  }
                }}
              />
              <label className="flex items-center gap-1 text-xs px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItemMandatory}
                  onChange={(e) => setNewItemMandatory(e.target.checked)}
                  className="rounded text-brand-600"
                />
                <span className="text-[11px] text-gray-700 font-medium">Obligatorio</span>
              </label>
              <button
                type="button"
                onClick={handleAddMaterial}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir
              </button>
            </div>

            {materialItems.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {materialItems.map((item) => (
                  <span
                    key={item.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                      item.isMandatory
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="text-[10px] opacity-75">({item.isMandatory ? 'Obligatorio' : 'Opcional'})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(item.id)}
                      className="hover:text-red-600 ml-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sesión Inicial */}
          <div className="p-4 bg-brand-50/50 rounded-xl space-y-3 border border-brand-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-brand-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-700" /> Sesión o Jornada Principal
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-gray-600 mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-600 mb-1">Hora Inicio</label>
                <input
                  type="time"
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                  value={sessionStartTime}
                  onChange={(e) => setSessionStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-600 mb-1">Hora Fin</label>
                <input
                  type="time"
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                  value={sessionEndTime}
                  onChange={(e) => setSessionEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-600 mb-1">Ubicación / Punto de Encuentro</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ej. Estación de tren de Sant Cugat / Polideportivo Municipal"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white pl-7"
                  value={sessionLocation}
                  onChange={(e) => setSessionLocation(e.target.value)}
                />
                <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-700 hover:bg-brand-800 text-white shadow-sm transition-all shadow-brand-700/20"
            >
              Publicar Actividad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
