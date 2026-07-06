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

        // Inicializar servicios por defecto
        const Servicio = require('./models/Servicio');
        const servicioCount = await Servicio.countDocuments();
        if (servicioCount === 0) {
            await Servicio.insertMany([
                { nombre: 'Corte de cabello', precio: 1500, duracionMin: 30, descripcion: 'Corte clásico o moderno con lavado incluido.' },
                { nombre: 'Barba', precio: 800, duracionMin: 20, descripcion: 'Perfilado de barba, afeitado tradicional con toalla caliente.' },
                { nombre: 'Corte + Barba', precio: 2000, duracionMin: 50, descripcion: 'Combo completo de corte de cabello y barba.' },
                { nombre: 'Coloración', precio: 3500, duracionMin: 90, descripcion: 'Tinte clásico o diseño de color personalizado.' },
                { nombre: 'Tratamiento capilar', precio: 2500, duracionMin: 60, descripcion: 'Lavado con productos premium e hidratación profunda.' },
            ]);
            console.log('💈 Servicios por defecto creados');
        }

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
const servicioRoutes = require('./routes/servicioRoutes');
const resenaRoutes = require('./routes/resenaRoutes');

app.use('/api/auth',     authRoutes);
app.use('/api/turnos',   turnoRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/resenas', resenaRoutes);

app.get('/', (req, res) => res.send('🚀 API Peluquería corriendo'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor listo en: http://localhost:${PORT}`));