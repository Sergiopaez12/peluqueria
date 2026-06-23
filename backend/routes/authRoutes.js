const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const { verificarToken } = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', authController.registrar);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/perfil (protegida)
router.get('/perfil', verificarToken, authController.perfil);

module.exports = router;
