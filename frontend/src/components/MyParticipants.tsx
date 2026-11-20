import { useState } from 'react';
import { 
  UserPlus, 
  HeartHandshake, 
  AlertTriangle, 
  Calendar, 
  Phone, 
  ShieldCheck, 
  Trash2, 
  Activity as ActivityIcon,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ChildSummaryDto, EnrollmentDto } from '@activapp/shared';

interface MyParticipantsProps {
  childrenList: ChildSummaryDto[];
  enrollments: EnrollmentDto[];
  onAddChild: (newChild: {
    fullName: string;
    birthDate: string;
    emergencyContact: string;
    allergies?: string;
    medicalNotes?: string;
  }) => void;
  onCancelEnrollment: (enrollmentId: string) => void;
}

export function MyParticipants({
  childrenList,
  enrollments,
  onAddChild,
  onCancelEnrollment
}: MyParticipantsProps) {
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !birthDate || !emergencyContact.trim()) return;

    onAddChild({
      fullName: fullName.trim(),
      birthDate,
      emergencyContact: emergencyContact.trim(),
      allergies: allergies.trim() || undefined,
      medicalNotes: medicalNotes.trim() || undefined
    });

    setFullName('');
    setBirthDate('');
    setEmergencyContact('');
    setAllergies('');
    setMedicalNotes('');
    setIsAddingChild(false);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-brand-700" />
            <span>Mis Participantes y Menores a Cargo</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Gestión familiar, historial de inscripciones y datos médicos bajo cumplimiento estricto del RGPD.
          </p>
        </div>

        <button
          onClick={() => setIsAddingChild(!isAddingChild)}
          className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" /> {isAddingChild ? 'Cerrar Formulario' : 'Añadir Participante'}
        </button>
      </div>

      {/* Formulario Desplegable para Registrar Participante */}
      {isAddingChild && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-brand-200 shadow-md space-y-4 animate-in fade-in duration-150">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-700" /> Ficha de Nuevo Menor / Participante
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Nombre y Apellidos *</label>
              <input
                type="text"
                required
                placeholder="Ej. Pau Navarro Soler"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-brand-600 focus:outline-none"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Fecha de Nacimiento *</label>
              <input
                type="date"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-brand-600 focus:outline-none"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Contacto de Emergencia / Teléfono *</label>
              <input
                type="text"
                required
                placeholder="Ej. Madre (+34 600 000 000)"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-brand-600 focus:outline-none"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Alergias o Intolerancias Médicas</label>
              <input
                type="text"
                placeholder="Ej. Alergia a los frutos secos y penicilina"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-brand-600 focus:outline-none"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Notas Médicas Confidenciales (Cifradas)</label>
              <input
                type="text"
                placeholder="Ej. Tratamiento de asma en mochila / Ventolín antes de ejercicio"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-brand-600 focus:outline-none"
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAddingChild(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Guardar Participante
            </button>
          </div>
        </form>
      )}

      {/* Listado de Menores */}
      {childrenList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
          <HeartHandshake className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-gray-700">No hay participantes registrados</h4>
          <p className="text-xs text-gray-500 mt-1">
            Haz clic en "Añadir Participante" para registrar a tu hijo/a o a ti mismo si eres autónomo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {childrenList.map((ch) => {
            const childEnrollments = enrollments.filter(e => e.childId === ch.id);

            return (
              <div key={ch.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{ch.fullName}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(ch.birthDate).toLocaleDateString('es-ES')}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {ch.emergencyContact}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sección Médica Protegida */}
                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 space-y-1 text-xs">
                  <div className="font-bold text-rose-900 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Datos Médicos (Protección RGPD)
                  </div>
                  <p className="text-rose-800 text-xs">
                    <strong>Alergias:</strong> {ch.allergies || 'Ninguna registrada'}
                  </p>
                  {ch.medicalNotes && (
                    <p className="text-rose-700 text-[11px]">
                      <strong>Tratamiento:</strong> {ch.medicalNotes}
                    </p>
                  )}
                </div>

                {/* Inscripciones del Menor */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <ActivityIcon className="w-3.5 h-3.5 text-brand-700" /> Actividades Inscritas
                  </h4>

                  {childEnrollments.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No está inscrito en ninguna actividad actualmente.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {childEnrollments.map((enr) => (
                        <div
                          key={enr.id}
                          className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs border border-gray-100"
                        >
                          <div>
                            <span className="font-semibold text-gray-800">
                              {enr.activity?.title || 'Actividad'}
                            </span>
                            <div className="mt-0.5">
                              {enr.status === 'CONFIRMED' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.2 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" /> Plaza Confirmada
                                </span>
                              )}
                              {enr.status === 'WAITLISTED' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.2 rounded-full">
                                  <Clock className="w-3 h-3" /> Lista de Espera #{enr.waitlistPosition}
                                </span>
                              )}
                              {enr.status === 'CANCELLED' && (
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.2 rounded-full">
                                  Cancelada
                                </span>
                              )}
                            </div>
                          </div>

                          {enr.status !== 'CANCELLED' && (
                            <button
                              onClick={() => onCancelEnrollment(enr.id)}
                              title="Cancelar plaza (promueve al siguiente de la lista de espera)"
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
