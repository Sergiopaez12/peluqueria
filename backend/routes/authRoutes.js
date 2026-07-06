const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const { verificarToken, soloAdmin } = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', authController.registrar);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/perfil (protegida)
router.get('/perfil', verificarToken, authController.perfil);
router.put('/perfil', verificarToken, authController.editarPerfil);
router.delete('/perfil', verificarToken, authController.eliminarCuenta);

// Admin routes
router.get('/estadisticas', verificarToken, soloAdmin, authController.getEstadisticas);
router.get('/clientes', verificarToken, soloAdmin, authController.getClientes);
router.delete('/clientes/:id', verificarToken, soloAdmin, authController.eliminarCliente);

module.exports = router;
