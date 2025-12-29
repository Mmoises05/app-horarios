import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { DocenteDashboard } from './components/DocenteDashboard';
import { ProgramadorDashboard } from './components/ProgramadorDashboard';


export type UserRole = 'docente' | 'programador' | null;

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface DayAvailability {
  day: string;
  slots: TimeSlot[];
  observations: string;
}

export interface DocenteData {
  id: string;
  name: string;
  email: string;
  availability: DayAvailability[];
}

function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<DocenteData | null>(null);
  // Global State for all teachers
  const [docentes, setDocentes] = useState<DocenteData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Fetch data on mount or when token changes
  useEffect(() => {
    if (!token) return; // Don't fetch if no token

    setIsLoading(true);
    fetch('http://localhost:3002/api/docentes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then(data => {
        setDocentes(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        if (err.message === 'Unauthorized') {
          handleLogout();
        }
        setIsLoading(false);
      });
  }, [token]);

  // Check for existing session on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as UserRole;
    const savedUser = localStorage.getItem('currentUser');

    if (token && savedRole) {
      setUserRole(savedRole);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    }
  }, []);

  const handleLogin = (role: UserRole, user?: DocenteData, newToken?: string) => {
    setUserRole(role);
    localStorage.setItem('userRole', role || '');

    if (newToken) {
      setToken(newToken);
      localStorage.setItem('token', newToken);
    }

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
  };

  const handleUpdateDocente = async (updatedUser: DocenteData) => {
    // 1. Optimistic Update Global List
    const updatedList = docentes.map(d =>
      d.id === updatedUser.id ? updatedUser : d
    );
    setDocentes(updatedList);
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    // 2. Send Update to Backend
    try {
      const res = await fetch(`http://localhost:3002/api/docentes/${updatedUser.id}/disponibilidad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ availability: updatedUser.availability }),
      });

      if (!res.ok) throw new Error('Failed to update');

    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Error al guardar cambios en el servidor');
    }
  };

  if (isLoading && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E30613]"></div>
      </div>
    );
  }

  if (!userRole) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // DOCENTE LOGIC
  if (userRole === 'docente' && currentUser) {
    return (
      <DocenteDashboard
        user={currentUser}
        onLogout={handleLogout}
        onUpdate={handleUpdateDocente}
      />
    );
  }

  // ADMIN/PROGRAMADOR LOGIC
  if (userRole === 'programador') {
    return (
      <ProgramadorDashboard
        onLogout={handleLogout}
        docentes={docentes} // Pass global state
      />
    );
  }

  return null;
}

export default App;
