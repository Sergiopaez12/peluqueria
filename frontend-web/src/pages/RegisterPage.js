import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function RegisterPage({ onLogin, onGoLogin }) {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmar) {
      return setError('Las contraseñas no coinciden.');
    }
    if (form.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/register`, {
        nombre: form.nombre,
        email: form.email,
        password: form.password
      });
      onLogin(res.data.token, res.data.usuario);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="icon">✂️</span>
          <h1>Crear cuenta</h1>
          <p>Registrate para agendar tu turno</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input
              id="reg-nombre"
              type="text"
              name="nombre"
              className="form-input"
              placeholder="Juan García"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              id="reg-email"
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
              id="reg-password"
              type="password"
              name="password"
              className="form-input"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input
              id="reg-confirmar"
              type="password"
              name="confirmar"
              className="form-input"
              placeholder="Repetí tu contraseña"
              value={form.confirmar}
              onChange={handleChange}
              required
            />
          </div>

          <button id="reg-submit" type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '⏳ Creando cuenta...' : '✓ Crear cuenta'}
          </button>
        </form>

        <div className="auth-footer">
          ¿Ya tenés cuenta?{' '}
          <button id="go-login" onClick={onGoLogin}>Iniciar sesión</button>
        </div>
      </div>
    </div>
  );
}
