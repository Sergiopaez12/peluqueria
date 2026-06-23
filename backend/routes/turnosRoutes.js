const express = require('express');
const router  = express.Router();
const turnoController = require('../controllers/turnoControllers');
const { verificarToken, soloAdmin } = require('../middleware/authMiddleware');

router.get('/',             verificarToken,            turnoController.obtenerTurnos);
router.post('/',            verificarToken,            turnoController.crearTurno);
router.delete('/:id',       verificarToken,            turnoController.eliminarTurno);
router.patch('/:id/estado', verificarToken, soloAdmin, turnoController.cambiarEstado);

module.exports = router;