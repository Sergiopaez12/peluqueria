const mongoose = require('mongoose');

const ServicioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true, trim: true },
  precio: { type: Number, required: true },
  duracionMin: { type: Number, default: 30 },
  activo: { type: Boolean, default: true },
  descripcion: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Servicio', ServicioSchema);
