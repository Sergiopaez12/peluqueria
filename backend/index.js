const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ CONECTADO A MONGODB CON ÉXITO');

        // Crear usuario admin por defecto si no existe
        const Usuario = require('./models/Usuario');
        const bcrypt  = require('bcryptjs');
        const adminExiste = await Usuario.findOne({ rol: 'admin' });
        if (!adminExiste) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin1234', salt);
            await Usuario.create({
                nombre: 'Dueño',
                email:  process.env.ADMIN_EMAIL || 'admin@peluqueria.com',
                password: passwordHash,
                rol: 'admin'
            });
            console.log(`👑 Admin creado: ${process.env.ADMIN_EMAIL}`);
        }

        // Inicializar horarios por defecto
        const { inicializarHorarios } = require('./controllers/horarioControllers');
        await inicializarHorarios();

        // Arrancar cron de recordatorios
        const { iniciarCron } = require('./services/cronService');
        iniciarCron();
    })
    .catch((err) => {
        console.error('❌ ERROR AL CONECTAR A MONGODB:', err.message);
    });

// RUTAS
const authRoutes    = require('./routes/authRoutes');
const turnoRoutes   = require('./routes/turnosRoutes');
const horarioRoutes = require('./routes/horarioRoutes');

app.use('/api/auth',     authRoutes);
app.use('/api/turnos',   turnoRoutes);
app.use('/api/horarios', horarioRoutes);

app.get('/', (req, res) => res.send('🚀 API Peluquería corriendo'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en: http://localhost:${PORT}`));