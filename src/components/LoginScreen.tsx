import { useState } from 'react';
import { ChevronRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { UserRole, DocenteData } from '../App';

interface LoginScreenProps {
  onLogin: (role: UserRole, user?: DocenteData, token?: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [step, setStep] = useState<'landing' | 'email' | 'password'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMicrosoftLoginClick = () => {
    setStep('email');
    setError('');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Escriba su dirección de correo electrónico.');
      return;
    }

    if (!email.toLowerCase().endsWith('@utp.edu.pe')) {
      setError('Solo se permite el acceso con cuentas institucionales (@utp.edu.pe).');
      return;
    }

    setStep('password');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('https://app-horarios-backend.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.role, data.user, data.token);
      } else {
        setError('La contraseña es incorrecta. Inténtelo de nuevo.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error de conexión con el servidor de autenticación.');
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'password') setStep('email');
    else if (step === 'email') setStep('landing');
    setError('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#E30613] selection:text-white">
      {/* 1. Dynamic Background Elements - Premium Feel */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated Blobs */}
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-gradient-to-tr from-[#E30613]/10 to-transparent rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] bg-gradient-to-bl from-slate-300/30 to-transparent rounded-full blur-[80px] animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-[30%] left-[20%] w-[50%] h-[50%] bg-gradient-to-t from-red-200/20 to-slate-200/20 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* Decorative Top Line with Glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E30613] via-red-500 to-[#E30613] z-20 shadow-[0_0_15px_rgba(227,6,19,0.5)]"></div>

      {/* Main Container with Scale Animation */}
      <div className="w-full max-w-[440px] relative z-10 animate-fade-in-up md:scale-100">

        {/* 2. Glassmorphism Card with Animated Border */}
        <div className="relative group rounded-2xl p-[1px] overflow-hidden">
          {/* Animated Gradient Border */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#E30613] via-white to-[#E30613] opacity-20 group-hover:opacity-100 transition-opacity duration-500 animate-spin-slow" style={{ animationDuration: '4s' }}></div>
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xl rounded-2xl"></div>

          <div className="relative bg-white/95 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden min-h-[420px] flex flex-col">

            {/* Header Section */}
            <div className="px-10 pt-10 pb-6 text-center w-full">
              <div className="flex justify-center mb-6 relative group/logo">
                <div className="absolute inset-0 bg-[#E30613]/5 blur-2xl rounded-full scale-150 opacity-0 group-hover/logo:opacity-100 transition-opacity duration-700"></div>
                <img
                  src="/logo_utp.png"
                  alt="UTP"
                  className="h-14 object-contain relative z-10 drop-shadow-sm transform transition-transform duration-300 group-hover/logo:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) parent.innerHTML = '<div class="text-[#E30613] font-bold text-4xl tracking-tighter drop-shadow-sm">UTP</div>';
                  }}
                />
              </div>
              {step === 'landing' && (
                <>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Portal Horario</h1>
                  <p className="text-slate-500 font-medium text-xs">Gestiona tu horario y disponibilidad</p>
                </>
              )}
            </div>

            {/* CONTENT AREA */}
            <div className="px-10 pb-10 flex-1 flex flex-col relative z-20">

              {step === 'landing' && (
                <div className="animate-fade-in flex flex-col h-full flex-1 justify-center pb-8">
                  <button
                    onClick={handleMicrosoftLoginClick}
                    className="w-full bg-[#2F2F2F] hover:bg-black text-white font-medium py-4 px-4 flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group/btn relative overflow-hidden rounded-xl"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-shimmer"></div>
                    <div className="flex gap-1">
                      <span className="w-2.5 h-2.5 bg-[#F25022]"></span>
                      <span className="w-2.5 h-2.5 bg-[#7FBA00]"></span>
                      <span className="w-2.5 h-2.5 bg-[#00A4EF]"></span>
                      <span className="w-2.5 h-2.5 bg-[#FFB900]"></span>
                    </div>
                    <span className="text-sm font-semibold tracking-wide">Iniciar sesión con Microsoft</span>
                    <ChevronRight className="w-4 h-4 text-white/50 group-hover/btn:translate-x-1 transition-transform" />
                  </button>

                  <div className="mt-8 relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-300 font-bold tracking-widest">Acceso Seguro</span>
                    </div>
                  </div>
                </div>
              )}


              {(step === 'email' || step === 'password') && (
                <div className="animate-fade-in flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-6">
                    {step === 'password' && (
                      <button onClick={handleBack} className="p-1.5 -ml-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#E30613] transition-colors">
                        <ArrowLeft size={18} />
                      </button>
                    )}
                    <h2 className="text-xl font-bold text-slate-800">
                      {step === 'email' ? 'Iniciar sesión' : 'Contraseña'}
                    </h2>
                  </div>

                  {/* Email Display in Password Step */}
                  {step === 'password' && (
                    <div className="mb-6 flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-600 font-medium font-mono">
                        {email}
                      </div>
                      <button
                        onClick={() => { setStep('email'); setPassword(''); }}
                        className="text-[10px] text-[#E30613] font-bold hover:underline uppercase tracking-wide"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}

                  <form onSubmit={step === 'email' ? handleEmailSubmit : handleLogin} className="flex-1 flex flex-col">

                    {step === 'email' && (
                      <div className="space-y-4">
                        <div className="group/input">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 group-focus-within/input:text-[#E30613] transition-colors">Usuario</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border-b-2 border-slate-200 focus:border-[#E30613] outline-none py-2 text-base bg-transparent transition-colors placeholder:text-slate-300 text-slate-800 font-medium"
                            placeholder="correo@utp.edu.pe"
                            autoFocus
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 bg-blue-50/50 p-2 rounded border border-blue-100/50 text-center">
                          Recuerda usar tu cuenta institucional <strong>@utp.edu.pe</strong>
                        </p>
                      </div>
                    )}

                    {step === 'password' && (
                      <div className="space-y-4">
                        <div className="group/input">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 group-focus-within/input:text-[#E30613] transition-colors">Contraseña</label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border-b-2 border-slate-200 focus:border-[#E30613] outline-none py-2 text-base bg-transparent transition-colors placeholder:text-slate-300 text-slate-800 font-medium"
                            placeholder="••••••••"
                            autoFocus
                          />
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="mt-4 flex items-start gap-3 bg-red-50 text-[#E30613] text-xs p-3 rounded-lg animate-shake border border-red-100">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span className="font-semibold">{error}</span>
                      </div>
                    )}

                    <div className="mt-auto pt-8 flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#E30613] hover:bg-[#c90510] disabled:bg-[#E30613]/70 text-white py-3 px-8 rounded-xl text-sm font-bold shadow-[0_4px_14px_0_rgba(227,6,19,0.39)] hover:shadow-[0_6px_20px_rgba(227,6,19,0.23)] hover:-translate-y-0.5 transition-all duration-300 min-w-[120px]"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Cargando...
                          </span>
                        ) : 'Siguiente'}
                      </button>
                    </div>

                  </form>
                </div>
              )}
            </div>

            {/* Bottom Gradient Line with Seamless Flow */}
            <div className="h-1.5 w-full relative overflow-hidden">
              <div
                className="absolute inset-0 w-full h-full animate-tricolor-flow"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #E30613, #000000, #FFFFFF, #E30613)',
                  backgroundSize: '200% 100%'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center mt-6 opacity-60 hover:opacity-100 transition-opacity duration-300">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">© 2026 UTP • Microsoft</span>
        </div>

      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes tricolor-flow {
          0% { background-position: 0% 0%; }
          100% { background-position: -200% 0%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
            animation: fade-in 0.4s ease-out forwards;
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
        .animate-tricolor-flow {
          animation: tricolor-flow 3s infinite linear;
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-spin-slow {
            animation: spin-slow 10s linear infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
