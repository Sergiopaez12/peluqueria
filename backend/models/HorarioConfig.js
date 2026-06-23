const mongoose = require('mongoose');

// Configuración de horarios disponibles por día de la semana
const HorarioConfigSchema = new mongoose.Schema({
    diaSemana:        { type: Number, min: 0, max: 6, required: true }, // 0=Dom, 1=Lun, ..., 6=Sab
    activo:           { type: Boolean, default: true },
    horaInicio:       { type: String, default: '09:00' }, // HH:MM
    horaFin:          { type: String, default: '19:00' }, // HH:MM
    intervaloMinutos: { type: Number, default: 30 }
}, { timestamps: true });

module.exports = mongoose.model('HorarioConfig', HorarioConfigSchema);
