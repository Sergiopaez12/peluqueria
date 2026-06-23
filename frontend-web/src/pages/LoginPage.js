import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function LoginPage({ onLogin, onGoRegister }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, form);
      onLogin(res.data.token, res.data.usuario);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="icon">✂️</span>
          <h1>BarberApp</h1>
          <p>Gestión de turnos para tu peluquería</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              name="email"
              className="form-input"
              placeholder="tucorreo@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              id="login-password"
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button id="login-submit" type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '⏳ Ingresando...' : '→ Ingresar'}
          </button>
        </form>

        <div className="divider">o</div>

        <div className="auth-footer">
          ¿No tenés cuenta?{' '}
          <button id="go-register" onClick={onGoRegister}>Registrarse</button>
        </div>

        <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--warning)' }}>
          👑 <strong>Dueño:</strong> admin@peluqueria.com / admin1234
        </div>
      </div>
    </div>
  );
}
