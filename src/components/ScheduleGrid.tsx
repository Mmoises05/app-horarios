import { useState } from 'react';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { DocenteData } from '../App';

interface ScheduleGridProps {
  user: DocenteData;
  onSave: (updatedUser: DocenteData) => void;
  onCancel: () => void;
}

// Generar bloques de tiempo de 45 minutos desde 8:15 hasta 23:15
const generateTimeSlots = () => {
  const slots: string[] = [];
  let hour = 8;
  let minute = 15;

  // Generar intervalos de 45 minutos hasta las 23:15
  while (hour < 23 || (hour === 23 && minute <= 15)) {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    slots.push(timeString);

    minute += 45;
    if (minute >= 60) {
      hour += Math.floor(minute / 60);
      minute = minute % 60;
    }
  }

  return slots;
};

const TIME_SLOTS = generateTimeSlots();
const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface ScheduleState {
  [day: string]: {
    [time: string]: boolean;
  };
}

export function ScheduleGrid({ user, onSave, onCancel }: ScheduleGridProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  // Inicializar el estado del horario desde los datos del usuario
  const initializeSchedule = (): ScheduleState => {
    const schedule: ScheduleState = {};

    DAYS_OF_WEEK.forEach(day => {
      schedule[day] = {};
      TIME_SLOTS.forEach(time => {
        schedule[day][time] = false;
      });
    });

    // Marcar los bloques según la disponibilidad existente
    user.availability.forEach(dayAvail => {
      if (schedule[dayAvail.day]) {
        dayAvail.slots.forEach(slot => {
          // Convertir los rangos a bloques de 45 minutos
          const startParts = slot.startTime.split(':');
          const endParts = slot.endTime.split(':');
          const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
          const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

          TIME_SLOTS.forEach(timeSlot => {
            const timeParts = timeSlot.split(':');
            const slotMinutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);

            if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
              schedule[dayAvail.day][timeSlot] = true;
            }
          });
        });
      }
    });

    return schedule;
  };

  const [schedule, setSchedule] = useState<ScheduleState>(initializeSchedule());

  const toggleTimeSlot = (day: string, time: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [time]: !prev[day][time]
      }
    }));
  };

  const selectAllDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: TIME_SLOTS.reduce((acc, time) => {
        acc[time] = true;
        return acc;
      }, {} as { [time: string]: boolean })
    }));
  };

  const clearDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: TIME_SLOTS.reduce((acc, time) => {
        acc[time] = false;
        return acc;
      }, {} as { [time: string]: boolean })
    }));
  };

  const handleSave = () => {
    // Convertir el schedule grid a formato de availability
    const newAvailability = DAYS_OF_WEEK.map(day => {
      const selectedTimes = TIME_SLOTS.filter(time => schedule[day][time]);

      // Agrupar bloques consecutivos
      const slots: { id: string; startTime: string; endTime: string }[] = [];
      let currentStart: string | null = null;
      let previousTime: string | null = null;

      selectedTimes.forEach((time, index) => {
        if (currentStart === null) {
          currentStart = time;
        } else {
          // Verificar si hay un gap
          const prevMinutes = previousTime ? timeToMinutes(previousTime) : 0;
          const currMinutes = timeToMinutes(time);

          if (currMinutes - prevMinutes > 45) {
            // Hay un gap, cerrar el bloque anterior
            const endTime = addMinutes(previousTime!, 45);
            slots.push({
              id: `${day}-${currentStart}-${Date.now()}`,
              startTime: currentStart,
              endTime: endTime
            });
            currentStart = time;
          }
        }

        previousTime = time;

        // Si es el último elemento, cerrar el bloque
        if (index === selectedTimes.length - 1) {
          const endTime = addMinutes(time, 45);
          slots.push({
            id: `${day}-${currentStart}-${Date.now()}`,
            startTime: currentStart!,
            endTime: endTime
          });
        }
      });

      const existingDay = user.availability.find(a => a.day === day);
      return {
        day,
        slots,
        observations: existingDay?.observations || ''
      };
    });

    onSave({ ...user, availability: newAvailability });
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const addMinutes = (time: string, minutesToAdd: number): string => {
    const totalMinutes = timeToMinutes(time) + minutesToAdd;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getSelectedCount = (day: string): number => {
    return TIME_SLOTS.filter(time => schedule[day][time]).length;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans selection:bg-[#E30613] selection:text-white">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-30 shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onCancel}
                className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-[#E30613] hover:border-red-200 hover:shadow-md transition-all group relative overflow-hidden"
                title="Volver"
              >
                <div className="absolute inset-0 bg-red-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform relative z-10" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none tracking-tight">Horario de Disponibilidad</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Vista Matrices (45 min)</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className="relative overflow-hidden group flex items-center gap-2 px-6 py-2.5 bg-[#E30613] hover:bg-[#c90510] text-white rounded-xl shadow-md shadow-red-200 hover:shadow-lg hover:shadow-red-300 transition-all transform hover:-translate-y-0.5 font-bold text-sm"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 transform skew-y-12"></div>
              <Save className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Guardar cambios</span>
            </button>
          </div>
        </div>
      </header>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-24 right-6 bg-white border border-emerald-100 text-emerald-700 px-6 py-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center gap-4 z-50 animate-bounce-in">
          <div className="p-2 bg-emerald-100 rounded-full">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-sm">¡Guardado!</p>
            <p className="text-xs text-emerald-600/80">Disponibilidad actualizada.</p>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-[1920px] mx-auto px-6 py-8 relative z-10 animate-fade-in">
        <div className="flex flex-col gap-6">

          {/* Header Info & Stats */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex-1 w-full relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#E30613]"></div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 text-[#E30613] rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-slate-900 font-bold text-sm">Modo de Selección Rápida</h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    Haga clic en las celdas para marcar/desmarcar. Use los botones de "Todo/Nada" en las columnas para acciones masivas.
                  </p>
                </div>
              </div>
            </div>

            {/* Simple Legend */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-8 h-full">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-emerald-500 rounded-md shadow-sm border border-emerald-600/20"></div>
                <span className="text-slate-700 font-bold text-xs uppercase tracking-wide">Disponible</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white rounded-md shadow-inner border border-slate-200"></div>
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wide">No disponible</span>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="overflow-x-auto relative">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-r border-slate-200 bg-slate-50 sticky left-0 z-20 min-w-[80px]">
                      Hora
                    </th>
                    {DAYS_OF_WEEK.map(day => (
                      <th key={day} className="px-2 py-4 border-b border-slate-200 min-w-[120px] group transition-colors hover:bg-slate-100">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-slate-800 font-bold text-sm tracking-tight">{day}</span>

                          <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => selectAllDay(day)}
                              className="px-3 py-1 text-[10px] font-bold text-white bg-slate-800 hover:bg-black rounded-full transition-colors uppercase tracking-wide"
                              title="Seleccionar todo el día"
                            >
                              Todo
                            </button>
                            <button
                              onClick={() => clearDay(day)}
                              className="px-3 py-1 text-[10px] font-bold text-[#E30613] bg-red-50 hover:bg-red-100 rounded-full transition-colors uppercase tracking-wide"
                              title="Limpiar disponibilidad"
                            >
                              Nada
                            </button>
                          </div>

                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {getSelectedCount(day)} bloques
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TIME_SLOTS.map((time, index) => (
                    <tr key={time} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 border-r border-slate-200 text-slate-500 text-xs font-bold font-mono bg-white sticky left-0 z-10 shadow-[4px_0_15px_-4px_rgba(0,0,0,0.05)]">
                        {time}
                      </td>
                      {DAYS_OF_WEEK.map(day => (
                        <td key={`${day}-${time}`} className="p-1 border-r border-slate-100 last:border-r-0">
                          <button
                            onClick={() => toggleTimeSlot(day, time)}
                            className={`w-full h-10 rounded-md transition-all duration-200 transform active:scale-95 ${schedule[day][time]
                              ? 'bg-emerald-500 shadow-md shadow-emerald-200 border border-emerald-600/20'
                              : 'bg-white hover:bg-slate-50 border border-slate-100'
                              }`}
                            title={`${day} ${time} - ${schedule[day][time] ? 'Disponible' : 'No disponible'}`}
                          >
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Summaries */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {DAYS_OF_WEEK.map(day => {
              const count = getSelectedCount(day);
              const totalMinutes = count * 45;
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              const hasHours = count > 0;

              return (
                <div
                  key={day}
                  className={`rounded-2xl border p-4 transition-all duration-300 ${hasHours
                    ? 'bg-white border-[#E30613]/20 shadow-sm'
                    : 'bg-slate-50 border-transparent opacity-60'
                    }`}
                >
                  <h3 className={`font-bold text-xs uppercase tracking-wider mb-1 ${hasHours ? 'text-slate-900' : 'text-slate-400'}`}>{day}</h3>
                  <div className="flex flex-col">
                    <span className={`text-2xl font-bold ${hasHours ? 'text-[#E30613]' : 'text-slate-300'}`}>
                      {count}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">bloques</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500 font-mono font-medium">
                      {hours}h {minutes}m
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <style>{`
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
    </div>
  );
}