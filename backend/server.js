const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Turno = require('./models/Turno'); // Importamos el modelo

const app = express();
app.use(cors());
app.use(express.json());

// RUTA: Obtener todos los turnos
app.get('/api/turnos', async (req, res) => {
    const turnos = await Turno.find();
    res.json(turnos);
});

// RUTA: Crear un nuevo turno (Desde la App Móvil)
app.post('/api/turnos', async (req, res) => {
    const nuevoTurno = new Turno(req.body);
    await nuevoTurno.save();
    res.json({ mensaje: 'Turno guardado correctamente' });
});

// Conexión a MongoDB (puedes usar una URL local o de Atlas)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/peluqueria';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error de conexión:', err));

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));