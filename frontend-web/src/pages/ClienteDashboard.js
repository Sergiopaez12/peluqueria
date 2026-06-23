import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const SERVICIOS = [
  'Corte de cabello','Barba','Corte + Barba','Coloración',
  'Mechas','Alisado','Permanente','Tratamiento capilar'
];

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const hoyStr = () => new Date().toISOString().split('T')[0];

const parseFecha = (fechaStr) => {
  const [y, m, d] = fechaStr.split('-');
  return new Date(y, m - 1, d);
};

// ── Badge de estado ───────────────────────────────────────
function EstadoBadge({ estado }) {
  const map = {
    pendiente:  { cls: 'badge-yellow', label: '⏳ Pendiente' },
    confirmado: { cls: 'badge-green',  label: '✅ Confirmado' },
    rechazado:  { cls: 'badge-pink',   label: '❌ Rechazado' },
  };
  const { cls, label } = (map[estado] || map.pendiente);
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ── Tab: Mis Turnos ───────────────────────────────────────
function TabTurnos({ turnos, loading, onEliminar }) {
  const hoy = hoyStr();
  const proximos = turnos.filter(t => t.fecha >= hoy).sort((a,b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
  const pasados  = turnos.filter(t => t.fecha <  hoy).sort((a,b) => b.fecha.localeCompare(a.fecha));

  if (loading) return <div className="loading"><div className="spinner" /> Cargando...</div>;
  if (turnos.length === 0) return (
    <div className="empty-state">
      <span className="empty-icon">📭</span>
      <p>Todavía no tenés turnos agendados.</p>
    </div>
  );

  const TurnoItem = ({ t, futuro }) => {
    const fecha = parseFecha(t.fecha);
    const [y, m, d] = t.fecha.split('-').map(Number);
    const [h, min]  = t.hora.split(':').map(Number);
    const fechaDate = new Date(y, m - 1, d, h, min);
    const ahora = new Date();
    const diffHoras = (fechaDate - ahora) / (1000 * 60 * 60);
    const puedeCancelar = futuro && diffHoras >= 2 && t.estado !== 'rechazado';
    const cancelBloqueado = futuro && diffHoras < 2;

    return (
      <div className={`turno-item${futuro ? '' : ' pasado'}`}>
        <div className="turno-date-block">
          <div className="turno-day">{fecha.getDate()}</div>
          <div className="turno-month">{MESES[fecha.getMonth()]}</div>
        </div>
        <div className="turno-info">
          <div className="turno-servicio">{t.servicio}</div>
          <div className="turno-hora">🕐 {t.hora} hs</div>
        </div>
        <EstadoBadge estado={t.estado || 'pendiente'} />
        {puedeCancelar && (
          <button className="btn btn-danger" style={{ marginLeft: 8 }} onClick={() => onEliminar(t._id)}>
            Cancelar
          </button>
        )}
        {cancelBloqueado && (
          <span title="No podés cancelar con menos de 2hs de anticipación"
            style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', cursor: 'help' }}>
            🔒 Sin cancelar
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="turno-timeline">
      {proximos.length > 0 && (
        <>
          <div className="section-label">📅 Próximos ({proximos.length})</div>
          {proximos.map(t => <TurnoItem key={t._id} t={t} futuro={true} />)}
        </>
      )}
      {pasados.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: proximos.length ? 24 : 0 }}>🕐 Historial ({pasados.length})</div>
          {pasados.map(t => <TurnoItem key={t._id} t={t} futuro={false} />)}
        </>
      )}
    </div>
  );
}

// ── Tab: Agendar ──────────────────────────────────────────
function TabAgendar({ token, onTurnoCreado }) {
  const [form, setForm]       = useState({ servicio: '', fecha: '', hora: '' });
  const [slots, setSlots]     = useState([]);
  const [cerrado, setCerrado] = useState(false);
  const [msgCerrado, setMsgCerrado] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');
  const headers = { Authorization: `Bearer ${token}` };

  // Cargar slots al elegir fecha
  const cargarSlots = async (fecha) => {
    if (!fecha) { setSlots([]); return; }
    setLoadingSlots(true); setSlots([]); setCerrado(false);
    try {
      const r = await axios.get(`${API}/horarios/slots?fecha=${fecha}`, { headers });
      if (r.data.cerrado) { setCerrado(true); setMsgCerrado(r.data.mensaje); }
      else { setSlots(r.data.slots); }
    } catch { setSlots([]); }
    finally { setLoadingSlots(false); }
  };

  const handleFechaChange = (e) => {
    setForm(f => ({ ...f, fecha: e.target.value, hora: '' }));
    cargarSlots(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hora) return setError('Seleccioná un horario disponible.');
    setError(''); setSuccess(''); setEnviando(true);
    try {
      await axios.post(`${API}/turnos`, form, { headers });
      setSuccess('✅ ¡Turno agendado! Esperá la confirmación del dueño.');
      setForm({ servicio: '', fecha: '', hora: '' });
      setSlots([]);
      onTurnoCreado();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agendar.');
    } finally { setEnviando(false); }
  };

  const disponibles = slots.filter(s => s.disponible);

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="card">
        <div className="card-title"><span className="icon">📅</span> Nuevo Turno</div>

        {error   && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Servicio</label>
            <select name="servicio" className="form-input" value={form.servicio}
              onChange={e => setForm(f => ({ ...f, servicio: e.target.value }))} required>
              <option value="">Seleccioná un servicio...</option>
              {SERVICIOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Fecha</label>
            <input type="date" className="form-input" value={form.fecha}
              min={hoyStr()} onChange={handleFechaChange} required />
          </div>

          {/* Slots de horario */}
          {form.fecha && (
            <div className="form-group">
              <label>Horario disponible</label>
              {loadingSlots ? (
                <div className="loading" style={{ padding: 16, justifyContent: 'flex-start' }}>
                  <div className="spinner" /> Buscando horarios...
                </div>
              ) : cerrado ? (
                <div className="alert alert-error" style={{ marginBottom: 0 }}>🚫 {msgCerrado}</div>
              ) : disponibles.length === 0 ? (
                <div className="alert alert-error" style={{ marginBottom: 0 }}>😔 No hay horarios disponibles para esta fecha.</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {slots.map(s => (
                    <button
                      key={s.hora} type="button"
                      disabled={!s.disponible}
                      onClick={() => s.disponible && setForm(f => ({ ...f, hora: s.hora }))}
                      style={{
                        padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: s.disponible ? 'pointer' : 'not-allowed',
                        border: form.hora === s.hora ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: !s.disponible
                          ? 'rgba(255,255,255,0.02)'
                          : form.hora === s.hora
                            ? 'rgba(167,139,250,0.2)'
                            : 'rgba(255,255,255,0.04)',
                        color: !s.disponible ? 'var(--text-muted)' : form.hora === s.hora ? 'var(--accent)' : 'var(--text-primary)',
                        textDecoration: !s.disponible ? 'line-through' : 'none',
                        transition: 'all 0.15s',
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      {s.hora}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {form.servicio && form.fecha && form.hora && (
            <div style={{ padding: '14px 16px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
              🔖 <strong style={{ color: 'var(--accent)' }}>{form.servicio}</strong> — {form.fecha} a las {form.hora} hs
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>⏳ Tu turno quedará pendiente hasta que el dueño lo confirme.</div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={enviando || !form.hora}>
            {enviando ? '⏳ Agendando...' : '✓ Confirmar turno'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Tab: Mi Perfil ────────────────────────────────────────
function TabPerfil({ usuario, turnos, onLogout }) {
  const hoy = hoyStr();
  const proximos = turnos.filter(t => t.fecha >= hoy).length;
  const confirmados = turnos.filter(t => t.estado === 'confirmado').length;
  const initials = usuario.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="profile-card">
      <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
        <div className="profile-avatar-lg">{initials}</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{usuario.nombre}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{usuario.email}</div>
        <span className="role-tag cliente" style={{ display: 'inline-block', marginTop: 10 }}>Cliente</span>
      </div>
      <div className="card">
        <div className="card-title"><span className="icon">📊</span> Resumen</div>
        <div className="profile-info-row">
          <span className="label">Total turnos</span>
          <span className="value">{turnos.length}</span>
        </div>
        <div className="profile-info-row">
          <span className="label">Próximos</span>
          <span className="value" style={{ color: 'var(--success)' }}>{proximos}</span>
        </div>
        <div className="profile-info-row">
          <span className="label">Confirmados</span>
          <span className="value" style={{ color: 'var(--success)' }}>{confirmados}</span>
        </div>
        <div className="profile-info-row">
          <span className="label">Realizados</span>
          <span className="value">{turnos.filter(t => t.fecha < hoy).length}</span>
        </div>
        <div className="profile-info-row">
          <span className="label">Email</span>
          <span className="value">{usuario.email}</span>
        </div>
      </div>
      <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={onLogout}>
        🚪 Cerrar sesión
      </button>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────
export default function ClienteDashboard({ usuario, token, onLogout }) {
  const [tab, setTab]         = useState('turnos');
  const [turnos, setTurnos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  const cargarTurnos = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/turnos`, { headers });
      setTurnos(r.data);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  };

  useEffect(() => { cargarTurnos(); }, []);

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Cancelar este turno?')) return;
    try {
      await axios.delete(`${API}/turnos/${id}`, { headers });
      setTurnos(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cancelar.');
    }
  };

  const hoy = hoyStr();
  const proximos = turnos.filter(t => t.fecha >= hoy).length;
  const pendientes = turnos.filter(t => t.estado === 'pendiente' && t.fecha >= hoy).length;
  const initials = usuario.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const TABS = [
    { id: 'turnos',  label: 'Mis Turnos', icon: '🗓️', badge: pendientes || null },
    { id: 'agendar', label: 'Agendar',    icon: '➕',  badge: null },
    { id: 'perfil',  label: 'Mi Perfil',  icon: '👤',  badge: null },
  ];

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">✂️</span>
          <span className="brand-name">BarberApp</span>
        </div>
        <div className="navbar-user">
          <div className="user-badge">
            <div className="user-avatar">{initials}</div>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{usuario.nombre}</span>
            <span className="role-tag cliente">Cliente</span>
          </div>
          <button className="btn-logout" onClick={onLogout}>Salir</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>👋 Hola, {usuario.nombre.split(' ')[0]}!</h2>
          <p>Gestioná tus turnos en la peluquería</p>
        </div>

        <div className="stats-row" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-value">{turnos.length}</div>
            <div className="stat-label">Total turnos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{proximos}</div>
            <div className="stat-label">Próximos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendientes}</div>
            <div className="stat-label">Pendientes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{turnos.filter(t => t.fecha < hoy).length}</div>
            <div className="stat-label">Realizados</div>
          </div>
        </div>

        <div className="tabs-bar">
          {TABS.map(t => (
            <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="tab-icon">{t.icon}</span>
              {t.label}
              {t.badge ? <span className="tab-badge">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        <div className="tab-content" key={tab}>
          {tab === 'turnos'  && <TabTurnos  turnos={turnos} loading={loading} onEliminar={handleEliminar} />}
          {tab === 'agendar' && <TabAgendar token={token} onTurnoCreado={() => { cargarTurnos(); setTab('turnos'); }} />}
          {tab === 'perfil'  && <TabPerfil  usuario={usuario} turnos={turnos} onLogout={onLogout} />}
        </div>
      </div>
    </div>
  );
}
