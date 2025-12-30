import { useState } from 'react';
import { LogOut, Filter, Download, Search, Clock, FileText } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { DocenteData } from '../App';
import { AvailabilityEditor } from './AvailabilityEditor';

interface ProgramadorDashboardProps {
  onLogout: () => void;
  docentes: DocenteData[];
  onUpdate: (docente: DocenteData) => void;
}

export function ProgramadorDashboard({ onUpdate, onLogout, docentes }: ProgramadorDashboardProps) {
  // ... existing state ...
  const [selectedDocente, setSelectedDocente] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [editingDocente, setEditingDocente] = useState<DocenteData | null>(null);

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const filterSlots = (slots: any[]) => {
    if (timeFilter === 'all') return slots;

    return slots.filter((slot: any) => {
      const hour = parseInt(slot.startTime.split(':')[0]);

      if (timeFilter === 'morning') return hour < 12;
      if (timeFilter === 'afternoon') return hour >= 12 && hour < 18;
      if (timeFilter === 'evening') return hour >= 18;
      return true;
    });
  };

  const handleExport = () => {
    // 1. Prepare Data
    const visibleDocentes = filterDocentes();

    // Helper to generate pastel colors
    const hslToHex = (h: number, s: number, l: number) => {
      l /= 100;
      const a = s * Math.min(l, 1 - l) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `${f(0)}${f(8)}${f(4)}`.toUpperCase();
    };

    // Assign a unique procedural pastel color to each teacher ID
    // Uses Golden Angle approximation (137.508°) to ensure maximum distinctness
    const docenteColors: Record<string, string> = {};
    visibleDocentes.forEach((d, index) => {
      const hue = (index * 137.508) % 360;
      docenteColors[d.id] = hslToHex(hue, 75, 90); // Saturation 75%, Lightness 90%
    });

    const dataToExport = visibleDocentes.flatMap((docente) => {
      const visibleDays = selectedDay === 'all'
        ? docente.availability
        : docente.availability.filter(d => d.day === selectedDay);

      return visibleDays.flatMap((day) => {
        const filteredSlots = filterSlots(day.slots);

        return filteredSlots.map((slot) => ({
          "ID Docente": docente.id,
          "Nombre": docente.name,
          "Email": docente.email,
          "Día": day.day,
          "Hora Inicio": slot.startTime,
          "Hora Fin": slot.endTime,
          "Observaciones": day.observations || '',
          "_docenteId": docente.id // Hidden field used for styling logic
        }));
      });
    });

    if (dataToExport.length === 0) {
      alert("No hay datos para exportar con los filtros seleccionados");
      return;
    }

    // 2. Create Sheet
    // Remove the hidden helper field for the actual worksheet data
    const cleanData = dataToExport.map(({ _docenteId, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(cleanData);

    // Apply Column Widths
    const cols = [
      { wch: 10 }, // ID Docente
      { wch: 25 }, // Nombre
      { wch: 30 }, // Email
      { wch: 12 }, // Día
      { wch: 12 }, // Hora Inicio
      { wch: 12 }, // Hora Fin
      { wch: 40 }  // Observaciones
    ];
    worksheet['!cols'] = cols;

    // Apply Styles
    const range = XLSX.utils.decode_range(worksheet['!ref']!);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cell_address]) continue;

        // Apply Header Style (First Row)
        if (R === 0) {
          worksheet[cell_address].s = {
            font: {
              bold: true,
              color: { rgb: "FFFFFF" },
              name: "Calibri",
              sz: 12
            },
            fill: {
              fgColor: { rgb: "E30613" } // UTP Red
            },
            alignment: {
              horizontal: "center",
              vertical: "center"
            },
            border: {
              top: { style: 'thin', color: { rgb: "000000" } },
              bottom: { style: 'thin', color: { rgb: "000000" } },
              left: { style: 'thin', color: { rgb: "000000" } },
              right: { style: 'thin', color: { rgb: "000000" } }
            }
          };
        }
        // Apply Data Cell Style
        else {
          // Identify the teacher ID for this row to determine the background color.
          // array index = row index - 1 (header offset)
          const dataIndex = R - 1;
          const rowDocenteId = dataToExport[dataIndex]._docenteId;
          const rowColor = docenteColors[rowDocenteId] || "FFFFFF";

          worksheet[cell_address].s = {
            font: { name: "Calibri", sz: 11, color: { rgb: "000000" } },
            alignment: { vertical: "center", wrapText: true },
            fill: {
              fgColor: { rgb: rowColor }
            },
            border: {
              top: { style: 'thin', color: { rgb: "000000" } },   // Black Border
              bottom: { style: 'thin', color: { rgb: "000000" } },
              left: { style: 'thin', color: { rgb: "000000" } },
              right: { style: 'thin', color: { rgb: "000000" } }
            }
          };

          // Center for standard data columns
          if ([0, 3, 4, 5].includes(C)) {
            worksheet[cell_address].s.alignment.horizontal = "center";
          }

          // Bold Day
          if (C === 3) {
            worksheet[cell_address].s.font.bold = true;
          }
        }
      }
    }

    // 3. Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Disponibilidad");

    // 4. Download
    XLSX.writeFile(workbook, `Reporte_Disponibilidad_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filterDocentes = () => {
    let filtered = [...docentes];

    if (selectedDocente !== 'all') {
      filtered = filtered.filter(d => d.id === selectedDocente);
    }

    return filtered;
  };

  const getDocenteAvailabilityForDay = (docenteId: string, day: string) => {
    const docente = docentes.find(d => d.id === docenteId);
    if (!docente) return null;

    const dayData = docente.availability.find(a => a.day === day);
    return dayData;
  };

  const handleSaveAvailability = (updatedUser: DocenteData) => {
    onUpdate(updatedUser);
    setEditingDocente(null);
  };

  const filteredDocentes = filterDocentes();

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans selection:bg-[#E30613] selection:text-white pb-20">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-slate-200/50 to-transparent opacity-60"></div>
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-50/40 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-red-50/30 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-[1920px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Logo UTP */}
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-red-500/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-md"></div>
                <img
                  src="/logo_utp.png"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentNode as HTMLElement;
                    if (parent) parent.innerHTML = '<div class="text-[#E30613] font-bold text-3xl tracking-tighter">UTP</div>';
                  }}
                  alt="UTP"
                  className="h-10 object-contain relative z-10"
                />
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block rotate-12"></div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Panel de Programación</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E30613] animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vista Administrativa</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onLogout}
                className="group flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-[#E30613] hover:bg-red-50 rounded-xl transition-all duration-300 font-bold text-xs uppercase tracking-wide border border-transparent hover:border-red-100"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1920px] mx-auto px-8 py-8 relative z-10 animate-fade-in">

        {/* Filters and Export Section */}
        <div className="bg-white rounded-[24px] p-8 mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white hover:border-red-100/50 transition-colors relative overflow-hidden group">
          {/* Subtle gradient accent on top */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E30613] via-red-400 to-[#E30613] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-8 border-b border-slate-100 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl text-slate-600 shadow-inner group-hover:bg-red-50 group-hover:text-[#E30613] transition-colors duration-300">
                <Filter className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Filtros de Consulta</h2>
                <p className="text-sm text-slate-500 mt-1">Refine la vista de la programación académica.</p>
              </div>
            </div>

            <button
              onClick={handleExport}
              className="relative overflow-hidden group/btn flex items-center gap-3 px-8 py-3 bg-[#1e1e1e] hover:bg-[#E30613] text-white rounded-xl transition-all shadow-[0_5px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_25px_rgba(227,6,19,0.25)] font-bold text-sm tracking-wide transform hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 transform skew-y-12"></div>
              <Download className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Exportar Excel</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Docente Filter */}
            <div className="group/filter">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5 ml-1 group-focus-within/filter:text-[#E30613] transition-colors">
                Docente
              </label>
              <div className="relative transform transition-all duration-200 focus-within:scale-[1.01]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/filter:text-[#E30613] transition-colors" />
                <select
                  value={selectedDocente}
                  onChange={(e) => setSelectedDocente(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 bg-slate-50 hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#E30613]/5 focus:border-[#E30613] appearance-none text-slate-700 text-sm font-semibold transition-all shadow-sm"
                >
                  <option value="all">Todos los docentes</option>
                  {docentes.map(docente => (
                    <option key={docente.id} value={docente.id}>
                      {docente.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <div className="border-t-[5px] border-t-current border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent"></div>
                </div>
              </div>
            </div>

            {/* Day Filter */}
            <div className="group/filter">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5 ml-1 group-focus-within/filter:text-[#E30613] transition-colors">
                Día
              </label>
              <div className="relative transform transition-all duration-200 focus-within:scale-[1.01]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/filter:text-[#E30613] transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 bg-slate-50 hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#E30613]/5 focus:border-[#E30613] appearance-none text-slate-700 text-sm font-semibold transition-all shadow-sm"
                >
                  <option value="all">Todos los días</option>
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <div className="border-t-[5px] border-t-current border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent"></div>
                </div>
              </div>
            </div>

            {/* Time Range Filter */}
            <div className="group/filter">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5 ml-1 group-focus-within/filter:text-[#E30613] transition-colors">
                Rango Horario
              </label>
              <div className="relative transform transition-all duration-200 focus-within:scale-[1.01]">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/filter:text-[#E30613] transition-colors" />
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 bg-slate-50 hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#E30613]/5 focus:border-[#E30613] appearance-none text-slate-700 text-sm font-semibold transition-all shadow-sm"
                >
                  <option value="all">Todos los horarios</option>
                  <option value="morning">Mañana (08:15 - 12:00)</option>
                  <option value="afternoon">Tarde (12:00 - 18:00)</option>
                  <option value="evening">Noche (18:00 - 23:15)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <div className="border-t-[5px] border-t-current border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent"></div>
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(selectedDocente !== 'all' || selectedDay !== 'all' || timeFilter !== 'all') && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedDocente('all');
                    setSelectedDay('all');
                    setTimeFilter('all');
                  }}
                  className="w-full mb-[1px] py-3.5 px-4 bg-red-50 hover:bg-red-100 text-[#E30613] rounded-xl font-bold text-sm transition-colors border border-red-100 dashed flex items-center justify-center gap-2 animate-fade-in"
                >
                  <span>Limpiar</span>
                </button>
              </div>
            )}
          </div>

          {/* Results Count Badge - Floating style */}
          <div className="mt-8 flex items-center justify-center">
            <div className="bg-slate-900 text-white shadow-lg shadow-slate-900/10 px-6 py-2 rounded-full flex items-center gap-3 transform hover:scale-105 transition-transform duration-300 cursor-default">
              <span className="w-2 h-2 rounded-full bg-[#E30613] animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Mostrando {filteredDocentes.length} {filteredDocentes.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>
          </div>
        </div>

        {/* Matrix View */}
        {selectedDay === 'all' ? (
          <div className="bg-white rounded-[24px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden relative">
            {/* Header Gradient */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E30613] via-red-500 to-black"></div>

            <div className="w-full">
              <table className="w-full table-fixed">
                <thead className="bg-white border-b border-slate-200/80">
                  <tr>
                    <th className="w-[50px] px-2 py-6 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider sticky left-0 bg-white z-20 border-r border-slate-100">
                      #
                    </th>
                    <th className="w-[18%] px-6 py-6 text-left text-[11px] font-extrabold text-slate-800 uppercase tracking-wider sticky left-[50px] bg-white z-20 border-r border-slate-100 shadow-[4px_0_15px_-5px_rgba(0,0,0,0.05)]">
                      Docente
                    </th>
                    {daysOfWeek.map(day => (
                      <th key={day} className="px-4 py-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest group cursor-default transition-colors hover:bg-slate-50 border-r border-slate-50 last:border-r-0">
                        <span className="group-hover:text-[#E30613] transition-colors">{day}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocentes.map((docente, idx) => (
                    <tr key={docente.id} className={`group hover:bg-red-50/10 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                      {/* Index Column */}
                      <td className="px-2 py-5 text-center text-[10px] font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-[#FFF5F5] z-10 border-r border-slate-100 align-top transition-colors">
                        {idx + 1}
                      </td>

                      {/* Docente Column */}
                      <td className="px-6 py-5 sticky left-[50px] bg-white group-hover:bg-[#FFF5F5] z-10 border-r border-slate-100 shadow-[4px_0_15px_-5px_rgba(0,0,0,0.05)] align-top transition-colors">
                        <button
                          onClick={() => setEditingDocente(docente)}
                          className="flex flex-col gap-1.5 text-left group/btn hover:translate-x-1 transition-transform w-full"
                        >
                          <span className="font-bold text-slate-800 text-sm leading-tight group-hover/btn:text-[#E30613] transition-colors flex items-center gap-2">
                            {docente.name}
                            <span className="opacity-0 group-hover/btn:opacity-100 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded transition-opacity">EDITAR</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold tracking-wide font-mono bg-slate-50 w-fit px-1.5 py-0.5 rounded border border-slate-100">{docente.email}</span>
                        </button>
                      </td>

                      {/* Days Columns */}
                      {daysOfWeek.map(day => {
                        const dayData = getDocenteAvailabilityForDay(docente.id, day);
                        const filteredSlots = dayData ? filterSlots(dayData.slots) : [];
                        const hasSlots = dayData && filteredSlots.length > 0;

                        return (
                          <td key={day} className="px-2 py-4 align-top border-r border-slate-100/50 last:border-r-0 h-full group-hover:border-slate-200/50">
                            {hasSlots ? (
                              <div className="flex flex-col gap-2 items-center">
                                {filteredSlots.map(slot => (
                                  <div
                                    key={slot.id}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center justify-center gap-2 hover:border-[#E30613] hover:text-[#E30613] hover:shadow-md hover:shadow-red-500/10 transition-all cursor-default shadow-sm group/slot"
                                    title={`${slot.startTime} - ${slot.endTime}`}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#E30613]/40 group-hover/slot:bg-[#E30613] transition-colors shrink-0" />
                                    <span className="text-[11px] font-bold text-slate-600 group-hover/slot:text-[#E30613] font-mono tracking-tighter transition-colors">
                                      {slot.startTime}-{slot.endTime}
                                    </span>
                                  </div>
                                ))}
                                {dayData.observations && (
                                  <div className="w-full mt-1 px-3 py-2 bg-amber-50/60 border border-amber-100/50 rounded-lg flex items-start gap-2 group/note select-none cursor-help hover:bg-amber-100/80 transition-colors" title={dayData.observations}>
                                    <FileText className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                                    <span className="text-[9px] font-medium text-amber-800/80 leading-snug line-clamp-2 text-left w-full">
                                      {dayData.observations}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-full min-h-[50px] flex items-center justify-center">
                                <div className="w-1 h-1 bg-slate-200 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Day-specific view
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredDocentes.map(docente => {
              const dayData = getDocenteAvailabilityForDay(docente.id, selectedDay);
              const filteredSlots = dayData ? filterSlots(dayData.slots) : [];
              const hasSlots = dayData && filteredSlots.length > 0;

              return (
                <div key={docente.id} className="group bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent hover:border-red-100 hover:shadow-[0_12px_40px_rgba(227,6,19,0.08)] transition-all duration-500 flex flex-col overflow-hidden relative h-full hover:-translate-y-1">
                  {/* Decorative Header Bar */}
                  <div className={`h-1.5 w-full ${hasSlots ? 'bg-[#E30613]' : 'bg-slate-100'}`} />

                  <div className="p-7 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-[#E30613] transition-colors">
                          {docente.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-bold truncate mt-1 font-mono tracking-wide opacity-80">
                          {docente.email}
                        </p>
                      </div>
                      <div className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm ${hasSlots
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                        {hasSlots ? 'Disponible' : 'No disponible'}
                      </div>
                    </div>

                    {hasSlots ? (
                      <div className="space-y-5 flex-1">
                        <div className="space-y-3">
                          <p className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest pl-1">Horarios Registrados</p>
                          <div className="flex flex-wrap gap-2.5">
                            {filteredSlots.map(slot => (
                              <div
                                key={slot.id}
                                className="bg-white border border-slate-200 text-slate-600 hover:border-[#E30613] hover:text-[#E30613] hover:bg-red-50/50 rounded-xl py-2 px-3.5 flex items-center gap-2.5 transition-all cursor-default shadow-sm group/item"
                              >
                                <Clock className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-[#E30613] transition-colors" />
                                <span className="text-xs font-bold font-mono tracking-tight">
                                  {slot.startTime}-{slot.endTime}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center py-10 text-center bg-slate-50/30 rounded-2xl border-2 border-dashed border-slate-100 group-hover:border-slate-200 transition-colors">
                        <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                          <Clock className="w-6 h-6 text-slate-200" />
                        </div>
                        <p className="text-xs text-slate-400 font-bold max-w-[150px]">Sin horarios registrados</p>
                      </div>
                    )}

                    {/* Observations Footer */}
                    {hasSlots && dayData?.observations && (
                      <div className="mt-8 pt-5 border-t border-dashed border-slate-100">
                        <div className="bg-amber-50/60 border border-amber-100/60 rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-amber-300/50"></div>
                          <FileText className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <div className="min-w-0 z-10">
                            <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest mb-1">Observación</p>
                            <p className="text-xs text-amber-900 leading-relaxed font-medium">
                              {dayData.observations}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-[1920px] mx-auto px-8 py-8 text-center border-t border-slate-200/50 mt-8">
        <p className="text-[10px] text-slate-400 font-extrabold tracking-[0.2em] uppercase opacity-70">© 2026 Universidad Tecnológica del Perú - Sistema de Horarios</p>
      </footer>

      {/* Admin Editor Modal */}
      {editingDocente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Editando Horario</h2>
                <p className="text-sm text-slate-500">Docente: <span className="text-[#E30613] font-bold">{editingDocente.name}</span></p>
              </div>
              <button
                onClick={() => setEditingDocente(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <LogOut className="w-5 h-5 text-slate-400 rotate-180" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#F5F5F7] p-6">
              <AvailabilityEditor
                user={editingDocente}
                onSave={handleSaveAvailability}
                onCancel={() => setEditingDocente(null)}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}