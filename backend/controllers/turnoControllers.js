const Turno   = require('../models/Turno');
const { enviarConfirmacion, enviarRechazo } = require('../services/emailService');

// Obtener turnos (admin = todos, cliente = los suyos)
exports.obtenerTurnos = async (req, res) => {
    try {
        let turnos;
        if (req.usuario.rol === 'admin') {
            turnos = await Turno.find()
                .populate('usuarioId', 'nombre email')
                .sort({ fecha: 1, hora: 1 });
        } else {
            turnos = await Turno.find({ usuarioId: req.usuario.id })
                .sort({ fecha: 1, hora: 1 });
        }
        res.json(turnos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener turnos.' });
    }
};

// Crear turno (asociado al usuario logueado)
exports.crearTurno = async (req, res) => {
    try {
        const { servicio, fecha, hora } = req.body;
        const nuevoTurno = new Turno({
            usuarioId: req.usuario.id,
            cliente:   req.usuario.nombre,
            servicio,
            fecha,
            hora,
            estado: 'pendiente'
        });
        await nuevoTurno.save();
        res.status(201).json(nuevoTurno);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error al guardar el turno.' });
    }
};

// Eliminar turno con validación de 2hs mínimas
exports.eliminarTurno = async (req, res) => {
    try {
        const turno = await Turno.findById(req.params.id);
        if (!turno) return res.status(404).json({ message: 'Turno no encontrado.' });

        // Solo el dueño o admin puede eliminar
        if (turno.usuarioId.toString() !== req.usuario.id && req.usuario.rol !== 'admin') {
            return res.status(403).json({ message: 'No tenés permiso para cancelar este turno.' });
        }

        // Validar anticipación mínima de 2hs (solo para clientes, admin puede siempre)
        if (req.usuario.rol !== 'admin') {
            const [y, m, d] = turno.fecha.split('-').map(Number);
            const [h, min]  = turno.hora.split(':').map(Number);
            const fechaTurno = new Date(y, m - 1, d, h, min, 0);
            const ahora = new Date();
            const diffMs = fechaTurno - ahora;
            const diffHoras = diffMs / (1000 * 60 * 60);

            if (diffHoras < 2) {
                return res.status(400).json({
                    message: 'No podés cancelar un turno con menos de 2 horas de anticipación.'
                });
            }
        }

        await turno.deleteOne();
        res.json({ message: 'Turno cancelado correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el turno.' });
    }
};

// Cambiar estado (solo admin): pendiente → confirmado | rechazado
exports.cambiarEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!['pendiente', 'confirmado', 'rechazado'].includes(estado)) {
            return res.status(400).json({ message: 'Estado inválido.' });
        }

        const turno = await Turno.findById(req.params.id).populate('usuarioId', 'nombre email');
        if (!turno) return res.status(404).json({ message: 'Turno no encontrado.' });

        turno.estado = estado;
        await turno.save();

        // Enviar email al cliente
        if (turno.usuarioId?.email) {
            if (estado === 'confirmado') {
                enviarConfirmacion(turno, turno.usuarioId).catch(err =>
                    console.error('Error enviando email confirmación:', err.message)
                );
            } else if (estado === 'rechazado') {
                enviarRechazo(turno, turno.usuarioId).catch(err =>
                    console.error('Error enviando email rechazo:', err.message)
                );
            }
        }

        res.json(turno);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cambiar estado.' });
    }
};