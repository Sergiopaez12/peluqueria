const mongoose = require('mongoose');

const TurnoSchema = new mongoose.Schema({
    usuarioId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    cliente:    { type: String, required: true },
    servicio:   { type: String, required: true },
    fecha:      { type: String, required: true },
    hora:       { type: String, required: true },
    estado:     { type: String, enum: ['pendiente', 'confirmado', 'rechazado'], default: 'pendiente' },
    confirmado: { type: Boolean, default: false },
    recordatorioEnviado: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Turno', TurnoSchema);