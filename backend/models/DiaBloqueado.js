const mongoose = require('mongoose');

const DiaBloqueadoSchema = new mongoose.Schema({
  fecha: { type: String, required: true, unique: true }, // YYYY-MM-DD
  motivo: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('DiaBloqueado', DiaBloqueadoSchema);
