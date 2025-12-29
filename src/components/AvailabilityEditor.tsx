import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, CheckCircle, Clock, Calendar, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { DocenteData, DayAvailability, TimeSlot } from '../App';

interface AvailabilityEditorProps {
  user: DocenteData;
  onSave: (updatedUser: DocenteData) => void;
  onCancel: () => void;
}

// ------ Custom Time Picker Component ------
interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

function TimePicker({ value, onChange }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [hours, minutes] = value.split(':');

  // Generate hours (06 to 23 for typical schedule)
  const hoursList = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, '0'));

  // Standard 15-minute intervals for scheduling
  const minutesList = ['00', '15', '30', '45'];

  const handleHourClick = (h: string) => {
    onChange(`${h}:${minutes}`);
    // Keep open to allow minute selection immediately after if desired
  };

  const handleMinuteClick = (m: string) => {
    onChange(`${hours}:${m}`);
    setIsOpen(false); // Close on minute selection effectively finishing the "time pick"
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-white border rounded-xl flex items-center justify-between gap-3 transition-all ${isOpen
          ? 'border-[#E30613] ring-2 ring-[#E30613]/10 shadow-sm'
          : 'border-slate-200 hover:border-[#E30613]/50'
          }`}
      >
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isOpen ? 'text-[#E30613]' : 'text-slate-400'}`} />
          <span className="font-mono text-sm font-bold text-slate-700">{value}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#E30613]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 z-50 flex gap-3 min-w-[200px] animate-fade-in-up">
          {/* Hours Column */}
          <div className="flex-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Hora</div>
            <div className="h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-1 space-y-1">
              {hoursList.map(h => (
                <button
                  key={h}
                  onClick={() => handleHourClick(h)}
                  className={`w-full py-1.5 rounded-lg text-sm font-bold transition-all ${hours === h
                    ? 'bg-[#E30613] text-white shadow-md shadow-red-200'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px bg-slate-100 my-2"></div>

          {/* Minutes Column */}
          <div className="flex-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Min</div>
            <div className="h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-1 space-y-1">
              {minutesList.map(m => (
                <button
                  key={m}
                  onClick={() => handleMinuteClick(m)}
                  className={`w-full py-1.5 rounded-lg text-sm font-bold transition-all ${minutes === m
                    ? 'bg-[#E30613] text-white shadow-md shadow-red-200'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------ Main Component ------

export function AvailabilityEditor({ user, onSave, onCancel }: AvailabilityEditorProps) {
  const [selectedDay, setSelectedDay] = useState('Lunes');
  const [availability, setAvailability] = useState<DayAvailability[]>(user.availability);
  const [showSuccess, setShowSuccess] = useState(false);

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const getCurrentDayData = (): DayAvailability => {
    const existing = availability.find(a => a.day === selectedDay);
    if (existing) return existing;
    return { day: selectedDay, slots: [], observations: '' };
  };

  const updateDayData = (updatedDay: DayAvailability) => {
    const newAvailability = availability.filter(a => a.day !== selectedDay);
    newAvailability.push(updatedDay);
    setAvailability(newAvailability);
  };

  const addTimeSlot = () => {
    const currentDay = getCurrentDayData();
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      startTime: '08:00',
      endTime: '10:00'
    };
    updateDayData({
      ...currentDay,
      slots: [...currentDay.slots, newSlot]
    });
  };

  const removeTimeSlot = (slotId: string) => {
    const currentDay = getCurrentDayData();
    updateDayData({
      ...currentDay,
      slots: currentDay.slots.filter(s => s.id !== slotId)
    });
  };

  const updateTimeSlot = (slotId: string, field: 'startTime' | 'endTime', value: string) => {
    const currentDay = getCurrentDayData();
    const slot = currentDay.slots.find(s => s.id === slotId);
    if (!slot) return;

    let newStart = slot.startTime;
    let newEnd = slot.endTime;

    if (field === 'startTime') {
      newStart = value;
      // If new start is after or equal to end, push end to be start + 1 hour
      if (newStart >= newEnd) {
        const [h, m] = newStart.split(':').map(Number);
        // Ensure we don't go past 23
        const nextH = Math.min(23, h + 1);
        newEnd = `${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        if (newStart >= newEnd) {
          if (newStart >= "23:00") {
            newEnd = "23:59";
          }
        }
      }
    } else {
      // field === 'endTime'
      if (value <= newStart) return;
      newEnd = value;
    }

    updateDayData({
      ...currentDay,
      slots: currentDay.slots.map(s =>
        s.id === slotId ? { ...s, startTime: newStart, endTime: newEnd } : s
      )
    });
  };

  const updateObservations = (value: string) => {
    const currentDay = getCurrentDayData();
    updateDayData({
      ...currentDay,
      observations: value
    });
  };

  const handleSave = () => {
    onSave({ ...user, availability });
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  const currentDayData = getCurrentDayData();

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans selection:bg-[#E30613] selection:text-white">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-[1920px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onCancel}
                className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-[#E30613] hover:border-red-200 hover:shadow-md transition-all group relative overflow-hidden"
                title="Volver al panel"
              >
                <div className="absolute inset-0 bg-red-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform relative z-10" />
              </button>

              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Registrar Disponibilidad</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100/50 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wide border border-slate-200/50">
                    <span>Ciclo 2026-1</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <p className="text-xs font-bold text-[#E30613]">{user.name}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="relative overflow-hidden group flex items-center gap-2 px-6 py-2.5 bg-[#E30613] hover:bg-[#c90510] text-white rounded-xl shadow-md shadow-red-200 hover:shadow-lg hover:shadow-red-300 transition-all transform hover:-translate-y-0.5 font-bold text-sm"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform skew-y-12"></div>
              <Save className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Guardar Cambios</span>
            </button>
          </div>
        </div>
      </header >

      {/* Success Message */}
      {
        showSuccess && (
          <div className="fixed top-24 right-6 bg-white border border-emerald-100 text-emerald-700 px-6 py-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center gap-4 z-50 animate-bounce-in">
            <div className="p-2 bg-emerald-100 rounded-full">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-sm">¡Cambios Guardados!</p>
              <p className="text-xs text-emerald-600/80">La disponibilidad se ha actualizado correctamente.</p>
            </div>
          </div>
        )
      }

      {/* Content */}
      <main className="max-w-[1920px] mx-auto px-6 py-8 relative z-10 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Day Selector Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] sticky top-28">
              <div className="flex items-center gap-2.5 mb-6 px-2">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-500" />
                </div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Días de la Semana</h2>
              </div>

              <div className="space-y-2">
                {daysOfWeek.map(day => {
                  const dayData = availability.find(a => a.day === day);
                  const hasSlots = dayData && dayData.slots.length > 0;
                  const isSelected = selectedDay === day;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`w-full px-4 py-3.5 rounded-xl text-left transition-all duration-200 group relative overflow-hidden ${isSelected
                        ? 'bg-red-50 text-[#E30613] shadow-inner font-bold'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100 font-medium'
                        }`}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E30613] rounded-r-full"></div>
                      )}

                      <div className="flex items-center justify-between relative z-10">
                        <span className={`text-sm ${isSelected ? 'translate-x-1.5' : ''} transition-transform`}>{day}</span>
                        {hasSlots ? (
                          <div className={`p-1 rounded-full ${isSelected ? 'bg-white text-[#E30613] shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                            <CheckCircle className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          isSelected && <ChevronRight className="w-4 h-4 text-[#E30613]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time Slots Editor */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 border-b border-slate-100 pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    {selectedDay}
                    <span className="px-2.5 py-0.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200">
                      {currentDayData.slots.length} Bloques
                    </span>
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">Configure los horarios de disponibilidad para este día.</p>
                </div>

                <button
                  onClick={addTimeSlot}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-md hover:shadow-lg font-bold text-sm group"
                >
                  <div className="bg-white/20 rounded-full p-0.5 transition-transform group-hover:rotate-90">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  Agregar Horario
                </button>
              </div>

              {/* Time Slots Grid */}
              <div className="space-y-6 mb-8">
                {currentDayData.slots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={addTimeSlot}>
                    <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <Clock className="w-8 h-8 text-slate-300 group-hover:text-[#E30613] transition-colors" />
                    </div>
                    <h3 className="text-slate-700 font-bold mb-1">Día sin disponibilidad</h3>
                    <p className="text-slate-400 text-sm mb-4">No has registrado horarios para el {selectedDay}</p>
                    <span className="text-[#E30613] text-sm font-bold hover:underline">
                      + Agregar primer horario
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {currentDayData.slots.map((slot, index) => (
                      <div key={slot.id} className="group bg-white border border-slate-200 hover:border-red-200 hover:shadow-lg hover:shadow-red-500/5 rounded-2xl p-5 transition-all duration-300 relative hover:-translate-y-1 hover:z-30 focus-within:z-30">
                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-[#E30613] transition-colors rounded-l-2xl"></div>

                        <div className="flex items-center gap-5 ml-2">
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            {/* Start Time */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Inicio
                              </label>
                              <div className="relative">
                                <TimePicker
                                  value={slot.startTime}
                                  onChange={(val) => updateTimeSlot(slot.id, 'startTime', val)}
                                />
                              </div>
                            </div>

                            {/* End Time */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Fin
                              </label>
                              <div className="relative">
                                <TimePicker
                                  value={slot.endTime}
                                  onChange={(val) => updateTimeSlot(slot.id, 'endTime', val)}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <div className="flex items-end self-end mb-1">
                            <button
                              onClick={() => removeTimeSlot(slot.id)}
                              className="p-2.5 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-[#E30613] rounded-xl transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                              title="Eliminar bloque"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observations */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 box-content">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Observaciones (Opcional)
                  </label>
                </div>
                <div className="relative">
                  <textarea
                    value={currentDayData.observations}
                    onChange={(e) => updateObservations(e.target.value)}
                    placeholder={`Ej: "Preferencia por mañanas", "Solo remoto los viernes"...`}
                    rows={3}
                    className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-200 focus:border-slate-400 resize-none text-slate-700 text-sm placeholder:text-slate-400 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out forwards;
        }
         @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div >
  );
}
