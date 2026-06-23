import React, { useState, useEffect } from 'react';
import './index.css';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import ClienteDashboard from './pages/ClienteDashboard';
import AdminDashboard   from './pages/AdminDashboard';

// Claves para localStorage
const TOKEN_KEY   = 'barber_token';
const USUARIO_KEY = 'barber_usuario';

function App() {
  const [vista, setVista]       = useState('login'); // 'login' | 'register'
  const [token, setToken]       = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [usuario, setUsuario]   = useState(() => {
    const u = localStorage.getItem(USUARIO_KEY);
    return u ? JSON.parse(u) : null;
  });

  // Si hay token guardado, validar que no expiró (simple check)
  useEffect(() => {
    if (token && usuario) {
      // Token presente, mantenemos la sesión
    }
  }, []);

  const handleLogin = (newToken, newUsuario) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(newUsuario));
    setToken(newToken);
    setUsuario(newUsuario);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    setToken(null);
    setUsuario(null);
    setVista('login');
  };

  // Usuario logueado → mostrar dashboard según rol
  if (token && usuario) {
    if (usuario.rol === 'admin') {
      return <AdminDashboard usuario={usuario} token={token} onLogout={handleLogout} />;
    }
    return <ClienteDashboard usuario={usuario} token={token} onLogout={handleLogout} />;
  }

  // Sin sesión → Login o Registro
  if (vista === 'register') {
    return (
      <RegisterPage
        onLogin={handleLogin}
        onGoLogin={() => setVista('login')}
      />
    );
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      onGoRegister={() => setVista('register')}
    />
  );
}

export default App;