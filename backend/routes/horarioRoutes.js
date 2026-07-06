const express = require('express');
const router  = express.Router();
const horarioController = require('../controllers/horarioControllers');
const { verificarToken, soloAdmin } = require('../middleware/authMiddleware');

// Slots libres para una fecha (clientes y admin)
router.get('/slots',  verificarToken, horarioController.getSlots);

// Configuración de horarios (solo admin)
router.get('/config',  verificarToken, soloAdmin, horarioController.getConfig);
router.put('/config',  verificarToken, soloAdmin, horarioController.updateConfig);

// Días bloqueados
router.get('/bloqueados', verificarToken, horarioController.getDiasBloqueados);
router.post('/bloqueados', verificarToken, soloAdmin, horarioController.bloquearDia);
router.delete('/bloqueados/:id', verificarToken, soloAdmin, horarioController.desbloquearDia);

module.exports = router;
