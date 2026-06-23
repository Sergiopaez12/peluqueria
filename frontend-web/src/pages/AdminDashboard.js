import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';
const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

// ── Badge de estado ───────────────────────────────────────
function EstadoBadge({ estado }) {
  const map = {
    pendiente:  { cls: 'badge-yellow', label: '⏳ Pendiente' },
    confirmado: { cls: 'badge-green',  label: '✅ Confirmado' },
    rechazado:  { cls: 'badge-pink',   label: '❌ Rechazado' },
  };
  const { cls, label } = map[estado] || map.pendiente;
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ── Tab: Agenda ───────────────────────────────────────────
function TabAgenda({ turnos, loading, onCambiarEstado, onEliminar, busqueda, setBusqueda, filtroFecha, setFiltroFecha, onRefresh }) {
  const hoy = new Date().toISOString().split('T')[0];

  const turnosFiltrados = turnos.filter(t => {
    const nombre = t.usuarioId?.nombre || t.cliente || '';
    const email  = t.usuarioId?.email  || '';
    const mb = nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
               email.toLowerCase().includes(busqueda.toLowerCase()) ||
               t.servicio.toLowerCase().includes(busqueda.toLowerCase());
    const mf = filtroFecha ? t.fecha === filtroFecha : true;
    return mb && mf;
  });

  return (
    <>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Buscar cliente, email o servicio..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <input type="date" className="form-input" style={{ width: 'auto' }}
          value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
        {filtroFecha && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFiltroFecha('')}>✕ Limpiar</button>
        )}
        <button className="btn btn-secondary btn-sm" onClick={onRefresh}>🔄 Actualizar</button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Cargando...</div>
      ) : turnosFiltrados.length === 0 ? (
        <div className="empty-state"><span className="empty-icon">📭</span><p>Sin turnos para mostrar.</p></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turnosFiltrados.map(t => (
                <tr key={t._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.usuarioId?.nombre || t.cliente}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.usuarioId?.email}</div>
                  </td>
                  <td><span className="badge badge-purple">{t.servicio}</span></td>
                  <td style={{ color: t.fecha >= hoy ? 'var(--success)' : 'var(--text-muted)' }}>{t.fecha}</td>
                  <td style={{ fontWeight: 600 }}>{t.hora}</td>
                  <td><EstadoBadge estado={t.estado} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {t.estado !== 'confirmado' && (
                        <button className="btn btn-sm" style={{ background: 'rgba(52,211,153,0.15)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.3)', width: 'auto', padding: '5px 10px', fontSize: 12 }}
                          onClick={() => onCambiarEstado(t._id, 'confirmado')}>✅ Confirmar</button>
                      )}
                      {t.estado !== 'rechazado' && (
                        <button className="btn btn-sm" style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.3)', width: 'auto', padding: '5px 10px', fontSize: 12 }}
                          onClick={() => onCambiarEstado(t._id, 'rechazado')}>❌ Rechazar</button>
                      )}
                      <button className="btn btn-danger" onClick={() => onEliminar(t._id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ── Tab: Clientes ─────────────────────────────────────────
function TabClientes({ turnos, loading }) {
  const clientesMap = {};
  turnos.forEach(t => {
    const uid = t.usuarioId?._id || t.cliente;
    if (!clientesMap[uid]) {
      clientesMap[uid] = { nombre: t.usuarioId?.nombre || t.cliente, email: t.usuarioId?.email || '—', turnos: [] };
    }
    clientesMap[uid].turnos.push(t);
  });
  const clientes = Object.values(clientesMap);

  if (loading) return <div className="loading"><div className="spinner" /> Cargando...</div>;
  if (clientes.length === 0) return <div className="empty-state"><span className="empty-icon">👥</span><p>No hay clientes registrados.</p></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {clientes.map((c, i) => (
        <div key={i} className="client-card">
          <div className="client-card-header">
            <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 15 }}>
              {c.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <div className="client-name">{c.nombre}</div>
              <div className="client-email">{c.email}</div>
            </div>
            <span className="badge badge-purple" style={{ marginLeft: 'auto' }}>
              {c.turnos.length} turno{c.turnos.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="client-turnos">
            {c.turnos.map(t => (
              <span key={t._id} className="turno-chip">
                <span className="dot" style={{ background: t.estado === 'confirmado' ? 'var(--success)' : t.estado === 'rechazado' ? 'var(--danger)' : 'var(--warning)' }} />
                {t.fecha} {t.hora} · {t.servicio}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Horarios ─────────────────────────────────────────
function TabHorarios({ token }) {
  const [config, setConfig]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState('');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/horarios/config`, { headers })
      .then(r => setConfig(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (idx, field, value) => {
    setConfig(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  };

  const handleSave = async () => {
    setSaving(true); setSuccess('');
    try {
      await axios.put(`${API}/horarios/config`, config, { headers });
      setSuccess('✅ Horarios guardados correctamente.');
    } catch { setSuccess('❌ Error al guardar.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading"><div className="spinner" /> Cargando...</div>;

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="card">
        <div className="card-title"><span className="icon">⏰</span> Días y horarios de atención</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          Configurá los días que atendés y el rango horario. Los turnos solo podrán agendarse en los horarios disponibles.
        </p>
        {success && <div className={`alert ${success.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{success}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {config.map((h, idx) => (
            <div key={h.diaSemana} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
              borderRadius: 12, opacity: h.activo ? 1 : 0.5, transition: 'opacity 0.2s'
            }}>
              {/* Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 110 }}>
                <input type="checkbox" checked={h.activo} onChange={e => handleChange(idx, 'activo', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{DIAS[h.diaSemana]}</span>
              </label>

              {/* Hora inicio */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Desde</span>
                <input type="time" className="form-input" style={{ width: 'auto', padding: '8px 10px', fontSize: 13 }}
                  value={h.horaInicio} disabled={!h.activo}
                  onChange={e => handleChange(idx, 'horaInicio', e.target.value)} />
              </div>

              {/* Hora fin */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Hasta</span>
                <input type="time" className="form-input" style={{ width: 'auto', padding: '8px 10px', fontSize: 13 }}
                  value={h.horaFin} disabled={!h.activo}
                  onChange={e => handleChange(idx, 'horaFin', e.target.value)} />
              </div>

              {/* Intervalo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cada</span>
                <select className="form-input" style={{ width: 'auto', padding: '8px 10px', fontSize: 13 }}
                  value={h.intervaloMinutos} disabled={!h.activo}
                  onChange={e => handleChange(idx, 'intervaloMinutos', Number(e.target.value))}>
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleSave} disabled={saving}>
          {saving ? '⏳ Guardando...' : '💾 Guardar horarios'}
        </button>
      </div>
    </div>
  );
}

// ── Dashboard principal Admin ─────────────────────────────
export default function AdminDashboard({ usuario, token, onLogout }) {
  const [tab, setTab]         = useState('agenda');
  const [turnos, setTurnos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [busqueda, setBusqueda]     = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const headers = { Authorization: `Bearer ${token}` };

  const cargarTurnos = async () => {
    try { setLoading(true); const r = await axios.get(`${API}/turnos`, { headers }); setTurnos(r.data); }
    catch { setError('Error al cargar turnos.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargarTurnos(); }, []);

  const handleCambiarEstado = async (id, estado) => {
    try {
      const r = await axios.patch(`${API}/turnos/${id}/estado`, { estado }, { headers });
      setTurnos(prev => prev.map(t => t._id === id ? { ...t, estado: r.data.estado } : t));
    } catch { setError('Error al cambiar estado.'); }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este turno?')) return;
    try { await axios.delete(`${API}/turnos/${id}`, { headers }); setTurnos(prev => prev.filter(t => t._id !== id)); }
    catch { setError('Error al eliminar.'); }
  };

  // Stats
  const hoy = new Date().toISOString().split('T')[0];
  const pendientes = turnos.filter(t => t.estado === 'pendiente').length;
  const confirmados = turnos.filter(t => t.estado === 'confirmado' && t.fecha >= hoy).length;
  const hoyCount = turnos.filter(t => t.fecha === hoy).length;
  const clientesUnicos = new Set(turnos.map(t => t.usuarioId?._id || t.cliente)).size;

  const initials = usuario.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const TABS = [
    { id: 'agenda',   label: 'Agenda',   icon: '📋', badge: pendientes || null },
    { id: 'clientes', label: 'Clientes', icon: '👥', badge: null },
    { id: 'horarios', label: 'Horarios', icon: '⏰', badge: null },
  ];

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">✂️</span>
          <span className="brand-name">BarberApp</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>Admin</span>
        </div>
        <div className="navbar-user">
          <div className="user-badge">
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>{initials}</div>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{usuario.nombre}</span>
            <span className="role-tag admin">👑 Dueño</span>
          </div>
          <button className="btn-logout" onClick={onLogout}>Salir</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>📊 Panel de Control</h2>
          <p>Gestión completa de turnos y clientes</p>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{turnos.length}</div>
            <div className="stat-label">Total turnos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendientes}</div>
            <div className="stat-label">Pendientes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{confirmados}</div>
            <div className="stat-label">Confirmados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{hoyCount}</div>
            <div className="stat-label">Hoy</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{clientesUnicos}</div>
            <div className="stat-label">Clientes</div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Tabs */}
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
          {tab === 'agenda' && (
            <div className="card">
              <div className="card-title"><span className="icon">📋</span> Todos los turnos</div>
              <TabAgenda turnos={turnos} loading={loading}
                onCambiarEstado={handleCambiarEstado} onEliminar={handleEliminar}
                busqueda={busqueda} setBusqueda={setBusqueda}
                filtroFecha={filtroFecha} setFiltroFecha={setFiltroFecha}
                onRefresh={cargarTurnos} />
            </div>
          )}
          {tab === 'clientes' && (
            <div className="card">
              <div className="card-title"><span className="icon">👥</span> Clientes ({new Set(turnos.map(t => t.usuarioId?._id || t.cliente)).size})</div>
              <TabClientes turnos={turnos} loading={loading} />
            </div>
          )}
          {tab === 'horarios' && <TabHorarios token={token} />}
        </div>
      </div>
    </div>
  );
}
