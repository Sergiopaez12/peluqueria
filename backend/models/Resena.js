const mongoose = require('mongoose');

const ResenaSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  turnoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Turno', required: true },
  puntuacion: { type: Number, min: 1, max: 5, required: true },
  comentario: { type: String, default: '' },
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Resena', ResenaSchema);
