const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Turno = require('../models/Turno');
const Servicio = require('../models/Servicio');

// REGISTRO DE CLIENTE
exports.registrar = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        // Verificar si el email ya existe
        const existe = await Usuario.findOne({ email });
        if (existe) {
            return res.status(400).json({ message: 'Ya existe una cuenta con ese email.' });
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const nuevoUsuario = new Usuario({
            nombre,
            email,
            password: passwordHash,
            rol: 'cliente'
        });

        await nuevoUsuario.save();

        // Generar token JWT
        const token = jwt.sign(
            { id: nuevoUsuario._id, nombre: nuevoUsuario.nombre, email: nuevoUsuario.email, rol: nuevoUsuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            usuario: {
                id: nuevoUsuario._id,
                nombre: nuevoUsuario.nombre,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar usuario.' });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ message: 'Email o contraseña incorrectos.' });
        }

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(400).json({ message: 'Email o contraseña incorrectos.' });
        }

        const token = jwt.sign(
            { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al iniciar sesión.' });
    }
};

// PERFIL (devuelve datos del usuario logueado)
exports.perfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select('-password');
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener perfil.' });
    }
};

// EDITAR PERFIL
exports.editarPerfil = async (req, res) => {
    try {
        const { nombre, passwordActual, passwordNueva } = req.body;
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        if (nombre) usuario.nombre = nombre;

        if (passwordActual && passwordNueva) {
            const passwordValida = await bcrypt.compare(passwordActual, usuario.password);
            if (!passwordValida) {
                return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
            }
            const salt = await bcrypt.genSalt(10);
            usuario.password = await bcrypt.hash(passwordNueva, salt);
        }

        await usuario.save();

        res.json({
            id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar perfil.' });
    }
};

// ELIMINAR CUENTA (CLIENTE)
exports.eliminarCuenta = async (req, res) => {
    try {
        const { password } = req.body;
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(400).json({ message: 'Contraseña incorrecta.' });
        }

        // Eliminar turnos del usuario
        await Turno.deleteMany({ usuarioId: usuario._id });
        await usuario.deleteOne();

        res.json({ message: 'Cuenta eliminada correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la cuenta.' });
    }
};

// ESTADISTICAS (ADMIN)
exports.getEstadisticas = async (req, res) => {
    try {
        const totalClientes = await Usuario.countDocuments({ rol: 'cliente' });
        
        const turnos = await Turno.find();
        
        const turnosPorEstado = {
            pendiente: 0,
            confirmado: 0,
            rechazado: 0
        };
        
        // Obtener precios de servicios para calcular ingresos
        const serviciosDb = await Servicio.find();
        const preciosMap = {};
        serviciosDb.forEach(s => {
            preciosMap[s.nombre.toLowerCase()] = s.precio;
        });

        // Valores por defecto si no coincide
        const precioDefault = 1500;
        
        let ingresosEstimados = 0;
        const serviciosContador = {};

        turnos.forEach(t => {
            if (turnosPorEstado[t.estado] !== undefined) {
                turnosPorEstado[t.estado]++;
            }
            if (t.estado === 'confirmado') {
                const precio = preciosMap[t.servicio.toLowerCase()] || precioDefault;
                ingresosEstimados += precio;
            }
            serviciosContador[t.servicio] = (serviciosContador[t.servicio] || 0) + 1;
        });

        // Ordenar servicios más populares
        const serviciosPopulares = Object.keys(serviciosContador)
            .map(nombre => ({ nombre, count: serviciosContador[nombre] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Turnos por día (últimos 7 días)
        const turnosPorDia = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const fechaStr = d.toISOString().split('T')[0];
            const count = turnos.filter(t => t.fecha === fechaStr).length;
            
            // Obtener nombre del día abreviado
            const diasNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const diaNombre = diasNombres[d.getDay()];

            turnosPorDia.push({
                fecha: fechaStr,
                dia: diaNombre,
                cantidad: count
            });
        }

        res.json({
            totalClientes,
            turnosPorEstado,
            ingresosEstimados,
            serviciosPopulares,
            turnosPorDia
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener estadísticas.' });
    }
};

// OBTENER TODOS LOS CLIENTES (ADMIN)
exports.getClientes = async (req, res) => {
    try {
        const clientes = await Usuario.find({ rol: 'cliente' }).select('-password').sort({ nombre: 1 });
        
        // Sumar cantidad de turnos de cada cliente
        const clientesConTurnos = await Promise.all(clientes.map(async (c) => {
            const turnosCount = await Turno.countDocuments({ usuarioId: c._id });
            return {
                ...c.toObject(),
                turnosCount
            };
        }));

        res.json(clientesConTurnos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener clientes.' });
    }
};

// ELIMINAR UN CLIENTE (ADMIN)
exports.eliminarCliente = async (req, res) => {
    try {
        const cliente = await Usuario.findById(req.params.id);
        if (!cliente || cliente.rol !== 'cliente') {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        // Eliminar turnos del cliente
        await Turno.deleteMany({ usuarioId: cliente._id });
        await cliente.deleteOne();

        res.json({ message: 'Cliente y sus turnos eliminados correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar cliente.' });
    }
};
