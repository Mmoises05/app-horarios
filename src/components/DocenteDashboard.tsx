import { useState } from 'react';
import { Calendar, Clock, LogOut, Edit, CheckCircle, Grid } from 'lucide-react';
import { DocenteData } from '../App';
import { AvailabilityEditor } from './AvailabilityEditor';
import { ScheduleGrid } from './ScheduleGrid';

interface DocenteDashboardProps {
  user: DocenteData;
  onLogout: () => void;
  onUpdate: (user: DocenteData) => void;
}

export function DocenteDashboard({ user, onLogout, onUpdate }: DocenteDashboardProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [showScheduleGrid, setShowScheduleGrid] = useState(false);
  const [userData, setUserData] = useState(user);

  // Sync state if prop updates
  if (user !== userData) {
    setUserData(user);
  }

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const getTotalHoursFormatted = () => {
    let totalMinutes = 0;
    userData.availability.forEach(day => {
      day.slots.forEach(slot => {
        const [startH, startM] = slot.startTime.split(':').map(Number);
        const [endH, endM] = slot.endTime.split(':').map(Number);
        const start = startH * 60 + startM;
        const end = endH * 60 + endM;
        totalMinutes += (end - start);
      });
    });

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  const getDaysWithAvailability = () => {
    return userData.availability.filter(day => day.slots.length > 0).length;
  };

  if (showScheduleGrid) {
    return (
      <ScheduleGrid
        user={userData}
        onSave={(updatedUser) => {
          onUpdate(updatedUser);
          setShowScheduleGrid(false);
        }}
        onCancel={() => setShowScheduleGrid(false)}
      />
    );
  }

  if (showEditor) {
    return (
      <AvailabilityEditor
        user={userData}
        onSave={(updatedUser) => {
          onUpdate(updatedUser);
          setShowEditor(false);
        }}
        onCancel={() => setShowEditor(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans selection:bg-[#E30613] selection:text-white">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* ... Logo Section ... */}
            <div className="flex items-center gap-6">
              {/* Logo UTP */}
              <img src="/logo_utp.png" alt="UTP" className="h-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = 'UTP'; }} />
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">Panel del Docente</h1>
                <p className="text-xs text-slate-500 font-medium">Gestión de Disponibilidad</p>
              </div>
            </div>

            <div className="flex items-center gap-4">

              <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-[#E30613] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-red-200">
                  {userData.name.charAt(0)}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-bold text-slate-700 leading-none">{userData.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">En Línea</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-[#E30613] hover:bg-red-50 rounded-xl transition-all duration-200"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 animate-fade-in">

        {/* Welcome Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Hola, {userData.name.split(' ')[0]}</h2>
            <p className="text-slate-500 mt-1">Bienvenido al nuevo portal de gestión horaria.</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Periodo Académico</p>
            <p className="text-lg font-bold text-[#E30613]">2026 - Ciclo 1</p>
          </div>
        </div>

        {/* Stats Cards - UTP Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Horas - Red Theme */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#E30613]/10 text-[#E30613] rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#E30613] uppercase tracking-wider">Horas Registradas</span>
              </div>
              <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{getTotalHoursFormatted()}</h3>
            </div>
          </div>

          {/* Card 2: Días - Black/Slate Theme */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Días Asignados</span>
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{getDaysWithAvailability()}</h3>
                <span className="text-slate-400 font-medium heading-font text-lg">/ 7</span>
              </div>
            </div>
          </div>

          {/* Card 3: Estado - Emerald (Success) Theme */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Estado</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Perfil Activo</h3>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4 bg-slate-50/30">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Mi Disponibilidad</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide font-semibold">Semana Regular</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowScheduleGrid(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-all font-semibold text-sm border border-slate-200 shadow-sm hover:shadow"
              >
                <Grid className="w-4 h-4" />
                <span>Vista Grilla</span>
              </button>
              <button
                onClick={() => setShowEditor(true)}
                className="flex items-center gap-2 px-5 py-2 bg-[#E30613] hover:bg-[#c90510] text-white rounded-lg transition-all shadow-md shadow-red-200 hover:shadow-lg hover:shadow-red-200 font-semibold text-sm transform hover:-translate-y-0.5"
              >
                <Edit className="w-4 h-4" />
                <span>Editar Horario</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col gap-3">
              {daysOfWeek.map(day => {
                const dayData = userData.availability.find(d => d.day === day);
                const hasSlots = dayData && dayData.slots.length > 0;

                return (
                  <div
                    key={day}
                    className={`
                        group relative bg-white rounded-xl p-4 border transition-all duration-200
                        ${hasSlots
                        ? 'border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-red-100'
                        : 'border-transparent bg-slate-50 opacity-60 hover:opacity-100'
                      }
                    `}
                  >
                    {/* Visual left border for available days */}
                    {hasSlots && <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#E30613] rounded-r-md"></div>}

                    <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4 pl-3">
                      {/* Day Name & Slots */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`font-bold text-base ${hasSlots ? 'text-slate-900' : 'text-slate-400'}`}>{day}</h3>
                          {!hasSlots && <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md uppercase tracking-wide">Sin Asignación</span>}
                        </div>

                        {hasSlots ? (
                          <div className="flex flex-wrap gap-2">
                            {dayData.slots.map(slot => (
                              <div key={slot.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 rounded-md text-xs font-semibold border border-slate-200 shadow-sm group-hover:border-red-100 group-hover:text-[#E30613] transition-colors">
                                <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E30613]" />
                                <span>{slot.startTime} - {slot.endTime}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 font-medium">No disponible</p>
                        )}
                      </div>

                      {/* Observations or Status */}
                      {hasSlots && (
                        <div className="w-full md:w-1/3 flex justify-end">
                          {dayData.observations ? (
                            <div className="text-sm text-slate-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100 w-full md:w-auto text-right">
                              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block mb-0.5">Observación</span>
                              {dayData.observations}
                            </div>
                          ) : (
                            <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Registrado</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-6 text-center">
        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">© 2026 Universidad Tecnológica del Perú</p>
      </footer>

      <style>{`
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