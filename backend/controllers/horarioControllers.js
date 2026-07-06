const HorarioConfig = require('../models/HorarioConfig');
const Turno = require('../models/Turno');
const DiaBloqueado = require('../models/DiaBloqueado');

const DIAS_NOMBRES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

// Horarios por defecto (Lun-Sab 9:00-19:00, Domingo cerrado)
const DEFAULTS = [
    { diaSemana: 0, activo: false, horaInicio: '09:00', horaFin: '19:00', intervaloMinutos: 30 },
    { diaSemana: 1, activo: true,  horaInicio: '09:00', horaFin: '19:00', intervaloMinutos: 30 },
    { diaSemana: 2, activo: true,  horaInicio: '09:00', horaFin: '19:00', intervaloMinutos: 30 },
    { diaSemana: 3, activo: true,  horaInicio: '09:00', horaFin: '19:00', intervaloMinutos: 30 },
    { diaSemana: 4, activo: true,  horaInicio: '09:00', horaFin: '19:00', intervaloMinutos: 30 },
    { diaSemana: 5, activo: true,  horaInicio: '09:00', horaFin: '19:00', intervaloMinutos: 30 },
    { diaSemana: 6, activo: true,  horaInicio: '09:00', horaFin: '14:00', intervaloMinutos: 30 },
];

// Inicializar configuración por defecto si no existe
exports.inicializarHorarios = async () => {
    for (const def of DEFAULTS) {
        const existe = await HorarioConfig.findOne({ diaSemana: def.diaSemana });
        if (!existe) await HorarioConfig.create(def);
    }
    console.log('📅 Horarios inicializados');
};

// GET /api/horarios/config
exports.getConfig = async (req, res) => {
    try {
        const config = await HorarioConfig.find().sort('diaSemana');
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener configuración.' });
    }
};

// PUT /api/horarios/config  (body: array de horarios)
exports.updateConfig = async (req, res) => {
    try {
        const horarios = req.body; // array de { diaSemana, activo, horaInicio, horaFin, intervaloMinutos }
        for (const h of horarios) {
            await HorarioConfig.findOneAndUpdate(
                { diaSemana: h.diaSemana },
                h,
                { upsert: true }
            );
        }
        const config = await HorarioConfig.find().sort('diaSemana');
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar configuración.' });
    }
};

// GET /api/horarios/slots?fecha=YYYY-MM-DD
exports.getSlots = async (req, res) => {
    try {
        const { fecha } = req.query;
        if (!fecha) return res.status(400).json({ message: 'Fecha requerida.' });

        // Verificar si el día está bloqueado
        const diaBloqueado = await DiaBloqueado.findOne({ fecha });
        if (diaBloqueado) {
            return res.json({ slots: [], cerrado: true, mensaje: diaBloqueado.motivo || 'Este día está cerrado.' });
        }

        const [y, m, d] = fecha.split('-').map(Number);
        const fechaObj  = new Date(y, m - 1, d);
        const diaSemana = fechaObj.getDay();

        const config = await HorarioConfig.findOne({ diaSemana });
        if (!config || !config.activo) {
            return res.json({ slots: [], cerrado: true, mensaje: `${DIAS_NOMBRES[diaSemana]} no es día de atención.` });
        }

        // Generar todos los slots del día
        const [hIni, mIni] = config.horaInicio.split(':').map(Number);
        const [hFin, mFin] = config.horaFin.split(':').map(Number);
        const inicio  = hIni * 60 + mIni;
        const fin     = hFin * 60 + mFin;
        const intervalo = config.intervaloMinutos;

        const todosSlots = [];
        for (let t = inicio; t < fin; t += intervalo) {
            const hh = String(Math.floor(t / 60)).padStart(2, '0');
            const mm = String(t % 60).padStart(2, '0');
            todosSlots.push(`${hh}:${mm}`);
        }

        // Turnos ya ocupados ese día (confirmados o pendientes)
        const turnosOcupados = await Turno.find({
            fecha,
            estado: { $in: ['pendiente', 'confirmado'] }
        }).select('hora');
        const horasOcupadas = new Set(turnosOcupados.map(t => t.hora));

        // Filtrar slots pasados si la fecha es hoy
        const ahora = new Date();
        const esHoy = fechaObj.toDateString() === ahora.toDateString();
        const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes() + 120; // +2hs buffer

        const slots = todosSlots.map(hora => {
            const [hh, mm] = hora.split(':').map(Number);
            const slotMin  = hh * 60 + mm;
            return {
                hora,
                disponible: !horasOcupadas.has(hora) && (!esHoy || slotMin > ahoraMin)
            };
        });

        res.json({ slots, cerrado: false });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al calcular slots.' });
    }
};

// GET /api/horarios/bloqueados
exports.getDiasBloqueados = async (req, res) => {
    try {
        const bloqueados = await DiaBloqueado.find().sort({ fecha: 1 });
        res.json(bloqueados);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener días bloqueados.' });
    }
};

// POST /api/horarios/bloqueados
exports.bloquearDia = async (req, res) => {
    try {
        const { fecha, motivo } = req.body;
        if (!fecha) return res.status(400).json({ message: 'Fecha requerida.' });

        const nuevoBloqueo = await DiaBloqueado.findOneAndUpdate(
            { fecha },
            { fecha, motivo },
            { upsert: true, new: true }
        );
        res.status(201).json(nuevoBloqueo);
    } catch (error) {
        res.status(400).json({ message: 'Error al bloquear día.' });
    }
};

// DELETE /api/horarios/bloqueados/:id
exports.desbloquearDia = async (req, res) => {
    try {
        const bloqueo = await DiaBloqueado.findById(req.params.id);
        if (!bloqueo) return res.status(404).json({ message: 'Bloqueo no encontrado.' });
        await bloqueo.deleteOne();
        res.json({ message: 'Día desbloqueado correctamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al desbloquear día.' });
    }
};
