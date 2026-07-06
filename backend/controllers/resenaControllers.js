const Resena = require('../models/Resena');
const Turno = require('../models/Turno');

exports.getResenas = async (req, res) => {
  try {
    const resenas = await Resena.find()
      .populate('usuarioId', 'nombre')
      .sort({ createdAt: -1 });
    res.json(resenas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener reseñas.' });
  }
};

exports.createResena = async (req, res) => {
  try {
    const { turnoId, puntuacion, comentario } = req.body;
    if (!turnoId || !puntuacion) {
      return res.status(400).json({ message: 'Turno e puntuación son requeridos.' });
    }

    // Verificar si el turno existe y pertenece al usuario y está confirmado
    const turno = await Turno.findById(turnoId);
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado.' });
    }

    if (turno.usuarioId.toString() !== req.usuario.id) {
      return res.status(403).json({ message: 'Solo podés opinar sobre tus propios turnos.' });
    }

    if (turno.estado !== 'confirmado') {
      return res.status(400).json({ message: 'Solo podés opinar sobre turnos que ya hayan sido confirmados.' });
    }

    // Verificar si ya existe una reseña para este turno
    const yaTieneResena = await Resena.findOne({ turnoId });
    if (yaTieneResena) {
      return res.status(400).json({ message: 'Ya dejaste una reseña para este turno.' });
    }

    const nuevaResena = new Resena({
      usuarioId: req.usuario.id,
      turnoId,
      puntuacion,
      comentario
    });

    await nuevaResena.save();
    res.status(201).json(nuevaResena);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la reseña.' });
  }
};

exports.deleteResena = async (req, res) => {
  try {
    const resena = await Resena.findById(req.params.id);
    if (!resena) {
      return res.status(404).json({ message: 'Reseña no encontrada.' });
    }

    if (resena.usuarioId.toString() !== req.usuario.id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ message: 'No tenés permisos para eliminar esta reseña.' });
    }

    await resena.deleteOne();
    res.json({ message: 'Reseña eliminada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar reseña.' });
  }
};
