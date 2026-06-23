const express = require('express');
const router  = express.Router();
const horarioController = require('../controllers/horarioControllers');
const { verificarToken, soloAdmin } = require('../middleware/authMiddleware');

// Slots libres para una fecha (clientes y admin)
router.get('/slots',  verificarToken, horarioController.getSlots);

// Configuración de horarios (solo admin)
router.get('/config',  verificarToken, soloAdmin, horarioController.getConfig);
router.put('/config',  verificarToken, soloAdmin, horarioController.updateConfig);

module.exports = router;
